// ecctrl joystick (pulls the physics chunk) → only on touch devices in walk mode
const TouchControls = lazy(() => import('@/ui/TouchControls'))

import { Experience } from '@/scene/Experience'
import { EnterGate } from '@/ui/EnterGate'
import { Hud } from '@/ui/Hud'
import { InspectPanel } from '@/ui/InspectPanel'
import { BugReport } from '@/ui/BugReport'
import { Suspense, lazy } from 'react'
import { useStore } from '@/state/store'
import { isTouchDevice } from '@/lib/quality'

function TouchControlsGate() {
  const mode = useStore((s) => s.mode)
  const phase = useStore((s) => s.phase)
  if (!isTouchDevice() || mode !== 'walk' || phase !== 'live') return null
  return (
    <Suspense fallback={null}>
      <TouchControls />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <Experience />
      <Hud />
      <InspectPanel />
      <TouchControlsGate />
      <BugReport />
      <EnterGate />
    </>
  )
}
