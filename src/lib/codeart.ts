import * as THREE from 'three'
import { ANISO, mkCanvas } from '@/lib/tier'

/**
 * Famous code as museum pieces.
 *
 * Each plate is a CanvasTexture: the snippet in a monospace face with light syntax
 * colouring, a title above it and a caption below saying why it matters. Painted rather
 * than fetched — every image host worth linking either blocks CORS or disappears, and a
 * repainted canvas also stays sharp at any wall size.
 */

const W = 1024
const H = 512
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'
const FONT_D = '"Sora", system-ui, sans-serif'

/** GitHub-dark-ish palette so the plates read as code, not as decoration. */
const C = {
  bg: '#0d1117',
  frame: '#1c222b',
  key: '#ff7b72',   // keywords
  fn: '#d2a8ff',    // function names
  str: '#a5d6ff',   // strings
  num: '#79c0ff',   // numbers
  com: '#8b949e',   // comments
  txt: '#c9d1d9',   // plain code
  ttl: '#e6edf3',
  cap: '#7d8590',
  accent: '#F2B441',
}

export interface CodePlate {
  id: string
  title: string
  /** Lines with a colour role each. */
  code: [string, keyof typeof C][]
  caption: string
  year: string
}

/** The pieces, chosen for being recognisable rather than clever. */
export const PLATES: CodePlate[] = [
  {
    id: 'hello',
    title: 'Hello, World',
    year: '1978',
    code: [
      ['#include <stdio.h>', 'com'],
      ['', 'txt'],
      ['main()', 'fn'],
      ['{', 'txt'],
      ['    printf("hello, world\\n");', 'str'],
      ['}', 'txt'],
    ],
    caption: 'Kernighan va Ritchie kitobidan. Deyarli har bir dasturchi shu ikki so‘zdan boshlagan.',
  },
  {
    id: 'quake',
    title: 'Fast Inverse Square Root',
    year: '1999',
    code: [
      ['i  = *(long*)&y;', 'txt'],
      ['i  = 0x5f3759df - (i >> 1);', 'num'],
      ['y  = *(float*)&i;', 'txt'],
      ['', 'txt'],
      ['// what the fuck?', 'com'],
    ],
    caption: 'Quake III Arena kodidan. Bu sehrli son 1/√x ni uch barobar tez hisoblaydi — izohni muallif ham qo‘shgan.',
  },
  {
    id: 'linux',
    title: 'Linus Torvalds — comp.os.minix',
    year: '1991',
    code: [
      ['Hello everybody out there using minix -', 'txt'],
      ['', 'txt'],
      ['I\'m doing a (free) operating system', 'str'],
      ['(just a hobby, won\'t be big and', 'com'],
      ['professional like gnu) ...', 'com'],
    ],
    caption: 'Linux shu xabardan boshlangan. “Katta bo‘lmaydi” degan tizim bugun deyarli hamma serverda ishlaydi.',
  },
  {
    id: 'git',
    title: 'git — birinchi commit',
    year: '2005',
    code: [
      ['commit e83c516331', 'num'],
      ['Author: Linus Torvalds', 'txt'],
      ['', 'txt'],
      ['    Initial revision of "git",', 'str'],
      ['    the information manager from hell', 'str'],
    ],
    caption: 'Git ikki hafta ichida yozilgan. Muallif uni o‘zi shunday ta’riflagan.',
  },
  {
    id: 'naming',
    title: 'Ikki qiyin masala',
    year: '~1996',
    code: [
      ['// There are only two hard things', 'com'],
      ['// in Computer Science:', 'com'],
      ['//', 'com'],
      ['//   1. cache invalidation', 'key'],
      ['//   2. naming things', 'key'],
    ],
    caption: 'Phil Karlton. Har bir dasturchi buni kech bo‘lsa ham tan oladi.',
  },
  {
    id: 'bugs',
    title: '99 little bugs',
    year: 'xalq og‘zaki ijodi',
    code: [
      ['99 little bugs in the code,', 'txt'],
      ['99 little bugs.', 'txt'],
      ['Take one down, patch it around —', 'str'],
      ['127 little bugs in the code.', 'num'],
    ],
    caption: 'Dasturchilar qo‘shig‘i. Nega 127? Chunki bitta baytga shuncha sig‘adi.',
  },
]

const cache = new Map<string, THREE.CanvasTexture>()

export function codePlateTexture(p: CodePlate): THREE.CanvasTexture {
  const hit = cache.get(p.id)
  if (hit) return hit

  const { canvas, ctx } = mkCanvas(W, H)

  // plate ground and a thin inner frame, like a mounted print
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = C.frame
  ctx.lineWidth = 3
  ctx.strokeRect(14, 14, W - 28, H - 28)

  // title
  ctx.fillStyle = C.ttl
  ctx.font = `700 38px ${FONT_D}`
  ctx.fillText(p.title, 52, 84)

  // year, right-aligned on the title line
  ctx.fillStyle = C.accent
  ctx.font = `500 24px ${FONT_M}`
  ctx.textAlign = 'right'
  ctx.fillText(p.year, W - 52, 84)
  ctx.textAlign = 'left'

  // hairline under the title
  ctx.strokeStyle = C.frame
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(52, 108)
  ctx.lineTo(W - 52, 108)
  ctx.stroke()

  // the snippet
  let size = 30
  ctx.font = `400 ${size}px ${FONT_M}`
  const longest = p.code.reduce((a, [t]) => Math.max(a, ctx.measureText(t).width), 0)
  while (size > 16 && longest * (size / 30) > W - 130) size -= 2
  ctx.font = `400 ${size}px ${FONT_M}`
  const lh = size * 1.55
  const top = 172
  p.code.forEach(([text, role], i) => {
    ctx.fillStyle = C[role]
    ctx.fillText(text, 56, top + i * lh)
  })

  // caption at the foot
  ctx.fillStyle = C.cap
  ctx.font = `400 21px ${FONT_D}`
  const words = p.caption.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > W - 110) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 52, H - 78 + i * 30))

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  cache.set(p.id, tex)
  return tex
}
