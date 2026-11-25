import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { fxIntensity, fxTime } from '@/lib/wallFx'
import { useStore } from '@/state/store'
import { corridors, isNear, roomById, rooms, FLOOR2_Y } from '@/data/rooms'
import type { RoomId } from '@/data/types'
import { exhibits } from '@/data/exhibits'
import { Room, type Openings } from './rooms/Room'
import { Corridor } from './rooms/Corridor'
import { AtriumMezz } from './rooms/AtriumMezz'
import { Exhibit } from './Exhibit'
import { DigitalGlobe } from './DigitalGlobe'
import { Decor } from './Decor'
import { SpotPool } from './SpotPool'
import { ReflectiveFloor } from './ReflectiveFloor'
import { WallClock } from './WallClock'
import { CodeWall } from './CodeWall'
import { LogoWall } from './LogoWall'
import { CvWall } from './CvWall'
import { GiftShelf } from './GiftShelf'
import { GithubLive } from './GithubLive'
import { GithubReadme } from './GithubReadme'
import { FeedbackWall } from './FeedbackWall'
import { LanguageKiosk } from './LanguageKiosk'
import { CornerGlass } from './CornerGlass'
import { NavGlass } from './NavGlass'
import { perfCount } from '@/lib/perfBus'

/**
 * Door openings per room from the corridor graph.
 * Base height is relative to the room's own floor — the atrium's upper-floor
 * doors sit at FLOOR2_Y, regular rooms at 0.
 */
function useOpenings(): Record<string, Openings> {
  return useMemo(() => {
    const o: Record<string, Openings> = {}
    for (const r of rooms) o[r.id] = {}
    const add = (id: string, side: keyof Openings, base: number) => {
      ;(o[id][side] ??= []).push(base)
    }
    for (const c of corridors) {
      const a = roomById[c.from]
      const b = roomById[c.to]
      const y = Math.max(a.floorY, b.floorY)
      const dx = b.center[0] - a.center[0]
      const dz = b.center[1] - a.center[1]
      if (Math.abs(dx) > Math.abs(dz)) {
        add(a.id, dx > 0 ? 'e' : 'w', y - a.floorY)
        add(b.id, dx > 0 ? 'w' : 'e', y - b.floorY)
      } else {
        add(a.id, dz > 0 ? 's' : 'n', y - a.floorY)
        add(b.id, dz > 0 ? 'n' : 's', y - b.floorY)
      }
    }
    return o
  }, [])
}

/** Museum feature wall (accent-tinted plaster) per room — behind the hero exhibit. */
const FEATURE: Partial<Record<string, 'n' | 's' | 'e' | 'w'>> = {
  entrance: 'w',
  projects: 'w',
  skills: 's',
  contact: 'e',
  experiments: 'n',
  timeline: 'n',
  about: 'w',
}

/**
 * Hides rooms the visitor cannot be looking into (anything further than one door away).
 * Frustum culling alone still walks every mesh; this drops whole rooms from the graph.
 */
function VisibleGroup({ id, children }: { id: RoomId; children: React.ReactNode }) {
  // during warm-up everything is visible so the one-time shader compile covers the whole museum
  const visible = useStore((s) => s.warmup || isNear(s.roomId, id))
  // roomGate lets the nav board's thumbnail pass reveal one room at a time off-screen
  return <group visible={visible} userData={{ roomGate: id }}>{children}</group>
}

/** Drives the shared wall-shader clock; off on the low tier. */
function WallFxDriver() {
  const quality = useStore((s) => s.quality)
  useEffect(() => { fxIntensity.value = quality === 'low' ? 0 : quality === 'medium' ? 0.7 : 1 }, [quality])
  useFrame((_, dt) => { fxTime.value += Math.min(dt, 0.05) })
  return null
}

export function World() {
  const openings = useOpenings()
  useEffect(() => { perfCount('World') }, [])

  return (
    <group name="world">
      <WallFxDriver />
      <SpotPool />
      {rooms.map((r) => (
        <VisibleGroup key={r.id} id={r.id}>
          <Room room={r} openings={openings[r.id]} featureSide={FEATURE[r.id]} />
        </VisibleGroup>
      ))}
      {corridors.map((c) => (
        <Corridor key={`${c.from}-${c.to}`} a={roomById[c.from]} b={roomById[c.to]} />
      ))}
      <AtriumMezz />
      <Decor />
      <ReflectiveFloor />
      {exhibits.map((e) => (
        <VisibleGroup key={e.id} id={e.roomId}>
          <Exhibit data={e} />
        </VisibleGroup>
      ))}
      {/* Tashkent clock — centred on the stair's north glass balustrade (holo-display on the pane) */}
      <WallClock position={[-1.6, 5.85, -4.87]} />

      {/* live GitHub profile screen — about room feature wall */}
      <GithubLive position={[-46.7, 7.9, 0]} rotationY={Math.PI / 2} />
      {/* language lectern — entrance hall, north-west corner by the doorway */}
      <LanguageKiosk position={[-4.9, 0, 35.4]} rotationY={Math.atan2(4.9, 4.6)} />

      {/* entrance: glass screen across the north-east corner, floor-fixed, clear of ceiling and walls */}
      <CornerGlass corner={[7, 33]} inward={[-1, 1]} distance={3.6} accent={roomById.entrance.accent}>
        <NavGlass />
      </CornerGlass>

      {/* contact card + feedback form — about room, south wall */}
      <FeedbackWall position={[-36.5, 7.9, 6.82]} rotationY={Math.PI} />

      {/* profile README — two big screens filling the north wall: left = start, right = continuation */}
      <GithubReadme position={[-43.35, 8.2, -6.7]} rotationY={0} page={0} />
      <GithubReadme position={[-36.65, 8.2, -6.7]} rotationY={0} page={1} />

      {/* skills: technology wall where the bot screen used to be (south wall) */}
      <LogoWall position={[20, 2.5, 6.62]} rotationY={Math.PI} title="Texnologiyalar" />

      {/* gift shop: the CV framed beside the GitHub piece on the north wall … */}
      <CvWall position={[44.6, 2.35, -6.62]} rotationY={0} />
      {/* … and the book shelf now filling the whole south wall, opposite it */}
      <GiftShelf position={[40, 2.525, 6.59]} rotationY={Math.PI} />

      {/* atrium: famous-code gallery on the south wall, two rows — ground floor and mezzanine */}
      <CodeWall />

      {/* digital globe floats in the double-height void — Uzbekistan raised, Tashkent beacon */}
      <DigitalGlobe position={[-1.2, FLOOR2_Y + 0.8, 0]} />
    </group>
  )
}
