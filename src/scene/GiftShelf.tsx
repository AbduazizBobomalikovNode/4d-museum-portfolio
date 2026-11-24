import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { BOOKS, BOOK_CELLS, SHELF_COLS, SHELF_ROWS, coverUrl, type Book } from '@/lib/books'
import { CARD_BTN, buttonTexture, cardTexture, titleTexture } from '@/lib/bookart'
import { UNIT_BOX, UNIT_PLANE } from '@/lib/geo'

/**
 * The gift shelf in the Gift Shop: a full-wall bookcase, 8 columns × 8 rows of
 * compartments, twenty famous programming books standing face-out among decorative
 * spines, a button that spins a selector across the twenty featured slots, and the book
 * it lands on presented in 3D with a link.
 *
 * The spin highlight is its own small mesh moved by matrix, never a canvas repaint —
 * repainting a big canvas every frame is exactly what made the nav glass stutter. Covers
 * are real textures (useTexture, cached, `<Preload all />`-visible) so they stay crisp
 * up close, unlike the old flat board.
 */

// ── layout: the whole south wall, in local units (group is centred on the case) ─────────
const WIDTH = 13.4
const BOTTOM_Y = 0.1
const TOP_Y = 4.95
const HEIGHT = TOP_Y - BOTTOM_Y // 4.85
const DEPTH = 0.42
const PLINTH_H = 0.95
const RAIL_H = 0.55
const GRID_H = HEIGHT - PLINTH_H - RAIL_H // 3.35
const COL_W = WIDTH / SHELF_COLS // 1.675
const ROW_H = GRID_H / SHELF_ROWS // ~0.419
const GRID_LEFT = -WIDTH / 2
const GRID_TOP = HEIGHT / 2 - RAIL_H // 1.875
const GRID_BOTTOM = GRID_TOP - GRID_H // -1.475, matches -HEIGHT/2+PLINTH_H
const RAIL_Y = (GRID_TOP + HEIGHT / 2) / 2
const PLINTH_Y = (GRID_BOTTOM + -HEIGHT / 2) / 2
/** Left half of a featured cell holds the cover; the right half takes spines. */
const COVER_W = COL_W * 0.5
/** Front face of the case body — the highlight/covers sit just proud of this. */
const FRONT_Z = DEPTH / 2

/** Centre (x, y) of grid cell `n` (0..63), row 0 at the top. */
function cellCenter(n: number): [number, number] {
  const col = n % SHELF_COLS
  const row = Math.floor(n / SHELF_COLS)
  const x = GRID_LEFT + col * COL_W + COL_W / 2
  const y = GRID_TOP - row * ROW_H - ROW_H / 2
  return [x, y]
}

// ── static carcass: back panel, stiles, rail, plinth, brass trims, shelves, dividers ────
interface Box { pos: [number, number, number]; size: [number, number, number]; brass?: boolean }

const CARCASS: Box[] = (() => {
  const parts: Box[] = []
  // opaque back panel — keeps the wall (and whatever decor sits on it) fully hidden
  parts.push({ pos: [0, 0, -FRONT_Z + 0.025], size: [WIDTH + 0.1, HEIGHT + 0.1, 0.05] })
  // left/right stiles
  parts.push({ pos: [-WIDTH / 2 - 0.03, 0, 0], size: [0.06, HEIGHT + 0.06, DEPTH] })
  parts.push({ pos: [WIDTH / 2 + 0.03, 0, 0], size: [0.06, HEIGHT + 0.06, DEPTH] })
  // top rail + bottom plinth bodies
  parts.push({ pos: [0, RAIL_Y, 0], size: [WIDTH, RAIL_H, DEPTH - 0.04] })
  parts.push({ pos: [0, PLINTH_Y, 0], size: [WIDTH, PLINTH_H, DEPTH] })
  // brass trim lines separating rail/plinth from the grid
  parts.push({ pos: [0, GRID_TOP + 0.02, FRONT_Z - 0.02], size: [WIDTH - 0.14, 0.03, 0.015], brass: true })
  parts.push({ pos: [0, GRID_BOTTOM - 0.02, FRONT_Z - 0.02], size: [WIDTH - 0.14, 0.03, 0.015], brass: true })
  // interior horizontal shelves (row boundaries 1..7 — the outer two are the rail/plinth faces)
  for (let r = 1; r < SHELF_ROWS; r++) {
    const y = GRID_TOP - r * ROW_H
    parts.push({ pos: [0, y, -0.01], size: [WIDTH - 0.1, 0.04, DEPTH - 0.08] })
  }
  // interior vertical dividers (column boundaries 1..7)
  for (let c = 1; c < SHELF_COLS; c++) {
    const x = GRID_LEFT + c * COL_W
    parts.push({ pos: [x, (GRID_TOP + GRID_BOTTOM) / 2, -0.01], size: [0.035, GRID_H, DEPTH - 0.08] })
  }
  return parts
})()

