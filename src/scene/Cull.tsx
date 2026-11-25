import type { ReactNode } from 'react'
import { useStore } from '@/state/store'
import { isNear } from '@/data/rooms'
import type { RoomId } from '@/data/types'
import { perfFlags } from '@/lib/perfFlags'

/**
 * Same near-room visibility World.tsx's VisibleGroup applies to rooms and exhibits, for everything else
 * (corridors, mezzanine, decor, wall screens, kiosk, globe, clock): visible while the visitor is in, or one
 * door away from, ANY of `id`. During warm-up everything is visible so the shader compile covers it.
 *
 * `roomGate` lets the nav board's preview shots show one room at a time (RoomPreview reads it; an array
 * means "belongs to each of these rooms", e.g. a corridor).
 *
 * Never put a light inside: three drops invisible lights from the frame, which changes the light count and
 * recompiles every material. Keep lights as siblings outside the Cull.
 * `cullAll` off: a plain fragment (the old, always-submitted behaviour).
 */
export function Cull({ id, children }: { id: RoomId | RoomId[]; children: ReactNode }) {
  const ids = Array.isArray(id) ? id : [id]
  const visible = useStore((s) => s.warmup || ids.some((i) => isNear(s.roomId, i)))
  if (!perfFlags.cullAll) return <>{children}</>
  return <group visible={visible} userData={{ roomGate: ids.length === 1 ? ids[0] : ids }}>{children}</group>
}
