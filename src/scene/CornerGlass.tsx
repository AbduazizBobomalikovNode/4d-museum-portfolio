import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { UNIT_BOX } from '@/lib/geo'
import { useBody } from '@/scene/physics/BodyContext'

const W = 4.0 // pane width
const H = 3.4 // pane height — room is 5.2 tall, so it stops well short of the ceiling
const T = 0.055 // pane thickness
const SHOE = 0.08 // floor channel the pane is seated in

/**
 * Free-standing glass screen cutting across a room corner on the diagonal.
 *
 * It is fixed to the floor only: a shallow metal shoe holds the pane, and the top and
 * both vertical edges stay clear of the ceiling and the two walls, so the corner reads
 * as an open volume rather than a boxed-in one.
 *
 * `corner` is the wall intersection in world XZ; `inward` is the unit direction from that
 * corner towards the room centre (the pane sits square across it, i.e. at 45°).
 */
export function CornerGlass({
  corner,
  inward,
  floorY = 0,
  distance = 3.0,
  accent = '#F2B441',
  children,
}: {
  corner: [number, number]
  inward: [number, number]
  floorY?: number
  /** Distance from the corner along `inward` — must exceed W/2 or the pane would meet a wall. */
  distance?: number
  accent?: string
  /** Rendered flat against the room-facing face of the pane, centred on it. */
  children?: ReactNode
}) {
  const Body = useBody()

  const { glassMat, shoeMat, capMat } = useMemo(() => {
    // same recipe as the stair balustrade so the museum uses one glass throughout;
    // transparent + DoubleSide needs forceSinglePass or three re-validates the program every frame
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#9fd8e8',
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      forceSinglePass: true,
    })
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.35, metalness: 0.7 })
    // the top edge of 22%-opacity glass is invisible on its own — a thin lit cap draws the cut line
    const capMat = new THREE.MeshStandardMaterial({
      color: '#0e1014',
      roughness: 0.3,
      metalness: 0.6,
      emissive: accent,
      emissiveIntensity: 0.35,
    })
    return { glassMat, shoeMat, capMat }
  }, [accent])

  const [px, pz, rotY] = useMemo(() => {
    const len = Math.hypot(inward[0], inward[1]) || 1
    const nx = inward[0] / len
    const nz = inward[1] / len
    // face the room centre; the pane's local X (its width) then runs along the corner bisector
    return [corner[0] + nx * distance, corner[1] + nz * distance, Math.atan2(nx, nz)] as const
  }, [corner, inward, distance])

  return (
    <group position={[px, floorY, pz]} rotation={[0, rotY, 0]}>
      <Body>
        {/* floor channel — the only place the screen is attached */}
        <mesh geometry={UNIT_BOX} material={shoeMat} position={[0, SHOE / 2, 0]} scale={[W, SHOE, 0.16]} dispose={null} receiveShadow />
        {/* the pane: free at the top and at both vertical edges */}
        <mesh
          geometry={UNIT_BOX}
          material={glassMat}
          position={[0, SHOE + H / 2, 0]}
          scale={[W, H, T]}
          dispose={null}
        />
      </Body>
      {/* Sits high on the pane — its top element clears the glass edge by ~12cm — leaving the
          lower third as plain glass you can see the room through. */}
      {children ? <group position={[0, SHOE + H * 0.54, T / 2 + 0.012]}>{children}</group> : null}
      {/* visual only — a collider this thin would just fight the pane's */}
      <mesh geometry={UNIT_BOX} material={capMat} position={[0, SHOE + H + 0.015, 0]} scale={[W, 0.03, T + 0.02]} dispose={null} />
    </group>
  )
}
