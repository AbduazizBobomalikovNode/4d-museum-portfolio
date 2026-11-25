import * as THREE from 'three'
import { useEffect, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { perfFlags } from './perfFlags'
import { perfEvent } from './perfBus'
import { roomEntryU } from './rail'
import { neighbours } from '@/data/rooms'
import { MAX_IMAGE_SIDE, ANISO, mkCanvas } from './tier'
import { useStore } from '@/state/store'
import type { RoomId } from '@/data/types'

/**
 * Deferred asset pipeline (`lazyAssets`).
 *
 * Before the gate only what the visitor can see first is prepared: the atrium (the gate's orbit) and the
 * entrance (first stop on the rail). Everything else — canvases to paint, images to fetch, remote logos — is
 * queued here and handled in `requestIdleCallback` slices AFTER the gate opens, nearest room (along the
 * rail) first. A room the visitor walks towards jumps the queue because priority is recomputed on every pick.
 *
 * Never changes the shader program set: a deferred texture is a normal Texture that starts with a 2x2
 * placeholder image and later has its image swapped (dispose + needsUpdate), so the material always has its
 * `map` and its program never changes. Finished textures are pre-uploaded with `gl.initTexture` in idle
 * slices so the first sight does not pay for the upload.
 */

export const lazyOn = perfFlags.lazyAssets

const CRITICAL: ReadonlySet<RoomId> = new Set<RoomId>(['atrium', 'entrance'])

interface Task { room: RoomId | null; critical: boolean; run: () => Promise<void> | void }

const queue: Task[] = []
let gateOpen = false
let settledFlag = false
let running = 0
let scheduled = false
const MAX_ASYNC = 3
const pending = new Map<string, number>() // room -> unfinished tasks
const roomReady = new Set<string>()
const readyListeners = new Set<(room: RoomId) => void>()
let renderer: THREE.WebGLRenderer | null = null
const initQueue: THREE.Texture[] = []
const initRoom = new WeakMap<THREE.Texture, RoomId | null>()
/** A single upload above this (RGBA + mips) is a 50-200 ms main-thread stall that cannot be split. */
const HEAVY_BYTES = 8 * 1024 * 1024
const texBytes = (t: THREE.Texture) => {
  const im = t.image as { width?: number; height?: number } | undefined
  return im?.width && im.height ? im.width * im.height * 4 * 1.34 : 0
}

/** 2x2 stand-in image shared by every deferred texture. */
let tiny: HTMLCanvasElement | null = null
export function placeholderImage(): HTMLCanvasElement {
  if (!tiny) {
    tiny = document.createElement('canvas')
    tiny.width = tiny.height = 2
    const c = tiny.getContext('2d')!
    c.fillStyle = '#14161c'
    c.fillRect(0, 0, 2, 2)
  }
  return tiny
}

/** True once the gate has opened and every queued task has finished: later requests just run synchronously. */
export const assetsSettled = () => !lazyOn || settledFlag

/** True while new work should be queued instead of run now. */
export const shouldDefer = () => lazyOn && !settledFlag

export function setAssetRenderer(gl: THREE.WebGLRenderer) { renderer = gl }

export function onRoomAssets(cb: (room: RoomId) => void): () => void {
  readyListeners.add(cb)
  return () => { readyListeners.delete(cb) }
}

/** Queue `run` for `room` (null: no particular room). With the flag off — or once settled — it runs immediately. */
export function defer(room: RoomId | null, run: () => Promise<void> | void): void {
  if (!shouldDefer()) { void run(); return }
  queue.push({ room, critical: room !== null && CRITICAL.has(room), run })
  if (room) pending.set(room, (pending.get(room) ?? 0) + 1)
  if (gateOpen) pump()
}

/** Pre-upload a finished texture to the GPU in an idle slice. */
export function registerTexture(tex: THREE.Texture) {
  if (!perfFlags.prewarm || !renderer) return
  if (!initQueue.includes(tex)) initQueue.push(tex)
  if (gateOpen) pump()
}

// ---- fonts: wait (bounded) for the three families before the first paint so nothing is painted twice ----
const FACES = [
  '600 20px "Sora"', '700 20px "Sora"', '800 20px "Sora"',
  '400 20px "IBM Plex Sans"', '500 20px "IBM Plex Sans"', '600 20px "IBM Plex Sans"',
  '400 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"',
]
export let fontsLoaded = false
export const fontsReady: Promise<boolean> = (() => {
  if (!lazyOn || typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve(false)
  const all = Promise.all(FACES.map((f) => document.fonts.load(f))).then(() => true, () => false)
  const timeout = new Promise<boolean>((res) => setTimeout(() => res(false), 1500))
  return Promise.race([all, timeout]).then((ok) => { fontsLoaded = ok; perfEvent('fonts-' + (ok ? 'loaded' : 'timeout')); return ok })
})()

/** With lazyAssets the fonts were awaited before painting, so a repaint on `fonts.ready` would just paint twice. */
export const needFontsRepaint = () => !(lazyOn && fontsLoaded)

// ---- scheduler ----
type Idle = (deadline: { timeRemaining: () => number; didTimeout: boolean }) => void
const ric = (cb: Idle, timeout: number) =>
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback(cb, { timeout })
    : setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: false }), 40)

