import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { UNIT_BOX } from '@/lib/geo'

interface Props {
  accent: string
  /** Forwarded to the chest-core material so Exhibit's hover pulse can drive it. */
  coreRef?: React.Ref<THREE.MeshStandardMaterial>
}

/**
 * Little humanoid robot (procedural, ~55 cm tall) that hovers over a pedestal:
 * boxy head with glowing eyes + antenna, chest core, swinging arms, idle bob.
 */
export function Robot({ accent, coreRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)

  const { bodyMat, darkMat, eyeMat } = useMemo(() => {
    const bodyMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.35 })
    const darkMat = new THREE.MeshStandardMaterial({ color: '#22252c', roughness: 0.6, metalness: 0.5 })
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#5DE4FF', toneMapped: false })
    return { bodyMat, darkMat, eyeMat }
  }, [accent])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (root.current) {
      root.current.position.y = 0.06 + Math.sin(t * 1.6) * 0.035 // hover bob
      root.current.rotation.y = Math.sin(t * 0.5) * 0.35
    }
    if (head.current) head.current.rotation.y = Math.sin(t * 0.9 + 1) * 0.45
    if (armL.current) armL.current.rotation.x = Math.sin(t * 1.6) * 0.35
    if (armR.current) armR.current.rotation.x = -Math.sin(t * 1.6) * 0.35
  })

  return (
    <group ref={root}>
      {/* torso */}
      <mesh material={bodyMat} castShadow position={[0, 0.16, 0]} geometry={UNIT_BOX} scale={[0.2, 0.24, 0.13]} dispose={null}>      </mesh>
      {/* chest core — glows; Exhibit pulses it on hover/select */}
      <mesh position={[0, 0.17, 0.068]}>
        <cylinderGeometry args={[0.035, 0.035, 0.015, 16]} />
        <meshStandardMaterial ref={coreRef} color="#0f1014" emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.36, 0]}>
        <mesh material={bodyMat} castShadow geometry={UNIT_BOX} scale={[0.15, 0.12, 0.12]} dispose={null}>        </mesh>
        <mesh material={eyeMat} position={[-0.035, 0.01, 0.062]} geometry={UNIT_BOX} scale={[0.03, 0.02, 0.005]} dispose={null}>        </mesh>
        <mesh material={eyeMat} position={[0.035, 0.01, 0.062]} geometry={UNIT_BOX} scale={[0.03, 0.02, 0.005]} dispose={null}>        </mesh>
        {/* antenna */}
        <mesh material={darkMat} position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
        </mesh>
        <mesh material={eyeMat} position={[0, 0.125, 0]}>
          <sphereGeometry args={[0.014, 8, 8]} />
        </mesh>
      </group>
      {/* arms (pivot at shoulders) */}
      <group ref={armL} position={[-0.125, 0.26, 0]}>
        <mesh material={darkMat} castShadow position={[0, -0.09, 0]} geometry={UNIT_BOX} scale={[0.05, 0.18, 0.05]} dispose={null}>        </mesh>
        <mesh material={bodyMat} position={[0, -0.19, 0]}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>
      </group>
      <group ref={armR} position={[0.125, 0.26, 0]}>
        <mesh material={darkMat} castShadow position={[0, -0.09, 0]} geometry={UNIT_BOX} scale={[0.05, 0.18, 0.05]} dispose={null}>        </mesh>
        <mesh material={bodyMat} position={[0, -0.19, 0]}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>
      </group>
      {/* legs */}
      <mesh material={darkMat} castShadow position={[-0.055, -0.045, 0]} geometry={UNIT_BOX} scale={[0.055, 0.13, 0.06]} dispose={null}>      </mesh>
      <mesh material={darkMat} castShadow position={[0.055, -0.045, 0]} geometry={UNIT_BOX} scale={[0.055, 0.13, 0.06]} dispose={null}>      </mesh>
      {/* feet */}
      <mesh material={bodyMat} position={[-0.055, -0.115, 0.015]} geometry={UNIT_BOX} scale={[0.06, 0.03, 0.09]} dispose={null}>      </mesh>
      <mesh material={bodyMat} position={[0.055, -0.115, 0.015]} geometry={UNIT_BOX} scale={[0.06, 0.03, 0.09]} dispose={null}>      </mesh>
    </group>
  )
}
