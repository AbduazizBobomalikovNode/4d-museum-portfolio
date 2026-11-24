/**
 * Serverless relay to Telegram (Vercel / Netlify function style).
 *
 * Handles both things the museum sends:
 *   kind: 'feedback' — the 3D contact form in the About room (name / surname / message)
 *   kind: 'bug'      — Shift+X: a screenshot plus a description and scene metadata
 *
 * Keeps the bot token OFF the client: set TG_BOT_TOKEN and TG_CHAT_ID as environment
 * variables in the hosting dashboard, then point the site at this route with
 *   VITE_FEEDBACK_ENDPOINT=/api/feedback
 *
 * Only the site's own origin may post here (origin allowlist, JSON only, light rate limit);
 * see docs/DEPLOY.md. The Origin header stops other websites, not scripted clients.
 */

/** Telegram caps a photo caption at 1024 characters. */
const CAPTION_MAX = 1024
/** Refuse oversized payloads before we try to decode them (Vercel's body cap is ~4.5MB). */
const PHOTO_MAX_BYTES = 4_000_000

const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])

const call = (token, method, body, json = true) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    ...(json ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { body }),
  })

/** data:image/jpeg;base64,... → Buffer, or null if it is not one. */
function decodePhoto(dataUrl) {
  if (typeof dataUrl !== 'string') return null
  const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return null
  const buf = Buffer.from(m[2], 'base64')
  return buf.length > PHOTO_MAX_BYTES ? null : { buf, type: `image/${m[1]}`, ext: m[1] === 'png' ? 'png' : 'jpg' }
}

/** The only origin that is always allowed. Extras come from env (see allowedOrigins). */
const SITE_ORIGIN = 'https://4d-portfolio.vercel.app'

/** Normalize a URL / origin string to `scheme://host[:port]` (lowercase host), or null. */
function toOrigin(value) {
  if (typeof value !== 'string' || !value) return null
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null
  } catch {
    return null
  }
}

/** Exact-match allowlist: the site, FEEDBACK_ALLOWED_ORIGINS, and this deployment's own Vercel URLs. */
function allowedOrigins() {
  const env = process.env
  const list = [SITE_ORIGIN]
  for (const extra of (env.FEEDBACK_ALLOWED_ORIGINS ?? '').split(',')) list.push(extra.trim())
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) list.push(`https://${host}`)
  }
  return new Set(list.map(toOrigin).filter(Boolean))
}

/** Origin header, or the origin of Referer when Origin is absent. No header → null. */
function requestOrigin(headers) {
  if (headers.origin !== undefined) return toOrigin(headers.origin)
  return toOrigin(headers.referer)
}

function originAllowed(headers) {
  const origin = requestOrigin(headers)
  if (!origin) return false
  if (allowedOrigins().has(origin)) return true
  // local dev only (`vercel dev` => 'development', or no VERCEL_ENV at all) — never on a
  // preview or production deployment, which are already covered by their own URLs above
  const env = process.env.VERCEL_ENV
  if (env === undefined || env === '' || env === 'development') {
    const u = new URL(origin)
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
  }
  return false
}

const isJson = (headers) => /^application\/json\s*(;.*)?$/i.test(String(headers['content-type'] ?? ''))

/**
 * Best-effort rate limit: RATE_MAX accepted requests per RATE_WINDOW_MS per client IP.
 * Serverless instances do not share memory (and a cold start resets it), so this is a
 * floor against casual spam, NOT a guarantee. Fails open: any internal error lets the
 * request through. Old entries are pruned so the map cannot grow without bound.
 */
const RATE_MAX = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX_KEYS = 5000
const hits = new Map()

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  const first = String(Array.isArray(fwd) ? fwd[0] : (fwd ?? '')).split(',')[0].trim()
  return first || String(req.headers['x-real-ip'] ?? '').trim() || req.socket?.remoteAddress || 'unknown'
}

function rateLimited(req) {
  try {
    const now = Date.now()
    if (hits.size > RATE_MAX_KEYS / 2) {
      for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k)
      // still too many live keys: drop the oldest insertions rather than grow
      while (hits.size >= RATE_MAX_KEYS) hits.delete(hits.keys().next().value)
    }
    const ip = clientIp(req)
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
    if (recent.length >= RATE_MAX) {
      hits.set(ip, recent)
      return true
    }
    recent.push(now)
    hits.set(ip, recent)
    return false
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  if (!originAllowed(req.headers ?? {})) return res.status(403).json({ error: 'origin' })
  if (!isJson(req.headers ?? {})) return res.status(415).json({ error: 'content-type' })

  let body
  try {
    body = req.body
  } catch {
    return res.status(400).json({ error: 'invalid' })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'invalid' })

  const { name = '', surname = '', message = '', photo = null, meta = '', kind = 'feedback' } = body
  if (
    [name, surname, message, meta, kind].some((v) => typeof v !== 'string') ||
    (photo !== null && typeof photo !== 'string')
  ) {
    return res.status(400).json({ error: 'invalid' })
  }
  if (!message.trim() || message.length > 4000 || name.length > 120 || surname.length > 120) {
    return res.status(400).json({ error: 'invalid' })
  }
  if (meta.length > 2000) return res.status(400).json({ error: 'invalid' })

  if (rateLimited(req)) return res.status(429).json({ error: 'rate' })

  const token = process.env.TG_BOT_TOKEN
  const chat = process.env.TG_CHAT_ID
  if (!token || !chat) return res.status(500).json({ error: 'not configured' })

  const isBug = kind === 'bug'
  const head = isBug ? '🐞 <b>4D Portfolio — bug report</b>' : '🏛 <b>4D Portfolio — yangi fikr</b>'
  const who = isBug ? [] : [`👤 <b>Ism:</b> ${esc(name)}`, `👤 <b>Familiya:</b> ${esc(surname)}`, '']
  const tail = meta ? ['', `<pre>${esc(meta)}</pre>`] : []
  const text = [head, '', ...who, `💬 ${esc(message)}`, ...tail].join('\n')

  const shot = decodePhoto(photo)

  // No screenshot: one plain message and we are done.
  if (!shot) {
    const tg = await call(token, 'sendMessage', { chat_id: chat, text, parse_mode: 'HTML' })
    if (!tg.ok) return res.status(502).json({ error: 'telegram' })
    return res.status(200).json({ ok: true })
  }

  // With a screenshot: the picture carries as much of the text as a caption allows, and
  // anything past that follows as a separate message so nothing is silently truncated.
  const fits = text.length <= CAPTION_MAX
  const form = new FormData()
  form.append('chat_id', chat)
  form.append('parse_mode', 'HTML')
  form.append('caption', fits ? text : `${head}\n\n💬 ${esc(String(message).slice(0, 700))}`)
  form.append('photo', new Blob([shot.buf], { type: shot.type }), `shot.${shot.ext}`)

  const tg = await call(token, 'sendPhoto', form, false)
  if (!tg.ok) return res.status(502).json({ error: 'telegram' })

  if (!fits) {
    // best-effort: the screenshot already landed, so a failure here is not worth a 502
    await call(token, 'sendMessage', { chat_id: chat, text, parse_mode: 'HTML' }).catch(() => {})
  }
  return res.status(200).json({ ok: true })
}
