import { useStore } from '@/state/store'
import { isTouchDevice } from '@/lib/quality'
import { useT } from '@/lib/useT'

/** Loading + enter gate. The click doubles as the audio/pointer-lock user gesture. */
export function EnterGate() {
  const phase = useStore((s) => s.phase)
  const enter = useStore((s) => s.enter)
  const t = useT()
  if (phase === 'live') return null
  const loading = phase === 'loading'
  const touch = isTouchDevice()
  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-inner">
        <div className="eyebrow">{t('gateEyebrow')}</div>
        <h1 id="gate-title">{t('gateTitle')}</h1>
        <p className="lede">{t('gateLede')}</p>
        <div className="gate-actions">
          <button className="btn primary" disabled={loading} onClick={() => enter(true)}>
            {loading ? t('loading') : t('enterSound')}
          </button>
          <button className="btn" disabled={loading} onClick={() => enter(false)}>
            {t('enterMute')}
          </button>
        </div>
        <ul className="hints">
          {touch ? (
            <>
              <li>{t('hintSwipe')}</li>
              <li>{t('hintTap')}</li>
              <li>{t('hintJoystick')}</li>
            </>
          ) : (
            <>
              <li>{t('hintScroll')}</li>
              <li>{t('hintClick')}</li>
              <li>{t('hintWalk')}</li>
            </>
          )}
        </ul>
        <a className="skip" href={`${import.meta.env.BASE_URL}guide.html`}>{t('skip2d')}</a>
      </div>
    </div>
  )
}
