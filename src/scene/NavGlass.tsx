import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { isNear, rooms } from '@/data/rooms'
import type { RoomId } from '@/data/types'
import { pick, tr } from '@/lib/i18n'
import { useLang } from '@/lib/useT'
import { useStore } from '@/state/store'
import { onCounts, readCounts, trackRoom, trackVisit, type Counts } from '@/lib/counter'
import { RoomPreview } from './RoomPreview'
import { ANISO, mkCanvas } from '@/lib/tier'

const W = 2048
const H = 1024
const COLS = 4
const ROWS = 2
const PAD = 34
const TOP = 150 // headline band
const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

const CARD_W = (W - PAD * (COLS + 1)) / COLS
const CARD_H = (H - TOP - PAD * (ROWS + 1)) / ROWS

const cardRect = (i: number) => ({
  x: PAD + (i % COLS) * (CARD_W + PAD),
  y: TOP + PAD + Math.floor(i / COLS) * (CARD_H + PAD),
  w: CARD_W,
  h: CARD_H,
})

const BW = 1024 // banner canvas — POT, 8:1
const BH = 128

/**
 * Total visits, set on the bare glass above the board so it reads as the headline of the
 * whole panel rather than a line inside it.
 */
function VisitBanner({ total, lang, width, y }: { total: number | null; lang: string; width: number; y: number }) {
  const { tex, ctx } = useMemo(() => {
    const { canvas, ctx } = mkCanvas(BW, BH)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    return { tex, ctx }
  }, [])

  useEffect(() => {
    ctx.clearRect(0, 0, BW, BH)
    if (total == null) { tex.needsUpdate = true; return }
    const num = total.toLocaleString()
    const word = tr('navVisits', lang as Parameters<typeof tr>[1])
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    // the number carries the panel; the word rides under it, small and quiet
    ctx.fillStyle = '#F2B441'
    let ns = 84
    ctx.font = `800 ${ns}px ${FONT_D}`
    while (ns > 40 && ctx.measureText(num).width > BW - 420) {
      ns -= 4
      ctx.font = `800 ${ns}px ${FONT_D}`
    }
    ctx.fillText(num, BW / 2 - 90, 92)
    const numW = ctx.measureText(num).width
    ctx.fillStyle = '#cfc9bb'
    ctx.font = `400 34px ${FONT_M}`
    ctx.textAlign = 'left'
    ctx.fillText(word, BW / 2 - 90 + numW / 2 + 24, 92)
    tex.needsUpdate = true
  }, [ctx, tex, total, lang])

  useEffect(() => () => tex.dispose(), [tex])

  return (
    <mesh position={[0, y, 0.002]} raycast={() => null}>
      <planeGeometry args={[width, width / 8]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * Soft rectangular glow, drawn once and reused.
 *
 * Hover used to be painted into the board itself, which meant repainting 2048x1024 and
 * re-uploading 8MB every time the crosshair crossed a card — and the crosshair samples
 * ten times a second while you walk. Moving hover onto its own mesh makes it a matrix
 * change instead: no canvas work, no upload.
 */
const glowTexture = (() => {
  const { canvas: c, ctx } = mkCanvas(256, 256)
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 30
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(30, 30, 196, 196, 20)
  ctx.fill()
  ctx.fill()
  ctx.fill() // three passes: the halo has to read through 22%-opacity glass
  // punch the middle back out — we want a halo around the card, not a lit panel over it
  ctx.shadowBlur = 0
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.roundRect(34, 34, 188, 188, 18)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  return tex
})()

/** Places the glow over whichever target is hovered, in board-canvas coordinates. */
function HoverGlow({ rect, color, width, height }: {
  rect: { x: number; y: number; w: number; h: number } | null
  color: string
  width: number
  height: number
}) {
  if (!rect) return null
  const pad = 14
  const w = ((rect.w + pad * 2) / W) * width
  const h = ((rect.h + pad * 2) / H) * height
  const cx = ((rect.x + rect.w / 2) / W - 0.5) * width
  const cy = (0.5 - (rect.y + rect.h / 2) / H) * height
  return (
    <mesh position={[cx, cy, 0.006]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        map={glowTexture}
        color={color}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Quick-travel board printed on the corner glass: one card per room, click to jump.
 * Canvas texture on a plain mesh (depth-tested like everything else); picking is UV
 * based so it also works from the first-person crosshair.
 */
export function NavGlass({ position = [0, 0, 0], rotationY = 0, width = 3.8, height = 1.9, }: { position?: [number, number, number]; rotationY?: number; width?: number; height?: number }) {
  const lang = useLang()
  const teleport = useStore((s) => s.teleport)
  const current = useStore((s) => s.roomId)
  const [hover, setHover] = useState<number | null>(null)
  // visit counters live in a hosted counter (see lib/counter.ts) — Pages cannot keep a number
  const [counts, setCounts] = useState<Counts>({})
  useEffect(() => {
    const off = onCounts(setCounts)
    trackVisit()
    readCounts(rooms.map((r) => `room-${r.id}`))
    return off
  }, [])
  useEffect(() => { trackRoom(current) }, [current])

  const glowT = useRef(0)

  const { tex, ctx } = useMemo(() => {
    const { canvas, ctx } = mkCanvas(W, H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    return { tex, ctx }
  }, [])

  const paint = useCallback(() => {
    ctx.clearRect(0, 0, W, H)
    // headline band
    ctx.fillStyle = 'rgba(11,14,20,0.72)'
    ctx.beginPath()
    ctx.roundRect(PAD, 26, W - PAD * 2, TOP - 36, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(242,180,65,0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#F2B441'
    ctx.font = `500 26px ${FONT_M}`
    ctx.fillText('⌁ ' + tr('navEyebrow', lang), PAD + 28, 66)
    ctx.fillStyle = '#E8E6E0'
    let hs = 46
    ctx.font = `800 ${hs}px ${FONT_D}`
    while (hs > 26 && ctx.measureText(tr('navHint', lang)).width > W - PAD * 2 - 56) {
      hs -= 2
      ctx.font = `800 ${hs}px ${FONT_D}`
    }
    ctx.fillText(tr('navHint', lang), PAD + 28, 120)

    rooms.forEach((room, i) => {
      const r = cardRect(i)
      const isCurrent = room.id === current
      ctx.fillStyle = 'rgba(11,14,20,0.78)'
      ctx.beginPath()
      ctx.roundRect(r.x, r.y, r.w, r.h, 14)
      ctx.fill()
      ctx.strokeStyle = isCurrent ? 'rgba(93,228,255,0.85)' : 'rgba(120,130,145,0.45)'
      ctx.lineWidth = isCurrent ? 3 : 2
      ctx.beginPath()
      ctx.roundRect(r.x, r.y, r.w, r.h, 14)
      ctx.stroke()

      // well for the animated thumbnail plane that sits just in front of the board
      const pw = r.w - 28
      const ph = r.h * 0.46
      ctx.fillStyle = '#0d1016'
      ctx.beginPath()
      ctx.roundRect(r.x + 14, r.y + 14, pw, ph, 10)
      ctx.fill()

      // number line, then the name on a full-width line of its own
      ctx.fillStyle = room.accent
      ctx.font = `700 24px ${FONT_M}`
      ctx.fillText(String(i + 1).padStart(2, '0'), r.x + 18, r.y + ph + 50)

      ctx.fillStyle = '#E8E6E0'
      const maxW = r.w - 36
      let name = pick(room.title, lang)
      let size = 30
      ctx.font = `700 ${size}px ${FONT_D}`
      while (size > 15 && ctx.measureText(name).width > maxW) {
        size -= 1
        ctx.font = `700 ${size}px ${FONT_D}`
      }
      while (name.length > 4 && ctx.measureText(name + '…').width > maxW) name = name.slice(0, -1)
      if (name !== pick(room.title, lang)) name += '…'
      ctx.fillText(name, r.x + 18, r.y + ph + 88)
      ctx.fillStyle = '#8b949e'
      ctx.font = `20px ${FONT_M}`
      const hits = counts[`room-${room.id}`]
      const floor = room.level === 1 ? tr('floor2', lang) : tr('floor1', lang)
      ctx.fillText(hits == null ? floor : `${floor}  ·  ${hits.toLocaleString()} ${tr('navVisits', lang)}`, r.x + 18, r.y + r.h - 18)
      if (isCurrent) {
        ctx.fillStyle = '#5DE4FF'
        ctx.font = `20px ${FONT_M}`
        ctx.textAlign = 'right'
        ctx.fillText(tr('navHere', lang), r.x + r.w - 18, r.y + r.h - 18)
        ctx.textAlign = 'left'
      }
    })
    tex.needsUpdate = true
  }, [ctx, tex, lang, current, counts])

  // repaint on hover/lang/room changes, plus once more when the webfonts land
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { document.fonts?.ready.then(() => setFontsReady(true)) }, [])
  useEffect(() => { paint() }, [paint, fontsReady])

  /** Index into `rooms`, or null. */
  const pickUv = useCallback((uv: THREE.Vector2): number | null => {
    const x = uv.x * W
    const y = (1 - uv.y) * H
    for (let i = 0; i < rooms.length; i++) {
      const r = cardRect(i)
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i
    }
    return null
  }, [])

  const go = useCallback((i: number | null) => {
    if (i == null) return
    teleport(rooms[i].id as RoomId)
    glowT.current = 1
  }, [teleport])

  // crosshair support
  const meshRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const m = meshRef.current
    if (!m) return
    m.userData.onUvHit = (uv: THREE.Vector2) => go(pickUv(uv))
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => {
      const hit = uv ? pickUv(uv) : null
      setHover((prev) => (prev === hit ? prev : hit))
    }
    return () => {
      if (!m) return
      delete m.userData.onUvHit
      delete m.userData.onUvHover
    }
  }, [go, pickUv])

  const mat = useRef<THREE.MeshStandardMaterial>(null)
  // the board lives in the entrance hall — animating it from across the museum would
  // redraw eight canvases for nobody to see. The low tier drops it entirely, the same
  // way WallFxDriver zeroes the animated walls.
  const quality = useStore((s) => s.quality)
  const nearby = isNear(current, 'entrance') && quality !== 'low'
  useFrame((_, dt) => {
    if (glowT.current > 0) {
      glowT.current = Math.max(0, glowT.current - dt * 1.8)
      if (mat.current) mat.current.emissiveIntensity = 0.75 + glowT.current * 1.2
    }
  })

  const hit = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.uv ? pickUv(e.uv) : null)

  return (
    <group name="nav-board" position={position} rotation={[0, rotationY, 0]}>
      <mesh
        ref={meshRef}
        name="nav-glass"
        onClick={(e) => { e.stopPropagation(); go(hit(e)) }}
        onPointerMove={(e) => {
          const h = hit(e)
          if (h !== hover) setHover(h)
          document.body.style.cursor = h != null ? 'pointer' : 'auto'
        }}
        onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto' }}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial ref={mat} map={tex} transparent emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.75} roughness={0.7} depthWrite={false} />
      </mesh>
      <HoverGlow
        rect={hover != null ? cardRect(hover) : null}
        color={hover != null ? rooms[hover].accent : '#ffffff'}
        width={width}
        height={height}
      />
      <VisitBanner total={counts['visits'] ?? null} lang={lang} width={width * 0.82} y={height / 2 + 0.30} />
      {rooms.map((room, i) => {
        const r = cardRect(i)
        const pw = r.w - 28
        const ph = r.h * 0.46
        const cx = r.x + 14 + pw / 2
        const cy = r.y + 14 + ph / 2
        return (
          <RoomPreview
            key={room.id}
            fx={room.fx}
            accent={room.accent}
            seed={i + 1}
            slot={i}
            active={nearby}
            position={[(cx / W - 0.5) * width, (0.5 - cy / H) * height, 0.004]}
            size={[(pw / W) * width, (ph / H) * height]}
          />
        )
      })}
    </group>
  )
}
