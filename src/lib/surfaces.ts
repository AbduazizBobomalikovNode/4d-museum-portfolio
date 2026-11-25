import * as THREE from 'three'
import { ANISO, mkCanvas } from '@/lib/tier'

/**
 * Procedural surface textures (canvas) — no external assets.
 * All are tileable-ish via RepeatWrapping; use `tiled()` to clone with a
 * per-mesh repeat so texel density stays uniform across different wall sizes.
 */

const cache = new Map<string, THREE.CanvasTexture>()

function make(key: string, size: number, render: (ctx: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const { canvas, ctx } = mkCanvas(size, size)
  render(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  cache.set(key, tex)
  return tex
}

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Soft noise blotches used by several surfaces. */
function blotches(ctx: CanvasRenderingContext2D, s: number, rand: () => number, n: number, alpha: number, light: boolean) {
  for (let i = 0; i < n; i++) {
    const r = 20 + rand() * s * 0.25
    const x = rand() * s
    const y = rand() * s
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const c = light ? '255,255,255' : '0,0,0'
    g.addColorStop(0, `rgba(${c},${alpha * (0.4 + rand() * 0.6)})`)
    g.addColorStop(1, `rgba(${c},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

/** Plaster / concrete wall. `tint` shifts the base tone (per-room feature walls). */
export function wallTexture(tint = '#3a3d45', seed = 3): THREE.CanvasTexture {
  return make(`wall:${tint}:${seed}`, 512, (ctx, s) => {
    const rand = mulberry(seed)
    ctx.fillStyle = tint
    ctx.fillRect(0, 0, s, s)
    blotches(ctx, s, rand, 26, 0.045, true)
    blotches(ctx, s, rand, 26, 0.06, false)
    // fine speckle (≥3px: 1–2px dots shimmer under minification)
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.035)'
      ctx.fillRect(rand() * s, rand() * s, 3, 3)
    }
    // faint vertical trowel streaks
    ctx.globalAlpha = 0.028
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = rand() > 0.5 ? '#fff' : '#000'
      ctx.fillRect(rand() * s, 0, 1 + rand() * 3, s)
    }
    ctx.globalAlpha = 1
  })
}

/** Polished concrete floor: 2×2 m tiles with grout seams, stains, sheen variation. */
export function floorTexture(seed = 11): THREE.CanvasTexture {
  return make('floor:' + seed, 1024, (ctx, s) => {
    const rand = mulberry(seed)
    const tiles = 4 // texture covers 4×4 tiles → repeat = size/8 world units
    const t = s / tiles
    for (let ty = 0; ty < tiles; ty++)
      for (let tx = 0; tx < tiles; tx++) {
        const v = 26 + Math.floor(rand() * 10)
        ctx.fillStyle = `rgb(${v},${v + 1},${v + 4})`
        ctx.fillRect(tx * t, ty * t, t, t)
        // per-tile clouding
        const g = ctx.createRadialGradient(tx * t + rand() * t, ty * t + rand() * t, 0, tx * t + t / 2, ty * t + t / 2, t)
        g.addColorStop(0, 'rgba(255,255,255,0.05)')
        g.addColorStop(1, 'rgba(0,0,0,0.06)')
        ctx.fillStyle = g
        ctx.fillRect(tx * t, ty * t, t, t)
      }
    blotches(ctx, s, rand, 30, 0.05, false)
    // grout seams
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.lineWidth = 3
    for (let i = 0; i <= tiles; i++) {
      ctx.beginPath(); ctx.moveTo(i * t, 0); ctx.lineTo(i * t, s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * t); ctx.lineTo(s, i * t); ctx.stroke()
    }
    // hairline scratches
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      const x = rand() * s, y = rand() * s
      ctx.moveTo(x, y)
      ctx.lineTo(x + (rand() - 0.5) * 240, y + (rand() - 0.5) * 240)
      ctx.stroke()
    }
  })
}

/** Museum ceiling: dark panels with seams + faint vents. */
export function ceilingTexture(seed = 21): THREE.CanvasTexture {
  return make('ceiling:' + seed, 512, (ctx, s) => {
    const rand = mulberry(seed)
    ctx.fillStyle = '#191b20'
    ctx.fillRect(0, 0, s, s)
    const tiles = 4
    const t = s / tiles
    for (let ty = 0; ty < tiles; ty++)
      for (let tx = 0; tx < tiles; tx++) {
        const v = 23 + Math.floor(rand() * 5)
        ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`
        ctx.fillRect(tx * t + 2, ty * t + 2, t - 4, t - 4)
      }
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 4
    for (let i = 0; i <= tiles; i++) {
      ctx.beginPath(); ctx.moveTo(i * t, 0); ctx.lineTo(i * t, s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * t); ctx.lineTo(s, i * t); ctx.stroke()
    }
    blotches(ctx, s, rand, 14, 0.04, false)
  })
}

/** Wood planks (stair treads, benches). */
export function woodTexture(seed = 31): THREE.CanvasTexture {
  return make('wood:' + seed, 512, (ctx, s) => {
    const rand = mulberry(seed)
    ctx.fillStyle = '#6b4a2b'
    ctx.fillRect(0, 0, s, s)
    // grain streaks
    for (let i = 0; i < 90; i++) {
      const y = rand() * s
      const h = 1 + rand() * 3
      const tone = rand()
      ctx.fillStyle = tone > 0.6 ? 'rgba(255,220,170,0.10)' : 'rgba(40,20,5,0.16)'
      ctx.fillRect(0, y, s, h)
    }
    // plank seams (horizontal)
    ctx.strokeStyle = 'rgba(30,15,4,0.7)'
    ctx.lineWidth = 3
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, (s / 4) * i); ctx.lineTo(s, (s / 4) * i); ctx.stroke()
    }
    // knots
    for (let i = 0; i < 6; i++) {
      const x = rand() * s, y = rand() * s
      ctx.strokeStyle = 'rgba(35,18,6,0.5)'
      ctx.lineWidth = 2
      for (let rr = 3; rr < 14; rr += 4) { ctx.beginPath(); ctx.ellipse(x, y, rr * 1.6, rr, 0, 0, Math.PI * 2); ctx.stroke() }
    }
    blotches(ctx, s, rand, 10, 0.05, false)
  })
}

const tiledCache = new Map<string, THREE.Texture>()

/**
 * Clone a texture with world-size based repeat so texel density stays uniform.
 * Clones are cached and quantised: walls come in a handful of sizes, and every unique
 * clone is a separate GPU binding, so this collapses ~120 textures into a dozen.
 */
export function tiled(tex: THREE.CanvasTexture, w: number, h: number, tile: number): THREE.Texture {
  const rx = Math.round((w / tile) * 4) / 4
  const ry = Math.round((h / tile) * 4) / 4
  const key = `${tex.uuid}:${rx}:${ry}`
  const hit = tiledCache.get(key)
  if (hit) return hit
  const t = tex.clone()
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  tiledCache.set(key, t)
  return t
}
