import { useMemo } from 'react'
import * as THREE from 'three'
import { useBody } from '@/scene/physics/BodyContext'
import type { Room as RoomData } from '@/data/types'
import { CORRIDOR_WIDTH, DOOR_HEIGHT } from '@/data/rooms'
import { ceilingTexture, floorTexture, tiled, wallTexture } from '@/lib/surfaces'
import { applyWallFx } from '@/lib/wallFx'
import { UNIT_BOX } from '@/lib/geo'

const WALL_T = 0.3

/** Shared across rooms: identical wall segments should not each own a material. */
const wallMatCache = new Map<string, THREE.MeshStandardMaterial>()
const SIDES = ['n', 's', 'e', 'w'] as const
export type Side = (typeof SIDES)[number]

/** Door openings per side: list of base heights RELATIVE to the room floor (0 = own floor, 6 = mezzanine level in the atrium). */
export type Openings = Partial<Record<Side, number[]>>

interface Props {
  room: RoomData
  openings: Openings
  /** Wall painted in the room accent (museum feature wall). */
  featureSide?: Side
}

/** Wall segments for one side of length L / height H with centred doors at the given base heights. */
function wallSegments(L: number, H: number, doors: number[] | undefined) {
  const segs: { off: number; y: number; len: number; h: number }[] = []
  if (!doors || doors.length === 0) {
    segs.push({ off: 0, y: H / 2, len: L, h: H })
    return segs
  }
  const dw = CORRIDOR_WIDTH
  const side = (L - dw) / 2
  segs.push({ off: -(dw / 2 + side / 2), y: H / 2, len: side, h: H })
  segs.push({ off: dw / 2 + side / 2, y: H / 2, len: side, h: H })
  const sorted = [...doors].sort((a, b) => a - b)
  let cur = 0
  for (const base of sorted) {
    if (base > cur + 0.01) segs.push({ off: 0, y: (cur + base) / 2, len: dw, h: base - cur })
    cur = base + DOOR_HEIGHT
  }
  if (cur < H - 0.01) segs.push({ off: 0, y: (cur + H) / 2, len: dw, h: H - cur })
  return segs
}

const sidePos = (side: Side, cx: number, cz: number, hw: number, hd: number): { x: number; z: number; rot: number; horiz: boolean } =>
  side === 'n' ? { x: cx, z: cz - hd, rot: 0, horiz: true }
  : side === 's' ? { x: cx, z: cz + hd, rot: 0, horiz: true }
  : side === 'e' ? { x: cx + hw, z: cz, rot: Math.PI / 2, horiz: false }
  : { x: cx - hw, z: cz, rot: Math.PI / 2, horiz: false }

/**
 * Greybox room, dressed: tiled polished-concrete floor, plaster walls
 * (feature wall tinted with the room accent), panelled ceiling with light
 * strips, accent door frames, baseboards. Colliders via useBody().
 */
