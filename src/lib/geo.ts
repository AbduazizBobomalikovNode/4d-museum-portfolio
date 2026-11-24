import * as THREE from 'three'

/**
 * Shared unit geometries.
 *
 * Every `<boxGeometry args={[w,h,d]} />` in JSX allocates its own BufferGeometry and its own
 * GPU buffers — the greybox museum was uploading ~440 of them, which shows up as a hitch the
 * first time a room comes into view. One unit cube scaled per mesh uploads once.
 */
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
export const UNIT_PLANE = new THREE.PlaneGeometry(1, 1)

UNIT_BOX.name = 'unit-box'
UNIT_PLANE.name = 'unit-plane'

/** Resolve a public/ asset against the deploy base ("/" locally, "/<repo>/" on GitHub Pages). */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
