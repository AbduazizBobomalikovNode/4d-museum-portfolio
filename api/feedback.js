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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const { name = '', surname = '', message = '', photo = null, meta = '', kind = 'feedback' } = req.body ?? {}
  if (!String(message).trim() || message.length > 4000 || name.length > 120 || surname.length > 120) {
    return res.status(400).json({ error: 'invalid' })
  }
  if (String(meta).length > 2000) return res.status(400).json({ error: 'invalid' })

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
