import { useEffect, useState } from 'react'
import { useStore } from '@/state/store'
import { LIKE_KEY, hasSeen, like, onCounts, readLikes } from '@/lib/counter'
import { roomById } from '@/data/rooms'
import { isTouchDevice } from '@/lib/quality'
import { MiniMap } from './MiniMap'
import { useL, useT } from '@/lib/useT'
import type { Quality } from '@/lib/quality'

/**
 * Fullscreen toggle. Hidden where the API does not exist — notably iPhone Safari, which
 * offers no Fullscreen API outside <video>, so showing a dead button there would be worse
 * than showing nothing.
 */
function FullscreenChip() {
  const t = useT()
  const [on, setOn] = useState(false)
  const [supported] = useState(
    () => typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function',
  )

  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', sync)
    sync()
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  if (!supported) return null

  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else void document.documentElement.requestFullscreen().catch(() => {})
  }

  return (
    <button className="chip" onClick={toggle} aria-pressed={on} title={on ? t('fullscreenExit') : t('fullscreen')}>
      <span aria-hidden="true">{on ? '⤢' : '⛶'}</span>
    </button>
  )
}

function LikeChip() {
  const t = useT()
  const [count, setCount] = useState<number | null>(null)
  const [done, setDone] = useState(() => hasSeen(LIKE_KEY))

  useEffect(() => {
    const off = onCounts((c) => setCount(c[LIKE_KEY] ?? null))
    readLikes()
    return off
  }, [])

  return (
    <button
      className={`chip like ${done ? 'is-liked' : ''}`}
      onClick={() => { if (like()) setDone(true) }}
      aria-pressed={done}
      title={done ? t('likeDone') : t('likeTitle')}
    >
      <span aria-hidden="true">{done ? '★' : '☆'}</span>
      {count != null && <span className="mono">{count.toLocaleString()}</span>}
    </button>
  )
}

export function Hud() {
  const phase = useStore((s) => s.phase)
  const roomId = useStore((s) => s.roomId)
  const mode = useStore((s) => s.mode)
  const toggleMode = useStore((s) => s.toggleMode)
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const timeOfDay = useStore((s) => s.timeOfDay)
  const setTimeOfDay = useStore((s) => s.setTimeOfDay)
  const pointerLocked = useStore((s) => s.pointerLocked)
  const hidden = useStore((s) => s.hudHidden)
  const inspectId = useStore((s) => s.inspectId)
  const formOpen = useStore((s) => s.formOpen)
  const touch = isTouchDevice()
  const t = useT()
  const L = useL()

  // global keys: M = mode, Esc handled by panel, H = hide HUD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.phase !== 'live' || s.reportOpen || s.formOpen) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'KeyM') s.toggleMode()
      if (e.code === 'KeyH') s.setHudHidden(!s.hudHidden)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (phase !== 'live') return null
  const room = roomById[roomId]
  const hour = Math.round(timeOfDay * 24) % 24

  return (
    <>
      <div className={`hud ${hidden ? 'hud-hidden' : ''}`} aria-live="polite">
        <div className="hud-room">
          <div className="eyebrow">{L(room.eyebrow)}</div>
          <div className="hud-title">{L(room.title)}</div>
        </div>

        <div className="hud-controls">
          <button className="chip" onClick={toggleMode} title="M">
            {mode === 'rail' ? t('modeWalk') : t('modeRail')}
          </button>
          <label className="chip time" title="Vaqt (4D)">
            <span className="mono">{String(hour).padStart(2, '0')}:00</span>
            <input type="range" min={0} max={1} step={0.005} value={timeOfDay} onChange={(e) => setTimeOfDay(parseFloat(e.target.value))} aria-label={t('timeLabel')} />
          </label>
          <select className="chip" value={quality} onChange={(e) => setQuality(e.target.value as Quality)} aria-label={t('qualityLabel')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="chip" onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? t('soundOn') : t('soundOff')}</button>
          <FullscreenChip />
          <LikeChip />
          <button className="chip" title="Bug report (Shift+X)" onClick={() => (window as unknown as { __bugCapture?: () => void }).__bugCapture?.()}>
            📷 {t('bug')}
          </button>
        </div>

        <MiniMap />

        <div className="hud-hint mono">
          {mode === 'rail'
            ? touch ? t('hudRailTouch') : t('hudRail')
            : touch ? t('hudWalkTouch') : t('hudWalk')}
        </div>
      </div>

      {mode === 'walk' && pointerLocked && !formOpen && <div className="crosshair" aria-hidden="true" />}
      {formOpen && <div className="typing-hint mono">{t('typingMode')}</div>}

      {/* pointer-lock gate for desktop free-walk */}
      {mode === 'walk' && !touch && !pointerLocked && !inspectId && !formOpen && (
        <button id="look-gate" className="look-gate" onClick={() => (window as unknown as { __lockPointer?: () => void }).__lockPointer?.()}>
          <span>{t('lookGate')}</span>
          <small>{t('lookGateSub')}</small>
        </button>
      )}
    </>
  )
}
