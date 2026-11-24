import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { TESSERACT_EDGES, writeTesseractEdges } from '@/lib/tesseract'

interface Props {
  position?: [number, number, number]
  scale?: number
  color?: string
  speed?: number
}

/** Atrium centrepiece: a tesseract rotating in 4D, projected to 3D every frame. */
export function Tesseract({ position = [0, 2.4, 0], scale = 1.1, color = '#5DE4FF', speed = 0.35 }: Props) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(TESSERACT_EDGES.length * 2 * 3)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const tmp = useMemo(() => ({ v: [0, 0, 0, 0] as [number, number, number, number], p: new THREE.Vector3() }), [])
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed
    const attr = geom.getAttribute('position') as THREE.BufferAttribute
    writeTesseractEdges(attr.array as Float32Array, t, scale, 2.6, tmp)
    attr.needsUpdate = true
    if (group.current) group.current.rotation.y = t * 0.15
    if (core.current) {
      const s = 0.18 + Math.sin(t * 3) * 0.02
      core.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={group} position={position}>
      <lineSegments geometry={geom}>
        <lineBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
      </lineSegments>
      <mesh ref={core}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}
