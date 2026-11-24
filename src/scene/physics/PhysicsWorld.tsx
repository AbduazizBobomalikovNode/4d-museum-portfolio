import type { ReactNode } from 'react'
import { Physics, RigidBody } from '@react-three/rapier'
import { BodyContext, type StaticBody } from './BodyContext'
import { FreeWalk } from '../player/FreeWalk'

const RapierBody: StaticBody = ({ children }) => (
  <RigidBody type="fixed" colliders="cuboid">{children}</RigidBody>
)

/**
 * Lazy-loaded chunk: rapier WASM + ecctrl. Mounted only in free-walk mode.
 * Fixed timestep + CCD on the character — never "vary" (tunnels through thin floors on slow frames).
 */
export default function PhysicsWorld({ children }: { children: ReactNode }) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} maxCcdSubsteps={2} debug={import.meta.env.VITE_PHYSICS_DEBUG === '1'}>
      <BodyContext.Provider value={RapierBody}>{children}</BodyContext.Provider>
      <FreeWalk />
    </Physics>
  )
}
