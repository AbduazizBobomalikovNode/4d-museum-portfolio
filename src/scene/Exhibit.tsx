import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Exhibit as ExhibitData } from '@/data/types'
import { roomById } from '@/data/rooms'
import { useStore } from '@/state/store'
import { useL, useLang, useT } from '@/lib/useT'
import { plaqueTexture, posterTexture } from '@/lib/poster'
import { Robot } from './Robot'
import { UNIT_BOX } from '@/lib/geo'

interface Props { data: ExhibitData }

const DEG = Math.PI / 180

/**
 * Greybox exhibit: frame on wall / pedestal / screen + diegetic plaque.
 * Hover = accent pulse, click = inspect panel (DOM).
 */
export function Exhibit({ data }: Props) {
  const room = roomById[data.roomId]
  const inspect = useStore((s) => s.inspect)
  const selected = useStore((s) => s.inspectId === data.id)
  const lang = useLang()
  const L = useL()
  const t = useT()
  const [hover, setHover] = useState(false)
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  const accent = data.accent ?? room.accent

  const plaque = useMemo(
    () => plaqueTexture(data.title, L(data.subtitle) + (data.year ? ` · ${data.year}` : ''), data.accent ?? room.accent, t('pressE'), lang, data.roomId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, room.accent, lang],
  )

  const poster = useMemo(
    () =>
      data.kind === 'pedestal'
        ? null
        : posterTexture({
            id: data.id + ':' + lang,
            title: data.title,
            subtitle: L(data.subtitle),
            year: data.year,
            description: L(data.description),
            tags: data.tags,
            footer: data.link?.replace('https://', '').replace('mailto:', ''),
          }, data.roomId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, lang],
  )

  const x = room.center[0] + data.local[0]
  const z = room.center[1] + data.local[1]
  const y = room.floorY
  const rotY = (data.facing ?? 0) * DEG

  const idle = useRef(false)
  useFrame(({ clock }) => {
    const m = glow.current
    if (!m) return
    if (!selected && !hover) {
      // write once when it settles, then do nothing every frame
      if (!idle.current) { m.emissiveIntensity = 0.5; idle.current = true }
      return
    }
    idle.current = false
    m.emissiveIntensity = (selected ? 0.95 : 0.8) + Math.sin(clock.elapsedTime * 2.4) * 0.12
  })

  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }
  const onOut = () => { setHover(false); document.body.style.cursor = 'auto' }
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); inspect(selected ? null : data.id) }

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]} name={`exhibit-${data.id}`}>
      {data.kind === 'frame' && (
        <group position={[0, 1.7, 0.17]}>
          <mesh castShadow onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} geometry={UNIT_BOX} scale={[2.2, 1.5, 0.08]} dispose={null}>            <meshStandardMaterial color="#1a1b20" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[2.0, 1.3]} />
            <meshStandardMaterial ref={glow} map={poster} emissive="#ffffff" emissiveMap={poster} emissiveIntensity={0.55} roughness={0.9} />
          </mesh>
        </group>
      )}
      {data.kind === 'pedestal' && (
        <group>
          {/* museum-white plinth — the old #2a2d34 box vanished against the dark floor */}
          <mesh castShadow receiveShadow position={[0, 0.55, 0]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} geometry={UNIT_BOX} scale={[0.8, 1.1, 0.8]} dispose={null}>            <meshStandardMaterial color="#DDD9CE" roughness={0.85} />
          </mesh>
          {/* accent rim under the top plate */}
          <mesh position={[0, 1.085, 0]} geometry={UNIT_BOX} scale={[0.84, 0.035, 0.84]} dispose={null}>            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} roughness={0.5} metalness={0.3} />
          </mesh>
          <group position={[0, 1.22, 0]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
            <Robot accent={accent} coreRef={glow} />
          </group>
        </group>
      )}
      {data.kind === 'screen' && (
        <group position={[0, 1.7, 0.17]}>
          <mesh castShadow onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} geometry={UNIT_BOX} scale={[2.6, 1.5, 0.1]} dispose={null}>            <meshStandardMaterial color="#0c0d11" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.056]}>
            <planeGeometry args={[2.45, 1.35]} />
            <meshStandardMaterial ref={glow} map={poster} emissive="#ffffff" emissiveMap={poster} emissiveIntensity={0.55} />
          </mesh>
        </group>
      )}

      {/* diegetic plaque */}
      <group position={[data.kind === 'pedestal' ? 0 : data.kind === 'screen' ? 1.82 : 1.45, data.kind === 'pedestal' ? 0.95 : 1.15, data.kind === 'pedestal' ? 0.5 : 0.17]} rotation={data.kind === 'pedestal' ? [-0.35, 0, 0] : [0, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.6, 0.3]} />
          <meshStandardMaterial map={plaque} emissive="#ffffff" emissiveMap={plaque} emissiveIntensity={0.25} roughness={0.8} />
        </mesh>
      </group>


      {hover && !selected && (
        <Html position={[0, 2.75, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="tip">{data.title}</div>
        </Html>
      )}
    </group>
  )
}
