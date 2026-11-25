import { Suspense, useMemo, useState } from 'react'
import * as THREE from 'three'
import { STACK_BADGES, logoBadgeTexture } from '@/lib/techlogos'
import { circuitTexture, codeTexture, contribTexture, numberTexture, quoteTexture, signTexture, wordmarkTexture, yearsTexture } from '@/lib/poster'
import { corridors, roomById, rooms, DOOR_HEIGHT } from '@/data/rooms'
import type { Room, RoomId } from '@/data/types'
import { useLang } from '@/lib/useT'
import { pick } from '@/lib/i18n'
import { UNIT_BOX, asset } from '@/lib/geo'
import { ANISO } from '@/lib/tier'
import { preloadImage, useImageTexture } from '@/lib/assets'
import { Cull } from './Cull'


function LogoBadge({ logo, position, rotationY, size = 1.15 }: {
  logo: { name: string; url: string }
  position: [number, number, number]
  rotationY: number
  size?: number
}) {
  const [, bump] = useState(0)
  const tex = useMemo(() => logoBadgeTexture(logo, () => bump((n) => n + 1)), [logo])
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} transparent emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.4} roughness={0.85} />
    </mesh>
  )
}


function Mural({ tex, position, rotationY, w, h, intensity = 0.4 }: { tex: THREE.Texture; position: [number, number, number]; rotationY: number; w: number; h: number; intensity?: number }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} transparent emissive="#ffffff" emissiveMap={tex} emissiveIntensity={intensity} roughness={0.9} />
    </mesh>
  )
}

function CodePanel({ position, rotationY, w, h, seed }: { position: [number, number, number]; rotationY: number; w: number; h: number; seed: number }) {
  const tex = useMemo(() => codeTexture(seed, 'atrium'), [seed])
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.3} roughness={0.9} />
    </mesh>
  )
}

/** Wayfinding sign INSIDE `room`, above its door toward `other`. */
function DoorSign({ room, other }: { room: Room; other: Room }) {
  const lang = useLang()
  const tex = useMemo(() => signTexture(pick(other.title, lang), pick(other.eyebrow, lang), lang, room.id), [other, lang, room.id])
  const y0 = Math.max(room.floorY, other.floorY)
  const dx = other.center[0] - room.center[0]
  const dz = other.center[1] - room.center[1]
  const horizontal = Math.abs(dx) > Math.abs(dz)
  const hw = room.size[0] / 2 - 0.18
  const hd = room.size[1] / 2 - 0.18
  let pos: [number, number, number]
  let rot = 0
  if (horizontal) {
    pos = dx > 0 ? [room.center[0] + hw, 0, room.center[1]] : [room.center[0] - hw, 0, room.center[1]]
    rot = dx > 0 ? -Math.PI / 2 : Math.PI / 2
  } else {
    pos = dz > 0 ? [room.center[0], 0, room.center[1] + hd] : [room.center[0], 0, room.center[1] - hd]
    rot = dz > 0 ? Math.PI : 0
  }
  pos[1] = y0 + DOOR_HEIGHT + 0.55
  return (
    <mesh position={pos} rotation={[0, rot, 0]}>
      <planeGeometry args={[2.4, 0.6]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.4} roughness={0.9} />
    </mesh>
  )
}

preloadImage(asset('textures/portrait.jpg'))

/**
 * Portrait photo material. Loaded through the R3F loader cache so `<Preload all />` and the
 * warm-up compile see it — swapping the material in later cost a mid-walk shader rebuild.
 */
function PortraitFace() {
  const tex = useImageTexture(asset('textures/portrait.jpg'), 'about')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  return <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.32} roughness={0.85} />
}

/** Portrait photo in a gallery frame (about room). */
function Portrait({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Cull id="about">
      {/* outer frame + inner mat, like the exhibit frames */}
      <mesh castShadow geometry={UNIT_BOX} scale={[3.8, 3.8, 0.12]} dispose={null}>        <meshStandardMaterial color="#1a1b20" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.066]}>
        <planeGeometry args={[3.6, 3.6]} />
        <meshStandardMaterial color="#DDD9CE" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[3.32, 3.32]} />
        <Suspense fallback={<meshStandardMaterial color="#22252c" roughness={0.9} />}>
          <PortraitFace />
        </Suspense>
      </mesh>
      {/* picture light */}
      <object3D name="portrait-target" position={[0, 0, 0]} />
      </Cull>
      {/* the light stays outside the Cull (a hidden light would change the light count) */}
      <pointLight position={[0, 2.4, 1.4]} intensity={9} distance={7} decay={2} color="#FFE2B8" />
    </group>
  )
}

/**
 * Wall decoration layer: language badges (skills), code murals (atrium),
 * accent bands, wayfinding signs above every door, GitHub portrait (about).
 */
/** Hall numbers on each room's feature wall (offset from centre so exhibits stay clear). */
const NUMBERS: { id: keyof typeof roomById; side: 'n' | 's' | 'e' | 'w'; along: number }[] = [
  { id: 'entrance', side: 'e', along: -4 },
  { id: 'projects', side: 'w', along: 4.6 },
  { id: 'skills', side: 'e', along: -4.3 },
  { id: 'contact', side: 'e', along: -4.3 },
  { id: 'experiments', side: 'n', along: 4.6 },
  { id: 'timeline', side: 'e', along: -4.3 },
  { id: 'about', side: 'w', along: 4.3 },
]

