import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { recordFrame, setCtx } from './perfCore'

/**
 * Lives inside the Canvas, perf mode only. `gl.info` is not auto-reset, so every pass of a
 * frame (reflector, room previews, main, post) accumulates; this reads the totals at the very
 * start of the NEXT frame (negative priority, so it never switches R3F to manual rendering)
 * and resets them.
 */
export default function PerfProbe() {
  const { gl, camera } = useThree()
  useEffect(() => {
    const g = gl as THREE.WebGLRenderer
    g.info.autoReset = false
    g.info.reset()
    return () => { g.info.autoReset = true }
  }, [gl])

  const last = useRef(0)
  const n = useRef(0)
  useFrame(() => {
    const g = gl as THREE.WebGLRenderer
    const t = performance.now()
    if (last.current) {
      recordFrame(t - last.current, {
        calls: g.info.render.calls,
        triangles: g.info.render.triangles,
        geometries: g.info.memory.geometries,
        textures: g.info.memory.textures,
        programs: g.info.programs?.length ?? 0,
        lines: g.info.render.lines,
        points: g.info.render.points,
      })
    }
    last.current = t
    g.info.reset()
    if ((n.current++ & 7) === 0) {
      const d = camera.getWorldDirection(new THREE.Vector3())
      setCtx(g.getPixelRatio(), g.domElement.width, g.domElement.height, [camera.position.x, camera.position.y, camera.position.z, d.x, d.y, d.z])
    }
  }, -1000)
  return null
}
