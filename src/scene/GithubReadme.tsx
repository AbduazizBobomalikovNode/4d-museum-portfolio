import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { loadImg, paintReadme, parseReadme } from '@/lib/ghpaint'
import { loadGithub, onGithub, type GithubSnapshot } from '@/lib/github'
import { UNIT_BOX } from '@/lib/geo'
import { ANISO, flatTexture, mkCanvas } from '@/lib/tier'
import { defer, deferUpload, needFontsRepaint, memoOnce, registerTexture } from '@/lib/assets'

const USER = 'AbduazizBobomalikovNode'
const PAGE_H = 1024 // content pixels shown per screen

let tall: HTMLCanvasElement | null = null
let tallScale = 1
const listeners = new Set<() => void>()

/** Fetch + paint the README once into a shared tall canvas; notify page textures. */
async function ensurePainted() {
  if (tall) return
  const made = mkCanvas(2048, 2048)
  tall = made.canvas
  tallScale = made.s
  const ctx = made.ctx
  const render = async (snap: GithubSnapshot) => {
    if (!snap.readme) return
    const { blocks, imgUrls } = parseReadme(snap.readme)
    const imgs = new Map<string, ImageBitmap | null>()
    await Promise.all([...new Set(imgUrls)].map(async (u) => imgs.set(u, await loadImg(u))))
    const paint = () => { paintReadme(ctx, blocks, imgs); listeners.forEach((l) => l()) }
    paint()
    if (needFontsRepaint()) document.fonts?.ready.then(paint)
  }
  onGithub((s) => void render(s))
  await loadGithub()
}

/**
 * One README "page" screen — a slice of the shared canvas on a POT texture.
 * Pure WebGL mesh: obeys the depth buffer, fog and lighting like everything else.
 */
export function GithubReadme({ position, rotationY = 0, page = 0 }: { position: [number, number, number]; rotationY?: number; page?: number }) {
  const { tex, ctx } = useMemo(() => memoOnce('gh-readme:' + page, () => {
    const { canvas, ctx } = mkCanvas(2048, PAGE_H)
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, 2048, PAGE_H)
    ctx.fillStyle = '#8b949e'
    ctx.font = '48px "IBM Plex Mono", monospace'
    ctx.fillText('README yuklanmoqda…', 720, 500)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    flatTexture(tex, THREE.LinearFilter)
    deferUpload(tex, canvas, 'about')
    return { tex, ctx }
  }), [page])
  const done = useRef(false)

  useEffect(() => {
    const copy = () => {
      if (!tall) return
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, 2048, PAGE_H)
      ctx.drawImage(tall, 0, page * PAGE_H * tallScale, 2048 * tallScale, PAGE_H * tallScale, 0, 0, 2048, PAGE_H)
      // page number
      ctx.fillStyle = '#8b949e'
      ctx.font = '30px "IBM Plex Mono", monospace'
      ctx.fillText(String(page + 1), 1990, 1000)
      tex.needsUpdate = true
      registerTexture(tex) // pre-upload in idle time instead of at first sight
      done.current = true
    }
    listeners.add(copy)
    defer('about', async () => { await ensurePainted(); copy() }) // fetch + paint in idle slices after the gate (lazyAssets)
    return () => { listeners.delete(copy) }
  }, [ctx, tex, page])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow geometry={UNIT_BOX} scale={[6.6, 3.4, 0.14]} dispose={null}>        <meshStandardMaterial color="#0c0d11" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh
        position={[0, 0, 0.075]}
        onClick={(e) => { e.stopPropagation(); window.open(`https://github.com/${USER}`, '_blank') }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <planeGeometry args={[6.4, 3.2]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} roughness={0.7} />
      </mesh>
    </group>
  )
}
