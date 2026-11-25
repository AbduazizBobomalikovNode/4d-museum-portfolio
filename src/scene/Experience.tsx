import { Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { KeyboardControls, PerformanceMonitor, Preload } from '@react-three/drei'
import { useStore } from '@/state/store'
import { canvasDpr } from '@/lib/tier'
import { World } from './World'
import { Lighting } from './Lighting'
import { RailCamera } from './player/RailCamera'
import { IntroCamera } from './player/IntroCamera'
import { keyboardMap } from '@/lib/keys'
import { TouchLook } from './player/TouchLook'
import { EscapeLadder } from './EscapeLadder'
import { perfFlags, perfMode } from '@/lib/perfFlags'
import { BodyContext, StableBody } from './physics/BodyContext'
import { perfEvent } from '@/lib/perfBus'
import { flushCritical, openGate, prewarmScene, setAssetRenderer } from '@/lib/assets'

const DEBUG = import.meta.env.VITE_DEBUG === '1' || import.meta.env.DEV

// Heavy chunks, loaded on demand: rapier+ecctrl only for free-walk, postprocessing only when quality allows it.
const loadPhysics = () => import('./physics/PhysicsWorld')
const PhysicsWorld = lazy(loadPhysics)
const Effects = lazy(() => import('./Effects'))
// ?perf=1 only — never part of a normal visit's work
const PerfProbe = perfMode ? lazy(() => import('@/perf/PerfProbe')) : null

/** How long after entering the visitor's frame times count towards quality demotion. */
const MONITOR_GRACE_MS = 4000
/** Wait this long after entering before fetching the physics chunk, so it never competes with the first seconds. */
const PREFETCH_DELAY_MS = 6000

/**
 * prefetchRapier: @react-three/rapier loads rapier's JS shell with its own dynamic import(), a separate tiny
 * chunk that otherwise costs one more round trip on the first press of M. Its hashed file name is only known
 * to the built PhysicsWorld chunk, so read it from there (production builds only; any failure is ignored).
 */
function warmRapierChunk() {
  try {
    const entry = performance.getEntriesByType('resource').find((r) => /\/PhysicsWorld-[\w-]+\.js/.test(r.name))
    if (!entry) return
    void fetch(entry.name).then((r) => r.text()).then((src) => {
      const m = /["'`](?:\.\/)?(rapier-[\w-]+\.js)["'`]/.exec(src)
      if (m) return import(/* @vite-ignore */ new URL(m[1], entry.name).href)
    }).catch(() => {})
  } catch { /* best effort */ }
}

/**
 * prefetchPhysics: the rapier chunk (~850 kB gz with its WASM) is otherwise fetched on the first
 * press of M, a visible wait. Once the visitor is inside and the scene is settled, pull it into the
 * module cache in idle time. Skipped on Save-Data / 2G links. Same `import()` as the lazy() above,
 * so pressing M later reuses the already-evaluated module.
 */
function PhysicsPrefetch() {
  const phase = useStore((s) => s.phase)
  useEffect(() => {
    if (!perfFlags.prefetchPhysics || phase !== 'live') return
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (c?.saveData || c?.effectiveType === 'slow-2g' || c?.effectiveType === '2g') return
    let cancelled = false
    let idle: number | undefined
    const run = () => {
      if (cancelled) return
      perfEvent('physics-prefetch-start')
      loadPhysics().then(() => {
        perfEvent('physics-prefetch-done')
        if (perfFlags.prefetchRapier) warmRapierChunk()
      }, () => { /* offline: M will retry the import */ })
    }
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(run, { timeout: 8000 })
      else run()
    }, PREFETCH_DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (idle !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle)
    }
  }, [phase])
  return null
}

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
      // lazyAssets: paint/load only the atrium + entrance before the gate (no-op when the flag is off)
      await flushCritical()
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
      openGate() // the rest of the assets now load in idle slices, nearest room first
      prewarmScene(scene) // and every texture gets its GPU upload in idle slices too (prewarm)
    }
    void run()
    return () => { cancelled = true }
  }, [gl, scene, camera, setPhase, setWarmup])
  return null
}

/**
 * Stable tree (default): the world is mounted once, at one fixed position, in every phase and mode.
 * Walk mode adds the lazy physics layer NEXT to it — colliders are built from the Body groups the
 * world registered (see physics/ColliderSync) — so toggling rail<->walk never rebuilds ~500 meshes.
 */
function StableStage() {
  const mode = useStore((s) => s.mode)
  const phase = useStore((s) => s.phase)
  const live = phase === 'live'
  return (
    <>
      <BodyContext.Provider value={StableBody}>
        <Lighting />
        <World />
      </BodyContext.Provider>
      {live && mode === 'walk' && (
        <Suspense fallback={null}>
          <PhysicsWorld />
        </Suspense>
      )}
      {/* the gate runs its own cinematic orbit; RailCamera takes over the moment the visitor enters */}
      {!live ? <IntroCamera /> : mode === 'rail' ? <RailCamera /> : <TouchLook />}
      {live && <EscapeLadder />}
    </>
  )
}

/** Legacy shape (`?opt=off` / `?optOff=stableTree`). Rail: plain world, no physics. Walk: world wrapped in lazy PhysicsWorld. */
function LegacyStage() {
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


function Stage() {
  return perfFlags.stableTree ? <StableStage /> : <LegacyStage />
}

function SceneSettings() {
  const { gl, scene, camera } = useThree()
  useEffect(() => { if (DEBUG) (window as unknown as { __cam: THREE.Camera }).__cam = camera }, [camera])
  useEffect(() => { if (DEBUG) (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl as THREE.WebGLRenderer }, [gl])
  // noPreserveBuffer: the canvas no longer keeps its backbuffer, so the bug reporter asks for one
  // synchronous frame right before it reads the pixels (same task => never blank).
  const advance = useThree((s) => s.advance)
  useEffect(() => { setAssetRenderer(gl as THREE.WebGLRenderer) }, [gl])
  useEffect(() => {
    if (!perfFlags.noPreserveBuffer) return
    const w = window as unknown as { __renderForCapture?: () => void }
    w.__renderForCapture = () => advance(performance.now())
    return () => { delete w.__renderForCapture }
  }, [advance])
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
  const dpr = useMemo(() => canvasDpr(), [])
  // monitorAfterEnter: when the visitor entered (0 = not yet)
  const liveAt = useRef(0)
  useEffect(() => useStore.subscribe((s) => s.phase, (p) => { if (p === 'live') liveAt.current = performance.now() }), [])

  return (
    <Canvas
      shadows={false}
      dpr={dpr}
      performance={{ min: 1 }}
      camera={{ fov: 62, near: 0.1, far: 120, position: [0, 1.6, 44] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: !perfFlags.noPreserveBuffer }}
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
        onDecline={() => {
          // a demotion is permanent (there is no onIncline), so the shader-compile stalls before the
          // visitor has entered, and the first seconds after, must not count
          const live = useStore.getState().phase === 'live' && liveAt.current > 0 && performance.now() - liveAt.current > MONITOR_GRACE_MS
          if (perfFlags.monitorAfterEnter && !live) { perfEvent('decline-ignored'); return }
          perfEvent('decline')
          if (quality === 'high') setQuality('medium'); else if (quality === 'medium') setQuality('low')
        }}
      />
      <PhysicsPrefetch />
      <Suspense fallback={null}>
        <KeyboardControls map={keyboardMap}>
          <Stage />
        </KeyboardControls>
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
        <Preload all />
        <ReadyProbe />
        {PerfProbe && <PerfProbe />}
      </Suspense>
    </Canvas>
  )
}
