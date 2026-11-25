import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { UNIT_BOX, UNIT_PLANE, asset } from '@/lib/geo'
import { ANISO, ANISO_MAX, mkCanvas } from '@/lib/tier'

/**
 * The CV, framed on the wall of the Gift Shop, with a download button under it.
 *
 * The page is a high-res JPEG rendered from the PDF (2048×2897). It renders unlit
 * (meshBasicMaterial, toneMapped=false) so paper stays white and ink stays black under
 * AgX instead of washing out to grey. It is not tinted on hover: in free walk the
 * crosshair rests on the page the whole time someone is reading it.
 *
 * The button hands over the actual PDF; clicking the page opens it in a new tab. Both
 * textures go through the R3F loader cache so `<Preload all />` warms them; a texture
 * that arrives later would swap the material and cost a recompile mid-walk.
 */

const PAGE = asset('cv-preview.jpg')
const PDF = asset('cv-bobomalikov.pdf')

/** A4 proportions, as the render is (2048×2897). */
const PH = 3.0
const PW = PH * (2048 / 2897)
const BTN_W = 1.6
const BTN_H = 0.32

function buttonTexture(): THREE.CanvasTexture {
  const { canvas: c, ctx } = mkCanvas(512, 128)
  const g = ctx.createLinearGradient(0, 0, 512, 128)
  g.addColorStop(0, '#F2B441')
  g.addColorStop(1, '#E08D2F')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = '#14100a'
  ctx.font = '700 44px "Sora", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CV yuklab olish ↓', 256, 82)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = ANISO
  return t
}

function labelTexture(): THREE.CanvasTexture {
  const { canvas: c, ctx } = mkCanvas(512, 128)
  ctx.fillStyle = '#E8E6E0'
  ctx.font = '700 42px "Sora", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Rezyume', 256, 52)
  ctx.fillStyle = '#8b93a3'
  ctx.font = '400 26px "Sora", system-ui, sans-serif'
  ctx.fillText('Bobomalikov Abduaziz · PDF', 256, 92)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = ANISO
  return t
}

export function CvWall({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const page = useTexture(PAGE)
  const [hover, setHover] = useState(false)
  const { gl } = useThree()

  useEffect(() => {
    page.colorSpace = THREE.SRGBColorSpace
    page.generateMipmaps = true
    page.minFilter = THREE.LinearMipmapLinearFilter
    page.magFilter = THREE.LinearFilter
    page.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), ANISO_MAX)
    page.needsUpdate = true
  }, [page, gl])

  const btnTex = useMemo(() => buttonTexture(), [])
  const labelTex = useMemo(() => labelTexture(), [])
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0c0d11', roughness: 0.42, metalness: 0.36 }),
    [],
  )

  const download = useCallback(() => {
    const a = document.createElement('a')
    a.href = PDF
    a.download = 'Bobomalikov-Abduaziz-CV.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [])

  const openPdf = useCallback(() => {
    window.open(PDF, '_blank', 'noopener')
  }, [])

  // first-person has no cursor — FreeWalk's centre raycast drives button + page click
  const btnRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const m = btnRef.current
    if (!m) return
    m.userData.onUvHit = () => download()
    m.userData.onUvHover = (uv: THREE.Vector2 | null) => setHover(!!uv)
    return () => { delete m.userData.onUvHit; delete m.userData.onUvHover }
  }, [download])

  const pageRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const m = pageRef.current
    if (!m) return
    m.userData.onUvHit = () => openPdf()
    return () => { delete m.userData.onUvHit }
  }, [openPdf])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow geometry={UNIT_BOX} scale={[PW + 0.3, PH + 0.94, 0.1]} material={frame} dispose={null} />

      <mesh position={[0, PH / 2 + 0.24, 0.056]} geometry={UNIT_PLANE} scale={[1.6, 0.34, 1]} dispose={null}>
        <meshStandardMaterial map={labelTex} transparent emissive="#ffffff" emissiveMap={labelTex} emissiveIntensity={0.5} />
      </mesh>

      <mesh
        ref={pageRef}
        name="cv-page"
        position={[0, 0.06, 0.056]}
        geometry={UNIT_PLANE}
        scale={[PW, PH, 1]}
        dispose={null}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); openPdf() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        {/* Unlit + untone-mapped: paper white and ink black stay true under AgX
            instead of the scene's lighting washing the scan out to grey. */}
        <meshBasicMaterial map={page} toneMapped={false} />
      </mesh>

      <mesh
        ref={btnRef}
        name="cv-download"
        position={[0, -PH / 2 - 0.2, 0.056]}
        geometry={UNIT_PLANE}
        scale={[BTN_W, BTN_H, 1]}
        dispose={null}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); download() }}
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto' }}
      >
        <meshStandardMaterial
          map={btnTex}
          emissive="#ffffff"
          emissiveMap={btnTex}
          emissiveIntensity={hover ? 0.9 : 0.62}
          roughness={0.66}
        />
      </mesh>
    </group>
  )
}

useTexture.preload(PAGE)
