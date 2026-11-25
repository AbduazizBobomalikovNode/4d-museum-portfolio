import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { COLS, ROWS, buildLogoWall } from '@/lib/techlogos'
import { UNIT_BOX, UNIT_PLANE } from '@/lib/geo'
import { ANISO, mkCanvas } from '@/lib/tier'

/**
 * The technology wall in the Skills Lab: 62 official logos on a 16-column grid.
 *
 * Built once and cached at module level — the marks are fetched from the network, and a
 * StrictMode remount must not fire sixty requests a second time.
 */

let shared: ReturnType<typeof buildLogoWall> | null = null
const wall = () => (shared ??= buildLogoWall())

/** Room is 14m wide. 9.8m leaves real margin and keeps the whole grid inside one glance
 *  from the middle of the room. */
const WIDTH = 9.8
const HEIGHT = (WIDTH / COLS) * ROWS

export function LogoWall({
  position,
  rotationY = 0,
  title,
}: {
  position: [number, number, number]
  rotationY?: number
  title: string
}) {
  const { texture } = useMemo(() => wall(), [])
  const [, force] = useState(0)

  // the texture keeps filling in after mount; nudge a re-render so the first paint is not
  // the only one the material ever sees
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 700)
    const stop = setTimeout(() => clearInterval(t), 20000)
    return () => { clearInterval(t); clearTimeout(stop) }
  }, [])

  const titleTex = useMemo(() => {
    const { canvas: c, ctx } = mkCanvas(1024, 128)
    ctx.fillStyle = '#E8E6E0'
    ctx.font = '600 62px "Sora", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, 512, 88)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = ANISO
    return t
  }, [title])

  const backing = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b0d12', roughness: 0.6, metalness: 0.2 }),
    [],
  )

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* dark panel behind the grid so the marks sit on their own ground, not on plaster */}
      <mesh castShadow geometry={UNIT_BOX} scale={[WIDTH + 0.5, HEIGHT + 1.1, 0.12]} material={backing} dispose={null} />

      <mesh position={[0, HEIGHT / 2 + 0.34, 0.07]} geometry={UNIT_PLANE} scale={[4.4, 0.55, 1]} dispose={null}>
        <meshStandardMaterial map={titleTex} transparent emissive="#ffffff" emissiveMap={titleTex} emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[0, -0.12, 0.07]} geometry={UNIT_PLANE} scale={[WIDTH, HEIGHT, 1]} dispose={null}>
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.72}
          roughness={0.75}
        />
      </mesh>
    </group>
  )
}
