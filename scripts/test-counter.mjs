#!/usr/bin/env node
/**
 * Checks the visit counter behaves the way the board claims it does.
 *
 * Run against the counter API directly (fast, no browser):
 *   pnpm test:counter
 *
 * It verifies, in order:
 *   1. /get does not change a value       — reading the board must not inflate it
 *   2. /hit increments by exactly one     — one visit is one visit
 *   3. a fresh key reads as 404           — which the client records as 0
 *   4. room keys behave like the visit key
 *
 * Uses a throwaway namespace so it never touches the real numbers.
 */

const BASE = 'https://abacus.jasoncameron.dev'
const NS = `4d-portfolio-selftest-${Date.now().toString(36)}`

let failures = 0

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function call(path, key) {
  const r = await fetch(`${BASE}/${path}/${NS}/${key}`)
  if (r.status === 404) return { status: 404, value: null }
  if (!r.ok) return { status: r.status, value: null }
  const body = await r.json()
  return { status: r.status, value: body.value }
}

console.log(`counter self-test · namespace ${NS}\n`)

// 1. a key nobody has hit yet
const fresh = await call('get', 'visits')
check('yangi kalit 404 qaytaradi (mijoz uni 0 deb yozadi)', fresh.status === 404, `status ${fresh.status}`)

// 2. first hit creates it at 1
const first = await call('hit', 'visits')
check('birinchi /hit qiymatni 1 qiladi', first.value === 1, `value ${first.value}`)

// 3. reading must not change it
const readA = await call('get', 'visits')
const readB = await call('get', 'visits')
check('/get qiymatni oshirmaydi', readA.value === 1 && readB.value === 1, `${readA.value}, ${readB.value}`)

// 4. each hit adds exactly one
await call('hit', 'visits')
await call('hit', 'visits')
const after = await call('get', 'visits')
check('har /hit aynan +1 qo‘shadi', after.value === 3, `3 kutildi, ${after.value} keldi`)

// 5. room keys are independent
const roomA = await call('hit', 'room-atrium')
const roomB = await call('hit', 'room-skills')
const visitsUnchanged = await call('get', 'visits')
check('xona kalitlari bir-biridan mustaqil', roomA.value === 1 && roomB.value === 1, `atrium ${roomA.value}, skills ${roomB.value}`)
check('xona hit umumiy tashrifga tegmaydi', visitsUnchanged.value === 3, `value ${visitsUnchanged.value}`)

// 6. CORS, since the museum calls this from the browser
const cors = await fetch(`${BASE}/get/${NS}/visits`, { headers: { Origin: 'https://abduazizbobomalikovnode.github.io' } })
check('CORS sarlavhasi bor', cors.headers.get('access-control-allow-origin') === '*', cors.headers.get('access-control-allow-origin') ?? 'yo‘q')

console.log(`\n${failures === 0 ? 'hammasi o‘tdi' : `${failures} ta test yiqildi`}`)
process.exit(failures === 0 ? 0 : 1)
