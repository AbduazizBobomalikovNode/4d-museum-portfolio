import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { roomById } from '@/data/rooms'
import { useStore } from '@/state/store'

const CENTRE = new THREE.Vector3(roomById.atrium.center[0], 0, roomById.atrium.center[1])
const LOOK = new THREE.Vector3(CENTRE.x, 4.9, CENTRE.z) // globe + the stair below it
/** Yaw offset so the subject sits right of centre, clear of the gate copy on the left. */
const FRAME_YAW = 0.26
const RADIUS = 8.6
const HEIGHT = 3.2
const SPEED = 0.055 // rad/s — a full turn takes ~2 minutes

/**
 * Slow orbit through the atrium behind the entrance gate: the visitor sees the museum
 * breathing before they commit to walking it. Runs only while `phase === 'gate'`, hands the
 * camera back to RailCamera on enter, and holds still under prefers-reduced-motion.
 */
export function IntroCamera() {
  const { camera } = useThree()
  const setRoom = useStore((s) => s.setRoom)
  const angle = useRef(Math.PI * 0.65)
  const target = useMemo(() => new THREE.Vector3(), [])
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // the orbit lives in the atrium, so let room culling light that neighbourhood
  useEffect(() => {
    const prev = useStore.getState().roomId
    setRoom('atrium')
    return () => setRoom(prev)
  }, [setRoom])

  useFrame((state, dt) => {
    if (!reduced) angle.current += dt * SPEED
    const a = angle.current
    // gentle bob so the shot never feels locked to a turntable
    const y = HEIGHT + Math.sin(state.clock.elapsedTime * 0.18) * 0.5
    target.set(CENTRE.x + Math.sin(a) * RADIUS, y, CENTRE.z + Math.cos(a) * RADIUS)
    camera.position.lerp(target, 1 - Math.exp(-dt * 2.2))
    camera.lookAt(LOOK)
    camera.rotateY(FRAME_YAW)
  })

  return null
}
