import * as THREE from 'three'
import { loadImg } from './ghpaint'
import { defer, deferUpload, memoOnce, registerTexture } from './assets'
import { ANISO, flatTexture, mkCanvas } from '@/lib/tier'

/**
 * Wall of official technology logos, painted into one CanvasTexture.
 *
 * The marks are the real ones — fetched from devicon (coloured, made for exactly this)
 * and simple-icons for the few devicon has no entry for. Nothing here is hand-drawn.
 * Both hosts answer with `Access-Control-Allow-Origin: *`, which matters: an SVG that
 * cannot be CORS-fetched cannot be drawn to a canvas at all.
 *
 * Loading is progressive — the grid paints immediately with name plates, and each logo
 * replaces its plate as it arrives. A logo that never loads keeps the plate, so the wall
 * is never half-empty.
 */

const DEV = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'
/** simple-icons renders one flat colour; `/hex` picks it. */
const SI = (name: string, hex: string) => `https://cdn.simpleicons.org/${name}/${hex}`

export interface Logo {
  /** Shown on the plate before the mark loads, and as the caption under it. */
  name: string
  url: string
}

/**
 * Order matters — it reads left to right, roughly: languages, then runtimes and
 * frameworks, then data, then infrastructure and tools, then platforms and hardware.
 */
export const LOGOS: Logo[] = [
  // tillar
  { name: 'C', url: `${DEV}/c/c-original.svg` },
  { name: 'C++', url: `${DEV}/cplusplus/cplusplus-original.svg` },
  { name: 'C#', url: `${DEV}/csharp/csharp-original.svg` },
  { name: 'Python', url: `${DEV}/python/python-original.svg` },
  { name: 'JavaScript', url: `${DEV}/javascript/javascript-original.svg` },
  { name: 'TypeScript', url: `${DEV}/typescript/typescript-original.svg` },
  { name: 'Rust', url: `${DEV}/rust/rust-original.svg` },
  { name: 'Ruby', url: `${DEV}/ruby/ruby-original.svg` },
  { name: 'Go', url: `${DEV}/go/go-original-wordmark.svg` },
  { name: 'Java', url: `${DEV}/java/java-original.svg` },
  { name: 'Kotlin', url: `${DEV}/kotlin/kotlin-original.svg` },
  { name: 'Swift', url: `${DEV}/swift/swift-original.svg` },
  { name: 'PHP', url: `${DEV}/php/php-original.svg` },
  { name: 'Bash', url: `${DEV}/bash/bash-original.svg` },
  { name: 'HTML5', url: `${DEV}/html5/html5-original.svg` },
  { name: 'CSS3', url: `${DEV}/css3/css3-original.svg` },

  // runtime va framework
  { name: 'Node.js', url: `${DEV}/nodejs/nodejs-original.svg` },
  { name: 'React', url: `${DEV}/react/react-original.svg` },
  { name: 'React Native', url: SI('react', '61DAFB') },
  { name: 'Vite', url: `${DEV}/vitejs/vitejs-original.svg` },
  { name: 'Express', url: `${DEV}/express/express-original.svg` },
  { name: 'Electron', url: `${DEV}/electron/electron-original.svg` },
  { name: 'Three.js', url: `${DEV}/threejs/threejs-original.svg` },
  { name: 'Tailwind', url: `${DEV}/tailwindcss/tailwindcss-original.svg` },
  { name: 'Flutter', url: `${DEV}/flutter/flutter-original.svg` },
  { name: 'Laravel', url: `${DEV}/laravel/laravel-original.svg` },
  { name: 'FastAPI', url: `${DEV}/fastapi/fastapi-original.svg` },
  { name: 'Django', url: `${DEV}/django/django-plain.svg` },

  // AI
  { name: 'Hugging Face', url: SI('huggingface', 'FFD21E') },
  { name: 'LangChain', url: SI('langchain', '1C3C3C') },
  { name: 'TensorFlow', url: `${DEV}/tensorflow/tensorflow-original.svg` },
  { name: 'Pandas', url: `${DEV}/pandas/pandas-original.svg` },
  { name: 'OpenCV', url: `${DEV}/opencv/opencv-original.svg` },
  { name: 'Jupyter', url: `${DEV}/jupyter/jupyter-original.svg` },

  // ma'lumot
  { name: 'PostgreSQL', url: `${DEV}/postgresql/postgresql-original.svg` },
  { name: 'MySQL', url: `${DEV}/mysql/mysql-original.svg` },
  { name: 'MongoDB', url: `${DEV}/mongodb/mongodb-original.svg` },
  { name: 'Redis', url: `${DEV}/redis/redis-original.svg` },
  { name: 'SQLite', url: `${DEV}/sqlite/sqlite-original.svg` },
  { name: 'Firebase', url: `${DEV}/firebase/firebase-plain.svg` },
  { name: 'Supabase', url: `${DEV}/supabase/supabase-original.svg` },

  // infratuzilma
  { name: 'Docker', url: `${DEV}/docker/docker-original.svg` },
  { name: 'Nginx', url: `${DEV}/nginx/nginx-original.svg` },
  { name: 'Kubernetes', url: `${DEV}/kubernetes/kubernetes-original.svg` },
  { name: 'Linux', url: `${DEV}/linux/linux-original.svg` },
  { name: 'Ubuntu', url: `${DEV}/ubuntu/ubuntu-original.svg` },
  { name: 'SSH', url: `${DEV}/ssh/ssh-original.svg` },
  { name: 'Cloudflare', url: `${DEV}/cloudflare/cloudflare-original.svg` },
  { name: 'Vercel', url: `${DEV}/vercel/vercel-original.svg` },
  { name: 'Git', url: `${DEV}/git/git-original.svg` },
  { name: 'GitHub', url: `${DEV}/github/github-original.svg` },

  // vositalar
  { name: 'VS Code', url: `${DEV}/vscode/vscode-original.svg` },
  { name: 'Postman', url: `${DEV}/postman/postman-original.svg` },
  { name: 'Figma', url: `${DEV}/figma/figma-original.svg` },
  { name: 'npm', url: `${DEV}/npm/npm-original-wordmark.svg` },
  { name: 'Swagger', url: SI('swagger', '85EA2D') },

  // platforma va qurilma
  { name: 'Apple', url: `${DEV}/apple/apple-original.svg` },
  { name: 'Android', url: `${DEV}/android/android-original.svg` },
  { name: 'Windows', url: `${DEV}/windows8/windows8-original.svg` },
  { name: 'Telegram', url: SI('telegram', '26A5E4') },
  { name: 'MQTT', url: SI('mqtt', '660066') },
  { name: 'Arduino', url: `${DEV}/arduino/arduino-original.svg` },
  { name: 'Raspberry Pi', url: `${DEV}/raspberrypi/raspberrypi-original.svg` },
  { name: 'Socket.io', url: `${DEV}/socketio/socketio-original.svg` },
]