// ── decorative spines: one InstancedMesh for the whole wall ──────────────────────────────
interface SpineInst { x: number; y: number; z: number; w: number; h: number; d: number; rotZ: number; color: string }

/** Muted cloth/paper tones — a real shelf is not one colour. */
const SPINE_COLORS = [
  '#7B2D2D', '#2D4A6B', '#2D6B4A', '#8A6A2D', '#5A2D6B',
  '#6B2D52', '#2D5A6B', '#5A6B2D', '#8A522D', '#2D6B60',
  '#522D6B', '#6B4A2D', '#3A3A3A', '#7A6A50',
]

/** Deterministic PRNG (mulberry32) so the shelf looks the same on every load. */
function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SPINES: SpineInst[] = (() => {
  const rnd = mulberry32(0xb00c5)
  const list: SpineInst[] = []
  const PAD = 0.05
  for (let n = 0; n < SHELF_COLS * SHELF_ROWS; n++) {
    const [cx] = cellCenter(n)
    const cellLeft = cx - COL_W / 2
    const cellRight = cx + COL_W / 2
    const row = Math.floor(n / SHELF_COLS)
    const top = GRID_TOP - row * ROW_H
    const bottom = top - ROW_H
    const featured = BOOK_CELLS.includes(n)
    const regionLeft = featured ? cellLeft + COVER_W + PAD * 2 : cellLeft + PAD
    const regionRight = cellRight - PAD
    let x = regionLeft
    if (regionRight - regionLeft < 0.12) continue
    while (x < regionRight - 0.01) {
      const remain = regionRight - x
      let w = 0.07 + rnd() * 0.09
      if (remain - w < 0.06) w = remain
      w = Math.min(w, remain)
      const h = (ROW_H - PAD * 2) * (0.7 + rnd() * 0.27)
      const d = 0.2 + rnd() * 0.06
      const lean = rnd() < 0.16 ? (rnd() < 0.5 ? -1 : 1) * (0.05 + rnd() * 0.12) : 0
      const color = SPINE_COLORS[Math.floor(rnd() * SPINE_COLORS.length)]
      list.push({
        x: x + w / 2,
        y: bottom + PAD + h / 2,
        z: -0.02 + rnd() * 0.04,
        w, h, d, rotZ: lean, color,
      })
      x += w
    }
  }
  return list
})()

function Spines() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const o = new THREE.Object3D()
    const color = new THREE.Color()
    SPINES.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z)
      o.rotation.set(0, 0, s.rotZ)
      o.scale.set(s.w, s.h, s.d)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      color.set(s.color)
      m.setColorAt(i, color)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPINES.length]} geometry={UNIT_BOX} dispose={null}>
      <meshStandardMaterial roughness={0.78} metalness={0.04} />
    </instancedMesh>
  )
}

// ── a single featured cover, its own texture, sized from the image's own aspect ─────────
BOOKS.forEach((b) => useTexture.preload(coverUrl(b)))

