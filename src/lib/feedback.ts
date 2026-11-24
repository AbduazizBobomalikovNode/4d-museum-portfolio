export interface Feedback { name: string; surname: string; message: string }

const ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined
const TOKEN = import.meta.env.VITE_TG_BOT_TOKEN as string | undefined
const CHAT = import.meta.env.VITE_TG_CHAT_ID as string | undefined

export const feedbackConfigured = Boolean(ENDPOINT || (TOKEN && CHAT))

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)

export function formatMessage(f: Feedback): string {
  return [
    '🏛 <b>4D Portfolio — yangi fikr</b>',
    '',
    `👤 <b>Ism:</b> ${esc(f.name)}`,
    `👤 <b>Familiya:</b> ${esc(f.surname)}`,
    '',
    `💬 ${esc(f.message)}`,
    '',
    `🕒 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })} (Toshkent)`,
  ].join('\n')
}

/**
 * Send feedback. Prefers VITE_FEEDBACK_ENDPOINT — a serverless relay that keeps the bot
 * token server-side (see api/feedback.js). The direct Telegram call is a dev fallback:
 * VITE_* values are inlined into the public bundle, so that token is readable by anyone.
 */
export async function sendFeedback(f: Feedback): Promise<void> {
  if (ENDPOINT) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
    if (!r.ok) throw new Error(`endpoint ${r.status}`)
    return
  }
  if (!TOKEN || !CHAT) throw new Error('feedback target not configured')
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text: formatMessage(f), parse_mode: 'HTML' }),
  })
  if (!r.ok) throw new Error(`telegram ${r.status}`)
}

export interface BugReport { message: string; meta: string; photo: string | null }

/**
 * Send a bug report (screenshot + description + scene metadata) through the same relay.
 *
 * Only the relay path: a screenshot goes to Telegram as multipart, which the browser
 * cannot do against the bot API without exposing the token. Callers fall back to
 * downloading the files when this throws or when no endpoint is configured.
 */
export async function sendBugReport(b: BugReport): Promise<void> {
  if (!ENDPOINT) throw new Error('feedback target not configured')
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'bug', message: b.message, meta: b.meta, photo: b.photo }),
  })
  if (!r.ok) throw new Error(`endpoint ${r.status}`)
}

/** True when a bug report can actually be delivered (the relay, not the dev token path). */
export const bugReportConfigured = Boolean(ENDPOINT)
