import { rooms, SPACING } from '@/data/rooms'
import { useStore } from '@/state/store'
import { useL, useT } from '@/lib/useT'

/**
 * Floor-plan mini-map. Rooms don't overlap in plan, so both storeys share one map;
 * upper-floor cells are drawn with a dashed outline and a "2" badge. Click = teleport.
 */
export function MiniMap() {
  const roomId = useStore((s) => s.roomId)
  const teleport = useStore((s) => s.teleport)
  const t = useT()
  const L = useL()
  const S = SPACING
  const minX = -2 * S, maxX = 2 * S, minZ = -S, maxZ = 2 * S
  const pad = 10
  const cell = 17
  const W = ((maxX - minX) / S + 1) * cell + pad * 2
  const H = ((maxZ - minZ) / S + 1) * cell + pad * 2
  const toX = (x: number) => pad + ((x - minX) / S) * cell + cell / 2
  const toY = (z: number) => pad + ((z - minZ) / S) * cell + cell / 2

  return (
    <svg className="minimap" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="navigation" aria-label={t('mapLabel')}>
      <g stroke="currentColor" strokeOpacity={0.3} strokeWidth={3}>
        <line x1={toX(0)} y1={toY(2 * S)} x2={toX(0)} y2={toY(-S)} />
        <line x1={toX(-2 * S)} y1={toY(0)} x2={toX(2 * S)} y2={toY(0)} />
      </g>
      {rooms.map((r) => {
        const active = r.id === roomId
        const upper = r.level === 1
        return (
          <g key={r.id} transform={`translate(${toX(r.center[0])},${toY(r.center[1])})`} onClick={() => teleport(r.id)} style={{ cursor: 'pointer' }}>
            <title>{L(r.title)}{upper ? ` (${t('floor2')})` : ''}</title>
            <rect
              x={-cell / 2 + 1.5} y={-cell / 2 + 1.5} width={cell - 3} height={cell - 3} rx={2.5}
              fill={active ? r.accent : 'currentColor'} fillOpacity={active ? 0.95 : upper ? 0.12 : 0.3}
              stroke={active ? r.accent : 'currentColor'} strokeOpacity={active ? 1 : 0.5}
              strokeDasharray={upper ? '3 2' : undefined} strokeWidth={1.2}
            />
            {upper && (
              <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontFamily="var(--font-mono)" fill={active ? '#0b0c10' : 'currentColor'} fillOpacity={active ? 1 : 0.8}>2</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