function BookFace({ book, cx, bottom }: { book: Book; cx: number; bottom: number }) {
  const tex = useTexture(coverUrl(book))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const img = tex.image as { width?: number; height?: number } | undefined
  const aspect = img?.width && img?.height ? img.width / img.height : 0.68
  const maxW = COVER_W - 0.06
  const maxH = ROW_H - 0.08
  let w = maxW
  let h = w / aspect
  if (h > maxH) { h = maxH; w = h * aspect }
  const x = cx - COL_W / 2 + 0.05 + maxW / 2
  const y = bottom + 0.04 + h / 2
  return (
    <mesh position={[x, y, FRONT_Z - 0.03]} geometry={UNIT_PLANE} scale={[w, h, 1]} dispose={null} name={`book-face-${book.id}`}>
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.42} roughness={0.68} />
    </mesh>
  )
}

function BookFaces() {
  return (
    <>
      {BOOKS.map((book, i) => {
        const [cx, cyc] = cellCenter(BOOK_CELLS[i])
        const bottom = cyc - ROW_H / 2
        return (
          <Suspense key={book.id} fallback={null}>
            <BookFace book={book} cx={cx} bottom={bottom} />
          </Suspense>
        )
      })}
    </>
  )
}

/** The reveal book's cover face — suspends on its own so the rest of the prize never waits. */
function CoverFaceMaterial({ book }: { book: Book }) {
  const tex = useTexture(coverUrl(book))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return <meshStandardMaterial attach="material-4" map={tex} roughness={0.62} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.34} />
}

const SPIN_MS = 3400
/** Two full laps before the selector settles, as asked. */
const LAPS = 2
/** How many past picks are remembered. Six blocked means no repeat inside seven presses. */
const MEMORY = 6

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

type Phase = 'idle' | 'spin' | 'reveal'

