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

/** perf mode only: every 2D canvas created, with the time and its backing-store size (pixels painted before the gate etc.). */
export const canvasLog: { t: number; px: number; who?: string }[] = []
if (perfMode && typeof HTMLCanvasElement !== 'undefined') {
  const seen = new WeakSet<HTMLCanvasElement>()
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: Parameters<typeof orig>) {
    if (a[0] === '2d' && !seen.has(this)) { seen.add(this); canvasLog.push({ t: performance.now(), px: this.width * this.height, who: this.width * this.height >= 1e6 ? (new Error().stack ?? '').split('\n').slice(3, 6).map((l) => l.trim().replace(/https?:\/\/[^/]+/, '')).join(' < ') : undefined }) }
    return (orig as (...x: unknown[]) => unknown).apply(this, a)
  } as typeof orig
}
