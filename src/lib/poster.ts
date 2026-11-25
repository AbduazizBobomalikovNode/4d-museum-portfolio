import * as THREE from 'three'
import { ANISO, mkCanvas } from '@/lib/tier'

/** GitHub language colors + brand colors used across posters and wall badges. */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Swift: '#F05138',
  PHP: '#777BB4',
  CSS: '#663399',
  HTML: '#E34C26',
  Node: '#339933',
  Electron: '#47848F',
  MQTT: '#606',
  Telegram: '#26A5E4',
  React: '#61DAFB',
  '3D': '#5DE4FF',
  AI: '#8E44AD',
  IoT: '#00979D',
  Linux: '#FCC624',
  PWA: '#5A0FC8',
}
export const langColor = (tag?: string) => (tag && LANG_COLORS[tag]) || '#F2B441'

const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_B = '"IBM Plex Sans", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

type Entry = { tex: THREE.CanvasTexture; draw: () => void }
const cache = new Map<string, Entry>()
let fontsHooked = false

/** Re-draw every cached canvas once web fonts finish loading (canvas won't reflow on its own). */
function hookFonts() {
  if (fontsHooked || typeof document === 'undefined' || !document.fonts?.ready) return
  fontsHooked = true
  document.fonts.ready.then(() => {
    for (const e of cache.values()) { e.draw(); e.tex.needsUpdate = true }
  })
}

function makeTexture(key: string, w: number, h: number, render: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit.tex
  const { canvas, ctx } = mkCanvas(w, h)
  const draw = () => { ctx.clearRect(0, 0, w, h); render(ctx) }
  draw()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  cache.set(key, { tex, draw })
  hookFonts()
  return tex
}

/** Set `font` shrunk until `text` fits maxW — canvas maxWidth squashes glyphs into unreadable mush. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number, weightFace: (s: number) => string, minSize = 16): number {
  ctx.font = weightFace(size)
  while (size > minSize && ctx.measureText(text).width > maxW) {
    size -= 2
    ctx.font = weightFace(size)
  }
  return size
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const t = line ? line + ' ' + word : word
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = word } else line = t
  }
  if (line) lines.push(line)
  return lines
}

export interface PosterSpec {
  id: string
  title: string
  subtitle?: string
  year?: string
  description: string
  tags?: string[]
  footer?: string
}

/** GitHub-card style poster used as exhibit artwork (1024×640). */
export function posterTexture(spec: PosterSpec): THREE.CanvasTexture {
  return makeTexture('poster:' + spec.id, 1024, 512, (ctx) => {
    const accent = langColor(spec.tags?.[0])
    // ground (1024×512 — keep power-of-two: NPOT mipmaps shimmer on some GPUs)
    ctx.fillStyle = '#14161C'
    ctx.fillRect(0, 0, 1024, 512)
    // accent bar + corner ticks
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 1024, 8)
    ctx.fillRect(0, 8, 8, 76)
    // year
    ctx.font = `28px ${FONT_M}`
    ctx.textAlign = 'right'
    ctx.fillStyle = '#A5A39B'
    if (spec.year) ctx.fillText(spec.year, 976, 66)
    // title
    ctx.textAlign = 'left'
    ctx.fillStyle = '#E8E6E0'
    fitFont(ctx, spec.title, 68, 900, (v) => `800 ${v}px ${FONT_D}`)
    ctx.fillText(spec.title, 44, 104)
    // subtitle
    if (spec.subtitle) {
      ctx.fillStyle = accent
      fitFont(ctx, spec.subtitle, 30, 928, (v) => `${v}px ${FONT_M}`)
      ctx.fillText(spec.subtitle, 44, 150)
    }
    // description
    ctx.font = `32px ${FONT_B}`
    ctx.fillStyle = '#C9C7BF'
    let y = 204
    for (const line of wrap(ctx, spec.description, 930).slice(0, 5)) {
      ctx.fillText(line, 44, y)
      y += 42
    }
    // tag chips
    let x = 44
    const cy = 448
    ctx.font = `26px ${FONT_M}`
    for (const t of spec.tags ?? []) {
      const wChip = ctx.measureText(t).width + 36
      ctx.strokeStyle = langColor(t)
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(x, cy - 30, wChip, 44, 22)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#E8E6E0'
      ctx.fillText(t, x + 18, cy)
      x += wChip + 14
    }
    // footer
    if (spec.footer) {
      ctx.font = `24px ${FONT_M}`
      ctx.fillStyle = '#7d7b74'
      ctx.textAlign = 'right'
      ctx.fillText(spec.footer, 980, 490)
      ctx.textAlign = 'left'
    }
  })
}

