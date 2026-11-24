import { useMemo } from 'react'
import * as THREE from 'three'
import { useBody } from '@/scene/physics/BodyContext'
import { ATRIUM_SIZE, FLOOR2_Y } from '@/data/rooms'
import { floorTexture, tiled, woodTexture } from '@/lib/surfaces'
import { UNIT_BOX } from '@/lib/geo'

const Y = FLOOR2_Y // walking surface of the mezzanine
const SLAB = 0.3
const RAIL_H = 1.05

/**
 * Atrium second storey: stair (ramp collider + step visuals), NE landing,
 * north + west mezzanine strips (reach the upper-floor doors), railings.
 * Stair: z = -3.5 band (z -5..-2), rises from x=-7 (y0) to x=+7 (y6).
 */
export function AtriumMezz() {
  // stair diagonal: y at horizontal position x (run x −7…+7, rise 0…6)
  // Exact balustrade polygons — see "Zina balustrade chizmasi" in docs/CONCEPT.md.
  const yDiag = (x: number) => ((x + 7) * FLOOR2_Y) / 14
  // North (z −4.96): ONE 8-edge polygon = stair side + void guard + landing edge, no overlaps.
  const glassGeoN = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-6.85, 0.0)
    sh.lineTo(6.85, yDiag(6.85) - 0.12)
    sh.lineTo(6.85, 6.0)
    sh.lineTo(7.3, 6.0)
    sh.lineTo(7.3, 7.05)
    sh.lineTo(-5.0, 7.05)
    sh.lineTo(-5.0, yDiag(-5.0) + 1.05)
    sh.lineTo(-6.85, yDiag(-6.85) + 1.05)
    sh.closePath()
    return new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // South (z −2.15): 4-edge parallelogram up to the landing post.
  const glassGeoS = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-6.85, yDiag(-6.85) - 0.12)
    sh.lineTo(6.85, yDiag(6.85) - 0.12)
    sh.lineTo(6.85, yDiag(6.85) + 1.05)
    sh.lineTo(-6.85, yDiag(-6.85) + 1.05)
    sh.closePath()
    return new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { floorMatN, floorMatW, landMat, woodMat, glassMat, railMat } = useMemo(() => {
    const floorMatN = new THREE.MeshStandardMaterial({ map: tiled(floorTexture(), ATRIUM_SIZE, 5, 8), roughness: 0.52, metalness: 0.03 })
    const floorMatW = new THREE.MeshStandardMaterial({ map: tiled(floorTexture(), 5, 15, 8), roughness: 0.52, metalness: 0.03 })
    const landMat = new THREE.MeshStandardMaterial({ map: tiled(floorTexture(), 3, 3, 8), roughness: 0.52, metalness: 0.03 })
    const woodMat = new THREE.MeshStandardMaterial({ map: tiled(woodTexture(), 3, 1, 2), roughness: 0.6, metalness: 0.05 })
    const glassMat = new THREE.MeshStandardMaterial({ color: '#9fd8e8', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.22, side: THREE.DoubleSide, forceSinglePass: true })
    const railMat = new THREE.MeshStandardMaterial({ color: '#c8a55c', roughness: 0.35, metalness: 0.85 })
    return { floorMatN, floorMatW, landMat, woodMat, glassMat, railMat }
  }, [])

  const Body = useBody()

  const rampLen = 14
  const rampRise = Y
  const angle = Math.atan2(rampRise, rampLen)

  // full-height stepped blocks packed edge-to-edge — thin floating treads left the sloped
  // stringer exposed between them and their front corners hanging in the air
  const steps = useMemo(() => {
    const n = 16
    const rise = rampRise / n
    const depth = rampLen / n
    const out: { pos: [number, number, number]; size: [number, number, number] }[] = []
    for (let i = 0; i < n; i++) {
      const x = -7 + depth * (i + 0.5)
      out.push({ pos: [x, i * rise + (rise + 0.02) / 2, -3.5], size: [depth + 0.02, rise + 0.02, 3] })
    }
    return out
  }, [rampLen, rampRise])

  return (
    <group name="atrium-mezz">
      <Body>
        {/* north strip (z -10..-5) and west strip (x -10..-5) */}
        <mesh receiveShadow position={[0, Y - SLAB / 2, -7.5]} material={floorMatN} geometry={UNIT_BOX} scale={[ATRIUM_SIZE, SLAB, 5]} dispose={null}>        </mesh>
        <mesh receiveShadow position={[-7.5, Y - SLAB / 2, 2.5]} material={floorMatW} geometry={UNIT_BOX} scale={[5, SLAB, 15]} dispose={null}>        </mesh>
        {/* NE landing bridges stair top → north strip */}
        <mesh receiveShadow position={[8.5, Y - SLAB / 2, -3.5]} material={landMat} geometry={UNIT_BOX} scale={[3, SLAB, 3]} dispose={null}>        </mesh>
        {/* solid sloped soffit. Block bottoms are HORIZONTAL, so each block's rear-bottom corner
            dips a full riser (0.375) below the diagonal — the slab must be thick enough that its
            flat underside clears that: top +0.10 above the diagonal, bottom −0.52 below it. */}
        <mesh receiveShadow castShadow position={[0, rampRise / 2 - 0.23, -3.5]} rotation={[0, 0, angle]} material={woodMat} geometry={UNIT_BOX} scale={[15.9, 0.62, 3]} dispose={null}>        </mesh>
        {/* step blocks double as colliders — the character controller autosteps each riser */}
        {steps.map((s2, i) => (
          <mesh key={'s' + i} position={s2.pos} material={woodMat} receiveShadow castShadow geometry={UNIT_BOX} scale={s2.size} dispose={null} />
        ))}
        {/* railings: mezzanine inner edges + stair open side */}
        {/* void-edge collider (visual guard is the north balustrade polygon) */}
        <mesh position={[1.15, Y + RAIL_H / 2, -5 + 0.04]} geometry={UNIT_BOX} scale={[12.3, RAIL_H, 0.06]} dispose={null}>          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
        <mesh position={[-5 + 0.04, Y + RAIL_H / 2, 2.5]} material={glassMat} geometry={UNIT_BOX} scale={[0.06, RAIL_H, 15]} dispose={null}>        </mesh>
        <mesh position={[-5 + 0.04, Y + RAIL_H, 2.5]} material={railMat} geometry={UNIT_BOX} scale={[0.12, 0.07, 15]} dispose={null}>        </mesh>
        <mesh position={[8.42, Y + RAIL_H / 2, -2 + 0.04]} material={glassMat} geometry={UNIT_BOX} scale={[3.15, RAIL_H, 0.06]} dispose={null}>        </mesh>
        <mesh position={[8.42, Y + RAIL_H, -2 + 0.04]} material={railMat} geometry={UNIT_BOX} scale={[3.15, 0.07, 0.12]} dispose={null}>        </mesh>
        {/* stair side rails on BOTH open sides, following the slope; corner posts tie the
            sloped bars into the horizontal mezzanine rails so no end floats in the air.
            The glass is shorter than the handrail: a rotated rectangle's lower corner would
            otherwise poke past the posts outside the stair envelope — small vertical infill
            panes close the resulting bottom gaps instead. */}
        {[-5 + 0.12, -2 - 0.12].map((z) => (
          <group key={z}>
            <mesh position={[0, rampRise / 2 + RAIL_H / 2, z]} rotation={[0, 0, angle]} geometry={UNIT_BOX} scale={[14.5, RAIL_H, 0.06]} dispose={null}>              <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
            </mesh>
            <mesh position={[0, rampRise / 2 + RAIL_H, z]} rotation={[0, 0, angle]} material={railMat} geometry={UNIT_BOX} scale={[14.9, 0.07, 0.12]} dispose={null}>            </mesh>

            {/* bottom post (floor → start of sloped handrail) */}
            <mesh position={[-6.85, 0.62, z]} material={railMat} geometry={UNIT_BOX} scale={[0.09, 1.24, 0.09]} dispose={null}>            </mesh>
            {/* top post (mezzanine floor → end of sloped handrail) */}
            <mesh position={[6.85, Y + (RAIL_H + 0.75) / 2 - 0.55, z]} material={railMat} geometry={UNIT_BOX} scale={[0.09, RAIL_H + 0.75, 0.09]} dispose={null}>            </mesh>
          </group>
        ))}
      </Body>
      {/* balustrade panes per the drawing (visual only; colliders are the hidden boxes) */}
      <mesh geometry={glassGeoN} position={[0, 0, -5 + 0.04 - 0.03]} material={glassMat} />
      <mesh geometry={glassGeoS} position={[0, 0, -2 - 0.12 - 0.03]} material={glassMat} />
      {/* north top rail (void edge) + sloped grab bar fixed on the panel face */}
      <mesh position={[1.15, Y + RAIL_H, -5 + 0.04]} material={railMat} geometry={UNIT_BOX} scale={[12.3, 0.07, 0.12]} dispose={null}>      </mesh>
      <mesh position={[0, rampRise / 2 + RAIL_H, -5 + 0.12]} rotation={[0, 0, angle]} material={railMat} geometry={UNIT_BOX} scale={[14.9, 0.07, 0.1]} dispose={null}>      </mesh>

      {/* void edge glow strip (visual wayfinding) */}
      <mesh position={[1, Y + 0.02, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.12]} />
        <meshBasicMaterial color="#5DE4FF" transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </group>
  )
}
