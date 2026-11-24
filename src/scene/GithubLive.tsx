import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { loadImg, paintProfile } from '@/lib/ghpaint'
import { loadGithub, onGithub } from '@/lib/github'
import { tr } from '@/lib/i18n'
import { useLang } from '@/lib/useT'
import { UNIT_BOX } from '@/lib/geo'

const USER = 'AbduazizBobomalikovNode'

/**
 * Live GitHub profile screen — pure WebGL: the card is painted into a POT
 * CanvasTexture on a mesh, so it depth-tests like any other 3D surface
 * (github.com refuses iframes, and DOM overlays float over walls).
 * Click opens the profile.
 */
export function GithubLive({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const { tex, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, 2048, 1024)
    ctx.fillStyle = '#8b949e'
    ctx.font = '48px "IBM Plex Mono", monospace'
    ctx.fillText('GitHub yuklanmoqda…', 760, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { tex, ctx }
  }, [])
  const painted = useRef(false)
  const lang = useLang()

  useEffect(() => {
    let alive = true
    let avatar: ImageBitmap | null = null
    const draw = async (snap: import('@/lib/github').GithubSnapshot) => {
      if (!avatar) avatar = await loadImg(snap.profile.avatar_url)
      if (!alive) return
      // only call it live when the API actually answered on this visit
      const label = snap.source === 'live'
        ? tr('ghLive', lang)
        : `${tr('ghCached', lang)} · ${new Date(snap.fetchedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')}`
      paintProfile(ctx, snap.profile, snap.repos, avatar, label)
      tex.needsUpdate = true
      painted.current = true
    }
    const off = onGithub((s) => void draw(s))
    void loadGithub()
    document.fonts?.ready.then(() => { if (alive && painted.current) tex.needsUpdate = true })
    return () => { alive = false; off() }
  }, [ctx, tex, lang])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow geometry={UNIT_BOX} scale={[5.2, 2.7, 0.12]} dispose={null}>        <meshStandardMaterial color="#0c0d11" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh
        position={[0, 0, 0.065]}
        onClick={(e) => { e.stopPropagation(); window.open(`https://github.com/${USER}`, '_blank') }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <planeGeometry args={[5.0, 2.5]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} roughness={0.7} />
      </mesh>
    </group>
  )
}
