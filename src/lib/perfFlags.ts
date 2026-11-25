/**
 * Kill-switches for runtime optimisations, read once at module load from the URL.
 *
 *   ?opt=off            every flagged optimisation off (the exact previous behaviour)
 *   ?optOff=a,b         only the named ones off
 *   ?perf=1             measurement mode (see src/perf/) — adds nothing when absent
 *
 * All flags default ON. They only exist so a regression found in production can be
 * bisected from the address bar without a redeploy.
 */
export const FLAG_NAMES = [
  'stableTree', // keep the world mounted across rail<->walk (physics wraps it without remounting)
  'prefetchPhysics', // fetch the rapier chunk in idle time after entering
  'reflectorCull', // skip the reflector's extra scene pass while the floor cannot be seen
  'previewCull', // skip the nav-board preview pass while the board is off screen
  'monitorAfterEnter', // PerformanceMonitor may only demote quality once the visitor is inside
  'noPreserveBuffer', // renderer without preserveDrawingBuffer; screenshots render a frame first
] as const

export type FlagName = (typeof FLAG_NAMES)[number]
export type PerfFlags = Record<FlagName, boolean>

function read(): { flags: PerfFlags; perf: boolean } {
  const flags = Object.fromEntries(FLAG_NAMES.map((n) => [n, true])) as PerfFlags
  let perf = false
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
    perf = q.get('perf') === '1'
    if (q.get('opt') === 'off') for (const n of FLAG_NAMES) flags[n] = false
    const off = q.get('optOff')
    if (off) for (const n of off.split(',')) if ((FLAG_NAMES as readonly string[]).includes(n.trim())) flags[n.trim() as FlagName] = false
  } catch { /* no URL access: defaults */ }
  return { flags, perf }
}

const parsed = read()

export const perfFlags: Readonly<PerfFlags> = Object.freeze(parsed.flags)
/** True only when the URL has ?perf=1. */
export const perfMode: boolean = parsed.perf
