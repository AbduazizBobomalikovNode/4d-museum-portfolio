import * as THREE from 'three'
import type { Quality } from './quality'
import { qualityPreset } from './quality'
import { perfEvent } from './perfBus'

/**
 * prewarm: draw EVERY material once before the gate, into render targets of each kind the session will
 * really render with.
 *
 * `compileAsync` only links programs. The GPU driver (ANGLE/Metal in particular) still builds the actual
 * pipeline state lazily on the first DRAW of a material with a given attachment format — and frustum culling
 * means a room's materials are not drawn at all until the visitor first sees it, so that cost used to land as a
 * 100-300 ms frame on the first sight of each room. Here frustum culling is switched off for one pass so every
 * mesh is drawn, into 64x64 targets (pipeline state does not depend on size) of the formats used later:
 *   - 8-bit colour + depth: room previews, plain screen output
 *   - half-float colour + depth: the post-processing composer (medium/high)
 *   - half-float colour + depth TEXTURE: the floor reflector (high)
 * plus one pass to the screen. Only used before the gate, while every room is visible (store.warmup).
 */
export function warmAllVariants(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, quality: Quality): void {
  const t0 = performance.now()
  const saved: [THREE.Object3D, boolean][] = []
  scene.traverse((o) => { if (o.frustumCulled) { saved.push([o, true]); o.frustumCulled = false } })
  const prev = gl.getRenderTarget()
  const targets: THREE.WebGLRenderTarget[] = []
  const draw = (rt: THREE.WebGLRenderTarget | null) => {
    try {
      gl.setRenderTarget(rt)
      gl.render(scene, camera)
    } catch { /* best effort */ }
  }
  try {
    const plain = new THREE.WebGLRenderTarget(64, 64, { depthBuffer: true })
    targets.push(plain)
    draw(plain)
    if (qualityPreset[quality].post) {
      const half = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType, depthBuffer: true })
      targets.push(half)
      draw(half)
    }
    if (quality === 'high') {
      const refl = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType })
      refl.depthBuffer = true
      refl.depthTexture = new THREE.DepthTexture(64, 64)
      refl.depthTexture.format = THREE.DepthFormat
      refl.depthTexture.type = THREE.UnsignedShortType
      targets.push(refl)
      draw(refl)
    }
    draw(null)
  } finally {
    gl.setRenderTarget(prev)
    for (const [o, v] of saved) o.frustumCulled = v
    for (const t of targets) { t.depthTexture?.dispose(); t.dispose() }
  }
  perfEvent('warm-all-variants', { ms: Math.round(performance.now() - t0) })
}
