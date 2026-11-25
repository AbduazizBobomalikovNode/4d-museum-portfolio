/**
 * Measurement collector. Loaded ONLY when the URL has ?perf=1 (dynamic import from main.tsx),
 * so a normal visit never downloads, parses or runs any of this.
 *
 * Everything is exposed as `window.__perf` (snapshot() / reset()) plus a small fixed overlay.
 */
import { useStore } from '@/state/store'
import { perfFlags } from '@/lib/perfFlags'
import { setPerfHook, canvasLog } from '@/lib/perfBus'

const WINDOW = 120 // frames used for the "recent" render-info averages
const MAX_FRAMES = 200000

interface Trans { t: number; phase: string; mode: string; room: string; quality: string }
interface LongTask { t: number; duration: number; phase: string; mode: string; room: string; quality: string }
interface Mark { name: string; t: number; detail?: Record<string, unknown> }
interface Measure { name: string; from: number; to: number; ms: number }
interface Toggle {
  to: string; t0: number; firstFrameMs: number | null; readyMs: number | null; firstFrameAfterReadyMs: number | null
  geomBefore: number; texBefore: number; progBefore: number
  geomAfter: number | null; texAfter: number | null; progAfter: number | null; worldMounts: number
}

const now = () => performance.now()
const pct = (sorted: number[], p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0)
const r2 = (v: number) => Math.round(v * 100) / 100

let frames: number[] = []
let calls: number[] = []
let tris: number[] = []
let maxCalls = 0
let maxTris = 0
let longtasks: LongTask[] = []
let marks: Mark[] = []
let measures: Measure[] = []
let toggles: Toggle[] = []
let counts: Record<string, number> = {}
let trans: Trans[] = []
const ctx = { texBytes: 0, rtBytes: 0, lights: 0, cam: [0, 0, 0, 0, 0, 0], dpr: 0, w: 0, h: 0, geometries: 0, textures: 0, programs: 0, lines: 0, points: 0 }
const t0 = now()

let pendingToggle: Toggle | null = null
let toggleReady = false
let afterCountdown = 0
let pendingRoom: { id: string; at: number } | null = null
let physicsMountedAt = -1

const state = () => {
  const s = useStore.getState()
  return { phase: s.phase, mode: s.mode, room: s.roomId, quality: s.quality }
}

export function mark(name: string, detail?: Record<string, unknown>, at?: number) {
  const t = at ?? now()
  marks.push({ name, t: r2(t), detail })
  try { performance.mark('perf:' + name, { startTime: t, detail }) } catch { /* old browser */ }
  return t
}
function measure(name: string, from: number, to: number) {
  measures.push({ name, from: r2(from), to: r2(to), ms: r2(to - from) })
  try { performance.measure('perf:' + name, { start: from, end: to }) } catch { /* ignore */ }
}
const markTime = (name: string) => marks.find((m) => m.name === name)?.t

function pushTrans() {
  const s = state()
  const last = trans[trans.length - 1]
  if (last && last.phase === s.phase && last.mode === s.mode && last.room === s.room && last.quality === s.quality) return
  trans.push({ t: r2(now()), ...s })
}

function stateAt(t: number) {
  let cur = trans[0]
  for (const x of trans) { if (x.t <= t) cur = x; else break }
  return cur ?? { ...state() }
}

/** Called by PerfProbe once per frame, before everything else (so it sees the whole previous frame). */
export function recordFrame(dt: number, info: { calls: number; triangles: number; geometries: number; textures: number; programs: number; lines: number; points: number }) {
  frames.push(dt)
  if (frames.length > MAX_FRAMES) frames.shift()
  calls.push(info.calls); tris.push(info.triangles)
  if (calls.length > WINDOW) { calls.shift(); tris.shift() }
  if (info.calls > maxCalls) maxCalls = info.calls
  if (info.triangles > maxTris) maxTris = info.triangles
  ctx.geometries = info.geometries; ctx.textures = info.textures; ctx.programs = info.programs
  ctx.lines = info.lines; ctx.points = info.points

  const t = now()
  if (pendingToggle) {
    const p = pendingToggle
    if (p.firstFrameMs === null) {
      p.firstFrameMs = r2(t - p.t0)
      measure('toggle-first-frame:' + p.to, p.t0, t)
    }
    const modeNow = useStore.getState().mode
    const ready = modeNow === p.to && (p.to === 'rail' || physicsMountedAt >= p.t0)
    if (ready && !toggleReady) {
      toggleReady = true
      p.readyMs = r2(t - p.t0)
      p.firstFrameAfterReadyMs = p.readyMs
      measure('toggle-ready:' + p.to, p.t0, t)
      afterCountdown = 20
    } else if (toggleReady && afterCountdown > 0 && --afterCountdown === 0) {
      p.geomAfter = info.geometries; p.texAfter = info.textures; p.progAfter = info.programs
      p.worldMounts = counts.World ?? 0
      pendingToggle = null
    }
  }
  if (pendingRoom) {
    measure('room-change:' + pendingRoom.id, pendingRoom.at, t)
    pendingRoom = null
  }
}

