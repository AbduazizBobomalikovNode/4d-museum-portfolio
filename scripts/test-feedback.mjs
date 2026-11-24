#!/usr/bin/env node
/**
 * Exercises the serverless feedback relay without deploying it and without sending
 * anything to Telegram — the outbound call is stubbed.
 *
 *   pnpm test:feedback
 *
 * Vercel calls this handler with (req, res); here we hand it the same shapes and check
 * the contract: method guard, origin allowlist, content-type, field types, rate limit, validation limits, the "not configured" path, HTML escaping,
 * and that a well-formed submission reaches Telegram with the right chat id.
 */

import handler from '../api/feedback.js'

let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

/** Minimal stand-in for Vercel's response object. */
function mockRes() {
  const out = { code: 0, body: null }
  return {
    status(c) { out.code = c; return this },
    json(b) { out.body = b; return out },
    get result() { return out },
    out,
  }
}

// Safety net: nothing in this script may ever reach the real Telegram API. Cases that
// need to inspect the outgoing call swap in their own stub and restore this one.
const blockedFetch = async (url) => {
  throw new Error(`unexpected network call in test: ${url}`)
}
globalThis.fetch = blockedFetch

const SITE = 'https://4d-portfolio.vercel.app'
let ipCounter = 0

/**
 * Runs the handler. Unless a case overrides them, requests come from the allowed site,
 * as JSON, from a fresh IP each (so the rate limiter does not leak between cases).
 * Pass a header as `undefined` to remove it.
 */
