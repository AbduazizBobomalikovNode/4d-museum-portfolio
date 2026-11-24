import { Suspense, lazy, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { KeyboardControls, PerformanceMonitor, Preload } from '@react-three/drei'
import { useStore } from '@/state/store'
import { detectQuality, qualityPreset } from '@/lib/quality'
import { World } from './World'
import { Lighting } from './Lighting'
import { RailCamera } from './player/RailCamera'
import { IntroCamera } from './player/IntroCamera'
import { keyboardMap } from '@/lib/keys'
import { TouchLook } from './player/TouchLook'
import { EscapeLadder } from './EscapeLadder'

const DEBUG = import.meta.env.VITE_DEBUG === '1' || import.meta.env.DEV

// Heavy chunks, loaded on demand: rapier+ecctrl only for free-walk, postprocessing only when quality allows it.
const PhysicsWorld = lazy(() => import('./physics/PhysicsWorld'))
const Effects = lazy(() => import('./Effects'))

/**
 * Compiles every material once while the whole museum is still visible, then drops the
 * warm-up flag (which turns room culling on) and opens the gate. Without this the first
 * walk into a room pays for shader compilation mid-frame.
 */
function ReadyProbe() {
  const setPhase = useStore((s) => s.setPhase)
  const setWarmup = useStore((s) => s.setWarmup)
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await new Promise((r) => requestAnimationFrame(r))
      if (cancelled) return
      try {
        const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Scene, c: THREE.Camera) => Promise<unknown> }
        // cap the wait: on a slow GPU the remaining shaders finish during the gate screen
        // instead of holding the visitor on "Loading…" for ten seconds
        if (r.compileAsync) {
          await Promise.race([
            r.compileAsync(scene, camera),
            new Promise((res) => setTimeout(res, 6000)),
          ])
        } else r.compile(scene, camera)
      } catch { /* compile is best-effort */ }
      if (cancelled) return
      setWarmup(false)
      setPhase('gate')
    }
    void run()
    return () => { cancelled = true }
  }, [gl, scene, camera, setPhase, setWarmup])
  return null
}

/** Rail: plain world, no physics. Walk: world wrapped in lazy PhysicsWorld (colliders + ecctrl). */
function Stage() {
  const mode = useStore((s) => s.mode)
  const phase = useStore((s) => s.phase)
  const content = (
    <>
      <Lighting />
      <World />
    </>
  )
  // the gate runs its own cinematic orbit; RailCamera takes over the moment the visitor enters
  if (phase !== 'live') {
    return (
      <>
        {content}
        <IntroCamera />
      </>
    )
  }
  if (mode === 'rail') {
    return (
      <>
        {content}
        <RailCamera />
        <EscapeLadder />
      </>
    )
  }
  return (
    <>
      <Suspense fallback={content}>
        <PhysicsWorld>{content}</PhysicsWorld>
      </Suspense>
      <TouchLook />
      <EscapeLadder />
    </>
  )
}

function SceneSettings() {
  const { gl, scene, camera } = useThree()
  useEffect(() => { if (DEBUG) (window as unknown as { __cam: THREE.Camera }).__cam = camera }, [camera])
  useEffect(() => { if (DEBUG) (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl as THREE.WebGLRenderer }, [gl])
  useEffect(() => {
    gl.toneMapping = THREE.AgXToneMapping
    gl.toneMappingExposure = 1.15
    scene.background = new THREE.Color('#07080a')
    scene.fog = new THREE.FogExp2('#07080a', 0.014)
    if (DEBUG) (window as unknown as { __scene: THREE.Scene }).__scene = scene
  }, [gl, scene])
  return null
}

export function Experience() {
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  // fixed for the session: changing dpr resizes the canvas and rebuilds every render target
  const dpr = useMemo(() => qualityPreset[detectQuality()].dpr, [])

  return (
    <Canvas
      shadows={false}
      dpr={dpr}
      performance={{ min: 1 }}
      camera={{ fov: 62, near: 0.1, far: 120, position: [0, 1.6, 44] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: true }}
      style={{ position: 'fixed', inset: 0 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#07080a')
        // each check is a blocking getProgramInfoLog round-trip
        gl.debug.checkShaderErrors = import.meta.env.DEV
      }}
    >
      <SceneSettings />
      <PerformanceMonitor
        bounds={() => [30, 58]}
        flipflops={3}
        onDecline={() => { if (quality === 'high') setQuality('medium'); else if (quality === 'medium') setQuality('low') }}
      />
      <Suspense fallback={null}>
        <KeyboardControls map={keyboardMap}>
          <Stage />
        </KeyboardControls>
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
        <Preload all />
        <ReadyProbe />
      </Suspense>
    </Canvas>
  )
}
