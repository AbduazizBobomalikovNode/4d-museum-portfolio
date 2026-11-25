import { perfFlags } from './perfFlags'
import { detectQuality, qualityPreset, type Quality } from './quality'

/**
 * Everything that depends on the tier AND must not change during a session lives here, decided
 * once at module load from the initial tier (like dpr). Changing any of it later would rebuild
 * textures or lights, i.e. recompile programs mid-walk. `PerformanceMonitor` demotions still
 * switch effects on/off (post, reflector) but never touch what is computed here.
 */
export const initialTier: Quality = typeof window === 'undefined' ? 'medium' : detectQuality()

const tuned = perfFlags.tierTuning
const low = tuned && initialTier === 'low'

/** Canvas textures are built at this fraction of their logical size per side (low tier: half). */
export const TEX_SCALE = low ? 0.5 : 1
/** Longest side of any loaded image texture. */
export const MAX_IMAGE_SIDE = low ? 1024 : 4096
/** Anisotropic filtering: 8 everywhere today; phones gain little from it and pay in bandwidth. */
export const ANISO = low ? 2 : 8
/** Cap for textures that ask for the device maximum (the CV page). */
export const ANISO_MAX = low ? 2 : 16
/** Spotlights in the fixed exhibit pool (never changes at runtime). */
export const SPOT_POOL = tuned ? (initialTier === 'low' ? 3 : initialTier === 'medium' ? 4 : 6) : 6
/** Flat UI canvases are seen head-on, so on the low tier they skip the mip chain (-33% memory). */
export const FLAT_MIPS = !low

/** Drawing-buffer pixel budget per tier (Mpx). Constant for the session. */
const PIXEL_BUDGET: Record<Quality, number> = { low: 1.3e6, medium: 2.5e6, high: 4e6 }

/**
 * dpr for the Canvas. Off: the legacy [min,max] range (R3F resolves it against devicePixelRatio).
 * On: the same range, additionally capped so cssWidth*cssHeight*dpr^2 stays within the tier's budget.
 * A plain number, so it is NOT re-derived mid-session (no extra framebuffer rebuilds).
 */
export function canvasDpr(): number | [number, number] {
  const range = qualityPreset[initialTier].dpr
  if (!perfFlags.tierTuning) return range
  const raw = Math.min(Math.max(window.devicePixelRatio || 1, range[0]), range[1])
  const area = Math.max(1, window.innerWidth * window.innerHeight)
  const capped = Math.sqrt(PIXEL_BUDGET[initialTier] / area)
  return Math.max(0.5, Math.min(raw, capped))
}

/**
 * A canvas of `w`x`h` LOGICAL pixels, backed by `TEX_SCALE` times that per side. The 2D context has the
 * matching scale applied, so existing painters keep drawing in logical coordinates unchanged.
 * (Do not assign canvas.width/height afterwards: that resets the transform.)
 */
export function mkCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; s: number } {
  // only big canvases are worth shrinking; signs, plaques and buttons stay crisp
  const s = w * h >= 512 * 512 ? TEX_SCALE : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * s))
  canvas.height = Math.max(1, Math.round(h * s))
  const ctx = canvas.getContext('2d')!
  if (s !== 1) ctx.scale(s, s)
  return { canvas, ctx, s }
}

/** Mark a flat, head-on UI canvas texture as mip-less on the low tier. */
export function flatTexture<T extends import('three').Texture>(tex: T, linear: number): T {
  if (!FLAT_MIPS) { tex.generateMipmaps = false; tex.minFilter = linear as never }
  return tex
}

if (typeof document !== 'undefined' && low) document.documentElement.classList.add('tier-low')
