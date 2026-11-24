import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { sendFeedback } from '@/lib/feedback'
import { useStore } from '@/state/store'
import { useT } from '@/lib/useT'
import { useLang } from '@/lib/useT'
import { UNIT_BOX } from '@/lib/geo'

const W = 2048
const H = 1024
const FONT_D = '"Sora", system-ui, sans-serif'
const FONT_B = '"IBM Plex Sans", system-ui, sans-serif'
const FONT_M = '"IBM Plex Mono", ui-monospace, monospace'

const CONTACT = {
  name: 'Bobomalikov Abduaziz',
  role: 'Full-stack · Node.js dasturchi',
  phone: '+998 91 666 43 15',
  phoneRaw: '+998916664315',
  telegram: '@Bobomalikov_Abduaziz',
}

type FieldId = 'name' | 'surname' | 'message'
type Rect = { x: number; y: number; w: number; h: number }

/** Canvas-space hit boxes — the same numbers drive painting and picking. */
const BOX: Record<FieldId | 'send', Rect> = {
  name: { x: 1090, y: 200, w: 900, h: 96 },
  surname: { x: 1090, y: 320, w: 900, h: 96 },
  message: { x: 1090, y: 440, w: 900, h: 250 },
  send: { x: 1090, y: 725, w: 420, h: 100 },
}
const MAXLEN: Record<FieldId, number> = { name: 60, surname: 60, message: 600 }

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

/** Wrap `text` to `maxW`, honouring explicit newlines. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const t = line ? `${line} ${word}` : word
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word } else line = t
    }
    out.push(line)
  }
  return out
}

/**
 * Contact card + feedback form painted into a CanvasTexture on a wall mesh.
 * Pure WebGL: real depth test (no DOM overlay showing through walls). Clicks are
 * raycast UV hits; typing goes through an offscreen input so mobile keyboards work.
 */