/** Square language badge. 2-letter marks sit bottom-right (real JS/TS logo layout),
 * longer wordmarks are centred; PY gets Python's blue/yellow split. */
export function badgeTexture(label: string, bg: string, fg = '#0B0C10'): THREE.CanvasTexture {
  return makeTexture('badge:' + label, 256, 256, (ctx) => {
    ctx.beginPath()
    ctx.roundRect(0, 0, 256, 256, 28)
    if (label === 'PY') {
      ctx.save()
      ctx.clip()
      ctx.fillStyle = '#3776AB'
      ctx.fillRect(0, 0, 256, 128)
      ctx.fillStyle = '#FFD43B'
      ctx.fillRect(0, 128, 256, 128)
      ctx.restore()
    } else {
      ctx.fillStyle = bg
      ctx.fill()
    }
    ctx.fillStyle = label === 'PY' ? '#FFFFFF' : fg
    if (label.length <= 2) {
      // bottom-right corner wordmark, 20 px margin
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      fitFont(ctx, label, 84, 170, (v) => `800 ${v}px ${FONT_D}`)
      ctx.fillText(label, 236, 232)
    } else {
      // centred wordmark
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      fitFont(ctx, label, 64, 208, (v) => `800 ${v}px ${FONT_D}`)
      ctx.fillText(label, 128, 134)
    }
  })
}

/** Code-editor mural for large walls (subtle syntax-colored lines). */
export function codeTexture(seed = 1): THREE.CanvasTexture {
  return makeTexture('code:' + seed, 1024, 1024, (ctx) => {
    ctx.fillStyle = '#111318'
    ctx.fillRect(0, 0, 1024, 1024)
    const colors = ['#5DE4FF', '#F2B441', '#A277FF', '#61DAFB', '#7d7b74', '#4FBF67']
    let rng = seed * 999331 + 7
    const rand = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647 }
    let y = 40
    while (y < 1000) {
      let x = 40 + Math.floor(rand() * 3) * 56
      const n = 2 + Math.floor(rand() * 4)
      for (let i = 0; i < n && x < 900; i++) {
        const wSeg = 40 + rand() * 200
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)]
        ctx.globalAlpha = 0.5 + rand() * 0.4
        ctx.beginPath()
        ctx.roundRect(x, y, wSeg, 14, 7)
        ctx.fill()
        x += wSeg + 24
      }
      y += 42
    }
    ctx.globalAlpha = 1
  })
}

/** Door signage: room name + arrow (used above openings for wayfinding). */
export function signTexture(title: string, eyebrow: string, key = ''): THREE.CanvasTexture {
  return makeTexture('sign:' + key + title, 512, 128, (ctx) => {
    ctx.fillStyle = '#0F1116'
    ctx.beginPath()
    ctx.roundRect(0, 0, 512, 128, 12)
    ctx.fill()
    ctx.fillStyle = '#F2B441'
    ctx.fillRect(0, 0, 7, 128)
    ctx.font = `17px ${FONT_M}`
    ctx.fillStyle = '#A5A39B'
    ctx.fillText(eyebrow.toUpperCase(), 28, 40)
    ctx.fillStyle = '#E8E6E0'
    fitFont(ctx, '→  ' + title, 40, 466, (v) => `700 ${v}px ${FONT_D}`)
    ctx.fillText('→  ' + title, 26, 94)
  })
}

