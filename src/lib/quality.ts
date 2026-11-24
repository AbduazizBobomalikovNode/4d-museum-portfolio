export type Quality = 'low' | 'medium' | 'high'

export const isTouchDevice = () =>
  typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

/** Cheap heuristic tier. Replace/augment with detect-gpu later. */
export function detectQuality(): Quality {
  if (typeof navigator === 'undefined') return 'medium'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || isTouchDevice()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) return 'low'
  if (mobile) return cores >= 8 && mem >= 6 ? 'medium' : 'low'
  if (cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export const qualityPreset = {
  low: { dpr: [0.6, 0.9] as [number, number], shadows: false, post: false, aa: false },
  medium: { dpr: [0.85, 1.25] as [number, number], shadows: false, post: true, aa: false },
  high: { dpr: [1, 1.5] as [number, number], shadows: false, post: true, aa: true },
}
