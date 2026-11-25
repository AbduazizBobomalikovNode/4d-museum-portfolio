import { useEffect } from 'react'
import { useRapier } from '@react-three/rapier'

/** ?perf=1 only: exposes a canonical dump of every collider so two physics setups can be diffed. */
export function PerfColliders() {
  const { world } = useRapier()
  useEffect(() => {
    const w = window as unknown as { __perf?: Record<string, unknown> }
    const dump = () => {
      const rows: string[] = []
      world.colliders.forEach((c) => {
        const t = c.translation()
        const r = c.rotation()
        const h = c.halfExtents()
        const f = (v: number) => (Math.round(v * 1e4) / 1e4 + 0).toFixed(4)
        // quaternion sign is arbitrary: canonicalise so q and -q compare equal
        const s = r.w < 0 || (r.w === 0 && r.x < 0) ? -1 : 1
        rows.push([c.shape.type, f(t.x), f(t.y), f(t.z), f(s * r.x), f(s * r.y), f(s * r.z), f(s * r.w), h ? [f(h.x), f(h.y), f(h.z)].join(',') : ''].join(' '))
      })
      rows.sort()
      return rows
    }
    if (w.__perf) w.__perf.colliders = dump
    return () => { if (w.__perf) delete w.__perf.colliders }
  }, [world])
  return null
}