/** Museum plaque (small POT canvas — crisp at distance, replaces per-glyph Text meshes). */
export function plaqueTexture(title: string, sub: string, accent = '#B8780F', hint = 'PRESS E · TAP', key = ''): THREE.CanvasTexture {
  return makeTexture('plaque:' + key + title + sub, 256, 128, (ctx) => {
    ctx.fillStyle = '#E8E6E0'
    ctx.beginPath()
    ctx.roundRect(0, 0, 256, 128, 6)
    ctx.fill()
    ctx.fillStyle = '#16171B'
    fitFont(ctx, title, 22, 226, (v) => `600 ${v}px ${FONT_B}`, 12)
    ctx.fillText(title, 16, 42)
    ctx.fillStyle = '#4B4E57'
    fitFont(ctx, sub, 15, 226, (v) => `${v}px ${FONT_B}`, 10)
    ctx.fillText(sub, 16, 72)
    ctx.fillStyle = accent
    ctx.font = `12px ${FONT_M}`
    ctx.fillText(hint, 16, 106)
  })
}

/** Museum hall number: huge outlined numeral + small label (512² POT). */
export function numberTexture(num: string, label: string, accent: string, key = ''): THREE.CanvasTexture {
  return makeTexture('num:' + key + num + label, 512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512)
    ctx.strokeStyle = accent
    ctx.globalAlpha = 0.85
    ctx.lineWidth = 5
    ctx.textAlign = 'right'
    fitFont(ctx, num, 340, 440, (v) => `800 ${v}px ${FONT_D}`)
    ctx.strokeText(num, 480, 380)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#E8E6E0'
    ctx.textAlign = 'left'
    fitFont(ctx, label.toUpperCase(), 34, 440, (v) => `500 ${v}px ${FONT_M}`)
    ctx.fillText(label.toUpperCase(), 36, 460)
    ctx.fillStyle = accent
    ctx.fillRect(36, 418, 150, 4)
  })
}

/** Entrance wordmark banner (1024×256 POT). */
export function wordmarkTexture(): THREE.CanvasTexture {
  return makeTexture('wordmark', 1024, 256, (ctx) => {
    ctx.clearRect(0, 0, 1024, 256)
    ctx.fillStyle = '#E8E6E0'
    fitFont(ctx, '4D PORTFOLIO', 120, 840, (v) => `800 ${v}px ${FONT_D}`)
    ctx.fillText('4D PORTFOLIO', 36, 150)
    ctx.fillStyle = '#F2B441'
    ctx.font = `30px ${FONT_M}`
    ctx.fillText('TESSERACT GALLERY · 2022 → 2026', 40, 214)
    ctx.strokeStyle = '#5DE4FF'
    ctx.lineWidth = 3
    ctx.strokeRect(920, 40, 60, 60)
    ctx.strokeRect(944, 64, 60, 60)
    ctx.beginPath(); ctx.moveTo(920, 40); ctx.lineTo(944, 64); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(980, 40); ctx.lineTo(1004, 64); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(920, 100); ctx.lineTo(944, 124); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(980, 100); ctx.lineTo(1004, 124); ctx.stroke()
  })
}

/** GitHub-style contribution heatmap (512×256 POT). */
export function contribTexture(seed = 47): THREE.CanvasTexture {
  return makeTexture('contrib:' + seed, 512, 256, (ctx) => {
    ctx.fillStyle = '#0F1116'
    ctx.beginPath(); ctx.roundRect(0, 0, 512, 256, 10); ctx.fill()
    const greens = ['#1a2b22', '#0e4429', '#006d32', '#26a641', '#39d353']
    let a = seed
    const rand = () => { a = (a * 16807) % 2147483647; return a / 2147483647 }
    const cols = 30, rows = 7, cs = 13, gap = 3, ox = 26, oy = 42
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        const v = rand()
        ctx.fillStyle = greens[v < 0.35 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : v < 0.94 ? 3 : 4]
        ctx.beginPath(); ctx.roundRect(ox + c * (cs + gap), oy + r * (cs + gap), cs, cs, 3); ctx.fill()
      }
    ctx.fillStyle = '#A5A39B'
    ctx.font = `22px ${FONT_M}`
    ctx.fillText('github.com/AbduazizBobomalikovNode — 18 repos', 26, 216)
  })
}

