import { LANG_COLORS } from './poster'

const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_B = '"IBM Plex Sans", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

export interface Repo { name: string; description: string | null; language: string | null; stargazers_count: number; pushed_at: string }
export interface Profile { avatar_url: string; name: string | null; login: string; bio: string | null; public_repos: number; followers: number; following: number }

/** camo.githubusercontent proxy URLs embed the original URL as hex — decode for a CORS retry. */
function decodeCamo(url: string): string | null {
  const m = url.match(/camo\.githubusercontent\.com\/[0-9a-f]+\/([0-9a-f]+)/)
  if (!m) return null
  try {
    const hex = m[1]
    let out = ''
    for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16))
    return out.startsWith('http') ? out : null
  } catch { return null }
}

/** CORS image fetch → ImageBitmap (null when the host refuses — caller draws a placeholder). */
export async function loadImg(url: string): Promise<ImageBitmap | null> {
  // createImageBitmap rejects SVGs without width/height attrs — rasterise those via <img>+canvas
  const blobToBitmap = async (blob: Blob): Promise<ImageBitmap> => {
    if (!blob.type.includes('svg')) return createImageBitmap(blob)
    const obj = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.src = obj
      await img.decode()
      const w = img.naturalWidth || 96
      const h = img.naturalHeight || 96
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      return createImageBitmap(c)
    } finally {
      URL.revokeObjectURL(obj)
    }
  }
  const tryFetch = async (u: string) => {
    const r = await fetch(u, { mode: 'cors' })
    if (!r.ok) throw new Error(String(r.status))
    return blobToBitmap(await r.blob())
  }
  try { return await tryFetch(url) } catch { /* retry below */ }
  const orig = decodeCamo(url)
  if (orig) { try { return await tryFetch(orig) } catch { /* placeholder */ } }
  return null
}

/** GitHub-dark profile card (2048×1024 POT) — drawn entirely in canvas, no DOM. */
export function paintProfile(ctx: CanvasRenderingContext2D, p: Profile, repos: Repo[], avatar: ImageBitmap | null, sourceLabel = '') {
  const W = 2048
  const H = 1024
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#30363d'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)
  // header
  if (avatar) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(150, 150, 92, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, 58, 58, 184, 184)
    ctx.restore()
    ctx.strokeStyle = '#30363d'
    ctx.beginPath()
    ctx.arc(150, 150, 92, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#e6edf3'
  ctx.font = `800 56px ${FONT_D}`
  ctx.fillText(p.name ?? p.login, 290, 120)
  ctx.fillStyle = '#8b949e'
  ctx.font = `30px ${FONT_M}`
  ctx.fillText('@' + p.login, 290, 168)
  if (p.bio) {
    ctx.fillStyle = '#c9d1d9'
    ctx.font = `32px ${FONT_B}`
    ctx.fillText(p.bio, 290, 222)
  }
  ctx.fillStyle = '#8b949e'
  ctx.font = `30px ${FONT_M}`
  ctx.fillText(`${p.public_repos} repo   ·   ${p.followers} follower   ·   ${p.following} following`, 290, 272)
  // tell the truth about where this came from: live call vs snapshot/cache
  const live = sourceLabel.startsWith('●')
  ctx.fillStyle = live ? '#3fb950' : '#8b949e'
  ctx.textAlign = 'right'
  ctx.fillText(sourceLabel, W - 50, 272)
  ctx.textAlign = 'left'
  // repo grid 2×3
  const cw = (W - 120) / 2
  const chh = 200
  repos.slice(0, 6).forEach((r, i) => {
    const x = 50 + (i % 2) * (cw + 20)
    const y = 330 + Math.floor(i / 2) * (chh + 20)
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(x, y, cw, chh, 14)
    ctx.stroke()
    ctx.fillStyle = '#58a6ff'
    ctx.font = `700 34px ${FONT_B}`
    ctx.fillText(r.name, x + 26, y + 52)
    if (r.description) {
      ctx.fillStyle = '#8b949e'
      ctx.font = `26px ${FONT_B}`
      const words = r.description.split(' ')
      let line = ''
      let ly = y + 98
      for (const w of words) {
        const t = line ? line + ' ' + w : w
        if (ctx.measureText(t).width > cw - 52) {
          ctx.fillText(line, x + 26, ly)
          ly += 34
          line = w
          if (ly > y + 132) { line += '…'; break }
        } else line = t
      }
      ctx.fillText(line, x + 26, ly)
    }
    if (r.language) {
      ctx.fillStyle = LANG_COLORS[r.language] ?? '#8b949e'
      ctx.beginPath()
      ctx.arc(x + 34, y + chh - 32, 9, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#8b949e'
    ctx.font = `24px ${FONT_M}`
    ctx.fillText(`${r.language ?? '—'} · ★ ${r.stargazers_count} · ${new Date(r.pushed_at).toLocaleDateString('uz-UZ')}`, x + 56, y + chh - 24)
  })
}

interface Inline { kind: 'text' | 'img'; text?: string; color?: string; bold?: boolean; img?: ImageBitmap | null; w?: number; h?: number }
interface Block { kind: 'h1' | 'h2' | 'p' | 'li'; inlines: Inline[] }

/** Parse the API-rendered README HTML into paintable blocks + collect image URLs. */
export function parseReadme(html: string): { blocks: Block[]; imgUrls: string[] } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks: Block[] = []
  const imgUrls: string[] = []
  const inlineOf = (el: Element | ChildNode, color?: string, bold?: boolean): Inline[] => {
    const out: Inline[] = []
    el.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const t = n.textContent?.replace(/\s+/g, ' ') ?? ''
        if (t.trim()) out.push({ kind: 'text', text: t, color, bold })
      } else if (n.nodeName === 'IMG') {
        const src = (n as HTMLImageElement).getAttribute('src') ?? ''
        if (src) { imgUrls.push(src); out.push({ kind: 'img', text: src }) }
      } else if (n.nodeName === 'A') {
        out.push(...inlineOf(n, '#58a6ff', bold))
      } else if (n.nodeName === 'STRONG' || n.nodeName === 'B') {
        out.push(...inlineOf(n, color, true))
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        out.push(...inlineOf(n, color, bold))
      }
    })
    return out
  }
  const walk = (el: Element) => {
    for (const c of Array.from(el.children)) {
      const tag = c.tagName
      if (tag === 'H1') blocks.push({ kind: 'h1', inlines: inlineOf(c) })
      else if (tag === 'H2' || tag === 'H3') blocks.push({ kind: 'h2', inlines: inlineOf(c) })
      else if (tag === 'P') blocks.push({ kind: 'p', inlines: inlineOf(c) })
      else if (tag === 'UL' || tag === 'OL') {
        for (const li of Array.from(c.children)) blocks.push({ kind: 'li', inlines: inlineOf(li) })
      } else if (tag === 'DIV' || tag === 'ARTICLE' || tag === 'SECTION') walk(c)
      else if (tag === 'TABLE') blocks.push({ kind: 'p', inlines: inlineOf(c) })
    }
  }
  walk(doc.body)
  return { blocks, imgUrls }
}

