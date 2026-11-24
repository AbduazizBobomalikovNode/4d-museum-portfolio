#!/usr/bin/env node
/**
 * Optimize GLBs from assets-src/ → public/models/
 * Usage: pnpm assets:optimize [file.glb ...]
 * Pipeline: gltf-transform optimize (dedup/prune/join/instance/simplify) + Meshopt + KTX2 (ETC1S default, UASTC for normal/ORM)
 * Requires: @gltf-transform/cli (devDependency) and KTX-Software `toktx` on PATH for KTX2.
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

const SRC = 'assets-src'
const OUT = 'public/models'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(SRC).filter((f) => f.endsWith('.glb')).map((f) => join(SRC, f))

let hasToktx = true
try { execSync('toktx --version', { stdio: 'ignore' }) } catch { hasToktx = false }
if (!hasToktx) console.warn('[optimize] toktx not found → falling back to WebP textures. Install KTX-Software for KTX2.')

for (const f of files) {
  const out = join(OUT, basename(f))
  const tex = hasToktx ? 'ktx2' : 'webp'
  const cmd = `npx gltf-transform optimize "${f}" "${out}" --compress meshopt --texture-compress ${tex} --texture-size 2048 --simplify-ratio 0.9`
  console.log('[optimize]', cmd)
  execSync(cmd, { stdio: 'inherit' })
  if (hasToktx) {
    // higher quality for normal / occlusion-roughness-metallic slots
    execSync(`npx gltf-transform uastc "${out}" "${out}" --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" --level 4 --rdo --rdo-lambda 4 --zstd 18`, { stdio: 'inherit' })
  }
}
console.log('[optimize] done →', OUT)
