import { asset } from './geo'
import type { Profile, Repo } from './ghpaint'

export interface GithubSnapshot {
  fetchedAt: string
  profile: Profile & { html_url: string }
  repos: Repo[]
  readme: string
  /** Where this copy came from — the screens label themselves honestly with it. */
  source?: 'live' | 'cache' | 'build'
}

const USER = 'AbduazizBobomalikovNode'
const CACHE_KEY = 'gh-snapshot'
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000 // 6h — plenty fresh for a portfolio, kind to the API

let inflight: Promise<GithubSnapshot | null> | null = null
let current: GithubSnapshot | null = null
const listeners = new Set<(s: GithubSnapshot) => void>()

const publish = (s: GithubSnapshot) => {
  current = s
  listeners.forEach((l) => l(s))
}

/** Subscribe to snapshot updates; fires immediately if one is already loaded. */
export function onGithub(fn: (s: GithubSnapshot) => void): () => void {
  listeners.add(fn)
  if (current) fn(current)
  return () => listeners.delete(fn)
}

async function fromApi(): Promise<GithubSnapshot | null> {
  try {
    const [profile, repos] = await Promise.all([
      fetch(`https://api.github.com/users/${USER}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
      fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=6`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
    ])
    if (!profile?.login || !Array.isArray(repos)) return null
    const readme = await fetch(`https://api.github.com/repos/${USER}/${USER}/readme`, {
      headers: { Accept: 'application/vnd.github.html' },
    })
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '')
    return { fetchedAt: new Date().toISOString(), profile, repos, readme, source: 'live' }
  } catch {
    return null // rate limited or offline — the build snapshot already covers the screens
  }
}

/**
 * Resolve the GitHub data for the wall screens.
 *
 * Order: memory → the snapshot shipped with the build (always present, never rate limited)
 * → a background API refresh when the cached copy is stale, which republishes to subscribers.
 */
export function loadGithub(): Promise<GithubSnapshot | null> {
  if (current) return Promise.resolve(current)
  if (inflight) return inflight

  inflight = (async () => {
    // localStorage first: a repeat visitor skips the network entirely
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw) as GithubSnapshot
        const age = Date.now() - new Date(cached.fetchedAt).getTime()
        publish({ ...cached, source: 'cache' })
        if (age < CACHE_MAX_AGE) return cached
      }
    } catch { /* private mode / bad JSON */ }

    if (!current) {
      try {
        const built = (await fetch(asset('github-snapshot.json')).then((r) => (r.ok ? r.json() : null))) as GithubSnapshot | null
        if (built) publish({ ...built, source: 'build' })
      } catch { /* file missing in a dev checkout */ }
    }

    // opportunistic live refresh; failure is invisible because a snapshot is already showing
    const live = await fromApi()
    if (live) {
      publish(live)
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(live)) } catch { /* quota */ }
    }
    return current
  })()

  return inflight
}