const distance = (room: RoomId | null) => {
  if (!room) return 0.25
  const here = roomEntryU[useStore.getState().roomId] ?? 0
  return Math.abs((roomEntryU[room] ?? 0) - here)
}

function pickNext(): Task {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < queue.length; i++) {
    const d = distance(queue[i].room)
    if (d < bd) { bd = d; best = i }
  }
  return queue.splice(best, 1)[0]
}

function finish(t: Task) {
  if (!t.room) return
  const left = (pending.get(t.room) ?? 1) - 1
  pending.set(t.room, left)
  if (left <= 0 && !roomReady.has(t.room)) {
    roomReady.add(t.room)
    perfEvent('assets-room:' + t.room)
    readyListeners.forEach((l) => l(t.room as RoomId))
  }
}

/** Own-clock budget for one idle slice (ms): the gate screen is idle, so it may work longer than live rendering. */
const sliceBudget = () => (useStore.getState().phase === 'live' ? 9 : 24)

function slice(dl: { timeRemaining: () => number; didTimeout: boolean }) {
  scheduled = false
  const start = performance.now()
  const budget = Math.min(sliceBudget(), dl.didTimeout ? 9 : Math.max(9, dl.timeRemaining()))
  let ran = 0
  // queued work first (paint / fetch). `timeRemaining` is only advisory and is not checked inside a task, so
  // the slice also keeps its own clock; at least one unit always runs so the queue cannot starve.
  while (queue.length && running < MAX_ASYNC && (ran === 0 || performance.now() - start < budget)) {
    const t = pickNext()
    ran++
    running++
    const t1 = performance.now()
    let p: Promise<void> | void
    try { p = t.run() } catch { p = undefined }
    const ms = performance.now() - t1
    if (ms > 12) perfEvent('asset-task', { room: t.room, ms: Math.round(ms) })
    void Promise.resolve(p).catch(() => {}).finally(() => { running--; finish(t); pump() })
  }
  // then GPU pre-uploads, one at a time: a big canvas upload (+ mip chain) is 10-40 ms and cannot be split
  // Heavy uploads are done while the visitor is still on the gate screen; once live they wait until the visitor
  // is in (or next to) that texture's room, so a stall never lands in the middle of an unrelated walk.
  const live = useStore.getState().phase === 'live'
  const room = useStore.getState().roomId
  const pickInit = () => {
    if (!live) return initQueue.length ? 0 : -1
    return initQueue.findIndex((t) => {
      if (texBytes(t) <= HEAVY_BYTES) return true
      const r = initRoom.get(t)
      return !!r && (r === room || neighbours[room].includes(r))
    })
  }
  for (let i = pickInit(); i >= 0 && renderer && (ran === 0 || performance.now() - start < budget); i = pickInit()) {
    const t1 = performance.now()
    try { renderer.initTexture(initQueue.splice(i, 1)[0]) } catch { /* disposed meanwhile */ }
    const ms = performance.now() - t1
    ran++
    if (ms > 12) perfEvent('asset-init', { ms: Math.round(ms) })
  }
  const more = pickInit() >= 0
  if (!queue.length && running === 0 && !more && !settledFlag) {
    settledFlag = true
    perfEvent('assets-drained')
  } else if (queue.length || more) pump()
}

