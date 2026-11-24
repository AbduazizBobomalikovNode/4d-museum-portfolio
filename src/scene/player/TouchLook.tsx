import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useStore } from '@/state/store'

/**
 * Touch-drag look for free-walk on mobile (right half of the screen).
 * Joystick (left) comes from ecctrl/input. No gyroscope (NN/g: nauseating).
 */
export function TouchLook() {
  const { camera, gl } = useThree()
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const last = useRef<{ id: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      if (useStore.getState().mode !== 'walk') return
      if (e.clientX < window.innerWidth * 0.45) return // left = joystick area
      last.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      if (!last.current || e.pointerId !== last.current.id) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current.x = e.clientX
      last.current.y = e.clientY
      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y -= dx * 0.004
      euler.current.x = THREE.MathUtils.clamp(euler.current.x - dy * 0.004, -1.2, 1.2)
      camera.quaternion.setFromEuler(euler.current)
    }
    const onUp = (e: PointerEvent) => { if (last.current?.id === e.pointerId) last.current = null }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [camera, gl])

  return null
}