export function GiftShelf({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<Book | null>(null)
  const [hover, setHover] = useState<'spin' | 'open' | 'again' | null>(null)

  const recent = useRef<number[]>([])
  const spinStart = useRef(0)
  const targetIdx = useRef(0)

  const highlight = useRef<THREE.Mesh>(null)
  const gift = useRef<THREE.Group>(null)
  const book3d = useRef<THREE.Mesh>(null)
  const revealT = useRef(0)

  /** Pick an index that has not come up in the last six presses. */
  const nextIndex = useCallback(() => {
    const pool = BOOKS.map((_, i) => i).filter((i) => !recent.current.includes(i))
    const idx = pool[Math.floor(Math.random() * pool.length)]
    recent.current.push(idx)
    if (recent.current.length > MEMORY) recent.current.shift()
    return idx
  }, [])

  const startSpin = useCallback(() => {
    targetIdx.current = nextIndex()
    spinStart.current = performance.now()
    revealT.current = 0
    setPicked(null)
    setPhase('spin')
  }, [nextIndex])

  /** Book index → local position of its compartment on the shelf face.
   *  z sits just in front of the case (FRONT_Z + 0.03), clear of covers and spines. */
  const cellPos = useCallback((bookIndex: number): [number, number, number] => {
    const [x, y] = cellCenter(BOOK_CELLS[bookIndex])
    return [x, y, FRONT_Z + 0.03]
  }, [])

  useFrame(() => {
    const h = highlight.current
    if (phase === 'spin' && h) {
      const t = Math.min(1, (performance.now() - spinStart.current) / SPIN_MS)
      const p = easeOut(t)
      // travel LAPS full laps plus however far the target sits into the list, so the
      // last step of the easing lands exactly on it
      const steps = LAPS * BOOKS.length + targetIdx.current
      const at = Math.min(Math.floor(p * steps), steps) % BOOKS.length
      const [x, y, z] = cellPos(at)
      h.position.set(x, y, z)
      h.visible = true
      // a little pulse so the selector reads as moving even between cells
      const s = 1 + Math.sin(p * Math.PI * 12) * 0.05 * (1 - p)
      h.scale.set(COL_W * 0.92 * s, ROW_H * 0.92 * s, 1)
      if (t >= 1) {
        setPicked(BOOKS[targetIdx.current])
        setPhase('reveal')
      }
    } else if (h) {
      h.visible = phase === 'reveal'
      if (phase === 'reveal') {
        const [x, y, z] = cellPos(targetIdx.current)
        h.position.set(x, y, z)
        h.scale.set(COL_W * 0.92, ROW_H * 0.92, 1)
      }
    }

    // the gift grows out of the shelf and turns slowly, always at a comfortable eye
    // height in front of the wall — never at the picked cell's own (possibly floor- or
    // ceiling-level) row, so it never clips the case or the side walls
    const g = gift.current
    if (g) {
      const want = phase === 'reveal' ? 1 : 0
      revealT.current += (want - revealT.current) * 0.12
      const s = revealT.current
      g.visible = s > 0.01
      g.scale.setScalar(s)
      g.position.z = FRONT_Z + 0.05 + s * 0.95
      if (book3d.current) book3d.current.rotation.y = Math.sin(performance.now() / 1400) * 0.42
    }
  })

  /** Card UV → which of its two buttons. */
  const pickCard = useCallback((uv: THREE.Vector2) => {
    for (const key of ['open', 'again'] as const) {
      const r = CARD_BTN[key]
      // the card's rects are stored top-down; uv.y runs bottom-up
      const y = 1 - uv.y
      if (uv.x >= r.x && uv.x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return key
    }
    return null
  }, [])

  const buttonRef = useRef<THREE.Mesh>(null)
  const cardRef = useRef<THREE.Mesh>(null)

  // first-person has no cursor — FreeWalk's centre raycast drives hover and click
  useEffect(() => {
    const m = buttonRef.current
    if (!m) return
    m.userData.onUvHit = () => { if (phase !== 'spin') startSpin() }
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => setHover((prev) => (prev === (uv ? 'spin' : null) ? prev : uv ? 'spin' : null))
    return () => { delete m.userData.onUvHit; delete m.userData.onUvHover }
  }, [startSpin, phase])

  useEffect(() => {
    const m = cardRef.current
    if (!m || phase !== 'reveal') return
    m.userData.onUvHit = (uv: THREE.Vector2) => {
      const hit = pickCard(uv)
      if (hit === 'open' && picked) window.open(picked.url, '_blank', 'noopener,noreferrer')
      else if (hit === 'again') startSpin()
    }
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => {
      const hit = uv ? pickCard(uv) : null
      setHover((prev) => (prev === hit ? prev : hit))
    }
    return () => { delete m.userData.onUvHit; delete m.userData.onUvHover }
  }, [pickCard, picked, startSpin, phase])

  // no env map in this scene — high metalness on the brass trim would read as flat black
  // without one, so it stays a moderate "gold paint" like the room's own door frames, and
  // the wood carries a touch of warm emissive so it doesn't sink to pure black in the gaps
  // between the room's spotlights.
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2415', roughness: 0.6, metalness: 0.06, emissive: '#180d06', emissiveIntensity: 0.5 }), [])
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F2B441', roughness: 0.42, metalness: 0.4, emissive: '#4a2f0a', emissiveIntensity: 0.35 }), [])
  const spine = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b2230', roughness: 0.6, metalness: 0.15 }), [])

  const btnTex = buttonTexture()
  const titleTex = titleTexture()
  const cardTex = picked ? cardTexture(picked) : null

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* carcass: opaque back panel, stiles, rail, plinth, brass trims, shelves, dividers */}
      {CARCASS.map((b, i) => (
        <mesh
          key={i}
          castShadow={i < 5}
          receiveShadow
          position={b.pos}
          material={b.brass ? brass : wood}
          geometry={UNIT_BOX}
          scale={b.size}
          dispose={null}
        />
      ))}

      {/* decorative spines fill every compartment the twenty covers don't */}
      <Spines />

      {/* the twenty featured covers, face out, aspect kept from their own image */}
      <BookFaces />

      {/* title plate on the top rail */}
      <mesh position={[0, RAIL_Y, FRONT_Z - 0.015]} geometry={UNIT_PLANE} scale={[4.4, 0.55, 1]} dispose={null}>
        <meshStandardMaterial map={titleTex} transparent emissive="#ffffff" emissiveMap={titleTex} emissiveIntensity={0.55} />
      </mesh>

      {/* the spin button, centred on the plinth — its own mesh, no UV sub-region to test */}
      <mesh
        ref={buttonRef}
        name="gift-button"
        position={[0, PLINTH_Y, FRONT_Z + 0.03]}
        geometry={UNIT_PLANE}
        scale={[2.3, 0.575, 1]}
        dispose={null}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (phase !== 'spin') startSpin() }}
        onPointerMove={() => { if (hover !== 'spin') setHover('spin'); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto' }}
      >
        <meshStandardMaterial
          map={btnTex}
          emissive="#ffffff"
          emissiveMap={btnTex}
          emissiveIntensity={hover === 'spin' ? 0.82 : 0.62}
          roughness={0.7}
        />
      </mesh>

      {/* the selector: one small glowing frame that moves, never a board repaint */}
      <mesh ref={highlight} visible={false} geometry={UNIT_PLANE} scale={[COL_W * 0.92, ROW_H * 0.92, 1]} dispose={null}>
        <meshBasicMaterial
          color="#F2B441"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* the prize: fixed at comfortable eye height in front of the wall, and the card
          that explains it — independent of which row the picked book actually lives on */}
      <group ref={gift} position={[0, -0.5, 0]} visible={false}>
        {/* the book stands clear of the card, and in front of it, so neither clips the other */}
        <mesh ref={book3d} position={[-1.82, -0.28, 0.34]} castShadow>
          <boxGeometry args={[1.16, 1.62, 0.16]} />
          {/* +x, -x, +y, -y, +z (cover), -z */}
          <meshStandardMaterial attach="material-0" color="#e8e6e0" roughness={0.85} />
          <meshStandardMaterial attach="material-1" color="#c9c6bd" roughness={0.85} />
          <meshStandardMaterial attach="material-2" color="#e8e6e0" roughness={0.85} />
          <meshStandardMaterial attach="material-3" color="#e8e6e0" roughness={0.85} />
          {/* material-4 must always resolve to something — book3d mounts (invisible) before
              the first spin, and an unattached slot in the array crashes three's material
              handling. Fall back to the eventual pick, or the first book while idle. */}
          <Suspense fallback={<meshStandardMaterial attach="material-4" color="#1b2230" roughness={0.62} />}>
            <CoverFaceMaterial book={picked ?? BOOKS[0]} />
          </Suspense>
          <meshStandardMaterial attach="material-5" color="#1b2230" roughness={0.7} />
        </mesh>

        <mesh position={[0.9, -0.28, -0.05]} geometry={UNIT_BOX} scale={[3.3, 1.72, 0.08]} material={spine} dispose={null} />
        <mesh
          ref={cardRef}
          name="gift-card"
          position={[0.9, -0.28, 0.0]}
          geometry={UNIT_PLANE}
          scale={[3.2, 1.6, 1]}
          dispose={null}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation()
            const hit = e.uv ? pickCard(e.uv) : null
            if (hit === 'open' && picked) window.open(picked.url, '_blank', 'noopener,noreferrer')
            else if (hit === 'again') startSpin()
          }}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            const hit = e.uv ? pickCard(e.uv) : null
            if (hit !== hover) setHover(hit)
            document.body.style.cursor = hit ? 'pointer' : 'auto'
          }}
          onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto' }}
        >
          {cardTex ? (
            <meshStandardMaterial
              map={cardTex}
              emissive="#ffffff"
              emissiveMap={cardTex}
              emissiveIntensity={hover === 'open' || hover === 'again' ? 0.82 : 0.62}
              roughness={0.72}
            />
          ) : (
            <meshStandardMaterial color="#0d1016" roughness={0.72} />
          )}
        </mesh>
      </group>
    </group>
  )
}
