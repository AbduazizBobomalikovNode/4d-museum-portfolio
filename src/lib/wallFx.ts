import * as THREE from 'three'

/** Shared uniforms — one place drives every wall (no per-material bookkeeping). */
export const fxTime = { value: 0 }
export const fxIntensity = { value: 1 }

export const FX_MODES = { neural: 0, circuit: 1, rain: 2, grid: 3 } as const
export type WallFxName = keyof typeof FX_MODES

const VERT_HEAD = /* glsl */ `
varying vec3 vFxPos;
varying vec3 vFxNrm;
`
const VERT_BODY = /* glsl */ `
  vFxPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vFxNrm = normalize(mat3(modelMatrix) * objectNormal);
`

const FRAG_HEAD = /* glsl */ `
uniform float uFxTime;
uniform float uFxIntensity;
uniform vec3  uFxAccent;
uniform int   uFxMode;
varying vec3 vFxPos;
varying vec3 vFxNrm;

float fxHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

/** Wall-plane coordinates: horizontal axis along the wall, vertical = world Y. */
vec2 fxPlane(vec3 p, vec3 n) {
  return abs(n.x) > abs(n.z) ? vec2(p.z, p.y) : vec2(p.x, p.y);
}

/** Distance to the nearest line of a grid of spacing s (in plane units). */
float fxGridLine(vec2 uv, float s, float w) {
  vec2 g = abs(fract(uv / s - 0.5) - 0.5) * s;
  float d = min(g.x, g.y);
  return smoothstep(w, 0.0, d);
}

/** 0 — neural mesh: nodes on a jittered lattice, links, travelling activations. */
float fxNeural(vec2 uv, float t) {
  float s = 1.15;
  vec2 cell = floor(uv / s);
  vec2 f = fract(uv / s);
  float v = 0.0;
  // 2×2 neighbourhood: a 3×3 tap loop cost 9 hashes per fragment for no visible gain
  for (int j = 0; j <= 1; j++) {
    for (int i = 0; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 id = cell + o;
      vec2 node = o + vec2(fxHash(id), fxHash(id + 7.3)) * 0.7 + 0.15;
      float d = length(f - node);
      float pulse = 0.55 + 0.45 * sin(t * 1.6 + fxHash(id) * 15.0);
      v += smoothstep(0.075, 0.0, d) * pulse;                 // node
      v += smoothstep(0.5, 0.0, d) * 0.06 * pulse;            // halo
    }
  }
  // synapse lines: faint lattice with a signal running along it
  float lines = fxGridLine(uv, s, 0.012) * 0.35;
  float signal = smoothstep(0.97, 1.0, sin(uv.x * 1.9 - t * 1.1) * 0.5 + 0.5);
  return v + lines * (0.5 + signal);
}

/** 1 — circuit board: traces, pads, current pulses. */
float fxCircuit(vec2 uv, float t) {
  float s = 0.62;
  float traces = fxGridLine(uv, s, 0.009);
  vec2 cell = floor(uv / s);
  float keep = step(0.45, fxHash(cell));                      // sparse board, not a full mesh
  float pad = smoothstep(0.06, 0.0, length(fract(uv / s) - 0.5) * s) * step(0.82, fxHash(cell + 3.1));
  float flow = smoothstep(0.985, 1.0, sin(uv.x * 3.0 + t * 2.2 + fxHash(cell) * 6.0) * 0.5 + 0.5);
  return traces * (0.35 + keep * 0.5) + pad * (0.6 + 0.4 * sin(t * 3.0 + fxHash(cell) * 9.0)) + traces * flow * 1.6;
}

/** 2 — data rain: discrete glyph cells falling in sparse columns (no smeared streaks). */
float fxRain(vec2 uv, float t) {
  float colW = 0.28;
  float gh = 0.24;
  float col = floor(uv.x / colW);
  float colOn = step(0.45, fxHash(vec2(col, 9.1)));  // "active" is a reserved GLSL word            // only some columns run
  float h = fxHash(vec2(col, 1.7));
  float speed = 0.55 + h * 0.9;
  float cy = floor(uv.y / gh);
  // head position of this column's stream, in cell units
  float head = -t * speed * 4.0 + h * 40.0;
  float dist = mod(cy - head, 26.0);                            // 0 = head, grows up the trail
  float lit = step(0.35, fxHash(vec2(col, cy + floor(t * speed * 4.0))));
  float bright = (dist < 1.0 ? 1.0 : smoothstep(9.0, 0.0, dist) * 0.45) * lit;
  // glyph body: inset block inside the cell
  vec2 f = vec2(fract(uv.x / colW), fract(uv.y / gh));
  float block = smoothstep(0.40, 0.26, abs(f.x - 0.5)) * smoothstep(0.44, 0.30, abs(f.y - 0.5));
  return bright * block * colOn;
}

/** 3 — data grid: lattice, horizontal data streams, blinking cells, scan sweep. */
float fxGrid(vec2 uv, float t) {
  float s = 0.75;
  float g = fxGridLine(uv, s, 0.010) * 0.55;
  vec2 cell = floor(uv / s);
  // horizontal packets running along random rows
  float row = fxHash(vec2(0.0, cell.y));
  float packet = smoothstep(0.90, 1.0, sin(uv.x * 1.6 - t * (0.7 + row) + row * 20.0) * 0.5 + 0.5)
               * step(0.55, row)
               * smoothstep(0.06, 0.0, abs(fract(uv.y / s - 0.5) - 0.5) * s);
  // blinking cell blocks (like a status board)
  float blink = step(0.90, fxHash(cell + 5.7)) * step(0.5, sin(t * 1.3 + fxHash(cell) * 30.0));
  vec2 f = fract(uv / s);
  float block = blink * smoothstep(0.42, 0.30, max(abs(f.x - 0.5), abs(f.y - 0.5))) * 0.5;
  float scan = smoothstep(0.4, 0.0, abs(fract(uv.y * 0.05 - t * 0.04) - 0.5) * 5.0);
  return (g + block) * (1.0 + scan * 1.5) + packet * 1.4;
}
`

