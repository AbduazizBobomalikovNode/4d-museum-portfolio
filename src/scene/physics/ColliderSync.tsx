import { useEffect } from 'react'
import * as THREE from 'three'
import { useRapier, type RapierRigidBody } from '@react-three/rapier'
import { subscribeBodies } from './BodyContext'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _centre = new THREE.Vector3()
const _size = new THREE.Vector3()

/**
 * Stable-tree physics: instead of wrapping the world in <RigidBody>s (which re-parents it),
 * read the already-mounted `Body` groups and create one fixed body per group holding one
 * cuboid per visible mesh — the same shape set `<RigidBody colliders="cuboid">` derives
 * (bounding box of each mesh's geometry, scaled by its world transform), expressed in world
 * space. Rooms never move, so this is built once when physics starts.
 */
export function ColliderSync() {
  const { world, rapier } = useRapier()
  useEffect(() => {
    const made = new Map<THREE.Group, RapierRigidBody>()
    const add = (g: THREE.Group) => {
      if (made.has(g)) return
      const body = world.createRigidBody(rapier.RigidBodyDesc.fixed())
      g.updateWorldMatrix(true, true)
      g.traverseVisible((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const geo = m.geometry
        geo.computeBoundingBox()
        const bb = geo.boundingBox
        if (!bb) return
        bb.getSize(_size)
        bb.getCenter(_centre)
        m.matrixWorld.decompose(_pos, _quat, _scale)
        _centre.applyMatrix4(m.matrixWorld) // box centre in world space (offset follows rotation and scale)
        const desc = rapier.ColliderDesc.cuboid(
          (_size.x / 2) * Math.abs(_scale.x),
          (_size.y / 2) * Math.abs(_scale.y),
          (_size.z / 2) * Math.abs(_scale.z),
        )
          .setTranslation(_centre.x, _centre.y, _centre.z)
          .setRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w })
        world.createCollider(desc, body)
      })
      made.set(g, body)
    }
    const remove = (g: THREE.Group) => {
      const b = made.get(g)
      if (b) { world.removeRigidBody(b); made.delete(g) }
    }
    const off = subscribeBodies(add, remove)
    return () => {
      off()
      made.forEach((b) => { try { world.removeRigidBody(b) } catch { /* world already torn down */ } })
      made.clear()
    }
  }, [world, rapier])
  return null
}
