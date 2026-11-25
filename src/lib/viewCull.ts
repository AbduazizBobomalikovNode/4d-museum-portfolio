import * as THREE from 'three'

const _m = new THREE.Matrix4()
const _proj = new THREE.Matrix4()
const _frustum = new THREE.Frustum()

/**
 * Conservative "could this box be on screen?" test. The projection is widened by `slack`
 * (1.25 = 25% more field of view each way) because camera controllers move the camera at a
 * different point of the frame than the passes that ask — a one-frame-stale camera must never
 * make something pop. `camera.updateMatrixWorld()` is called so the test sees the latest pose.
 */
export function boxMaybeInView(camera: THREE.Camera, box: THREE.Box3, slack = 1.25): boolean {
  camera.updateMatrixWorld()
  _proj.copy((camera as THREE.PerspectiveCamera).projectionMatrix)
  _proj.elements[0] /= slack
  _proj.elements[5] /= slack
  _m.multiplyMatrices(_proj, camera.matrixWorldInverse)
  _frustum.setFromProjectionMatrix(_m)
  return _frustum.intersectsBox(box)
}