const FRAG_BODY = /* glsl */ `
  float fxDist = length(vFxPos - cameraPosition);
  if (uFxIntensity > 0.001 && abs(vFxNrm.y) < 0.5 && fxDist < 26.0) {
    vec2 fxUv = fxPlane(vFxPos, vFxNrm);
    float t = uFxTime;
    float a = 0.0;
    if (uFxMode == 0) a = fxNeural(fxUv, t) * 1.15;
    else if (uFxMode == 1) a = fxCircuit(fxUv, t) * 1.25;
    else if (uFxMode == 2) a = fxRain(fxUv, t) * 0.85;
    else a = fxGrid(fxUv, t) * 1.5;
    // fade near the floor so exhibits and plinths stay the focus
    a *= smoothstep(0.1, 1.6, vFxPos.y - floor(vFxPos.y / 6.0) * 6.0);
    a *= smoothstep(26.0, 14.0, fxDist); // fade out with distance — far walls stop shading
    totalEmissiveRadiance += uFxAccent * a * uFxIntensity;
  }
`

/**
 * Adds an animated IT/AI pattern to a wall material's emissive channel.
 * Patched via onBeforeCompile so lighting, fog and tone mapping still apply.
 */
export function applyWallFx(
  mat: THREE.MeshStandardMaterial,
  mode: WallFxName,
  accent: string,
  intensity = 1,
): THREE.MeshStandardMaterial {
  const uniforms = {
    uFxTime: fxTime,
    uFxIntensity: fxIntensity,
    uFxAccent: { value: new THREE.Color(accent).multiplyScalar(intensity) },
    uFxMode: { value: FX_MODES[mode] },
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_BODY}`)
  }
  mat.customProgramCacheKey = () => 'wallfx-' + mode
  return mat
}