/**
 * Paint parsed README blocks into a tall canvas (width 2048) and return the used height.
 * Images come from `imgs` (url → bitmap|null); null → small placeholder chip.
 */
export function paintReadme(ctx: CanvasRenderingContext2D, blocks: Block[], imgs: Map<string, ImageBitmap | null>): number {
  const W = 2048
  const M = 70
  const maxW = W - M * 2
  let y = 90
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, ctx.canvas.height)
  const drawInlines = (inlines: Inline[], startX: number, font: number, lh: number, center = false) => {
    // measure pass for centering (single-line approximation for headings)
    let x = startX
    const flushX = startX
    const put = (run: () => void) => run()
    if (center) {
      let total = 0
      ctx.font = `800 ${font}px ${FONT_D}`
      inlines.forEach((i) => { if (i.kind === 'text') total += ctx.measureText(i.text ?? '').width })
      x = Math.max(startX, (W - total) / 2)
    }
    for (const inl of inlines) {
      if (inl.kind === 'text') {
        const words = (inl.text ?? '').split(' ')
        ctx.font = `${inl.bold ? 700 : 400} ${font}px ${center ? FONT_D : FONT_B}`
        ctx.fillStyle = inl.color ?? '#c9d1d9'
        for (const w of words) {
          if (!w) continue
          const piece = w + ' '
          const pw = ctx.measureText(piece).width
          if (x + pw > W - M) { x = flushX; y += lh }
          put(() => ctx.fillText(piece, x, y))
          x += pw
        }
      } else {
        const bm = imgs.get(inl.text ?? '')
        if (bm) {
          const h = Math.min(64, bm.height * 2)
          const w = (bm.width / bm.height) * h
          const dw = Math.min(w, maxW)
          if (x + dw > W - M) { x = flushX; y += Math.max(72, h + 10) }
          ctx.drawImage(bm, x, y - h + 14, dw, h)
          x += dw + 12
        } else {
          // CORS-refused badge → neutral chip
          const label = '▧'
          ctx.font = `28px ${FONT_M}`
          const cw2 = 46
          if (x + cw2 > W - M) { x = flushX; y += 54 }
          ctx.fillStyle = '#21262d'
          ctx.beginPath()
          ctx.roundRect(x, y - 30, cw2, 40, 8)
          ctx.fill()
          ctx.fillStyle = '#8b949e'
          ctx.fillText(label, x + 12, y)
          x += cw2 + 10
        }
      }
    }
  }
  for (const b of blocks) {
    if (b.kind === 'h1') {
      y += 40
      ctx.fillStyle = '#e6edf3'
      drawInlines(b.inlines, M, 66, 80, true)
      y += 30
      ctx.strokeStyle = '#21262d'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
      y += 60
    } else if (b.kind === 'h2') {
      y += 34
      ctx.fillStyle = '#e6edf3'
      drawInlines(b.inlines, M, 48, 62)
      y += 20
      ctx.strokeStyle = '#21262d'
      ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
      y += 56
    } else if (b.kind === 'li') {
      ctx.fillStyle = '#8b949e'
      ctx.font = `34px ${FONT_B}`
      ctx.fillText('•', M + 6, y)
      drawInlines(b.inlines, M + 44, 34, 48)
      y += 56
    } else {
      drawInlines(b.inlines, M, 34, 48)
      y += 64
    }
  }
  return y + 40
}
