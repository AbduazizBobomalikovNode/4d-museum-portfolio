import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import { floorTexture, tiled } from '@/lib/surfaces'
import { useStore } from '@/state/store'
import { rooms } from '@/data/rooms'
import { perfFlags } from '@/lib/perfFlags'
import { boxMaybeInView } from '@/lib/viewCull'
import { CullableReflectorMaterial } from './CullableReflectorMaterial'

/** Upper-floor rooms (not the atrium: its mezzanine overlooks the void). Their floor slabs hide the ground floor. */
const upperRooms = rooms.filter((r) => r.level === 1)
const insideUpperRoom = (p: THREE.Vector3) =>
  upperRooms.some(
    (r) =>
      p.y > r.floorY &&
      Math.abs(p.x - r.center[0]) < r.size[0] / 2 - 0.3 &&
      Math.abs(p.z - r.center[1]) < r.size[1] / 2 - 0.3,
  )

const REFLECTOR_PROPS = {
  resolution: 384,
  mirror: 0.22,
  mixStrength: 0.85,
  mixBlur: 1,
  blur: [420, 130] as [number, number],
  depthScale: 0.8,
  minDepthThreshold: 0.4,
  maxDepthThreshold: 1.4,
  distortion: 0.04,
  roughness: 0.7,
  metalness: 0.1,
}

/**
 * One reflective plane covering the whole ground floor (rooms + corridors),
 * 12 mm above the collider floor boxes — those keep the plain texture and
 * remain the fallback when quality is 'low' (reflection = one extra scene
 * render per frame, so it is gated; PerformanceMonitor downgrades away).
 * Upper floor stays non-reflective (dimmer, rarely seen at grazing angles).
 */
export function ReflectiveFloor() {
  const quality = useStore((s) => s.quality)
  const mode = useStore((s) => s.mode)
  const tex = useMemo(() => tiled(floorTexture(), 58, 58, 8), [])
  // A reflector re-renders the whole scene into its own target every frame. Only the high
  // tier can afford that, and never in free-walk where physics already owns the budget.
  const camera = useThree((s) => s.camera)
  const box = useRef<THREE.Box3 | null>(null)
  if (quality !== 'high' || mode === 'walk') return null

  // reflectorCull: the reflection pass re-renders the whole scene, so skip it whenever the floor
  // cannot be seen — inside an upper-floor room (slabs in the way) or when the plane is outside
  // the view. The mesh and material stay mounted: no program is rebuilt when it comes back.
  const shouldRender = (obj: THREE.Object3D) => {
    if (insideUpperRoom(camera.position)) return false
    if (!box.current) {
      obj.updateWorldMatrix(true, false)
      box.current = new THREE.Box3().setFromObject(obj)
    }
    return boxMaybeInView(camera, box.current)
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18.5, 0.012, 18.5]}>
      <planeGeometry args={[58, 58]} />
      {perfFlags.reflectorCull ? (
        <CullableReflectorMaterial map={tex} distortionMap={tex} {...REFLECTOR_PROPS} shouldRender={shouldRender} />
      ) : (
        <MeshReflectorMaterial map={tex} distortionMap={tex} {...REFLECTOR_PROPS} />
      )}
    </mesh>
  )
}
