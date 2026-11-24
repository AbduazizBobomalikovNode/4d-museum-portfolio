#!/usr/bin/env node
/**
 * Exercises the serverless feedback relay without deploying it and without sending
 * anything to Telegram — the outbound call is stubbed.
 *
 *   pnpm test:feedback
 *
 * Vercel calls this handler with (req, res); here we hand it the same shapes and check
 * the contract: method guard, validation limits, the "not configured" path, HTML escaping,
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

const run = async (req, env = {}) => {
  const saved = { ...process.env }
  Object.assign(process.env, env)
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
const realFetch = globalThis.fetch
let sent = null
globalThis.fetch = async (url, init) => {
  sent = { url, body: JSON.parse(init.body) }
  return { ok: true }
}
const ok = await run(
  { method: 'POST', body: { name: 'Abduaziz', surname: 'Bobomalikov', message: 'Muzey zo‘r <b>test</b>' } },
  CONFIGURED,
)
globalThis.fetch = realFetch

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
globalThis.fetch = realFetch

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
globalThis.fetch = realFetch
check('uzun matn: rasm + alohida xabar', calls2.length === 2 && /sendPhoto$/.test(calls2[0].url) && /sendMessage$/.test(calls2[1].url), calls2.map(c => c.url.split('/').pop()).join(' + '))

// a bogus data URL must fall back to a text message, not crash
const calls3 = []
globalThis.fetch = async (url, init) => { calls3.push({ url, init }); return { ok: true } }
const bogus = await run({ method: 'POST', body: { kind: 'bug', message: 'test', photo: 'not-a-data-url' } }, CONFIGURED)
globalThis.fetch = realFetch
check('yaroqsiz rasm matnli xabarga tushadi', bogus.code === 200 && /sendMessage$/.test(calls3[0]?.url ?? ''), calls3[0]?.url?.split('/').pop() ?? '-')

console.log(`\n${failures === 0 ? 'hammasi o‘tdi' : `${failures} ta test yiqildi`}`)
process.exit(failures === 0 ? 0 : 1)
