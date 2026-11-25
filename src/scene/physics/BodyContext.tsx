import { createContext, useContext, type ReactNode } from 'react'
import type * as THREE from 'three'

/**
 * Static-body abstraction so world geometry can render with or without a physics engine.
 * Rail mode: plain <group> (no rapier loaded at all).
 * Walk mode: PhysicsWorld provides a RigidBody-backed implementation.
 */
export type StaticBody = (props: { children: ReactNode }) => ReactNode

export const PlainBody: StaticBody = ({ children }) => <group>{children}</group>

export const BodyContext = createContext<StaticBody>(PlainBody)

export const useBody = () => useContext(BodyContext)

/* ------------------------------------------------------------------------------------------
 * Stable mode (perfFlags.stableTree)
 *
 * The world is mounted ONCE and never re-parented. Every <Body> renders the same plain group
 * in rail and walk mode and just registers it here; `ColliderSync` (inside the lazy physics
 * chunk) turns the registered groups into fixed colliders when physics is on. This module must
 * stay free of rapier imports — it ships in the eager bundle.
 * ---------------------------------------------------------------------------------------- */

const bodies = new Set<THREE.Group>()
const listeners = new Set<{ add: (g: THREE.Group) => void; remove: (g: THREE.Group) => void }>()

const registerBody = (g: THREE.Group | null) => {
  if (!g) return
  bodies.add(g)
  listeners.forEach((l) => l.add(g))
  return () => {
    bodies.delete(g)
    listeners.forEach((l) => l.remove(g))
  }
}

export const StableBody: StaticBody = ({ children }) => <group ref={registerBody}>{children}</group>

/** Calls `add` for every body already registered and for each one that registers later. */
export function subscribeBodies(add: (g: THREE.Group) => void, remove: (g: THREE.Group) => void): () => void {
  const l = { add, remove }
  listeners.add(l)
  bodies.forEach(add)
  return () => { listeners.delete(l) }
}
