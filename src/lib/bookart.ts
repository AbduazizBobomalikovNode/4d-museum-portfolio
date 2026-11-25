import * as THREE from 'three'
import type { Book } from './books'
import { ANISO, mkCanvas } from '@/lib/tier'
import { deferUpload, needFontsRepaint } from './assets'

/**
 * The gift shelf's small canvas-texture bits: the spin button label, the top-rail title
 * plate, and the detail card shown when the spin lands on a book.
 *
 * The shelf itself is real 3D geometry now (see GiftShelf.tsx) — covers are loaded as
 * their own textures via useTexture, so this file only holds the text/label artwork that
 * a WebGL mesh cannot draw on its own.
 */

const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

const C = {
  ttl: '#E8E6E0',
  dim: '#8b93a3',
  accent: '#F2B441',
  free: '#5DE4FF',
}

function fit(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number, face: (s: number) => string, min = 13) {
  ctx.font = face(size)
  while (size > min && ctx.measureText(text).width > maxW) {
    size -= 1
    ctx.font = face(size)
  }
  return size
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW) { if (line) out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Re-paint once system/web fonts finish loading — canvas text does not reflow on its own. */
function onFontsReady(draw: () => void, tex: THREE.CanvasTexture) {
  if (!needFontsRepaint()) return
  document.fonts?.ready?.then(() => { draw(); tex.needsUpdate = true }).catch(() => {})
}

// ── the spin button, its own small mesh now (not a region of a big board) ───────────────

let btnTex: THREE.CanvasTexture | null = null
export function buttonTexture(): THREE.CanvasTexture {
  if (btnTex) return btnTex
  const W = 1024
  const H = 256
  const { canvas, ctx } = mkCanvas(W, H)
  const draw = () => {
    ctx.clearRect(0, 0, W, H)
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, '#F2B441')
    g.addColorStop(1, '#E08D2F')
    ctx.fillStyle = g
    roundRect(ctx, 14, 14, W - 28, H - 28, 34)
    ctx.fill()
    ctx.fillStyle = '#14100a'
    ctx.font = `700 82px ${FONT_D}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Sovg‘angizni oling', W / 2, H / 2 + 4)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }
  draw()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  deferUpload(tex, canvas, 'contact')
  onFontsReady(draw, tex)
  btnTex = tex
  return tex
}

// ── the title plate on the shelf's top rail ──────────────────────────────────────────────

let titleTex: THREE.CanvasTexture | null = null
export function titleTexture(): THREE.CanvasTexture {
  if (titleTex) return titleTex
  // 2048×256: power-of-two (NPOT mipmaps shimmer), and 8:1 so the plate is exactly as
  // tall as the 0.55m rail it sits on
  const W = 2048
  const H = 256
  const { canvas, ctx } = mkCanvas(W, H)
  const draw = () => {
    ctx.clearRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.fillStyle = C.ttl
    ctx.font = `700 112px ${FONT_D}`
    ctx.fillText('Kitob javoni', W / 2, 122)
    ctx.fillStyle = C.dim
    ctx.font = `400 56px ${FONT_D}`
    ctx.fillText('Dasturlash bo‘yicha 20 ta mashhur kitob', W / 2, 206)
    ctx.textAlign = 'left'
  }
  draw()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  deferUpload(tex, canvas, 'contact')
  onFontsReady(draw, tex)
  titleTex = tex
  return tex
}

// ── the detail card shown when the spin stops ────────────────────────────────

const CARD_W = 1024
const CARD_H = 512
const cardCache = new Map<string, THREE.CanvasTexture>()

export function cardTexture(book: Book): THREE.CanvasTexture {
  const hit = cardCache.get(book.id)
  if (hit) return hit

  const { canvas, ctx } = mkCanvas(CARD_W, CARD_H)

  ctx.fillStyle = '#0d1016'
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.strokeStyle = '#1e2531'
  ctx.lineWidth = 3
  ctx.strokeRect(12, 12, CARD_W - 24, CARD_H - 24)

  const L = 56
  const R = CARD_W - 56
  const maxW = R - L

  // the congratulation line, then the book itself
  ctx.fillStyle = C.accent
  ctx.font = `700 24px ${FONT_M}`
  ctx.fillText('SIZGA SOVG‘AMIZ', L, 74)

  ctx.fillStyle = C.ttl
  const ts = fit(ctx, book.title, 52, maxW, (v) => `800 ${v}px ${FONT_D}`, 26)
  ctx.font = `800 ${ts}px ${FONT_D}`
  const tlines = wrap(ctx, book.title, maxW).slice(0, 2)
  tlines.forEach((l, i) => ctx.fillText(l, L, 132 + i * (ts * 1.12)))
  const afterTitle = 132 + (tlines.length - 1) * ts * 1.12

  ctx.fillStyle = C.dim
  ctx.font = `400 25px ${FONT_D}`
  ctx.fillText(`${book.author} · ${book.year}`, L, afterTitle + 42)

  ctx.strokeStyle = '#1e2531'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(L, afterTitle + 66)
  ctx.lineTo(R, afterTitle + 66)
  ctx.stroke()

  // what the book gives the reader
  ctx.fillStyle = '#b8c0cd'
  ctx.font = `400 25px ${FONT_D}`
  const nlines = wrap(ctx, book.note, maxW).slice(0, 4)
  nlines.forEach((l, i) => ctx.fillText(l, L, afterTitle + 108 + i * 34))

  // the two buttons, and an honest label on the first one
  const by = CARD_H - 96
  const bw = 400
  const bh = 62

  ctx.fillStyle = book.free ? '#12303a' : '#1a1f2a'
  roundRect(ctx, L, by, bw, bh, 12)
  ctx.fill()
  ctx.strokeStyle = book.free ? C.free : '#2b3342'
  ctx.lineWidth = 2
  roundRect(ctx, L, by, bw, bh, 12)
  ctx.stroke()
  ctx.fillStyle = book.free ? C.free : C.ttl
  ctx.font = `700 26px ${FONT_D}`
  ctx.textAlign = 'center'
  ctx.fillText(book.free ? 'Bepul o‘qish →' : 'Kitob haqida →', L + bw / 2, by + bh / 2 + 9)

  ctx.fillStyle = '#151a23'
  roundRect(ctx, L + bw + 24, by, bw - 60, bh, 12)
  ctx.fill()
  ctx.strokeStyle = '#2b3342'
  roundRect(ctx, L + bw + 24, by, bw - 60, bh, 12)
  ctx.stroke()
  ctx.fillStyle = C.dim
  ctx.font = `600 24px ${FONT_D}`
  ctx.fillText('Boshqa sovg‘a', L + bw + 24 + (bw - 60) / 2, by + bh / 2 + 8)
  ctx.textAlign = 'left'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  cardCache.set(book.id, tex)
  return tex
}

/** The card's two hit boxes, in 0..1 of the card. */
export const CARD_BTN = {
  open: { x: 56 / CARD_W, y: (CARD_H - 96) / CARD_H, w: 400 / CARD_W, h: 62 / CARD_H },
  again: { x: (56 + 424) / CARD_W, y: (CARD_H - 96) / CARD_H, w: 340 / CARD_W, h: 62 / CARD_H },
}
