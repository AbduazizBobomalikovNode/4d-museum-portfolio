import { perfMode } from './perfFlags'

/**
 * Visit counters for the quick-travel board.
 *
 * GitHub Pages is static — there is nowhere on it to keep a number — so the counts live
 * in a hosted counter. Abacus is used because it needs no account and no token (nothing
 * to leak into the public bundle), answers with `Access-Control-Allow-Origin: *`, and is
 * open source, so if it ever shuts down the way CountAPI did in 2023, the same API can be
 * self-hosted and only BASE below changes.
 *
 * Everything here fails silently: a counter that is down must never break the museum.
 */

/** Swap this one line to move to another host (or a self-hosted Abacus). */
const BASE = 'https://abacus.jasoncameron.dev'
/** Namespace is public by design — anyone who finds it can inflate a number, which is the
 *  accepted trade for having no secret in a static site. */
const NS = '4d-portfolio-abduaziz'

const SESSION_KEY = 'nav-counted'
const TIMEOUT = 6000

export type Counts = Record<string, number>

const counts: Counts = {}
const listeners = new Set<(c: Counts) => void>()

let flushing = false
/**
 * Coalesce updates. A page load fires nine requests (the visit plus eight rooms) and their
 * replies land one after another; publishing each one separately made the board repaint its
 * 2048x1024 canvas nine times in a row, which is visible as a stutter.
 */
const publish = () => {
  if (flushing) return
  flushing = true
  setTimeout(() => {
    flushing = false
    const snapshot = { ...counts }
    listeners.forEach((l) => l(snapshot))
  }, 60)
}

/** Subscribe to count updates; fires immediately with whatever is already known. */
export function onCounts(fn: (c: Counts) => void): () => void {
  listeners.add(fn)
  fn({ ...counts }) // immediate, so a remount paints from cache without waiting
  return () => listeners.delete(fn)
}

async function call(path: string, key: string): Promise<number | null> {
  // ?perf=1 measurement sessions must not inflate the public numbers: read, never hit
  if (perfMode && path === 'hit') path = 'get'
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), TIMEOUT)
    const r = await fetch(`${BASE}/${path}/${NS}/${key}`, { signal: ctl.signal })
    clearTimeout(timer)
    // 404 = nobody has hit this key yet. Record it as zero so the board shows a number
    // and we stop asking on every mount.
    if (r.status === 404) { counts[key] = 0; publish(); return 0 }
    if (!r.ok) return null
    const body = (await r.json()) as { value?: number }
    if (typeof body.value !== 'number') return null
    counts[key] = body.value
    publish()
    return body.value
  } catch {
    return null // offline, blocked, rate limited — the board just shows nothing
  }
}

/** Has this key already been counted in this browser tab? */
export function hasSeen(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as string[]).includes(key) : false
  } catch {
    return false
  }
}

/** Mark it counted. Returns false when it already was — the caller should not count again. */
function seen(key: string): boolean {
  if (hasSeen(key)) return true
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const set = raw ? (JSON.parse(raw) as string[]) : []
    set.push(key)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(set))
  } catch { /* private mode: count it, better than losing the visit */ }
  return false
}

/** Count this visit once per tab, then read it back. */
export function trackVisit(): void {
  bump('visits')
}

/** Count entering a room once per tab. */
export function trackRoom(id: string): void {
  bump(`room-${id}`)
}

function bump(key: string): void {
  if (!seen(key)) { void call('hit', key); return }
  // already counted in this tab — only fetch if we have nothing to show yet
  if (counts[key] === undefined) void call('get', key)
}

/** Read counts without touching them — for rooms this visitor has not entered. */
export function readCounts(keys: string[]): void {
  for (const k of keys) if (counts[k] === undefined) void call('get', k)
}

export const LIKE_KEY = 'likes'

/** Read the like total without touching it. */
export function readLikes(): void {
  if (counts[LIKE_KEY] === undefined) void call('get', LIKE_KEY)
}

/**
 * Register a like. One per browser tab — the visitor can like again on their next visit,
 * which is what "har bir kirishda bosilsa bo'ladigan" asks for. Returns false if this tab
 * already liked, so the button can just sit there looking pressed.
 */
export function like(): boolean {
  if (perfMode) return false
  if (seen(LIKE_KEY)) return false
  void call('hit', LIKE_KEY)
  return true
}
