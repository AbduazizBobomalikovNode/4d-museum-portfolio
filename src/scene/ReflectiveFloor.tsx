import { useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { floorTexture, tiled } from '@/lib/surfaces'
import { useStore } from '@/state/store'

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
  if (quality !== 'high' || mode === 'walk') return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18.5, 0.012, 18.5]}>
      <planeGeometry args={[58, 58]} />
      <MeshReflectorMaterial
        map={tex}
        resolution={384}
        mirror={0.22}
        mixStrength={0.85}
        mixBlur={1}
        blur={[420, 130]}
        depthScale={0.8}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        distortion={0.04}
        distortionMap={tex}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}
