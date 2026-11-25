import * as React from 'react'
import * as THREE from 'three'
import { perfFlags } from '@/lib/perfFlags'
import { extend, useFrame, useThree } from '@react-three/fiber'
import type { MeshReflectorMaterial as DreiReflector } from '@react-three/drei'
import { BlurPass } from '@react-three/drei/materials/BlurPass.js'
import { MeshReflectorMaterial as ReflectorImpl } from '@react-three/drei/materials/MeshReflectorMaterial.js'

type DreiProps = React.ComponentProps<typeof DreiReflector>
export type CullableReflectorProps = DreiProps & {
  /**
   * Asked once per frame before the reflection pass; return false to skip the extra scene
   * render (the mesh and material stay mounted, so no program is ever rebuilt).
   */
  shouldRender?: (reflector: THREE.Object3D) => boolean
}

/**
 * Line-for-line copy of drei 10.7's `MeshReflectorMaterial` (same impl class, same shader, same
 * render targets, same per-frame maths) with ONE addition: `shouldRender`. drei registers its
 * reflection pass in a private `useFrame`, so there is no other way to skip it without
 * unmounting the mesh — and unmounting would recompile the program when it comes back.
 * Used only when `perfFlags.reflectorCull` is on; otherwise ReflectiveFloor keeps using drei's.
 */