export function setMem(texBytes: number, rtBytes: number, lights: number) { ctx.texBytes = texBytes; ctx.rtBytes = rtBytes; ctx.lights = lights }

export function setCtx(dpr: number, w: number, h: number, cam?: number[]) { ctx.dpr = dpr; ctx.w = w; ctx.h = h; if (cam) ctx.cam = cam }

function stats(arr: number[]) {
  const n = arr.length
  const sorted = [...arr].sort((a, b) => a - b)
  const sum = arr.reduce((a, b) => a + b, 0)
  return {
    count: n,
    fps: n ? r2((n * 1000) / sum) : 0,
    meanMs: n ? r2(sum / n) : 0,
    p50: r2(pct(sorted, 0.5)), p95: r2(pct(sorted, 0.95)), p99: r2(pct(sorted, 0.99)),
    maxMs: r2(sorted[n - 1] ?? 0),
    over33: arr.filter((d) => d > 33).length,
    over50: arr.filter((d) => d > 50).length,
    over100: arr.filter((d) => d > 100).length,
  }
}

const avg = (a: number[]) => (a.length ? r2(a.reduce((x, y) => x + y, 0) / a.length) : 0)

export function snapshot() {
  const s = state()
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, r2(p.startTime)]))
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  return {
    at: r2(now()),
    sinceInstall: r2(now() - t0),
    frames: stats(frames),
    render: {
      windowFrames: calls.length,
      avgCalls: avg(calls), maxCallsWindow: Math.max(0, ...calls), maxCallsSinceReset: maxCalls,
      avgTriangles: Math.round(avg(tris)), maxTrianglesWindow: Math.max(0, ...tris), maxTrianglesSinceReset: maxTris,
      geometries: ctx.geometries, textures: ctx.textures, programs: ctx.programs,
    },
    longtasks: longtasks.map((l) => ({ ...l })),
    longtaskTotalMs: r2(longtasks.reduce((a, l) => a + l.duration, 0)),
    marks: marks.map((m) => ({ ...m })),
    measures: measures.map((m) => ({ ...m })),
    toggles: toggles.map((x) => ({ ...x })),
    pendingToggle: pendingToggle ? { to: pendingToggle.to } : null,
    counts: { ...counts },
    transitions: trans.map((x) => ({ ...x })),
    paint: paints,
    memory: { textureMB: r2(ctx.texBytes / 1048576), renderTargetMB: r2(ctx.rtBytes / 1048576), lights: ctx.lights },
    canvas2d: (() => {
      const gate = markTime('gate-ready') ?? Infinity
      const before = canvasLog.filter((c) => c.t <= gate)
      const sum = (a: { px: number }[]) => a.reduce((x, c) => x + c.px, 0)
      return { count: canvasLog.length, totalMpx: r2(sum(canvasLog) / 1e6), beforeGateCount: before.length, beforeGateMpx: r2(sum(before) / 1e6) }
    })(),
    requests: { count: res.length, bytes: res.reduce((a, r) => a + (r.transferSize || 0), 0) },
    quality: s.quality, mode: s.mode, room: s.room, phase: s.phase,
    dpr: ctx.dpr, canvas: { w: ctx.w, h: ctx.h }, camera: ctx.cam.map(r2), railU: r2(useStore.getState().railU),
    flags: { ...perfFlags },
  }
}

export function reset() {
  frames = []; calls = []; tris = []; maxCalls = 0; maxTris = 0
  longtasks = []
}