/** 16 columns, as asked — the row count follows from how many logos there are. */
export const COLS = 16
export const ROWS = Math.ceil(LOGOS.length / COLS)

const CELL = 128
const PAD = 18

export interface LogoWall {
  texture: THREE.CanvasTexture
  /** Canvas aspect, so the mesh can be scaled without distorting the grid. */
  aspect: number
}

/**
 * Paint the grid and start filling it. Returns immediately; the texture updates itself
 * as marks arrive, so nothing blocks the first frame.
 */
export function buildLogoWall(): LogoWall {
  const w = COLS * CELL
  const h = ROWS * CELL
  const { canvas, ctx } = mkCanvas(w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO
  flatTexture(tex, THREE.LinearFilter)
  deferUpload(tex, canvas, 'skills')

  const cellRect = (i: number) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    return { x: col * CELL, y: row * CELL }
  }

  // Opaque ground, not a transparent one: the cells have gaps between them, and anything
  // sitting between this panel and the wall would show through them.
  ctx.fillStyle = '#0b0d12'
  ctx.fillRect(0, 0, w, h)
  LOGOS.forEach((logo, i) => {
    const { x, y } = cellRect(i)
    ctx.fillStyle = 'rgba(255,255,255,.035)'
    ctx.beginPath()
    ctx.roundRect(x + 6, y + 6, CELL - 12, CELL - 12, 12)
    ctx.fill()
    // placeholder: the name, until its mark arrives
    ctx.fillStyle = 'rgba(232,230,224,.34)'
    ctx.textAlign = 'center'
    let fs = 17
    ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`
    while (fs > 10 && ctx.measureText(logo.name).width > CELL - 26) {
      fs -= 1
      ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`
    }
    ctx.fillText(logo.name, x + CELL / 2, y + CELL / 2 + fs / 3)
    ctx.textAlign = 'left'
  })
  tex.needsUpdate = true

  // fill in the real marks, a few at a time so the network is not hit with 60 at once
  // lazyAssets: the 62 remote marks are fetched in idle slices after the gate (skills room first when near)
  defer('skills', async () => {
    const BATCH = 6
    for (let start = 0; start < LOGOS.length; start += BATCH) {
      const slice = LOGOS.slice(start, start + BATCH)
      const bitmaps = await Promise.all(slice.map((l) => loadImg(l.url).catch(() => null)))
      bitmaps.forEach((bmp, k) => {
        if (!bmp) return // host refused — the name plate stays
        const i = start + k
        const { x, y } = cellRect(i)
        // repaint the cell over its placeholder
        ctx.fillStyle = '#0b0d12'
        ctx.fillRect(x, y, CELL, CELL)
        ctx.fillStyle = 'rgba(255,255,255,.045)'
        ctx.beginPath()
        ctx.roundRect(x + 6, y + 6, CELL - 12, CELL - 12, 12)
        ctx.fill()
        // contain the mark inside the cell, keeping its own proportions
        const box = CELL - PAD * 2
        const scale = Math.min(box / bmp.width, box / bmp.height)
        const dw = bmp.width * scale
        const dh = bmp.height * scale
        ctx.drawImage(bmp, x + (CELL - dw) / 2, y + (CELL - dh) / 2 - 6, dw, dh)
        // caption
        ctx.fillStyle = 'rgba(232,230,224,.55)'
        ctx.textAlign = 'center'
        ctx.font = `500 13px "IBM Plex Sans", system-ui, sans-serif`
        const label = LOGOS[i].name
        ctx.fillText(label.length > 13 ? label.slice(0, 12) + '…' : label, x + CELL / 2, y + CELL - 14)
        ctx.textAlign = 'left'
      })
      tex.needsUpdate = true
      registerTexture(tex)
    }
  })

  return { texture: tex, aspect: w / h }
}