/** Circuit-board traces (512² POT) — experiments room. */
export function circuitTexture(seed = 5): THREE.CanvasTexture {
  return makeTexture('circuit:' + seed, 512, 512, (ctx) => {
    ctx.fillStyle = '#10151a'
    ctx.fillRect(0, 0, 512, 512)
    let a = seed * 7919 + 13
    const rand = () => { a = (a * 16807) % 2147483647; return a / 2147483647 }
    ctx.lineWidth = 3
    for (let i = 0; i < 26; i++) {
      let x = 32 + Math.floor(rand() * 14) * 32
      let y = 32 + Math.floor(rand() * 14) * 32
      ctx.strokeStyle = rand() > 0.35 ? '#1f4d46' : '#6b5b1e'
      ctx.beginPath(); ctx.moveTo(x, y)
      const steps = 2 + Math.floor(rand() * 3)
      for (let sIdx = 0; sIdx < steps; sIdx++) {
        if (rand() > 0.5) x += (rand() > 0.5 ? 1 : -1) * (32 + Math.floor(rand() * 3) * 32)
        else y += (rand() > 0.5 ? 1 : -1) * (32 + Math.floor(rand() * 3) * 32)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#39d3c0'
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
    }
    // chip
    ctx.fillStyle = '#1a2027'
    ctx.fillRect(208, 208, 96, 96)
    ctx.strokeStyle = '#39d3c0'
    ctx.lineWidth = 2
    ctx.strokeRect(208, 208, 96, 96)
    ctx.fillStyle = '#5DE4FF'
    ctx.font = `700 26px ${FONT_M}`
    ctx.fillText('IoT', 232, 264)
  })
}

/** Timeline year band (1024×128 POT). */
export function yearsTexture(): THREE.CanvasTexture {
  return makeTexture('years', 1024, 128, (ctx) => {
    ctx.clearRect(0, 0, 1024, 128)
    ctx.strokeStyle = '#F2B441'
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(20, 88); ctx.lineTo(1004, 88); ctx.stroke()
    const years = ['2022', '2023', '2024', '2025', '2026']
    years.forEach((yr, i) => {
      const x = 60 + i * 226
      ctx.beginPath(); ctx.moveTo(x, 88); ctx.lineTo(x, 64); ctx.stroke()
      ctx.fillStyle = i === years.length - 1 ? '#F2B441' : '#E8E6E0'
      ctx.font = `700 40px ${FONT_D}`
      ctx.fillText(yr, x - 44, 48)
    })
    ctx.fillStyle = '#F2B441'
    ctx.beginPath(); ctx.arc(1004, 88, 8, 0, Math.PI * 2); ctx.fill()
  })
}

/** Quote mural (1024×512 POT) — about room. */
export function quoteTexture(): THREE.CanvasTexture {
  return makeTexture('quote', 1024, 512, (ctx) => {
    ctx.clearRect(0, 0, 1024, 512)
    ctx.fillStyle = '#5DE4FF'
    ctx.font = `800 220px ${FONT_D}`
    ctx.globalAlpha = 0.5
    ctx.fillText('“', 24, 210)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#E8E6E0'
    ctx.font = `700 58px ${FONT_D}`
    ctx.fillText('Kod — fikrning', 170, 190)
    ctx.fillText('me’moriy shakli.', 170, 264)
    ctx.fillStyle = '#A5A39B'
    ctx.font = `30px ${FONT_M}`
    ctx.fillText('— Abduaziz Bobomalikov', 170, 350)
    ctx.fillStyle = '#5DE4FF'
    ctx.fillRect(170, 300, 120, 4)
  })
}