function overlay() {
  const el = document.createElement('div')
  el.id = 'perf-overlay'
  el.style.cssText =
    'position:fixed;left:6px;bottom:6px;z-index:2147483647;pointer-events:none;font:11px/1.35 ui-monospace,Menlo,monospace;' +
    'color:#9fffb0;background:rgba(0,0,0,.62);padding:5px 7px;border-radius:4px;white-space:pre'
  document.body.appendChild(el)
  setInterval(() => {
    const recent = frames.slice(-WINDOW)
    const st = stats(recent)
    const s = state()
    el.textContent =
      `fps ${st.fps}  p95 ${st.p95}ms  max ${st.maxMs}ms\n` +
      `calls ${avg(calls)}  tris ${Math.round(avg(tris))}\n` +
      `prog ${ctx.programs}  tex ${ctx.textures}  geo ${ctx.geometries}\n` +
      `q ${s.quality}  dpr ${r2(ctx.dpr)}  ${s.mode}/${s.room}`
  }, 500)
}

let installed = false
export function install() {
  if (installed) return
  installed = true
  mark('install')
  trans.push({ t: r2(now()), ...state() })

  try {
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const st = stateAt(e.startTime)
        longtasks.push({ t: r2(e.startTime), duration: r2(e.duration), phase: st.phase, mode: st.mode, room: st.room, quality: st.quality })
      }
    })
    po.observe({ type: 'longtask', buffered: true })
  } catch { /* longtask unsupported */ }

  setPerfHook((name, detail) => {
    if (name.startsWith('count:')) { const k = name.slice(6); counts[k] = (counts[k] ?? 0) + 1; return }
    if (name === 'physics-mounted') physicsMountedAt = now()
    if (name === 'decline' || name === 'decline-ignored') { const s = state(); mark(name, { ...detail, phase: s.phase, quality: s.quality }); return }
    mark(name, detail)
  })

  useStore.subscribe((s, prev) => {
    if (s.phase !== prev.phase || s.mode !== prev.mode || s.roomId !== prev.roomId || s.quality !== prev.quality) pushTrans()
    if (s.phase !== prev.phase) {
      if (s.phase === 'gate') {
        mark('gate-ready')
        const gv = markTime('gate-visible')
        const ready = markTime('gate-ready')
        if (gv !== undefined && ready !== undefined) measure('gate-visible->gate-ready', gv, ready)
        const boot = markTime('app-boot')
        if (boot !== undefined && ready !== undefined) measure('boot->gate-ready', boot, ready)
      }
      if (s.phase === 'live') {
        mark('entered')
        const ready = markTime('gate-ready')
        const e = markTime('entered')
        if (ready !== undefined && e !== undefined) measure('gate-ready->entered', ready, e)
      }
    }
    if (s.mode !== prev.mode) {
      const p: Toggle = {
        to: s.mode, t0: mark('toggle-start:' + s.mode), firstFrameMs: null, readyMs: null, firstFrameAfterReadyMs: null,
        geomBefore: ctx.geometries, texBefore: ctx.textures, progBefore: ctx.programs,
        geomAfter: null, texAfter: null, progAfter: null, worldMounts: counts.World ?? 0,
      }
      toggles.push(p)
      pendingToggle = p
      toggleReady = false
      if (s.mode === 'walk') physicsMountedAt = -1
    }
    if (s.roomId !== prev.roomId) { const t = mark('room:' + s.roomId); pendingRoom = { id: s.roomId, at: t } }
  })

  // gate-visible = the first moment the gate DOM exists
  const waitGate = () => {
    if (document.querySelector('.gate')) mark('gate-visible')
    else requestAnimationFrame(waitGate)
  }
  waitGate()

  const w = window as unknown as { __perf: unknown }
  // scripted driving for measurement sessions (perf mode only)
  const drive = {
    enter: (sound = false) => useStore.getState().enter(sound),
    toggle: () => useStore.getState().toggleMode(),
    teleport: (id: string) => useStore.getState().teleport(id as never),
    setRail: (u: number) => { const st = useStore.getState(); st.setRailTarget(u); st.setRailU(u) },
    quality: () => useStore.getState().quality,
  }
  w.__perf = { snapshot, reset, flags: perfFlags, drive }
  if (document.body) overlay()
  else document.addEventListener('DOMContentLoaded', overlay)
}
