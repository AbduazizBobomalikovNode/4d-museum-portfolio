import * as THREE from 'three'
import { railWaypoints } from '@/data/rooms'
import type { RoomId } from '@/data/types'

/** Smooth curve through the curated route (eye height baked into waypoints). */
export const railCurve = new THREE.CatmullRomCurve3(
  railWaypoints.map((w) => new THREE.Vector3(...w.position)),
  false,
  'centripetal',
  0.5,
)

/** Arc-length normalised u (0..1) for each waypoint, used for snapping/teleport. */
export const waypointU: number[] = (() => {
  const pts = railWaypoints.map((w) => new THREE.Vector3(...w.position))
  const cum: number[] = [0]
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1])
  const total = cum[cum.length - 1] || 1
  return cum.map((c) => c / total)
})()

/** First waypoint index of each room on the route. */
export const roomEntryU: Partial<Record<RoomId, number>> = (() => {
  const m: Partial<Record<RoomId, number>> = {}
  railWaypoints.forEach((w, i) => {
    if (m[w.roomId] === undefined) m[w.roomId] = waypointU[i]
  })
  return m
})()

export function nearestWaypointIndex(u: number): number {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < waypointU.length; i++) {
    const d = Math.abs(waypointU[i] - u)
    if (d < bd) { bd = d; best = i }
  }
  return best
}

/**
 * Closest point on the route to a world position, as a normalised u.
 *
 * Used when leaving free walk: the visitor rejoins the guided route where they are
 * standing rather than being thrown back to the start. Height counts fully so a walker
 * on the upper floor snaps to upper-floor waypoints, not the ones below them.
 */
export function nearestU(p: THREE.Vector3, samples = 400): number {
  const q = new THREE.Vector3()
  let best = 0
  let bd = Infinity
  for (let i = 0; i <= samples; i++) {
    const u = i / samples
    railCurve.getPoint(u, q)
    const d = q.distanceToSquared(p)
    if (d < bd) { bd = d; best = u }
  }
  return best
}
