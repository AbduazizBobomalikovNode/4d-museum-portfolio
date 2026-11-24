import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { nearestU } from '@/lib/rail'
import { useStore } from '@/state/store'

/** Two presses per rung, and they must be close together to count as a pair. */
const PAIR = 2
const WINDOW = 1600

/**
 * Esc steps back out of the museum one rung at a time, two presses per rung:
 *
 *   free walk  →  guided rail, picked up at the spot you were standing on
 *   rail        →  back to the start of the route
 *   at start    →  the front page
 *
 * Why two presses: while the pointer is locked the browser eats the first Esc to release
 * it and never delivers a keydown, so a single press means different things depending on
 * whether you are locked. Counting the lock release as a press makes the gesture identical
 * either way — and the pair also stops a stray Esc from dropping someone out of the museum.
 *
 * Panels own Esc while they are open (inspect, bug report, the feedback form); this only
 * acts once they are all closed.
 */
export function EscapeLadder() {
  const { camera } = useThree()
  const presses = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    const step = () => {
      const s = useStore.getState()
      if (s.mode === 'walk') {
        // Rejoin the route where the walker is standing. Set it in one write rather than
        // calling setMode('rail'), which snaps u to the current room's entry waypoint and
        // would undo exactly the position we are trying to keep.
        const u = nearestU(camera.position)
        useStore.setState({ mode: 'rail', railU: u, railTarget: u, inspectId: null })
        return
      }
      if (s.railU > 0.015 || s.railTarget > 0.015) {
        s.setRailTarget(0)
        s.setRailU(0)
        return
      }
      s.setPhase('gate')
    }

    // Leaving fullscreen is also an Esc the browser swallows — but that press meant
    // "give me my window back", not "take me out of the museum". Ignore presses around it.
    const fsChanged = { at: 0 }
    const onFullscreen = () => {
      fsChanged.at = performance.now()
      presses.current = 0
    }

    const press = () => {
      if (performance.now() - fsChanged.at < 400) { presses.current = 0; return }
      const s = useStore.getState()
      if (s.phase !== 'live' || s.reportOpen || s.formOpen || s.inspectId) {
        presses.current = 0
        return
      }
      const now = performance.now()
      presses.current = now - last.current > WINDOW ? 1 : presses.current + 1
      last.current = now
      if (presses.current >= PAIR) {
        presses.current = 0
        step()
      }
    }

    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') press() }
    // leaving pointer lock is how the browser reports the first Esc of a pair
    const onLock = () => { if (!document.pointerLockElement) press() }

    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerlockchange', onLock)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerlockchange', onLock)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [camera])

  return null
}