export function FeedbackWall({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const [values, setValues] = useState<Record<FieldId, string>>({ name: '', surname: '', message: '' })
  const [focus, setFocus] = useState<FieldId | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [hover, setHover] = useState<FieldId | 'send' | null>(null)
  const caretOn = useRef(true)
  const setFormOpen = useStore((s) => s.setFormOpen)
  const t = useT()
  const lang = useLang()

  const { tex, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { tex, ctx }
  }, [])

  /** Offscreen input carries the actual text entry (desktop + mobile keyboards, paste, IME). */
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    const el = document.createElement('textarea')
    el.setAttribute('aria-label', 'Fikr formasi')
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;opacity:0;'
    document.body.appendChild(el)
    inputRef.current = el
    return () => { el.remove(); inputRef.current = null }
  }, [])

  const paint = useCallback(() => {
    ctx.clearRect(0, 0, W, H)
    // panel ground
    ctx.fillStyle = '#0f1218'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#2a3038'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, W - 4, H - 4)
    ctx.fillStyle = '#F2B441'
    ctx.fillRect(0, 0, W, 8)

    // ── left column: contact card ──────────────────────────────
    ctx.fillStyle = '#F2B441'
    ctx.font = `500 30px ${FONT_M}`
    ctx.fillText(t('contactTitle'), 70, 120)
    ctx.fillStyle = '#E8E6E0'
    ctx.font = `800 68px ${FONT_D}`
    ctx.fillText(CONTACT.name, 70, 205)
    ctx.fillStyle = '#8b949e'
    ctx.font = `32px ${FONT_B}`
    ctx.fillText(t('role'), 70, 258)

    const row = (icon: string, label: string, value: string, y: number, color: string) => {
      ctx.fillStyle = '#1a1f27'
      roundRect(ctx, { x: 70, y: y - 52, w: 900, h: 92 }, 12)
      ctx.fill()
      ctx.fillStyle = color
      ctx.font = `40px ${FONT_B}`
      ctx.fillText(icon, 96, y + 2)
      ctx.fillStyle = '#8b949e'
      ctx.font = `24px ${FONT_M}`
      ctx.fillText(label, 160, y - 14)
      ctx.fillStyle = '#E8E6E0'
      ctx.font = `600 36px ${FONT_B}`
      ctx.fillText(value, 160, y + 22)
    }
    row('☎', t('phone'), CONTACT.phone, 400, '#F2B441')
    row('✈', t('telegram'), CONTACT.telegram, 520, '#5DE4FF')
    row('✉', t('email'), 'azizbek12234@gmail.com', 640, '#F2B441')

    ctx.fillStyle = '#6e7681'
    ctx.font = `26px ${FONT_M}`
    ctx.fillText(t('place'), 70, 760)

    // divider
    ctx.strokeStyle = '#2a3038'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(1030, 70)
    ctx.lineTo(1030, H - 70)
    ctx.stroke()

    // ── right column: feedback form ────────────────────────────
    ctx.fillStyle = '#E8E6E0'
    ctx.font = `800 52px ${FONT_D}`
    ctx.fillText(t('formTitle'), 1090, 140)

    const field = (id: FieldId) => {
      const r = BOX[id]
      const isFocus = focus === id
      const isHover = hover === id
      ctx.fillStyle = '#161b22'
      roundRect(ctx, r, 12)
      ctx.fill()
      ctx.strokeStyle = isFocus ? '#F2B441' : isHover ? '#5DE4FF' : '#30363d'
      ctx.lineWidth = isFocus ? 4 : 3
      roundRect(ctx, r, 12)
      ctx.stroke()

      const text = values[id]
      ctx.font = `34px ${FONT_B}`
      const pad = 26
      if (!text && !isFocus) {
        ctx.fillStyle = '#5a626c'
        ctx.fillText(t(id === 'name' ? 'fName' : id === 'surname' ? 'fSurname' : 'fMessage'), r.x + pad, r.y + (id === 'message' ? 56 : 60))
      } else {
        ctx.fillStyle = '#E8E6E0'
        const lines = wrapLines(ctx, text, r.w - pad * 2)
        const maxLines = id === 'message' ? 5 : 1
        const shown = lines.slice(-maxLines)
        shown.forEach((ln, i) => ctx.fillText(ln, r.x + pad, r.y + 56 + i * 42))
        if (isFocus && caretOn.current) {
          const last = shown[shown.length - 1] ?? ''
          const cx = r.x + pad + ctx.measureText(last).width + 4
          const cy = r.y + 56 + (shown.length - 1) * 42
          ctx.fillStyle = '#F2B441'
          ctx.fillRect(cx, cy - 30, 3, 38)
        }
      }
      // counter for the message box
      if (id === 'message') {
        ctx.fillStyle = '#5a626c'
        ctx.font = `22px ${FONT_M}`
        ctx.fillText(`${text.length}/${MAXLEN.message}`, r.x + r.w - 120, r.y + r.h - 18)
      }
    }
    field('name')
    field('surname')
    field('message')

    // send button
    const sb = BOX.send
    const busy = status === 'sending'
    const done = status === 'ok'
    const sendHover = hover === 'send' && !busy && !done
    if (sendHover) {
      // glow ring so the hover reads instantly from across the room
      ctx.save()
      ctx.shadowColor = '#5DE4FF'
      ctx.shadowBlur = 34
      ctx.fillStyle = '#5DE4FF'
      roundRect(ctx, { x: sb.x - 4, y: sb.y - 4, w: sb.w + 8, h: sb.h + 8 }, 18)
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = done ? '#238636' : busy ? '#6e5a24' : sendHover ? '#5DE4FF' : '#F2B441'
    roundRect(ctx, sb, 14)
    ctx.fill()
    ctx.fillStyle = done ? '#E8E6E0' : '#16171B'
    ctx.font = `700 38px ${FONT_D}`
    const label = done ? t('sent') : busy ? t('sending') : t('send')
    ctx.fillText(label, sb.x + 40, sb.y + 64)

    // status line
    ctx.font = `28px ${FONT_M}`
    if (status === 'error') {
      ctx.fillStyle = '#f85149'
      ctx.fillText(t('sendErrMsg'), 1090, 890)
    } else if (status === 'ok') {
      ctx.fillStyle = '#3fb950'
      ctx.fillText(t('sendOkMsg'), 1090, 890)
    } else {
      ctx.fillStyle = '#5a626c'
      ctx.fillText(focus ? t('formHintTyping') : t('formHintIdle'), 1090, 890)
    }
    tex.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, tex, values, focus, hover, status, lang])

  useEffect(() => { paint() }, [paint])
  useEffect(() => { document.fonts?.ready.then(() => paint()) }, [paint])

  // caret blink (only while a field is focused)
  useFrame(({ clock }) => {
    if (!focus) return
    const on = Math.floor(clock.elapsedTime * 1.8) % 2 === 0
    if (on !== caretOn.current) { caretOn.current = on; paint() }
  })

  const blur = useCallback(() => {
    setFocus(null)
    setFormOpen(false)
    inputRef.current?.blur()
  }, [setFormOpen])

  const focusField = useCallback((id: FieldId) => {
    setFocus(id)
    setFormOpen(true)
    setStatus((s) => (s === 'ok' || s === 'error' ? 'idle' : s))
    document.exitPointerLock?.()
    const el = inputRef.current
    if (el) {
      el.value = values[id]
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [setFormOpen, values])

  const submit = useCallback(async () => {
    if (status === 'sending') return
    if (!values.message.trim()) { setFocus('message'); setFormOpen(true); return }
    setStatus('sending')
    try {
      await sendFeedback(values)
      setStatus('ok')
      setValues({ name: '', surname: '', message: '' })
      blur()
      setTimeout(() => setStatus('idle'), 6000)
    } catch {
      setStatus('error')
    }
  }, [status, values, blur, setFormOpen])

  // keyboard: text comes from the offscreen input; keys handle navigation/submit
  useEffect(() => {
    if (!focus) return
    const el = inputRef.current
    if (!el) return
    const onInput = () => {
      const v = el.value.slice(0, MAXLEN[focus])
      if (v !== el.value) el.value = v
      setValues((prev) => ({ ...prev, [focus]: v }))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.preventDefault(); blur(); return }
      if (e.code === 'Tab') {
        e.preventDefault()
        const order: FieldId[] = ['name', 'surname', 'message']
        const next = order[(order.indexOf(focus) + (e.shiftKey ? 2 : 1)) % 3]
        focusField(next)
        return
      }
      if (e.code === 'Enter' && focus !== 'message') { e.preventDefault(); focusField(focus === 'name' ? 'surname' : 'message') }
      if (e.code === 'Enter' && e.ctrlKey) { e.preventDefault(); void submit() }
    }
    el.addEventListener('input', onInput)
    el.addEventListener('keydown', onKey)
    return () => { el.removeEventListener('input', onInput); el.removeEventListener('keydown', onKey) }
  }, [focus, blur, focusField, submit])

  useEffect(() => () => setFormOpen(false), [setFormOpen])

  /** UV → canvas coords → which control was hit. */
  const pickUv = useCallback((uv: THREE.Vector2): FieldId | 'send' | null => {
    const x = uv.x * W
    const y = (1 - uv.y) * H
    for (const key of ['name', 'surname', 'message', 'send'] as const) {
      const r = BOX[key]
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return key
    }
    return null
  }, [])
  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.uv ? pickUv(e.uv) : null)

  const activate = useCallback((hit: FieldId | 'send' | null) => {
    if (hit === 'send') void submit()
    else if (hit) focusField(hit)
    else blur()
  }, [submit, focusField, blur])

  // first-person mode has no cursor — FreeWalk's centre raycast drives both hover and click
  const screenRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const m = screenRef.current
    if (!m) return
    m.userData.onUvHit = (uv: THREE.Vector2) => activate(pickUv(uv))
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => {
      const hit = uv ? pickUv(uv) : null
      setHover((prev) => (prev === hit ? prev : hit))
    }
    return () => {
      if (!m) return
      delete m.userData.onUvHit
      delete m.userData.onUvHover
    }
  }, [activate, pickUv])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow geometry={UNIT_BOX} scale={[6.6, 3.4, 0.14]} dispose={null}>        <meshStandardMaterial color="#0c0d11" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh
        ref={screenRef}
        name="feedback-wall"
        position={[0, 0, 0.075]}
        onClick={(e) => { e.stopPropagation(); activate(pick(e)) }}
        onPointerMove={(e) => {
          const hit = pick(e)
          if (hit !== hover) setHover(hit)
          document.body.style.cursor = hit ? 'pointer' : 'auto'
        }}
        onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto' }}
      >
        <planeGeometry args={[6.4, 3.2]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.5} roughness={0.75} />
      </mesh>
    </group>
  )
}