const run = async (req, env = {}) => {
  const saved = { ...process.env }
  // a clean slate: tests must not depend on the machine's own Vercel / allowlist env
  for (const k of ['VERCEL_ENV', 'VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'FEEDBACK_ALLOWED_ORIGINS']) delete process.env[k]
  Object.assign(process.env, env)
  const ip = `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`
  req = {
    ...req,
    headers: { origin: SITE, 'content-type': 'application/json', 'x-forwarded-for': ip, ...req.headers },
  }
  const res = mockRes()
  await handler(req, res)
  process.env = saved
  return res.out
}

console.log('feedback relay self-test\n')

// 1. method guard
const get = await run({ method: 'GET' })
check('GET rad etiladi', get.code === 405, `status ${get.code}`)

// 2. validation
const CONFIGURED = { TG_BOT_TOKEN: 'test-token', TG_CHAT_ID: '12345' }
const empty = await run({ method: 'POST', body: { message: '   ' } }, CONFIGURED)
check('bo‘sh xabar rad etiladi', empty.code === 400, `status ${empty.code}`)

const long = await run({ method: 'POST', body: { message: 'x'.repeat(4001) } }, CONFIGURED)
check('4000 belgidan uzun xabar rad etiladi', long.code === 400, `status ${long.code}`)

const bigMeta = await run({ method: 'POST', body: { message: 'salom', meta: 'm'.repeat(2001) } }, CONFIGURED)
check('2000 belgidan uzun meta rad etiladi', bigMeta.code === 400, `status ${bigMeta.code}`)

const longName = await run({ method: 'POST', body: { name: 'x'.repeat(121), message: 'salom' } }, CONFIGURED)
check('121 belgilik ism rad etiladi', longName.code === 400, `status ${longName.code}`)

// 3. missing configuration must not leak a 200
const unset = await run({ method: 'POST', body: { message: 'salom' } }, { TG_BOT_TOKEN: '', TG_CHAT_ID: '' })
check('token sozlanmagan bo‘lsa 500', unset.code === 500, `status ${unset.code}`)

// 4. a good submission — stub the Telegram call
let sent = null
globalThis.fetch = async (url, init) => {
  sent = { url, body: JSON.parse(init.body) }
  return { ok: true }
}
const ok = await run(
  { method: 'POST', body: { name: 'Abduaziz', surname: 'Bobomalikov', message: 'Muzey zo‘r <b>test</b>' } },
  CONFIGURED,
)
globalThis.fetch = blockedFetch

check('to‘g‘ri yuborish 200 qaytaradi', ok.code === 200 && ok.body?.ok === true, `status ${ok.code}`)
check('Telegram sendMessage chaqirildi', /\/bottest-token\/sendMessage$/.test(sent?.url ?? ''), sent?.url ?? 'chaqirilmadi')
check('chat_id uzatildi', sent?.body?.chat_id === '12345', String(sent?.body?.chat_id))
check('ism xabarga kirdi', (sent?.body?.text ?? '').includes('Abduaziz'))
check('HTML ekranlangan (XSS yo‘q)', (sent?.body?.text ?? '').includes('&lt;b&gt;test&lt;/b&gt;'), 'foydalanuvchi <b> tegi matn sifatida ketdi')


// ── bug report: screenshot yo'li ──────────────────────────────────────
/** 1x1 JPEG, enough to exercise the decode + multipart path. */
const TINY_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='

const calls = []
globalThis.fetch = async (url, init) => {
  calls.push({ url, init })
  return { ok: true }
}
const bug = await run(
  { method: 'POST', body: { kind: 'bug', message: 'devor yo‘qoldi', photo: TINY_JPEG, meta: 'xona: atrium' } },
  CONFIGURED,
)
globalThis.fetch = blockedFetch

check('skrinshotli hisobot 200 qaytaradi', bug.code === 200, `status ${bug.code}`)
check('sendPhoto ishlatildi', /\/sendPhoto$/.test(calls[0]?.url ?? ''), calls[0]?.url ?? 'chaqirilmadi')
const form = calls[0]?.init?.body
check('multipart FormData yuborildi', form instanceof FormData)
check('rasm biriktirildi', form?.get('photo') instanceof Blob, `${form?.get('photo')?.constructor?.name}`)
check('caption bug sarlavhasi bilan', String(form?.get('caption') ?? '').includes('bug report'))
check('meta caption ichida', String(form?.get('caption') ?? '').includes('atrium'))

// a caption longer than Telegram allows must still deliver in full
const calls2 = []
globalThis.fetch = async (url, init) => { calls2.push({ url, init }); return { ok: true } }
await run({ method: 'POST', body: { kind: 'bug', message: 'z'.repeat(1500), photo: TINY_JPEG } }, CONFIGURED)
globalThis.fetch = blockedFetch
check('uzun matn: rasm + alohida xabar', calls2.length === 2 && /sendPhoto$/.test(calls2[0].url) && /sendMessage$/.test(calls2[1].url), calls2.map(c => c.url.split('/').pop()).join(' + '))

// a bogus data URL must fall back to a text message, not crash
const calls3 = []
globalThis.fetch = async (url, init) => { calls3.push({ url, init }); return { ok: true } }
const bogus = await run({ method: 'POST', body: { kind: 'bug', message: 'test', photo: 'not-a-data-url' } }, CONFIGURED)
globalThis.fetch = blockedFetch
check('yaroqsiz rasm matnli xabarga tushadi', bogus.code === 200 && /sendMessage$/.test(calls3[0]?.url ?? ''), calls3[0]?.url?.split('/').pop() ?? '-')

// ── origin allowlist / content-type / types / rate limit ─────────────────
const post = (headers, body = { message: 'salom' }) => ({ method: 'POST', headers, body })
let relayed = 0
globalThis.fetch = async () => { relayed++; return { ok: true } }

const foreign = await run(post({ origin: 'https://evil.com' }), CONFIGURED)
check('begona origin 403', foreign.code === 403 && foreign.body?.error === 'origin', `status ${foreign.code}`)
check('begona origin Telegram\'ga bormadi', relayed === 0)

for (const o of [
  'https://4d-portfolio.vercel.app.evil.com',
  'https://evil-4d-portfolio.vercel.app',
  'https://evil.com/4d-portfolio.vercel.app',
  'http://4d-portfolio.vercel.app',
  'https://4d-portfolio.vercel.app:8443',
  'https://4d-portfolio.vercel.app@evil.com',
  'null',
]) {
  const r = await run(post({ origin: o }), CONFIGURED)
  check(`o‘xshash origin rad etiladi: ${o}`, r.code === 403, `status ${r.code}`)
}

const none = await run(post({ origin: undefined }), CONFIGURED)
check('Origin ham Referer ham yo‘q: 403', none.code === 403, `status ${none.code}`)

const refOk = await run(post({ origin: undefined, referer: `${SITE}/about?x=1` }), CONFIGURED)
check('faqat Referer (ruxsat etilgan sayt): 200', refOk.code === 200, `status ${refOk.code}`)
const refBad = await run(post({ origin: undefined, referer: 'https://evil.com/?r=' + SITE }), CONFIGURED)
check('begona Referer: 403', refBad.code === 403, `status ${refBad.code}`)

const extraEnv = { ...CONFIGURED, FEEDBACK_ALLOWED_ORIGINS: ' https://my-domain.uz , https://www.my-domain.uz ' }
const extra = await run(post({ origin: 'https://my-domain.uz' }), extraEnv)
check('FEEDBACK_ALLOWED_ORIGINS: qo‘shimcha origin 200', extra.code === 200, `status ${extra.code}`)
const extraNo = await run(post({ origin: 'https://my-domain.uz' }), CONFIGURED)
check('env bo‘lmasa qo‘shimcha origin 403', extraNo.code === 403, `status ${extraNo.code}`)

const prev = await run(post({ origin: 'https://4d-portfolio-git-x-me.vercel.app' }), { ...CONFIGURED, VERCEL_BRANCH_URL: '4d-portfolio-git-x-me.vercel.app', VERCEL_ENV: 'preview' })
check('preview: VERCEL_BRANCH_URL ruxsat etiladi', prev.code === 200, `status ${prev.code}`)
const prevOther = await run(post({ origin: 'https://other-git-x-me.vercel.app' }), { ...CONFIGURED, VERCEL_BRANCH_URL: '4d-portfolio-git-x-me.vercel.app' })
check('boshqa *.vercel.app rad etiladi', prevOther.code === 403, `status ${prevOther.code}`)

const local = await run(post({ origin: 'http://localhost:5173' }), CONFIGURED)
check('localhost VERCEL_ENV yo‘q: 200', local.code === 200, `status ${local.code}`)
const local2 = await run(post({ origin: 'http://127.0.0.1:3000' }), { ...CONFIGURED, VERCEL_ENV: 'development' })
check('127.0.0.1 development: 200', local2.code === 200, `status ${local2.code}`)
const localDev = await run(post({ origin: 'http://localhost:5173' }), { ...CONFIGURED, VERCEL_ENV: 'development' })
check('localhost development: 200', localDev.code === 200, `status ${localDev.code}`)
for (const o of ['http://localhost:5173', 'http://127.0.0.1:3000']) {
  const lp = await run(post({ origin: o }), { ...CONFIGURED, VERCEL_ENV: 'preview' })
  check(`${o} preview'da rad etiladi`, lp.code === 403, `status ${lp.code}`)
}
const localProd = await run(post({ origin: 'http://localhost:5173' }), { ...CONFIGURED, VERCEL_ENV: 'production' })
check('localhost production\'da rad etiladi', localProd.code === 403, `status ${localProd.code}`)
const localHttps = await run(post({ origin: 'https://localhost:5173' }), CONFIGURED)
check('https://localhost rad etiladi', localHttps.code === 403, `status ${localHttps.code}`)
const prodSite = await run(post({ origin: SITE }), { ...CONFIGURED, VERCEL_ENV: 'production' })
check('production\'da sayt o‘zi 200', prodSite.code === 200, `status ${prodSite.code}`)

for (const ct of ['application/x-www-form-urlencoded', 'text/plain', 'multipart/form-data; boundary=x', undefined]) {
  const r = await run(post({ 'content-type': ct }), CONFIGURED)
  check(`content-type ${ct ?? '(yo‘q)'}: 415`, r.code === 415 && r.body?.error === 'content-type', `status ${r.code}`)
}
const ctCharset = await run(post({ 'content-type': 'application/json; charset=utf-8' }), CONFIGURED)
check('application/json; charset=utf-8: 200', ctCharset.code === 200, `status ${ctCharset.code}`)

for (const [label, body] of [
  ['name raqam', { name: 5, message: 'salom' }],
  ['surname obyekt', { surname: {}, message: 'salom' }],
  ['message massiv', { message: ['salom'] }],
  ['meta raqam', { message: 'salom', meta: 1 }],
  ['photo raqam', { message: 'salom', photo: 7 }],
  ['kind raqam', { message: 'salom', kind: 1 }],
  ['body massiv', ['salom']],
  ['body yo‘q', null],
]) {
  const r = await run(post({}, body), CONFIGURED)
  check(`satr bo‘lmagan maydon 400: ${label}`, r.code === 400 && r.body?.error === 'invalid', `status ${r.code}`)
}
const nullPhoto = await run(post({}, { kind: 'bug', message: 'salom', photo: null }), CONFIGURED)
check('photo: null qabul qilinadi', nullPhoto.code === 200, `status ${nullPhoto.code}`)

// rate limit: 5 per IP, the 6th is 429, another IP is unaffected
const sameIp = { 'x-forwarded-for': '203.0.113.9, 10.1.1.1' }
const codes = []
for (let i = 0; i < 6; i++) codes.push((await run(post(sameIp), CONFIGURED)).code)
check('6-so‘rov 429, dastlabki 5 tasi 200', codes.join() === '200,200,200,200,200,429', codes.join(','))
const rl = await run(post(sameIp), CONFIGURED)
check('429 javobi {"error":"rate"}', rl.body?.error === 'rate')
const otherIp = await run(post({ 'x-forwarded-for': '203.0.113.10' }), CONFIGURED)
check('boshqa IP o‘tadi', otherIp.code === 200, `status ${otherIp.code}`)
const realIp = []
for (let i = 0; i < 6; i++) realIp.push((await run(post({ 'x-forwarded-for': undefined, 'x-real-ip': '203.0.113.50' }), CONFIGURED)).code)
check('x-real-ip zaxirasi ishlaydi', realIp[5] === 429, realIp.join(','))
globalThis.fetch = blockedFetch

console.log(`\n${failures === 0 ? 'hammasi o‘tdi' : `${failures} ta test yiqildi`}`)
process.exit(failures === 0 ? 0 : 1)
