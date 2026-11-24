import type { LS } from '@/lib/i18n'

export type RoomId =
  | 'entrance'
  | 'projects'
  | 'atrium'
  | 'skills'
  | 'contact'
  | 'experiments'
  | 'timeline'
  | 'about'

export type ExhibitKind = 'frame' | 'pedestal' | 'screen'

export interface Exhibit {
  id: string
  roomId: RoomId
  kind: ExhibitKind
  title: string
  subtitle?: LS | string
  year?: string
  tags?: string[]
  description: LS | string
  /** Room-local position (x, z on floor). y is derived from kind. */
  local: [number, number]
  /** Facing direction in degrees (0 = +z). */
  facing?: number
  accent?: string
  link?: string
  /** Jonli sahifa: loyiha landing'i yoki saytning o'zi. `link` kodga, bu — ko'rish uchun. */
  demo?: string
}

export interface Room {
  id: RoomId
  title: LS
  eyebrow: LS
  /** World-space centre (x, z). */
  center: [number, number]
  size: [number, number]
  height: number
  /** Storey: 0 = ground floor, 1 = upper floor. */
  level: 0 | 1
  /** World y of this room's walking surface. */
  floorY: number
  accent: string
  /** Hypercube-cell index (0..7) for the mini-map net. */
  cell: number
  /** Animated wall pattern (see src/lib/wallFx.ts). */
  fx: 'neural' | 'circuit' | 'rain' | 'grid'
  description: LS
}

export interface Corridor {
  from: RoomId
  to: RoomId
}

export interface RailWaypoint {
  roomId: RoomId
  position: [number, number, number]
  /** Optional look-at target; defaults to next waypoint. */
  lookAt?: [number, number, number]
  /** Dwell label shown in HUD when near this point. */
  label?: string
}
