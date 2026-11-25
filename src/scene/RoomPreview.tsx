import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { rooms } from '@/data/rooms'
import { perfFlags } from '@/lib/perfFlags'
import { boxMaybeInView } from '@/lib/viewCull'

const RT_W = 384
const RT_H = 216
const ORBIT = 0.11 // rad/s — slow motion, the room drifts rather than spins

/**
 * A live 3D view of one room, rendered off-screen and shown on the quick-travel board.
 *
 * Cost control: the previews take turns. Each instance only renders on the frame where
 * `(frame + slot) % rooms.length === 0`, so the whole board adds exactly one small render
 * pass per frame no matter how many cards there are — and each card refreshes ~7×/s,
 * which is the slow-motion cadence the board wants anyway.
 *
 * Room culling hides distant rooms from the main pass; the target room is force-shown for
 * the duration of its shot and restored immediately, so React never sees the change.
 */
export function RoomPreview({
  slot,
  active,
  position,
  size,
  accent,
}: {
  /** Index into `rooms` — also this preview's turn in the round-robin. */
  slot: number
  active: boolean
  position: [number, number, number]
  size: [number, number]
  fx?: string
  seed?: number
  accent?: string
}) {
  const { scene } = useThree()
  const room = rooms[slot]

  const target = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(RT_W, RT_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    })
    rt.texture.colorSpace = THREE.SRGBColorSpace
    return rt
  }, [])
  useEffect(() => () => target.dispose(), [target])

  const cam = useMemo(() => new THREE.PerspectiveCamera(60, RT_W / RT_H, 0.1, 70), [])
  const tick = useRef(0)
  const gates = useRef<THREE.Object3D[] | null>(null)
  const wasVisible = useRef<boolean[]>([])
  const drawn = useRef(false)
  const boardRef = useRef<THREE.Object3D | null>(null)
  const boardBox = useRef<THREE.Box3 | null>(null)

  useFrame((state) => {
    tick.current++
    // one preview per frame — the round-robin also staggers the very first shots,
    // so loading the museum never pays for eight passes at once
    if (tick.current % rooms.length !== slot) return
    // every card gets one still even where motion is off (low tier, or away from the
    // entrance); without it those cards would stay black
    if (drawn.current && !active) return
    // previewCull: the board is one glass pane in the entrance hall. While it is outside the
    // view (other end of the hall, looking away, another room) nobody can see the shots, so skip
    // the pass. Wide slack: the stills resume a few frames before the board scrolls back in.
    if (drawn.current && perfFlags.previewCull) {
      if (!boardBox.current) {
        const glass = scene.getObjectByName('nav-glass')
        if (glass) {
          glass.updateWorldMatrix(true, false)
          boardBox.current = new THREE.Box3().setFromObject(glass).expandByScalar(0.3)
        }
      }
      if (boardBox.current && !boxMaybeInView(state.camera, boardBox.current, 1.6)) return
    }

    const t = state.clock.elapsedTime * ORBIT + slot * 1.9
    const radius = Math.min(room.size[0], room.size[1]) * 0.3
    cam.position.set(
      room.center[0] + Math.sin(t) * radius,
      room.floorY + 2.3,
      room.center[1] + Math.cos(t) * radius,
    )
    cam.lookAt(room.center[0] - Math.sin(t) * 2.5, room.floorY + 1.5, room.center[1] - Math.cos(t) * 2.5)

    // Show only the room being shot. Revealing every hidden group instead would submit the
    // whole museum for each pass, and there are eight passes a second.
    if (!gates.current) {
      const list: THREE.Object3D[] = []
      scene.traverse((o) => { if (o.userData?.roomGate) list.push(o) })
      gates.current = list
    }
    const gs = gates.current
    const was = wasVisible.current
    for (let k = 0; k < gs.length; k++) {
      was[k] = gs[k].visible
      gs[k].visible = gs[k].userData.roomGate === room.id
    }
    // the board must not appear inside its own entrance card
    const board = boardRef.current ?? (boardRef.current = scene.getObjectByName('nav-board') ?? null)
    const boardWas = board?.visible ?? false
    if (board) board.visible = false

    const gl = state.gl
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(target)
    gl.render(scene, cam)
    gl.setRenderTarget(prev)

    if (board) board.visible = boardWas
    for (let k = 0; k < gs.length; k++) gs[k].visible = was[k]
    drawn.current = true
  }, -2) // ahead of the main pass, so the board shows this frame's shot

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={target.texture} toneMapped={false} />
      </mesh>
      {/* thin accent edge behind the picture so each still reads as a framed window */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[size[0] + 0.008, size[1] + 0.008]} />
        <meshBasicMaterial color={accent ?? '#F2B441'} transparent opacity={0.45} toneMapped={false} />
      </mesh>
    </group>
  )
}
