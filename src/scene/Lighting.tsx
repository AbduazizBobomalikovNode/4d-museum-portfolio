import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '@/state/store'

/**
 * Time-of-day driven lighting (the "4D" dial).
 * 0/1 = midnight (cool, dim), 0.5 = noon (warm, bright).
 * Greybox: realtime lights. Later: blend baked lightmaps instead.
 */
export function Lighting() {
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const warm = useMemo(() => new THREE.Color('#FFD9A8'), [])
  const cool = useMemo(() => new THREE.Color('#6C8CFF'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const t = useStore.getState().timeOfDay
    // daylight factor: 0 at midnight, 1 at noon
    const day = Math.max(0, Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5)
    tmp.copy(cool).lerp(warm, day)
    if (hemi.current) { hemi.current.intensity = 0.18 + day * 0.55; hemi.current.color.copy(tmp) }
    if (amb.current) amb.current.intensity = 0.12 + day * 0.18
    if (sun.current) {
      // no shadow caster → the sun leaks through walls; keep it a gentle fill, not a floodlight
      sun.current.intensity = 0.1 + day * 0.7
      sun.current.color.copy(tmp)
      const a = t * Math.PI * 2
      sun.current.position.set(Math.cos(a) * 20, 14 + Math.max(0, Math.sin(a)) * 8, 8)
    }
  })

  return (
    <>
      <ambientLight ref={amb} intensity={0.3} />
      <hemisphereLight ref={hemi} args={['#FFD9A8', '#1a1b20', 0.8]} />
      <directionalLight ref={sun} position={[10, 14, 8]} intensity={1.5} />
    </>
  )
}