function pump(soon = false) {
  if (!gateOpen || scheduled) return
  scheduled = true
  ric(slice, soon ? 60 : 400)
}

/**
 * Called by the warm-up before the gate: run every critical task (atrium + entrance), then open the gate for
 * the idle pipeline. Everything non-critical stays queued.
 */
export async function flushCritical(): Promise<void> {
  if (!lazyOn) return
  perfEvent('critical-start')
  await fontsReady
  for (let guard = 0; guard < 500; guard++) {
    const i = queue.findIndex((t) => t.critical)
    if (i < 0) break
    const [t] = queue.splice(i, 1)
    running++
    try { await t.run() } catch { /* a failed paint just stays a placeholder */ }
    running--
    finish(t)
  }
  perfEvent('critical-done')
}

export function openGate() {
  if (gateOpen || (!lazyOn && !perfFlags.prewarm)) return
  gateOpen = true
  useStore.subscribe((s) => s.roomId, () => pump(true))
  pump()
}

/** Replace a deferred texture's image with the real one: dispose + needsUpdate keeps the program (same map). */
export function swapImage(tex: THREE.Texture, image: HTMLCanvasElement | HTMLImageElement | ImageBitmap) {
  tex.image = image
  tex.dispose()
  tex.needsUpdate = true
  registerTexture(tex)
}

/**
 * A canvas texture whose real canvas already exists (components that paint into it progressively): show a 2x2
 * stand-in until the idle pipeline uploads the real one. Saves the pre-gate GPU upload + mip generation.
 */
export function deferUpload(tex: THREE.Texture, canvas: HTMLCanvasElement, room: RoomId) {
  if (!shouldDefer()) return
  tex.image = placeholderImage()
  defer(room, () => { swapImage(tex, canvas) })
}

// ---- image textures (CV page, book covers, portrait) ----

function capped(bmp: ImageBitmap | HTMLImageElement, forceCanvas = false): HTMLCanvasElement | HTMLImageElement | ImageBitmap {
  const w = (bmp as ImageBitmap).width
  const h = (bmp as ImageBitmap).height
  const k = Math.min(1, MAX_IMAGE_SIDE / Math.max(w, h))
  if (k >= 1 && !forceCanvas) return bmp
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * k))
  c.height = Math.max(1, Math.round(h * k))
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return c
}

interface LazyImg { tex: THREE.Texture; loaded: boolean; subs: Set<() => void> }
const lazyImgs = new Map<string, LazyImg>()

function lazyImage(url: string, room: RoomId): LazyImg {
  let e = lazyImgs.get(url)
  if (e) return e
  const tex = new THREE.Texture(placeholderImage())
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  tex.needsUpdate = true
  e = { tex, loaded: false, subs: new Set() }
  lazyImgs.set(url, e)
  const entry = e
  defer(room, async () => {
    if (MAX_IMAGE_SIDE < 4096) {
      // low tier: decode, then downscale through a canvas (a canvas image gets three's normal flipY)
      const bmp = await createImageBitmap(await (await fetch(url)).blob())
      swapImage(tex, capped(bmp, true))
    } else {
      // a plain <img> keeps three's default orientation and costs no extra copy (an ImageBitmap would need flipY at decode)
      const img = new Image()
      img.src = url
      await img.decode()
      swapImage(tex, img)
    }
    entry.loaded = true
    entry.subs.forEach((f) => f())
  })
  return e
}

/** Suspense-free texture for `url`: a placeholder object immediately, the same object holding the picture later. */
function useLazyImageTexture(url: string, room: RoomId): THREE.Texture {
  const e = lazyImage(url, room)
  const [, bump] = useState(0)
  useEffect(() => {
    if (e.loaded) return
    const f = () => bump((n) => n + 1)
    e.subs.add(f)
    return () => { e.subs.delete(f) }
  }, [e])
  return e.tex
}

function useEagerImageTexture(url: string): THREE.Texture {
  const tex = useTexture(url)
  capTextureImage(tex) // low tier only: no-op when the image is within MAX_IMAGE_SIDE
  return tex
}

