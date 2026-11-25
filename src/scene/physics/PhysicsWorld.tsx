import { useEffect, type ReactNode } from 'react'
import { Physics, RigidBody } from '@react-three/rapier'
import { BodyContext, type StaticBody } from './BodyContext'
import { FreeWalk } from '../player/FreeWalk'
import { ColliderSync } from './ColliderSync'
import { PerfColliders } from './PerfColliders'
import { perfEvent } from '@/lib/perfBus'
import { perfMode } from '@/lib/perfFlags'

const RapierBody: StaticBody = ({ children }) => (
  <RigidBody type="fixed" colliders="cuboid">{children}</RigidBody>
)

/**
 * Lazy-loaded chunk: rapier WASM + ecctrl. Mounted only in free-walk mode.
 * Fixed timestep + CCD on the character — never "vary" (tunnels through thin floors on slow frames).
 *
 * Two shapes:
 *  - with `children` (legacy, `?opt=off`): the world is rendered INSIDE <Physics> and every Body
 *    becomes a <RigidBody>. That re-parents the world, i.e. a full remount on every toggle.
 *  - without children (stableTree): the world stays where it is; `ColliderSync` builds the
 *    colliders from the Body groups it registered.
 */
export default function PhysicsWorld({ children }: { children?: ReactNode }) {
  useEffect(() => { perfEvent('physics-mounted') }, [])
  const stable = children === undefined
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} maxCcdSubsteps={2} debug={import.meta.env.VITE_PHYSICS_DEBUG === '1'}>
      {stable ? <ColliderSync /> : <BodyContext.Provider value={RapierBody}>{children}</BodyContext.Provider>}
      {perfMode && <PerfColliders />}
      <FreeWalk />
    </Physics>
  )
}
