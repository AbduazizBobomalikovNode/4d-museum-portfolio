import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { LANGS, LANG_META, tr, type Lang } from '@/lib/i18n'
import { useStore } from '@/state/store'
import { UNIT_BOX } from '@/lib/geo'
import { ANISO, mkCanvas } from '@/lib/tier'
import { Cull } from './Cull'
import { memoOnce } from '@/lib/assets'

const W = 1024
const H = 1024
const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

type Rect = { x: number; y: number; w: number; h: number }
/** Canvas hit boxes — one row per language, same numbers used for paint and pick. */
const ROW: Record<Lang, Rect> = {
  uz: { x: 70, y: 300, w: 884, h: 130 },
  kr: { x: 70, y: 448, w: 884, h: 130 },
  ru: { x: 70, y: 596, w: 884, h: 130 },
  en: { x: 70, y: 744, w: 884, h: 130 },
}

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

/**
 * Electronic lectern in the entrance hall: a tilted touch panel on a plinth where
 * visitors pick the museum language (uz / uz-cyrillic / ru / en). Painted into a
 * CanvasTexture on a real mesh, so it depth-tests like everything else; picking is
 * UV-based and works from the first-person crosshair too.
 */
export function LanguageKiosk({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const [hover, setHover] = useState<Lang | null>(null)
  const flash = useRef(0)

  const { tex, ctx } = useMemo(() => memoOnce('kiosk', () => {
    const { canvas, ctx } = mkCanvas(W, H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    return { tex, ctx }
  }), [])

  const paint = useCallback(() => {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#2a3038'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, W - 4, H - 4)
    // header band
    ctx.fillStyle = '#5DE4FF'
    ctx.fillRect(0, 0, W, 6)
    ctx.fillStyle = '#5DE4FF'
    ctx.font = `500 26px ${FONT_M}`
    ctx.fillText('🌐  ' + tr('kioskTitle', lang), 70, 120)
    ctx.fillStyle = '#E8E6E0'
    ctx.font = `800 62px ${FONT_D}`
    ctx.fillText(tr('kioskTitle', lang), 70, 196)
    ctx.fillStyle = '#8b949e'
    ctx.font = `26px ${FONT_M}`
    ctx.fillText(tr('kioskSub', lang), 70, 246)

    for (const code of LANGS) {
      const r = ROW[code]
      const isActive = code === lang
      const isHover = hover === code
      ctx.fillStyle = isActive ? '#132b33' : isHover ? '#1c2430' : '#141922'
      roundRect(ctx, r, 16)
      ctx.fill()
      ctx.strokeStyle = isActive ? '#5DE4FF' : isHover ? '#F2B441' : '#2a3038'
      ctx.lineWidth = isActive || isHover ? 4 : 2.5
      roundRect(ctx, r, 16)
      ctx.stroke()

      ctx.font = `54px ${FONT_D}`
      ctx.fillText(LANG_META[code].flag, r.x + 34, r.y + 88)
      ctx.fillStyle = '#E8E6E0'
      ctx.font = `700 46px ${FONT_D}`
      ctx.fillText(LANG_META[code].native, r.x + 120, r.y + 84)
      ctx.fillStyle = isActive ? '#5DE4FF' : '#5a626c'
      ctx.font = `28px ${FONT_M}`
      ctx.fillText(code.toUpperCase(), r.x + r.w - 110, r.y + 82)
      if (isActive) {
        ctx.fillStyle = '#5DE4FF'
        ctx.beginPath()
        ctx.arc(r.x + r.w - 42, r.y + 66, 11, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = '#5a626c'
    ctx.font = `24px ${FONT_M}`
    ctx.fillText(`${tr('kioskCurrent', lang)}: ${LANG_META[lang].native}`, 70, 946)
    tex.needsUpdate = true
  }, [ctx, tex, lang, hover])

  useEffect(() => { paint() }, [paint])
  useEffect(() => { document.fonts?.ready.then(() => paint()) }, [paint])

  const pickUv = useCallback((uv: THREE.Vector2): Lang | null => {
    const x = uv.x * W
    const y = (1 - uv.y) * H
    for (const code of LANGS) {
      const r = ROW[code]
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return code
    }
    return null
  }, [])

  const choose = useCallback((code: Lang | null) => {
    if (!code) return
    setLang(code)
    flash.current = 1
  }, [setLang])

  // crosshair support (first person has no cursor)
  const screenRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const m = screenRef.current
    if (!m) return
    m.userData.onUvHit = (uv: THREE.Vector2) => choose(pickUv(uv))
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => {
      const hit = uv ? pickUv(uv) : null
      setHover((prev) => (prev === hit ? prev : hit))
    }
    return () => {
      if (!m) return
      delete m.userData.onUvHit
      delete m.userData.onUvHover
    }
  }, [choose, pickUv])

  // confirmation glow after a pick
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (flash.current > 0) {
      flash.current = Math.max(0, flash.current - dt * 1.6)
      if (glow.current) glow.current.emissiveIntensity = 0.5 + flash.current * 1.6
    }
  })

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.uv ? pickUv(e.uv) : null)

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Cull id="entrance">
      {/* plinth */}
      <mesh castShadow receiveShadow position={[0, 0.52, 0]} geometry={UNIT_BOX} scale={[0.95, 1.04, 0.6]} dispose={null}>        <meshStandardMaterial color="#16181e" roughness={0.45} metalness={0.5} />
      </mesh>
      {/* accent light strip down the front */}
      <mesh position={[0, 0.52, 0.301]}>
        <planeGeometry args={[0.12, 0.84]} />
        <meshStandardMaterial color="#0b0e14" emissive="#5DE4FF" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* base */}
      <mesh receiveShadow position={[0, 0.03, 0]} geometry={UNIT_BOX} scale={[1.1, 0.07, 0.74]} dispose={null}>        <meshStandardMaterial color="#0d0f13" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* tilted head */}
      <group position={[0, 1.36, 0.17]} rotation={[-0.42, 0, 0]}>
        <mesh castShadow geometry={UNIT_BOX} scale={[1.0, 1.0, 0.07]} dispose={null}>          <meshStandardMaterial color="#0c0d11" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh
          ref={screenRef}
          name="language-kiosk"
          position={[0, 0, 0.038]}
          onClick={(e) => { e.stopPropagation(); choose(pick(e)) }}
          onPointerMove={(e) => {
            const hit = pick(e)
            if (hit !== hover) setHover(hit)
            document.body.style.cursor = hit ? 'pointer' : 'auto'
          }}
          onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto' }}
        >
          <planeGeometry args={[0.94, 0.94]} />
          <meshStandardMaterial ref={glow} map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} roughness={0.7} />
        </mesh>
      </group>
      {/* globe icon floating over the lectern */}
      <mesh position={[0, 2.02, 0]}>
        <torusGeometry args={[0.1, 0.012, 8, 32]} />
        <meshStandardMaterial color="#5DE4FF" emissive="#5DE4FF" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      </Cull>
      {/* lights stay outside the Cull: a hidden light changes the light count and recompiles every material */}
      <pointLight position={[0, 1.8, 0.6]} intensity={4} distance={3.6} decay={2} color="#5DE4FF" />
    </group>
  )
}
