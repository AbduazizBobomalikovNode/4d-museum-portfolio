import { useMemo } from 'react'
import * as THREE from 'three'
import { PLATES, codePlateTexture } from '@/lib/codeart'
import { UNIT_BOX, UNIT_PLANE } from '@/lib/geo'

/**
 * Famous-code gallery on the atrium's south wall.
 *
 * Six plates: a pair flanking the doorway at eye level, and four in a band above it, so
 * they also read from the mezzanine. Each is a framed panel — a dark backing box
 * with the painted plate on its face, the way the exhibit frames elsewhere are built.
 */

const PLATE_W = 3.2
const PLATE_H = PLATE_W / 2 // canvas is 1024×512

/**
 * The south wall carries the Projects Wing doorway — 4m wide, 3.2m tall, centred.
 * So the lower row is a pair flanking the door at eye level, and the upper row is a
 * band of four above it, readable from the floor and from the mezzanine.
 */
const LOWER_Y = 2.4
const UPPER_Y = 6.3
const LOWER_X = 4.2   // door edge is at ±2; half a plate is 1.68 — leaves a real gap
const UPPER_GAP = 0.5

export function CodeWall({ z = 9.86, y0 = 0 }: { z?: number; y0?: number }) {
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0c0d11', roughness: 0.45, metalness: 0.35 }),
    [],
  )

  const plates = useMemo(() => {
    const step = PLATE_W + UPPER_GAP
    return PLATES.map((p, i) => {
      const lower = i < 2
      const x = lower
        ? (i === 0 ? -LOWER_X : LOWER_X)
        : (i - 2 - 1.5) * step // four across, centred
      return { id: p.id, tex: codePlateTexture(p), x, y: y0 + (lower ? LOWER_Y : UPPER_Y) }
    })
  }, [y0])

  return (
    <group position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
      {plates.map((p) => (
        <group key={p.id} position={[p.x, p.y, 0]}>
          <mesh castShadow geometry={UNIT_BOX} scale={[PLATE_W + 0.16, PLATE_H + 0.16, 0.1]} material={frameMat} dispose={null} />
          <mesh position={[0, 0, 0.055]} geometry={UNIT_PLANE} scale={[PLATE_W, PLATE_H, 1]} dispose={null}>
            <meshStandardMaterial
              map={p.tex}
              emissive="#ffffff"
              emissiveMap={p.tex}
              emissiveIntensity={0.42}
              roughness={0.72}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
