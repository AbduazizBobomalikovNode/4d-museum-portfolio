import { createContext, useContext, type ReactNode } from 'react'

/**
 * Static-body abstraction so world geometry can render with or without a physics engine.
 * Rail mode: plain <group> (no rapier loaded at all).
 * Walk mode: PhysicsWorld provides a RigidBody-backed implementation.
 */
export type StaticBody = (props: { children: ReactNode }) => ReactNode

export const PlainBody: StaticBody = ({ children }) => <group>{children}</group>

export const BodyContext = createContext<StaticBody>(PlainBody)

export const useBody = () => useContext(BodyContext)
