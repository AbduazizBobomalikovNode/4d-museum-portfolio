#!/usr/bin/env node
/**
 * Snapshot the GitHub profile, repos and README into public/github-snapshot.json.
 * `build` runs this first so the deployed museum always has real content to show:
 * the anonymous API allows 60 requests/hour per IP, and the wall screens fall back
 * to this file whenever the live call is rate-limited or offline.
 *
 * Never fails the build — a stale snapshot beats a broken deploy.
 * Usage: pnpm gh:snapshot   (GITHUB_TOKEN=... raises the limit to 5000/h)
 */
import { existsSync, writeFileSync } from 'node:fs'

const USER = 'AbduazizBobomalikovNode'
const OUT = 'public/github-snapshot.json'

const headers = { Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const get = async (url, accept) => {
  const r = await fetch(url, { headers: accept ? { ...headers, Accept: accept } : headers })
  if (!r.ok) throw new Error(`${r.status} ${url.replace('https://api.github.com', '')}`)
  return accept === 'application/vnd.github.html' ? r.text() : r.json()
}

try {
  const [profile, repos] = await Promise.all([
    get(`https://api.github.com/users/${USER}`),
    get(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=6`),
  ])
  // a missing README should not lose the profile data
  const readme = await get(`https://api.github.com/repos/${USER}/${USER}/readme`, 'application/vnd.github.html').catch(() => '')

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    profile: {
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
    },
    // Never publish a private repo's existence: this snapshot is committed and served
    // from a public page, so a token that can see private repos must not leak their names.
    repos: repos.filter((r) => !r.private).map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count,
      html_url: r.html_url,
      pushed_at: r.pushed_at,
    })),
    readme,
  }
  writeFileSync(OUT, JSON.stringify(snapshot))
  console.log(`[github] snapshot updated · ${snapshot.repos.length} repos · README ${readme.length} B`)
} catch (e) {
  const kept = existsSync(OUT)
  console.warn(`[github] snapshot refresh skipped (${e.message})${kept ? ' — keeping the existing file' : ' — NO snapshot on disk'}`)
  // deliberate: the build continues with whatever snapshot is already committed
}
