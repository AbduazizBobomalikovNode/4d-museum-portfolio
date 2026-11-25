import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

import { CITY, MONTHS, WEEKDAYS, type Lang } from '@/lib/i18n'
import { useLang } from '@/lib/useT'
import { ANISO, flatTexture, mkCanvas } from '@/lib/tier'
import { memoOnce } from '@/lib/assets'

/** Built once: constructing an Intl formatter is far costlier than using one. */
const TASHKENT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tashkent',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  day: '2-digit', month: 'numeric', year: 'numeric', weekday: 'short',
  hour12: false,
})

/** Tashkent wall parts as numbers (Intl with a fixed IANA zone, independent of the visitor's zone). */
function tashkentNow(lang: Lang, ms: number) {
  const parts = TASHKENT.formatToParts(new Date(ms))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
    day: get('day'),
    month: MONTHS[lang][parseInt(get('month'), 10) - 1] ?? '',
    year: get('year'),
    weekday: WEEKDAYS[lang][wdMap[get('weekday')] ?? 0],
  }
}

/**
 * Live translucent digital wall clock — Tashkent time with the date underneath.
 * Canvas is POT (1024×512) and redrawn once per second.
 */
export function WallClock({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const lastSec = useRef(-1)
  const lastLang = useRef('')
  const lang = useLang()
  const { tex, ctx } = useMemo(() => memoOnce('wall-clock', () => {
    const { canvas, ctx } = mkCanvas(1024, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = ANISO
    flatTexture(tex, THREE.LinearFilter)
    return { tex, ctx }
  }), [])

  useFrame(() => {
    // the face only changes once a second (or with the language): compare the whole second
    // first, so the other 59 frames cost two integer ops instead of a date format
    const sec = Math.floor(Date.now() / 1000)
    if (sec === lastSec.current && lang === lastLang.current) return
    lastSec.current = sec
    lastLang.current = lang
    const t = tashkentNow(lang, sec * 1000)
    const w = 1024 // logical size (the backing store may be smaller on the low tier)
    const h = 512
    ctx.clearRect(0, 0, w, h)
    // glass panel ground
    ctx.fillStyle = 'rgba(10, 14, 20, 0.42)'
    ctx.beginPath()
    ctx.roundRect(8, 8, w - 16, h - 16, 26)
    ctx.fill()
    ctx.strokeStyle = 'rgba(93, 228, 255, 0.55)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.strokeStyle = 'rgba(93, 228, 255, 0.18)'
    ctx.lineWidth = 10
    ctx.stroke()
    // time digits
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5DE4FF'
    ctx.shadowColor = '#5DE4FF'
    ctx.shadowBlur = 26
    ctx.font = `700 190px ${FONT_M}`
    ctx.fillText(t.time, w / 2, 250)
    ctx.shadowBlur = 0
    // date line
    ctx.fillStyle = '#F2B441'
    ctx.font = `600 58px ${FONT_D}`
    ctx.fillText(`${t.day}-${t.month} ${t.year}`, w / 2, 366)
    ctx.fillStyle = '#C9C7BF'
    ctx.font = `36px ${FONT_M}`
    ctx.fillText(`${t.weekday} · ${CITY[lang]} · UTC+5`, w / 2, 442)
    tex.needsUpdate = true
  })

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[3.4, 1.7]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}
