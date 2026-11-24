import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { railWaypoints } from '@/data/rooms'
import { nearestWaypointIndex, railCurve } from '@/lib/rail'
import { useStore } from '@/state/store'

/**
 * Guided-tour camera: scroll / arrow keys / touch-drag move `railTarget`,
 * camera eases along the CatmullRom curve, looks ahead (or at waypoint lookAt),
 * with subtle mouse parallax. Default navigation mode.
 */
export function RailCamera() {
  const { camera, gl } = useThree()
  const pos = useMemo(() => new THREE.Vector3(), [])
  const ahead = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const lookCur = useMemo(() => new THREE.Vector3(), [])
  const mouse = useRef({ x: 0, y: 0 })
  const touch = useRef<{ y: number } | null>(null)
  const init = useRef(false)

  useEffect(() => {
    const el = gl.domElement
    const onWheel = (e: WheelEvent) => {
      const st = useStore.getState()
      if (st.mode !== 'rail' || st.phase !== 'live' || st.reportOpen || st.formOpen) return
      e.preventDefault()
      useStore.getState().nudgeRail(Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 80) * 0.0004)
    }
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.mode !== 'rail' || s.phase !== 'live' || s.reportOpen || s.formOpen) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (['ArrowUp', 'KeyW', 'ArrowRight', 'KeyD'].includes(e.code)) s.nudgeRail(0.02)
      if (['ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA'].includes(e.code)) s.nudgeRail(-0.02)
    }
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onTouchStart = (e: TouchEvent) => { touch.current = { y: e.touches[0].clientY } }
    const onTouchMove = (e: TouchEvent) => {
      if (!touch.current || useStore.getState().mode !== 'rail') return
      const dy = touch.current.y - e.touches[0].clientY
      touch.current.y = e.touches[0].clientY
      useStore.getState().nudgeRail(dy * 0.001)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [gl])

  useFrame((_, dt) => {
    const s = useStore.getState()
    // ease u toward target
    const k = 1 - Math.exp(-dt * 3.0)
    const u = init.current ? THREE.MathUtils.lerp(s.railU, s.railTarget, k) : s.railTarget
    init.current = true
    if (Math.abs(u - s.railU) > 1e-5) s.setRailU(u)

    railCurve.getPointAt(u, pos)
    // look target: waypoint lookAt if near one, else a bit ahead on the curve
    const wi = nearestWaypointIndex(u)
    const wp = railWaypoints[wi]
    if (wp.lookAt) look.set(...wp.lookAt)
    else {
      railCurve.getPointAt(Math.min(1, u + 0.02), ahead)
      look.copy(ahead)
    }
    // parallax
    look.x += mouse.current.x * 0.6
    look.y += -mouse.current.y * 0.35
    lookCur.lerp(look, 1 - Math.exp(-dt * 3))

    camera.position.lerp(pos, 1 - Math.exp(-dt * 6))
    camera.lookAt(lookCur)

    if (wp.roomId !== s.roomId) s.setRoom(wp.roomId)
  })

  return null
}
