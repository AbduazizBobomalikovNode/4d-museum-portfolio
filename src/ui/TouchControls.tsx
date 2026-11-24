import { useEffect, useState } from 'react'
import { Joystick } from 'ecctrl/input'

/**
 * Mobile joystick for free-walk mode. Look = drag on the right half (TouchLook).
 *
 * Placement follows the orientation. Held upright the thumb sits low and near the edge,
 * so the old fixed 28px/110px worked. Turned sideways the screen gets much wider and the
 * phone is held in two hands: the left thumb rests well inside the left half, not against
 * the bezel — so the joystick moves inboard and sits low —
 * measured at 151px from the edge and 131px from the bottom on a 844x390 screen, which is
 * where a left thumb falls when the phone is gripped in two hands. Safe-area insets are added on top, for notches in landscape.
 */
const isLandscape = () => window.innerWidth > window.innerHeight

export default function TouchControls() {
  const [landscape, setLandscape] = useState(isLandscape)

  useEffect(() => {
    const update = () => setLandscape(isLandscape())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  const wrapper: React.CSSProperties = landscape
    ? {
        position: 'fixed',
        left: 'calc(6vw + env(safe-area-inset-left, 0px))',
        bottom: 'calc(8vh + env(safe-area-inset-bottom, 0px))',
        zIndex: 22,
      }
    : {
        position: 'fixed',
        left: 'calc(26px + env(safe-area-inset-left, 0px))',
        bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        zIndex: 22,
      }

  return (
    <Joystick
      id="default"
      joystickMaxRadius={landscape ? 50 : 44}
      joystickWrapperStyle={wrapper}
      joystickBaseStyle={{ background: 'rgba(232,230,224,0.12)', border: '1px solid rgba(232,230,224,0.25)' }}
      joystickKnobStyle={{ background: 'rgba(242,180,65,0.9)' }}
    />
  )
}
