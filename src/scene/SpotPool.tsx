import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { exhibits } from '@/data/exhibits'
import { roomById } from '@/data/rooms'
import { useStore } from '@/state/store'

const POOL = 6
const DEG = Math.PI / 180

interface Slot { pos: THREE.Vector3; target: THREE.Vector3; accent: THREE.Color }

/** Pre-computed lamp position + aim for every exhibit (room-local → world). */
const SLOTS: Record<string, Slot> = Object.fromEntries(
  exhibits.map((e) => {
    const room = roomById[e.roomId]
    const rot = (e.facing ?? 0) * DEG
    const x = room.center[0] + e.local[0]
    const z = room.center[1] + e.local[1]
    // 1.6 m in front of the piece, just under the ceiling
    const fx = Math.sin(rot) * 1.6
    const fz = Math.cos(rot) * 1.6
    return [
      e.id,
      {
        pos: new THREE.Vector3(x + fx, room.floorY + room.height - 0.2, z + fz),
        target: new THREE.Vector3(x, room.floorY + 1.4, z),
        accent: new THREE.Color(e.accent ?? room.accent),
      },
    ]
  }),
)

/**
 * Fixed pool of exhibit spotlights.
 *
 * Adding or removing a light changes three's program cache key, which recompiles EVERY
 * material in the scene — that was the multi-frame hitch when walking into a room. The
 * pool keeps the light count constant and just re-aims lamps at whatever the current
 * room shows, so no shader is ever rebuilt while moving.
 */
export function SpotPool() {
  const roomId = useStore((s) => s.roomId)
  const inspectId = useStore((s) => s.inspectId)
  const lights = useRef<(THREE.SpotLight | null)[]>([])
  const targets = useMemo(() => Array.from({ length: POOL }, () => new THREE.Object3D()), [])

  // wire each lamp to its own target object once
  useEffect(() => {
    lights.current.forEach((l, i) => { if (l) l.target = targets[i] })
  }, [targets])

  const assigned = useMemo(() => exhibits.filter((e) => e.roomId === roomId).slice(0, POOL), [roomId])

  useEffect(() => {
    for (let i = 0; i < POOL; i++) {
      const l = lights.current[i]
      if (!l) continue
      const ex = assigned[i]
      if (!ex) { l.intensity = 0; continue }
      const s = SLOTS[ex.id]
      l.position.copy(s.pos)
      targets[i].position.copy(s.target)
      targets[i].updateMatrixWorld()
      l.color.set('#FFE2B8')
      l.intensity = 16
      l.distance = 9
    }
  }, [assigned, targets])

  // selected piece gets a brighter pool of light
  useFrame(() => {
    for (let i = 0; i < POOL; i++) {
      const l = lights.current[i]
      const ex = assigned[i]
      if (!l || !ex) continue
      const want = ex.id === inspectId ? 30 : 16
      if (l.intensity !== want) l.intensity += (want - l.intensity) * 0.15
    }
  })

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i}>
          <spotLight
            ref={(el) => { lights.current[i] = el }}
            angle={0.55}
            penumbra={0.6}
            intensity={0}
            distance={9}
            castShadow={false}
          />
          <primitive object={targets[i]} />
        </group>
      ))}
    </>
  )
}