export function Room({ room, openings, featureSide }: Props) {
  const Body = useBody()
  const [cx, cz] = room.center
  const [w, d] = room.size
  const h = room.height
  const y0 = room.floorY
  const hw = w / 2
  const hd = d / 2
  const accent = room.accent

  const { floorMat, ceilMat, frameMat, baseMat, stripMat, mkWall, fTint } = useMemo(() => {
    const floorTex = tiled(floorTexture(), w, d, 8)
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.52, metalness: 0.03 })
    const ceilTex = tiled(ceilingTexture(), w, d, 6)
    const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9 })
    // animated IT/AI pattern is the default wall backdrop; feature walls get a stronger accent
    const mkWall = (tint: string, len: number, hh: number, feature = false) => {
      // one material per (tint, quantised size, room pattern) — walls repeat a lot
      const rx = Math.round((len / 5) * 4) / 4
      const ry = Math.round((hh / 5) * 4) / 4
      const key = `${tint}:${rx}:${ry}:${room.fx}:${accent}:${feature}`
      const hit = wallMatCache.get(key)
      if (hit) return hit
      const mat = applyWallFx(
        new THREE.MeshStandardMaterial({ map: tiled(wallTexture(tint), len, hh, 5), roughness: 0.92, metalness: 0.02 }),
        room.fx,
        accent,
        feature ? 0.5 : 0.28,
      )
      wallMatCache.set(key, mat)
      return mat
    }
    // feature tint: keep the accent hue but clamp saturation/lightness to plaster levels,
    // otherwise bright accents (cyan) turn the whole wall pastel
    const hsl = { h: 0, s: 0, l: 0 }
    new THREE.Color(accent).getHSL(hsl)
    const fTint = '#' + new THREE.Color().setHSL(hsl.h, 0.18, 0.18).getHexString()
    const frameMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5, metalness: 0.35 })
    const baseMat = new THREE.MeshStandardMaterial({ color: '#101216', roughness: 0.6, metalness: 0.2 })
    const stripMat = new THREE.MeshStandardMaterial({ color: '#0c0d10', emissive: '#FFE3BC', emissiveIntensity: 0.9, toneMapped: true })
    return { floorMat, ceilMat, frameMat, baseMat, stripMat, mkWall, fTint }
  }, [w, d, accent, room.fx])

  const parts = useMemo(() => {
    const walls: { pos: [number, number, number]; size: [number, number, number]; mat: THREE.Material }[] = []
    const frames: { pos: [number, number, number]; size: [number, number, number] }[] = []
    const bases: { pos: [number, number, number]; size: [number, number, number] }[] = []
    for (const side of SIDES) {
      const doors = openings[side]
      const p = sidePos(side, cx, cz, hw, hd)
      const L = p.horiz ? w : d
      const feature = side === featureSide
      for (const s of wallSegments(L, h, doors)) {
        walls.push({
          // 6 mm sink: keeps wall top/bottom faces off the coplanar ceiling/floor planes (z-fighting)
          pos: p.horiz ? [p.x + s.off, y0 + s.y - 0.006, p.z] : [p.x, y0 + s.y - 0.006, p.z + s.off],
          size: p.horiz ? [s.len, s.h, WALL_T] : [WALL_T, s.h, s.len],
          mat: mkWall(feature ? fTint : '#3a3d45', s.len, s.h, feature),
        })
        // baseboard for floor-level full-height segments
        if (s.y === h / 2) {
          const inset = 0.04
          bases.push({
            pos: p.horiz
              ? [p.x + s.off, y0 + 0.09, p.z + (p.z > cz ? -WALL_T / 2 - inset : WALL_T / 2 + inset)]
              : [p.x + (p.x > cx ? -WALL_T / 2 - inset : WALL_T / 2 + inset), y0 + 0.09, p.z + s.off],
            size: p.horiz ? [s.len, 0.18, 0.06] : [0.06, 0.18, s.len],
          })
        }
      }
      // accent door frames (jambs + header). The jamb overlaps the wall's door-column edge by
      // 2 cm so the wall's end face sits INSIDE the jamb box — flush placement left the two
      // faces coplanar and they z-fight into a flickering checker at grazing angles.
      for (const base of doors ?? []) {
        const t = 0.14
        const jh = DOOR_HEIGHT + t
        const zOut = 0
        for (const sideOff of [-(CORRIDOR_WIDTH / 2 + t / 2 - 0.02), CORRIDOR_WIDTH / 2 + t / 2 - 0.02]) {
          frames.push({
            pos: p.horiz ? [p.x + sideOff, y0 + base + jh / 2 - t / 2, p.z + zOut] : [p.x + zOut, y0 + base + jh / 2 - t / 2, p.z + sideOff],
            size: p.horiz ? [t, jh, WALL_T + 0.12] : [WALL_T + 0.12, jh, t],
          })
        }
        frames.push({
          pos: p.horiz ? [p.x, y0 + base + DOOR_HEIGHT + t / 2 - 0.02, p.z + zOut] : [p.x + zOut, y0 + base + DOOR_HEIGHT + t / 2 - 0.02, p.z],
          size: p.horiz ? [CORRIDOR_WIDTH + t * 2, t, WALL_T + 0.12] : [WALL_T + 0.12, t, CORRIDOR_WIDTH + t * 2],
        })
      }
    }
    return { walls, frames, bases }
  }, [cx, cz, w, d, h, y0, hw, hd, openings, featureSide, mkWall, fTint])

  // ceiling light strips: two runs along the room's long axis
  const strips = useMemo(() => {
    const list: { pos: [number, number, number]; size: [number, number, number] }[] = []
    const off = Math.min(hw, hd) * 0.45
    for (const o of [-off, off]) list.push({ pos: [cx + o, y0 + h - 0.06, cz], size: [0.25, 0.08, d * 0.6] })
    return list
  }, [cx, cz, d, h, y0, hw, hd])

  return (
    <group name={`room-${room.id}`}>
      <Body>
        <mesh receiveShadow position={[cx, y0 - 0.15, cz]} material={floorMat} geometry={UNIT_BOX} scale={[w, 0.3, d]} dispose={null}>        </mesh>
        {parts.walls.map((wl, i) => (
          <mesh key={i} castShadow receiveShadow position={wl.pos} material={wl.mat} geometry={UNIT_BOX} scale={wl.size} dispose={null} />
        ))}
      </Body>
      {/* ceiling */}
      <mesh position={[cx, y0 + h + 0.15, cz]} material={ceilMat} geometry={UNIT_BOX} scale={[w, 0.3, d]} dispose={null}>      </mesh>
      {/* light strips (visual fixtures) */}
      {strips.map((s2, i) => (
        <mesh key={'l' + i} position={s2.pos} material={stripMat} geometry={UNIT_BOX} scale={s2.size} dispose={null} />
      ))}
      {/* accent door frames + baseboards */}
      {parts.frames.map((f, i) => (
        <mesh key={'f' + i} position={f.pos} material={frameMat} geometry={UNIT_BOX} scale={f.size} dispose={null} />
      ))}
      {parts.bases.map((b, i) => (
        <mesh key={'b' + i} position={b.pos} material={baseMat} geometry={UNIT_BOX} scale={b.size} dispose={null} />
      ))}
      {/* accent hanging-rail line across the feature wall */}
      {featureSide && (() => {
        const p = sidePos(featureSide, cx, cz, hw, hd)
        const L = (p.horiz ? w : d) - 0.6
        const off = 0.19
        const pos: [number, number, number] = p.horiz
          ? [p.x, y0 + 3.35, p.z + (p.z > cz ? -off : off)]
          : [p.x + (p.x > cx ? -off : off), y0 + 3.35, p.z]
        return (
          <mesh position={pos} material={frameMat} geometry={UNIT_BOX} scale={p.horiz ? [L, 0.05, 0.02] : [0.02, 0.05, L]} dispose={null} />
        )
      })()}
    </group>
  )
}
