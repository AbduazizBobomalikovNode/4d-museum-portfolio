import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { exhibits } from '@/data/exhibits'
import { roomById } from '@/data/rooms'
import { useStore } from '@/state/store'
import { SPOT_POOL } from '@/lib/tier'

/** 6 on desktop; fewer on phones (decided once from the initial tier — the count must never change at runtime). */
const POOL = SPOT_POOL
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

  const inRoom = useMemo(() => exhibits.filter((e) => e.roomId === roomId), [roomId])
  // pool >= exhibits (desktop): the same fixed assignment as always. Smaller pool (phones): the lamps follow
  // the exhibits nearest the camera, re-picked at most 3x/s and only when the set actually changes; an exhibit
  // that stays in the set keeps its lamp, so nothing jumps.
  const base = useMemo(() => inRoom.slice(0, POOL), [inRoom])
  const [picked, setPicked] = useState<{ room: string; list: typeof base } | null>(null)
  const assigned = picked && picked.room === roomId ? picked.list : base
  const lastPick = useRef(0)
  useFrame((state) => {
    if (inRoom.length <= POOL || state.clock.elapsedTime - lastPick.current < 0.33) return
    lastPick.current = state.clock.elapsedTime
    const cp = state.camera.position
    const want = [...inRoom]
      .sort((a, b) => SLOTS[a.id].target.distanceToSquared(cp) - SLOTS[b.id].target.distanceToSquared(cp))
      .slice(0, POOL)
    const cur = picked && picked.room === roomId ? picked.list : base
    if (cur.length === want.length && cur.every((e) => want.includes(e))) return
    const next = cur.map((e) => (want.includes(e) ? e : undefined))
    const fresh = want.filter((e) => !cur.includes(e))
    for (let i = 0; i < POOL; i++) if (!next[i] && fresh.length) next[i] = fresh.shift()
    setPicked({ room: roomId, list: next.filter(Boolean) as typeof base })
  })

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