/**
 * One official mark on a plate, for the badges flanking the Stack screen.
 *
 * Same sources as the wall, same reason: these were hand-drawn letter badges before, and
 * a real mark says more than "TS" in a coloured square. Draws the name underneath so the
 * plate still reads while the logo is in flight — or if its host ever stops answering.
 */
export function logoBadgeTexture(logo: Logo, onReady?: () => void): THREE.CanvasTexture {
  return memoOnce('badge:' + logo.name, () => buildBadge(logo, onReady))
}

function buildBadge(logo: Logo, onReady?: () => void): THREE.CanvasTexture {
  const S = 256
  const { canvas, ctx } = mkCanvas(S, S)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = ANISO

  const ground = () => {
    ctx.clearRect(0, 0, S, S)
    ctx.fillStyle = 'rgba(12,13,17,.92)'
    ctx.beginPath()
    ctx.roundRect(4, 4, S - 8, S - 8, 26)
    ctx.fill()
    ctx.strokeStyle = 'rgba(232,230,224,.16)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  const caption = () => {
    ctx.fillStyle = 'rgba(232,230,224,.62)'
    ctx.textAlign = 'center'
    let fs = 26
    ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`
    while (fs > 14 && ctx.measureText(logo.name).width > S - 40) {
      fs -= 2
      ctx.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`
    }
    ctx.fillText(logo.name, S / 2, S - 26)
    ctx.textAlign = 'left'
  }

  ground()
  caption()
  tex.needsUpdate = true

  defer('skills', () => loadImg(logo.url).then((bmp) => {
    if (!bmp) return // host refused — the name stays
    ground()
    const box = S - 96
    const scale = Math.min(box / bmp.width, box / bmp.height)
    const dw = bmp.width * scale
    const dh = bmp.height * scale
    ctx.drawImage(bmp, (S - dw) / 2, (S - dh) / 2 - 16, dw, dh)
    caption()
    tex.needsUpdate = true
    onReady?.()
  }))

  return tex
}

/** The eight marks beside the Stack screen — the languages the Stack text names. */
export const STACK_BADGES: Logo[] = [
  { name: 'C', url: `${DEV}/c/c-original.svg` },
  { name: 'C++', url: `${DEV}/cplusplus/cplusplus-original.svg` },
  { name: 'C#', url: `${DEV}/csharp/csharp-original.svg` },
  { name: 'TypeScript', url: `${DEV}/typescript/typescript-original.svg` },
  { name: 'Python', url: `${DEV}/python/python-original.svg` },
  { name: 'Swift', url: `${DEV}/swift/swift-original.svg` },
  { name: 'PHP', url: `${DEV}/php/php-original.svg` },
  { name: 'React Native', url: SI('react', '61DAFB') },
]
