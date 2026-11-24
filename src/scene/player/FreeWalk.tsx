import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { useJoystickStore } from 'ecctrl/input'
import { rooms } from '@/data/rooms'
import { useStore } from '@/state/store'
import { isTouchDevice } from '@/lib/quality'

const EYE = 0.85 // capsule centre (~0.81 with controller offset) + 0.85 ≈ 1.66 eye height
const HALF = 0.45
const RADIUS = 0.3
const WALK_SPEED = 4.2
const RUN_SPEED = 7.5
const ACCEL = 18 // 1/s — how fast current velocity approaches the target

/**
 * First-person walk on a Rapier KinematicCharacterController — deterministic,
 * no floating spring, so the camera is rock-steady when you stop.
 * Autostep climbs the stair treads; snap-to-ground keeps contact on the ramp.
 */
export function FreeWalk() {
  const body = useRef<RapierRigidBody>(null)
  const plc = useRef<React.ComponentRef<typeof PointerLockControls>>(null)
  const { world } = useRapier()
  const { camera, scene, gl } = useThree()
  const [, get] = useKeyboardControls()
  const spawn = useStore((s) => s.walkSpawn)
  const setPointerLocked = useStore((s) => s.setPointerLocked)
  const touch = useMemo(() => isTouchDevice(), [])

  // created in an effect (StrictMode-safe: memo + remove-in-cleanup leaves a freed controller behind)
  const controllerRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.06)
    c.setApplyImpulsesToDynamicBodies(false)
    c.enableAutostep(0.42, 0.12, true) // stair risers are 0.375 + 0.02 cap
    c.enableSnapToGround(0.5)
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180)
    c.setMinSlopeSlideAngle((80 * Math.PI) / 180)
    controllerRef.current = c
    return () => {
      controllerRef.current = null
      world.removeCharacterController(c)
    }
  }, [world])

  const vel = useRef(new THREE.Vector3()) // horizontal velocity (smoothed)
  const vy = useRef(0)
  const grounded = useRef(true) // computedGrounded() is only valid AFTER computeColliderMovement
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const wish = useMemo(() => new THREE.Vector3(), [])
  const eye = useMemo(() => new THREE.Vector3(), [])
  const lastRoomCheck = useRef(0)
  const lastHoverCheck = useRef(0)
  const hoverTarget = useRef<THREE.Object3D | null>(null)
  const interactDown = useRef(false)

  // teleport on spawn change
  useEffect(() => {
    if (!spawn || !body.current) return
    body.current.setNextKinematicTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] })
    vel.current.set(0, 0, 0)
    vy.current = 0
  }, [spawn])

  /** Centre-screen raycast → nearest exhibit (E key / click while pointer-locked). */
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const centre = useMemo(() => new THREE.Vector2(0, 0), [])
  const interact = () => {
    raycaster.setFromCamera(centre, camera)
    raycaster.far = 6
    const hits = raycaster.intersectObjects(scene.children, true)
    for (const h of hits) {
      // interactive canvas surfaces (feedback form) handle their own UV hit-testing
      const onUvHit = h.object.userData?.onUvHit as ((uv: THREE.Vector2) => void) | undefined
      if (onUvHit && h.uv) { onUvHit(h.uv); return }
      let o: THREE.Object3D | null = h.object
      while (o && !o.name.startsWith('exhibit-')) o = o.parent
      if (o) {
        const id = o.name.slice('exhibit-'.length)
        const st = useStore.getState()
        st.inspect(st.inspectId === id ? null : id)
        return
      }
    }
    useStore.getState().inspect(null)
  }
  useEffect(() => {
    const w = window as unknown as { __lockPointer?: () => void }
    w.__lockPointer = () => {
      if (document.pointerLockElement) return
      try { plc.current?.lock() } catch { /* SecurityError right after Esc — user just clicks again */ }
    }
    return () => { delete w.__lockPointer }
  }, [])

  useEffect(() => {
    const el = gl.domElement
    const onClick = () => { if (useStore.getState().pointerLocked) interact() }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  useFrame((state, rawDt) => {
    const b = body.current
    const controller = controllerRef.current
    if (!b || !controller) return
    const dt = Math.min(rawDt, 1 / 12) // clamp slow frames, but not so tight that walking crawls

    const st0 = useStore.getState()
    const blocked = st0.reportOpen || st0.formOpen
    const k = get()
    if (!blocked) {
      if (k.interact && !interactDown.current) { interactDown.current = true; interact() }
      if (!k.interact) interactDown.current = false
    }

    // wish direction from camera yaw (flattened); frozen while the bug-report modal is open
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    right.crossVectors(fwd, camera.up).normalize()
    wish.set(0, 0, 0)
    if (!blocked) {
      const joy = useJoystickStore.getState().joysticks['default']
      if (joy?.active) wish.addScaledVector(fwd, joy.y).addScaledVector(right, joy.x)
      if (k.forward) wish.add(fwd)
      if (k.backward) wish.sub(fwd)
      if (k.rightward) wish.add(right)
      if (k.leftward) wish.sub(right)
      if (wish.lengthSq() > 1) wish.normalize()
      const speed = k.run ? RUN_SPEED : WALK_SPEED
      wish.multiplyScalar(speed)
    }

    // smooth accelerate toward the wish velocity
    const kAcc = 1 - Math.exp(-ACCEL * dt)
    vel.current.x += (wish.x - vel.current.x) * kAcc
    vel.current.z += (wish.z - vel.current.z) * kAcc
    if (vel.current.lengthSq() < 1e-6) vel.current.set(0, 0, 0)

    // gravity (kept simple: controller has snap-to-ground)
    vy.current = grounded.current ? -0.5 : vy.current - 9.81 * dt

    const move = { x: vel.current.x * dt, y: vy.current * dt, z: vel.current.z * dt }
    const collider = b.collider(0)
    controller.computeColliderMovement(collider, move)
    const out = controller.computedMovement()
    grounded.current = controller.computedGrounded()
    const p = b.translation()
    const nx = p.x + out.x
    const ny = p.y + out.y
    const nz = p.z + out.z
    b.setNextKinematicTranslation({ x: nx, y: ny, z: nz })
    if (grounded.current && vy.current < -0.5) vy.current = -0.5

    // fail-safe: fell out of the world → respawn in the current room
    if (ny < -8) {
      const r = rooms.find((rm) => rm.id === useStore.getState().roomId) ?? rooms[0]
      b.setNextKinematicTranslation({ x: r.center[0], y: r.floorY + 1, z: r.center[1] })
      vy.current = 0
    }

    // camera: direct follow (kinematic body is already smooth), tiny lerp to hide substeps
    eye.set(nx, ny + EYE, nz)
    const kCam = 1 - Math.exp(-40 * dt)
    camera.position.lerp(eye, kCam)

    // crosshair hover for interactive canvas surfaces (10×/s — pointer lock hides the cursor,
    // so without this the form's hover state could never light up in first person)
    if (state.clock.elapsedTime - lastHoverCheck.current > 0.1) {
      lastHoverCheck.current = state.clock.elapsedTime
      raycaster.setFromCamera(centre, camera)
      raycaster.far = 6
      let found: THREE.Object3D | null = null
      for (const h of raycaster.intersectObjects(scene.children, true)) {
        const fn = h.object.userData?.onUvHover as ((uv: THREE.Vector2 | null) => void) | undefined
        if (fn && h.uv) { fn(h.uv); found = h.object; break }
        if (h.object.visible) break // something opaque in the way
      }
      if (hoverTarget.current && hoverTarget.current !== found) {
        const prev = hoverTarget.current.userData?.onUvHover as ((uv: null) => void) | undefined
        prev?.(null)
      }
      hoverTarget.current = found
    }

    // room detection (cheap, 5×/s), y-weighted so mezzanine ≠ ground floor
    if (state.clock.elapsedTime - lastRoomCheck.current > 0.2) {
      lastRoomCheck.current = state.clock.elapsedTime
      let best = useStore.getState().roomId
      let bd = Infinity
      for (const r of rooms) {
        const dx = nx - r.center[0]
        const dz = nz - r.center[1]
        const dy = ny - (r.floorY + 1)
        const d = dx * dx + dz * dz + dy * dy * 6
        if (d < bd) { bd = d; best = r.id }
      }
      useStore.getState().setRoom(best)
    }
  })

  const start = spawn ?? [0, 1, 40]

  return (
    <>
      {!touch && (
        <PointerLockControls
          ref={plc}
          makeDefault
          onLock={() => setPointerLocked(true)}
          onUnlock={() => setPointerLocked(false)}
        />
      )}
      <RigidBody ref={body} type="kinematicPosition" position={start} colliders={false} ccd>
        <CapsuleCollider args={[HALF, RADIUS]} />
      </RigidBody>
    </>
  )
}