const sideXform = (room: (typeof rooms)[number], side: 'n' | 's' | 'e' | 'w', along: number, y: number): { position: [number, number, number]; rotationY: number } => {
  const [cx, cz] = room.center
  const hw = room.size[0] / 2 - 0.18
  const hd = room.size[1] / 2 - 0.18
  if (side === 'n') return { position: [cx + along, y, cz - hd], rotationY: 0 }
  if (side === 's') return { position: [cx + along, y, cz + hd], rotationY: Math.PI }
  if (side === 'e') return { position: [cx + hw, y, cz + along], rotationY: -Math.PI / 2 }
  return { position: [cx - hw, y, cz + along], rotationY: Math.PI / 2 }
}

export function Decor() {
  const skills = roomById.skills
  const about = roomById.about
  const atrium = roomById.atrium
  const entrance = roomById.entrance
  const contact = roomById.contact
  const experiments = roomById.experiments
  const timeline = roomById.timeline

  const lang = useLang()
  const numberMurals = useMemo(
    () =>
      NUMBERS.map((n, i) => {
        const room = roomById[n.id]
        const label = pick(room.eyebrow, lang).split('·')[0].trim()
        return { key: String(n.id), tex: numberTexture(String(i + 1).padStart(2, '0'), label, room.accent, lang, n.id), ...sideXform(room, n.side, n.along, room.floorY + 3.9) }
      }),
    [lang],
  )

  // skills: official marks flanking the north-wall Stack screen, four per side
  const badgeMeshes = useMemo(() => {
    const [cx, cz] = skills.center
    const wallZ = cz - skills.size[1] / 2 + 0.18
    const y = skills.floorY + 2.9
    const xs = [-6.1, -4.8, -3.5, -2.2, 2.2, 3.5, 4.8, 6.1]
    return STACK_BADGES.map((logo, i) => ({
      logo,
      position: [cx + xs[i], y, wallZ] as [number, number, number],
      rotationY: 0,
    }))
  }, [skills])

  return (
    <group name="decor">
      <Cull id="skills">
        {badgeMeshes.map((b) => (
          <LogoBadge key={b.logo.name} {...b} />
        ))}
      </Cull>

      {/* atrium code murals: F1 north & west walls (doors there are at mezzanine level) */}
      <Cull id="atrium">
        <CodePanel position={[atrium.center[0] - 5.5, 2.6, atrium.center[1] - atrium.size[1] / 2 + 0.18]} rotationY={0} w={6} h={3.4} seed={1} />
        <CodePanel position={[atrium.center[0] + 5.5, 2.6, atrium.center[1] - atrium.size[1] / 2 + 0.18]} rotationY={0} w={6} h={3.4} seed={2} />
        <CodePanel position={[atrium.center[0] - atrium.size[0] / 2 + 0.18, 2.6, atrium.center[1] + 4.5]} rotationY={Math.PI / 2} w={6} h={3.4} seed={3} />
      </Cull>

      {/* wayfinding signs above every door, both directions */}
      {corridors.map((c) => (
        <group key={`sign-${c.from}-${c.to}`}>
          <Cull id={c.from}><DoorSign room={roomById[c.from]} other={roomById[c.to]} /></Cull>
          <Cull id={c.to}><DoorSign room={roomById[c.to]} other={roomById[c.from]} /></Cull>
        </group>
      ))}

      {/* hall numbers */}
      {numberMurals.map((m) => (
        <Cull key={m.key} id={m.key as RoomId}><Mural tex={m.tex} position={m.position} rotationY={m.rotationY} w={2.2} h={2.2} intensity={0.35} /></Cull>
      ))}

      {/* entrance: wordmark banner (east wall) */}
      <Cull id="entrance"><Mural tex={wordmarkTexture('entrance')} {...sideXform(entrance, 'e', 0, entrance.floorY + 2.5)} w={5.4} h={1.35} intensity={0.45} /></Cull>

      {/* contact: GitHub contribution graph (south wall) */}
      <Cull id="contact"><Mural tex={contribTexture(47, 'contact')} {...sideXform(contact, 's', 0, contact.floorY + 2.2)} w={4.4} h={2.2} intensity={0.5} /></Cull>

      {/* experiments: circuit boards flanking the south door */}
      <Cull id="experiments">
        <Mural tex={circuitTexture(5, 'experiments')} {...sideXform(experiments, 's', -4.5, experiments.floorY + 2.5)} w={3} h={3} intensity={0.45} />
        <Mural tex={circuitTexture(9, 'experiments')} {...sideXform(experiments, 's', 4.5, experiments.floorY + 2.5)} w={3} h={3} intensity={0.45} />
      </Cull>

      {/* timeline: year band above the frames on both long walls */}
      <Cull id="timeline">
        <Mural tex={yearsTexture('timeline')} {...sideXform(timeline, 'n', 0, timeline.floorY + 3.6)} w={11} h={1.4} intensity={0.5} />
        <Mural tex={yearsTexture('timeline')} {...sideXform(timeline, 's', 0, timeline.floorY + 3.6)} w={11} h={1.4} intensity={0.5} />
      </Cull>

      {/* about: quote mural (south wall) */}
      <Cull id="about"><Mural tex={quoteTexture('about')} {...sideXform(about, 'w', 4.6, about.floorY + 1.75)} w={4.2} h={2.1} intensity={0.4} /></Cull>

      {/* about: GitHub portrait — south wall, beside the quote */}
      <Portrait position={[about.center[0] - 4.0, about.floorY + 2.3, about.center[1] + about.size[1] / 2 - 0.18]} rotationY={Math.PI} />
    </group>
  )
}