export const CullableReflectorMaterial = React.forwardRef<React.ElementRef<typeof DreiReflector>, CullableReflectorProps>(({
  mixBlur = 0,
  mixStrength = 1,
  resolution = 256,
  blur = [0, 0],
  minDepthThreshold = 0.9,
  maxDepthThreshold = 1,
  depthScale = 0,
  depthToBlurRatioBias = 0.25,
  mirror = 0,
  distortion = 1,
  mixContrast = 1,
  distortionMap,
  reflectorOffset = 0,
  shouldRender,
  ...props
}, ref) => {
  extend({ MeshReflectorMaterialImpl: ReflectorImpl })
  const gl = useThree(({ gl }) => gl)
  const camera = useThree(({ camera }) => camera)
  const scene = useThree(({ scene }) => scene)
  blur = Array.isArray(blur) ? blur : [blur, blur]
  const hasBlur = blur[0] + blur[1] > 0
  const blurX = blur[0]
  const blurY = blur[1]
  const materialRef = React.useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  React.useImperativeHandle(ref, () => materialRef.current, [])
  const [reflectorPlane] = React.useState(() => new THREE.Plane())
  const [normal] = React.useState(() => new THREE.Vector3())
  const [reflectorWorldPosition] = React.useState(() => new THREE.Vector3())
  const [cameraWorldPosition] = React.useState(() => new THREE.Vector3())
  const [rotationMatrix] = React.useState(() => new THREE.Matrix4())
  const [lookAtPosition] = React.useState(() => new THREE.Vector3(0, 0, -1))
  const [clipPlane] = React.useState(() => new THREE.Vector4())
  const [view] = React.useState(() => new THREE.Vector3())
  const [target] = React.useState(() => new THREE.Vector3())
  const [q] = React.useState(() => new THREE.Vector4())
  const [textureMatrix] = React.useState(() => new THREE.Matrix4())
  const [virtualCamera] = React.useState(() => new THREE.PerspectiveCamera())

  const beforeRender = React.useCallback(() => {
    const parent = materialRef.current.parent || materialRef.current?.__r3f?.parent?.object
    if (!parent) return
    reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)
    rotationMatrix.extractRotation(parent.matrixWorld)
    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)
    reflectorWorldPosition.addScaledVector(normal, reflectorOffset)
    view.subVectors(reflectorWorldPosition, cameraWorldPosition)
    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return
    view.reflect(normal).negate()
    view.add(reflectorWorldPosition)
    rotationMatrix.extractRotation(camera.matrixWorld)
    lookAtPosition.set(0, 0, -1)
    lookAtPosition.applyMatrix4(rotationMatrix)
    lookAtPosition.add(cameraWorldPosition)
    target.subVectors(reflectorWorldPosition, lookAtPosition)
    target.reflect(normal).negate()
    target.add(reflectorWorldPosition)
    virtualCamera.position.copy(view)
    virtualCamera.up.set(0, 1, 0)
    virtualCamera.up.applyMatrix4(rotationMatrix)
    virtualCamera.up.reflect(normal)
    virtualCamera.lookAt(target)
    virtualCamera.far = camera.far // Used in WebGLBackground
    virtualCamera.updateMatrixWorld()
    virtualCamera.projectionMatrix.copy((camera as THREE.PerspectiveCamera).projectionMatrix)
    // Update the texture matrix
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    textureMatrix.multiply(virtualCamera.projectionMatrix)
    textureMatrix.multiply(virtualCamera.matrixWorldInverse)
    textureMatrix.multiply(parent.matrixWorld)
    // Oblique near-plane clipping (http://www.terathon.com/lengyel/Lengyel-Oblique.pdf)
    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)
    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)
    const projectionMatrix = virtualCamera.projectionMatrix
    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    q.z = -1.0
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))
    projectionMatrix.elements[2] = clipPlane.x
    projectionMatrix.elements[6] = clipPlane.y
    projectionMatrix.elements[10] = clipPlane.z + 1.0
    projectionMatrix.elements[14] = clipPlane.w
  }, [camera, reflectorOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const [fbo1, fbo2, blurpass, reflectorProps] = React.useMemo(() => {
    const parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    }
    const fbo1 = new THREE.WebGLRenderTarget(resolution, resolution, parameters)
    fbo1.depthBuffer = true
    fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution)
    fbo1.depthTexture.format = THREE.DepthFormat
    fbo1.depthTexture.type = THREE.UnsignedShortType
    const fbo2 = new THREE.WebGLRenderTarget(resolution, resolution, parameters)
    const blurpass = new BlurPass({
      gl,
      resolution,
      width: blurX,
      height: blurY,
      minDepthThreshold,
      maxDepthThreshold,
      depthScale,
      depthToBlurRatioBias,
    })
    const reflectorProps = {
      mirror,
      textureMatrix,
      mixBlur,
      tDiffuse: fbo1.texture,
      tDepth: fbo1.depthTexture,
      tDiffuseBlur: fbo2.texture,
      hasBlur,
      mixStrength,
      minDepthThreshold,
      maxDepthThreshold,
      depthScale,
      depthToBlurRatioBias,
      distortion,
      distortionMap,
      mixContrast,
      'defines-USE_BLUR': hasBlur ? '' : undefined,
      'defines-USE_DEPTH': depthScale > 0 ? '' : undefined,
      'defines-USE_DISTORTION': distortionMap ? '' : undefined,
    }
    return [fbo1, fbo2, blurpass, reflectorProps] as const
  }, [gl, blurX, blurY, textureMatrix, resolution, mirror, hasBlur, mixBlur, mixStrength, minDepthThreshold, maxDepthThreshold, depthScale, depthToBlurRatioBias, distortion, distortionMap, mixContrast])

  // reflectorDispose: drei never frees these, so every rail<->walk cycle leaked 2 colour targets, a depth
  // texture and the blur pass's pair (~5 textures + their GPU memory)
  React.useEffect(() => {
    if (!perfFlags.reflectorDispose) return
    return () => {
      fbo1.depthTexture?.dispose()
      fbo1.dispose()
      fbo2.dispose()
      blurpass.renderTargetA.dispose()
      blurpass.renderTargetB.dispose()
      blurpass.convolutionMaterial.dispose()
    }
  }, [fbo1, fbo2, blurpass])

  useFrame(() => {
    const parent = materialRef.current.parent || materialRef.current?.__r3f?.parent?.object
    if (!parent) return
    // the one difference from drei: nothing to reflect for a floor nobody can see
    if (shouldRender && !shouldRender(parent)) return
    parent.visible = false
    const currentXrEnabled = gl.xr.enabled
    const currentShadowAutoUpdate = gl.shadowMap.autoUpdate
    beforeRender()
    gl.xr.enabled = false
    gl.shadowMap.autoUpdate = false
    gl.setRenderTarget(fbo1)
    gl.state.buffers.depth.setMask(true)
    if (!gl.autoClear) gl.clear()
    gl.render(scene, virtualCamera)
    if (hasBlur) blurpass.render(gl, fbo1, fbo2)
    gl.xr.enabled = currentXrEnabled
    gl.shadowMap.autoUpdate = currentShadowAutoUpdate
    parent.visible = true
    gl.setRenderTarget(null)
  })

  return React.createElement('meshReflectorMaterialImpl', {
    attach: 'material',
    // Defines can't be updated dynamically, so the material is recreated
    key: 'key' + reflectorProps['defines-USE_BLUR'] + reflectorProps['defines-USE_DEPTH'] + reflectorProps['defines-USE_DISTORTION'],
    ref: materialRef,
    ...reflectorProps,
    ...props,
  })
})
