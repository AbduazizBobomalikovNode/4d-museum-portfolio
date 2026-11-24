import * as THREE from 'three'

export type Vec4 = [number, number, number, number]

/** 16 vertices of the unit tesseract (±1). */
export const TESSERACT_VERTS: Vec4[] = Array.from({ length: 16 }, (_, i) => [
  i & 1 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 4 ? 1 : -1,
  i & 8 ? 1 : -1,
])

/** 32 edges: pairs differing in exactly one coordinate. */
export const TESSERACT_EDGES: [number, number][] = (() => {
  const e: [number, number][] = []
  for (let a = 0; a < 16; a++)
    for (let b = a + 1; b < 16; b++) {
      let d = 0
      for (let k = 0; k < 4; k++) if (TESSERACT_VERTS[a][k] !== TESSERACT_VERTS[b][k]) d++
      if (d === 1) e.push([a, b])
    }
  return e
})()

/** Rotate in plane (i, j) by angle t. Mutates `v`. */
export function rotate4(v: Vec4, i: number, j: number, t: number): Vec4 {
  const c = Math.cos(t)
  const s = Math.sin(t)
  const a = v[i]
  const b = v[j]
  v[i] = a * c - b * s
  v[j] = a * s + b * c
  return v
}

/** 4D → 3D perspective projection (camera at w = -d). */
export function project4to3(v: Vec4, d = 2.6, out = new THREE.Vector3()): THREE.Vector3 {
  const w = 1 / (d - v[3])
  return out.set(v[0] * w, v[1] * w, v[2] * w)
}

/**
 * Fill `positions` (Float32Array of length 32*2*3) with edge endpoints for time t.
 * Rotation planes: XW, YZ, XZ (+slow ZW) — gives the classic "inside-out" turn.
 */
export function writeTesseractEdges(
  positions: Float32Array,
  t: number,
  scale = 1,
  d = 2.6,
  tmp: { v: Vec4; p: THREE.Vector3 } = { v: [0, 0, 0, 0], p: new THREE.Vector3() },
): void {
  const proj: number[] = new Array(16 * 3)
  for (let i = 0; i < 16; i++) {
    const src = TESSERACT_VERTS[i]
    tmp.v[0] = src[0]; tmp.v[1] = src[1]; tmp.v[2] = src[2]; tmp.v[3] = src[3]
    rotate4(tmp.v, 0, 3, t * 0.9)
    rotate4(tmp.v, 1, 2, t * 0.6)
    rotate4(tmp.v, 0, 2, t * 0.35)
    rotate4(tmp.v, 2, 3, t * 0.2)
    project4to3(tmp.v, d, tmp.p).multiplyScalar(scale)
    proj[i * 3] = tmp.p.x; proj[i * 3 + 1] = tmp.p.y; proj[i * 3 + 2] = tmp.p.z
  }
  let k = 0
  for (const [a, b] of TESSERACT_EDGES) {
    positions[k++] = proj[a * 3]; positions[k++] = proj[a * 3 + 1]; positions[k++] = proj[a * 3 + 2]
    positions[k++] = proj[b * 3]; positions[k++] = proj[b * 3 + 1]; positions[k++] = proj[b * 3 + 2]
  }
}
