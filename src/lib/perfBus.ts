import { perfMode } from './perfFlags'

type Hook = (name: string, detail?: Record<string, unknown>) => void
let hook: Hook | null = null

/** perf mode only: the measurement module installs its collector here. */
export function setPerfHook(h: Hook | null) { hook = h }

/** Report an event to the collector. A no-op unless ?perf=1 and the collector has loaded. */
export function perfEvent(name: string, detail?: Record<string, unknown>): void {
  if (perfMode && hook) hook(name, detail)
}

/** Count a mount (e.g. the world) — perf mode only. Call from an effect. */
export function perfCount(name: string): void {
  if (perfMode && hook) hook('count:' + name)
}
