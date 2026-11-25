import { perfFlags } from './perfFlags'

export type Quality = 'low' | 'medium' | 'high'

export const isTouchDevice = () =>
  typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

/**
 * "Mobile" = a phone or tablet, not merely something with a touch screen: a coarse PRIMARY pointer,
 * or a mobile user-agent hint (incl. iPadOS, which sends a desktop UA but has touch + Apple platform).
 * A touch-screen laptop keeps a fine primary pointer, so it is judged by cores/memory like any desktop.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  if (nav.userAgentData?.mobile) return true
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true // iPadOS in desktop mode
  return !!window.matchMedia?.('(pointer: coarse)').matches
}

/** Cheap heuristic tier. Replace/augment with detect-gpu later. */
export function detectQuality(): Quality {
  if (typeof navigator === 'undefined') return 'medium'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  const mobile = perfFlags.tierTuning ? isMobileDevice() : /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || isTouchDevice()
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
