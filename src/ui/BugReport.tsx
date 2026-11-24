import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@/state/store'
import { bugReportConfigured, sendBugReport } from '@/lib/feedback'

const stamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function download(name: string, url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Bug reporter: Shift+X (or the 📷 HUD chip) grabs a screenshot of the canvas,
 * opens a modal — image left, description right — and "Tayyor" downloads
 * bug-<stamp>.png + bug-<stamp>.txt (description + auto metadata).
 * Game input is frozen while open (store.reportOpen).
 */
export function BugReport() {
  const open = useStore((s) => s.reportOpen)
  const setOpen = useStore((s) => s.setReportOpen)
  const [shot, setShot] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'saved' | 'failed'>('idle')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const capture = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    document.exitPointerLock?.()
    try {
      // JPEG, capped at 1600px wide: a full-size PNG runs to ~3MB, over what the
      // relay (and Vercel's request body limit) will take.
      const max = 1600
      if (canvas.width > max) {
        const scaled = document.createElement('canvas')
        scaled.width = max
        scaled.height = Math.round((canvas.height / canvas.width) * max)
        scaled.getContext('2d')?.drawImage(canvas, 0, 0, scaled.width, scaled.height)
        setShot(scaled.toDataURL('image/jpeg', 0.82))
      } else {
        setShot(canvas.toDataURL('image/jpeg', 0.82))
      }
    } catch {
      setShot(null)
    }
    setText('')
    setState('idle')
    setOpen(true)
    setTimeout(() => areaRef.current?.focus(), 50)
  }, [setOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (e.code === 'KeyX' && e.shiftKey && !s.reportOpen && s.phase === 'live') {
        e.preventDefault()
        capture()
      }
      if (e.code === 'Escape' && s.reportOpen) s.setReportOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [capture])

  // expose for the HUD chip
  useEffect(() => {
    ;(window as unknown as { __bugCapture?: () => void }).__bugCapture = capture
    return () => { delete (window as unknown as { __bugCapture?: () => void }).__bugCapture }
  }, [capture])

  if (!open) return null

  const finish = async () => {
    const s = useStore.getState()
    const id = stamp()
    const cam = document.querySelector('canvas') // meta only
    const meta = [
      `vaqt: ${new Date().toISOString()}`,
      `xona: ${s.roomId}`,
      `rejim: ${s.mode}`,
      `sifat: ${s.quality}`,
      `timeOfDay: ${s.timeOfDay.toFixed(2)}`,
      `railU: ${s.railU.toFixed(3)}`,
      `viewport: ${window.innerWidth}x${window.innerHeight} dpr${window.devicePixelRatio}`,
      `ua: ${navigator.userAgent}`,
      cam ? `canvas: ${cam.width}x${cam.height}` : '',
    ].join('\n')
    const description = text.trim() || '(tavsif yozilmagan)'
    const body = `# Bug report ${id}\n\n## Tavsif\n${description}\n\n## Meta\n${meta}\n`

    const saveLocally = () => {
      if (shot) download(`bug-${id}.jpg`, shot)
      download(`bug-${id}.txt`, 'data:text/plain;charset=utf-8,' + encodeURIComponent(body))
    }

    // Straight to Telegram when the relay is configured; the download is the fallback,
    // so a report is never lost just because the endpoint is down.
    if (bugReportConfigured) {
      setState('sending')
      try {
        await sendBugReport({ message: description, meta, photo: shot })
        setState('sent')
        setTimeout(() => setOpen(false), 1100)
        return
      } catch {
        saveLocally()
        setState('failed')
        setTimeout(() => setOpen(false), 1800)
        return
      }
    }
    saveLocally()
    setState('saved')
    setTimeout(() => setOpen(false), 900)
  }

  return (
    <div className="bugmodal" role="dialog" aria-modal="true" aria-label="Bug report">
      <div className="bugmodal-inner">
        <div className="bug-left">
          {shot ? <img src={shot} alt="Screenshot" /> : <div className="bug-noshot">Skrinshot olinmadi</div>}
        </div>
        <div className="bug-right">
          <div className="eyebrow">Bug | Feedback · Shift+X</div>
          <h2>Nima muammo?</h2>
          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Muammoni tarif qiling: nima noto'g'ri, qayerda, nima kutgandingiz…"
          />
          <div className="bug-actions">
            <button className="btn primary" onClick={() => void finish()} disabled={state === 'sending' || state === 'sent' || state === 'saved'}>
              {state === 'sending' ? 'Yuborilmoqda…'
                : state === 'sent' ? 'Yuborildi ✓'
                : state === 'saved' ? 'Yuklandi ✓'
                : state === 'failed' ? 'Yuborilmadi — yuklab olindi'
                : bugReportConfigured ? 'Yuborish' : 'Tayyor — yuklab olish'}
            </button>
            <button className="btn" onClick={() => setOpen(false)}>Bekor (Esc)</button>
          </div>
          <p className="bug-hint">
            {bugReportConfigured
              ? 'Skrinshot va tavsif to‘g‘ridan-to‘g‘ri Telegram’ga boradi.'
              : 'JPG + TXT Downloads papkasiga tushadi.'}
          </p>
        </div>
      </div>
    </div>
  )
}