function useEagerImageTextureFor(url: string, _room: RoomId): THREE.Texture {
  return useEagerImageTexture(url)
}

/** Shared entry point: lazy when `lazyAssets` is on (decided once at load), the old suspending loader otherwise. */
export const useImageTexture: (url: string, room: RoomId) => THREE.Texture = lazyOn ? useLazyImageTexture : useEagerImageTextureFor

export function preloadImage(url: string) {
  if (!lazyOn) useTexture.preload(url)
}

/** Cap an already-loaded texture's image (planets on the low tier). */
export function capTextureImage(tex: THREE.Texture) {
  const im = tex.image as ImageBitmap | HTMLImageElement | undefined
  if (im && Math.max(im.width, im.height) > MAX_IMAGE_SIDE) {
    tex.image = capped(im)
    tex.dispose() // in case it was already uploaded at full size
    tex.needsUpdate = true
  }
}

/**
 * A painted canvas texture. Flag off / settled: painted right now (the old behaviour). Otherwise the texture
 * starts as a 2x2 placeholder and the canvas is created, painted (after the fonts are ready) and uploaded by the
 * idle pipeline. `paint` receives a context already scaled for the tier, so it draws in logical pixels.
 */
export function lazyPainted(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
  room: RoomId | null,
  configure?: (tex: THREE.CanvasTexture) => void,
): THREE.CanvasTexture {
  if (!shouldDefer()) {
    const { canvas, ctx } = mkCanvas(w, h)
    paint(ctx)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    configure?.(tex)
    return tex
  }
  const tex = new THREE.CanvasTexture(placeholderImage())
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  configure?.(tex)
  defer(room, async () => {
    await fontsReady
    const { canvas, ctx } = mkCanvas(w, h)
    paint(ctx)
    swapImage(tex, canvas)
  })
  return tex
}

const once = new Map<string, unknown>()
/**
 * Build `make()` once per key (lazyAssets). React re-runs a component's useMemo from scratch every time a
 * sibling suspends before the first commit (the planet textures do), so the same 2048x1024 canvas used to be
 * allocated and painted four times before the gate — and with deferred uploads, four orphan textures too.
 */
export function memoOnce<T>(key: string, make: () => T): T {
  if (!lazyOn) return make()
  if (!once.has(key)) once.set(key, make())
  return once.get(key) as T
}

const TEX_KEYS = ['map', 'emissiveMap', 'specularMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'lightMap', 'bumpMap', 'envMap'] as const

/**
 * prewarm: after the gate, walk the scene once and queue every texture it uses for an idle `gl.initTexture`,
 * nearest room (along the rail) first. Without this a texture is uploaded — with its mip chain — the first frame
 * its mesh becomes visible, i.e. as a hitch the first time a room comes into view.
 */
export function prewarmScene(scene: THREE.Scene) {
  if (!perfFlags.prewarm || !renderer) return
  const seen = new Map<THREE.Texture, RoomId | null>()
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    if (!m) return
    let room: RoomId | null = null
    for (let p: THREE.Object3D | null = o; p; p = p.parent) {
      const g = p.userData?.roomGate as RoomId | RoomId[] | undefined
      if (g) { room = Array.isArray(g) ? g[0] : g; break }
    }
    for (const mat of Array.isArray(m) ? m : [m]) {
      for (const k of TEX_KEYS) {
        const t = (mat as unknown as Record<string, unknown>)[k] as THREE.Texture | null | undefined
        if (t && (t as THREE.Texture).isTexture && !seen.has(t)) seen.set(t, room)
      }
    }
  })
  const here = roomEntryU[useStore.getState().roomId] ?? 0
  const list = [...seen.entries()].sort((a, b) => Math.abs((a[1] ? roomEntryU[a[1]] ?? 0 : 0) - here) - Math.abs((b[1] ? roomEntryU[b[1]] ?? 0 : 0) - here))
  list.sort((a, b) => Number(texBytes(b[0]) > HEAVY_BYTES) - Number(texBytes(a[0]) > HEAVY_BYTES)) // heavy first: they go during the gate
  for (const [t, r] of list) { initRoom.set(t, r); if (!initQueue.includes(t)) initQueue.push(t) }
  perfEvent('prewarm-queued', { textures: list.length })
  pump()
}
