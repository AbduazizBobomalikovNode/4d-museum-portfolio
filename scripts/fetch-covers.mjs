#!/usr/bin/env node
/**
 * Pull the twenty book covers off Open Library once, into public/books/.
 *
 * They are fetched here rather than in the browser because Open Library rate-limits by
 * IP: twenty covers requested back-to-back come back as 157-byte 1×1 JPEGs, and a visitor
 * would see half the shelf empty. Committed files are the same offline floor as
 * public/github-snapshot.json — served from our own origin, no CORS, no limit.
 *
 * Run with `pnpm covers`. A failed fetch keeps whatever is already on disk and never
 * fails the build.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, '..', 'public', 'books')

/** Enough of a gap that Open Library answers with a real image every time. */
const GAP_MS = 2500
/** Anything under this is the rate-limit placeholder, not a cover. */
const MIN_BYTES = 2000
/** Covers are shown at ~100px on the board and ~512px on the prize; 400 wide is plenty. */
const WIDTH = 400

const src = await readFile(join(here, '..', 'src', 'lib', 'books.ts'), 'utf8')
const books = [...src.matchAll(/id: '([^']+)'[\s\S]*?isbn: '(\d+)'/g)].map((m) => ({ id: m[1], isbn: m[2] }))
if (books.length === 0) {
  console.error('books.ts dan kitoblar topilmadi — hech nima o‘zgartirilmadi')
  process.exit(0)
}

await mkdir(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let got = 0
let kept = 0
let failed = 0

for (const [i, b] of books.entries()) {
  const path = join(OUT, `${b.id}.jpg`)
  const url = `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`
  if (i > 0) await sleep(GAP_MS)
  try {
    const r = await fetch(url, { redirect: 'follow' })
    const buf = Buffer.from(await r.arrayBuffer())
    if (!r.ok || buf.byteLength < MIN_BYTES) throw new Error(`bo‘sh javob (${buf.byteLength} b)`)
    await writeFile(path, buf)
    // shrink in place; sips ships with macOS, and a miss here is not worth failing over
    await run('sips', ['-Z', String(WIDTH), path, '--out', path]).catch(() => {})
    const { size } = await import('node:fs').then((fs) => fs.promises.stat(path))
    console.log(`  ✓ ${b.id}  ${Math.round(size / 1024)} kB`)
    got++
  } catch (e) {
    const onDisk = await access(path).then(() => true, () => false)
    if (onDisk) { console.log(`  · ${b.id}  saqlanib qoldi (${e.message})`); kept++ }
    else { console.log(`  ✗ ${b.id}  ${e.message}`); failed++ }
  }
}

console.log(`\n${got} ta yangilandi · ${kept} ta o‘zgarmadi · ${failed} ta yo‘q`)
