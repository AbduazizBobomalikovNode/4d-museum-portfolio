import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { recordFrame, setCtx, setMem } from './perfCore'

/**
 * Lives inside the Canvas, perf mode only. `gl.info` is not auto-reset, so every pass of a
 * frame (reflector, room previews, main, post) accumulates; this reads the totals at the very
 * start of the NEXT frame (negative priority, so it never switches R3F to manual rendering)
 * and resets them.
 */
export default function PerfProbe() {
  const { gl, camera, scene } = useThree()
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
    if ((n.current & 63) === 1) {
      // estimated GPU bytes: every distinct texture reachable from a material (RGBA8, +1/3 for mips),
      // plus the render targets we know about (8 room previews, reflector)
      const seen = new Set<THREE.Texture>()
      let lights = 0
      scene.traverse((o) => {
        if ((o as THREE.Light).isLight) lights++
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
        if (!m) return
        for (const mat of Array.isArray(m) ? m : [m]) {
          for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) seen.add(v as THREE.Texture)
        }
      })
      let tex = 0
      seen.forEach((t) => {
        const im = t.image as { width?: number; height?: number } | undefined
        if (!im?.width || !im.height) return
        tex += im.width * im.height * 4 * (t.generateMipmaps ? 4 / 3 : 1)
      })
      setMem(tex, 8 * 384 * 216 * 4, lights)
    }
    g.info.reset()
    if ((n.current++ & 7) === 0) {
      const d = camera.getWorldDirection(new THREE.Vector3())
      setCtx(g.getPixelRatio(), g.domElement.width, g.domElement.height, [camera.position.x, camera.position.y, camera.position.z, d.x, d.y, d.z])
    }
  }, -1000)
  return null
}
