import { useMemo } from 'react'
import * as THREE from 'three'
import { useBody } from '@/scene/physics/BodyContext'
import type { Room as RoomData } from '@/data/types'
import { CORRIDOR_WIDTH, DOOR_HEIGHT } from '@/data/rooms'
import { ceilingTexture, floorTexture, tiled, wallTexture } from '@/lib/surfaces'
import { applyWallFx } from '@/lib/wallFx'
import { UNIT_BOX } from '@/lib/geo'

interface Props {
  a: RoomData
  b: RoomData
}

/**
 * Straight greybox corridor between two rooms (axis-aligned).
 * Runs at the HIGHER of the two floor levels (atrium ↔ upper-floor rooms connect at the mezzanine).
 */
export function Corridor({ a, b }: Props) {
  const Body = useBody()
  const ax = a.center[0], az = a.center[1]
  const bx = b.center[0], bz = b.center[1]
  const y0 = Math.max(a.floorY, b.floorY)
  const horizontal = Math.abs(ax - bx) > Math.abs(az - bz)
  const h = DOOR_HEIGHT
  const WALL_T = 0.3

  // span between the two facing WALL planes — centring on room centres breaks when
  // room sizes differ (the atrium is wider): that left a 1.2 m floor hole at the threshold
  let start: number
  let end: number
  if (horizontal) {
    if (bx > ax) { start = ax + a.size[0] / 2; end = bx - b.size[0] / 2 } else { start = bx + b.size[0] / 2; end = ax - a.size[0] / 2 }
  } else {
    if (bz > az) { start = az + a.size[1] / 2; end = bz - b.size[1] / 2 } else { start = bz + b.size[1] / 2; end = az - a.size[1] / 2 }
  }
  const len = end - start
  const mid = (start + end) / 2
  const cx = horizontal ? mid : ax
  const cz = horizontal ? az : mid

  const { floorMat, wallMat, ceilMat, stripMat } = useMemo(() => {
    const floorMat = new THREE.MeshStandardMaterial({ map: tiled(floorTexture(), CORRIDOR_WIDTH, len + 0.28, 8), roughness: 0.52, metalness: 0.03 })
    const wallMat = applyWallFx(
      new THREE.MeshStandardMaterial({ map: tiled(wallTexture(), len + 0.28, h, 5), roughness: 0.92, metalness: 0.02 }),
      b.fx,
      b.accent,
      0.34,
    )
    const ceilMat = new THREE.MeshStandardMaterial({ map: tiled(ceilingTexture(), CORRIDOR_WIDTH, len + 0.28, 6), roughness: 0.9 })
    const stripMat = new THREE.MeshStandardMaterial({ color: '#0c0d10', emissive: '#FFE3BC', emissiveIntensity: 0.9 })
    return { floorMat, wallMat, ceilMat, stripMat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len, h, b.fx, b.accent])
  const floorSize: [number, number, number] = horizontal ? [len + 0.28, 0.3, CORRIDOR_WIDTH] : [CORRIDOR_WIDTH, 0.3, len + 0.28]
  const wallSize: [number, number, number] = horizontal ? [len + 0.28, h, WALL_T] : [WALL_T, h, len + 0.28]
  // +0.01: corridor wall inner face must clear the room door-jamb plane (z-fighting)
  const off = CORRIDOR_WIDTH / 2 + WALL_T / 2 + 0.01

  return (
    <group name={`corridor-${a.id}-${b.id}`}>
      <Body>
        <mesh receiveShadow position={[cx, y0 - 0.153, cz]} material={floorMat} geometry={UNIT_BOX} scale={floorSize} dispose={null} />
        <mesh castShadow receiveShadow position={horizontal ? [cx, y0 + h / 2, cz - off] : [cx - off, y0 + h / 2, cz]} material={wallMat} geometry={UNIT_BOX} scale={wallSize} dispose={null} />
        <mesh castShadow receiveShadow position={horizontal ? [cx, y0 + h / 2, cz + off] : [cx + off, y0 + h / 2, cz]} material={wallMat} geometry={UNIT_BOX} scale={wallSize} dispose={null} />
      </Body>
      <mesh position={[cx, y0 + h + 0.154, cz]} material={ceilMat} geometry={UNIT_BOX} scale={horizontal ? [len + 0.28, 0.3, CORRIDOR_WIDTH + WALL_T * 2] : [CORRIDOR_WIDTH + WALL_T * 2, 0.3, len + 0.28]} dispose={null} />
      {/* centre light strip */}
      <mesh position={[cx, y0 + h - 0.06, cz]} material={stripMat} geometry={UNIT_BOX} scale={horizontal ? [len * 0.7, 0.08, 0.22] : [0.22, 0.08, len * 0.7]} dispose={null} />
    </group>
  )
}
