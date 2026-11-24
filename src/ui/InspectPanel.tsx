import { useEffect } from 'react'
import { useStore } from '@/state/store'
import { exhibitById } from '@/data/exhibits'
import { roomById } from '@/data/rooms'
import { useL, useT } from '@/lib/useT'

/** Glass DOM panel for the selected exhibit. Esc / × closes. */
export function InspectPanel() {
  const id = useStore((s) => s.inspectId)
  const inspect = useStore((s) => s.inspect)
  const t = useT()
  const L = useL()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') inspect(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inspect])

  if (!id) return null
  const ex = exhibitById[id]
  if (!ex) return null
  const room = roomById[ex.roomId]
  return (
    <aside className="panel" role="dialog" aria-labelledby="panel-title" style={{ ['--accent' as string]: ex.accent ?? room.accent }}>
      <button className="panel-close" onClick={() => inspect(null)} aria-label={t('close')}>×</button>
      <div className="eyebrow">{L(room.eyebrow)}{ex.year ? ` · ${ex.year}` : ''}</div>
      <h2 id="panel-title">{ex.title}</h2>
      {ex.subtitle && <div className="panel-sub">{L(ex.subtitle)}</div>}
      <p>{L(ex.description)}</p>
      {ex.tags && (
        <div className="tags">{ex.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
      )}
      <div className="panel-actions">
        {/* jonli sahifa birinchi: ko'pchilik avval ko'rmoqchi, keyin kodga qaraydi */}
        {ex.demo && (
          <a className="btn primary small" href={ex.demo} target="_blank" rel="noreferrer">{t('openDemo')}</a>
        )}
        {ex.link && (
          <a className={`btn small ${ex.demo ? '' : 'primary'}`} href={ex.link} target="_blank" rel="noreferrer">
            {ex.demo ? t('openCode') : t('open')}
          </a>
        )}
      </div>
    </aside>
  )
}
