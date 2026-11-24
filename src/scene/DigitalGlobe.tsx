import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import { asset } from '@/lib/geo'

const R = 1.6
const DEG = Math.PI / 180

/**
 * lat/lon → point on the sphere, aligned with three's SphereGeometry equirect UVs
 * (lon 0 → +x, lon 90°E → −z), so overlays land on the textured map.
 */
function onSphere(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi = lat * DEG
  const lam = lon * DEG
  return new THREE.Vector3(r * Math.cos(phi) * Math.cos(lam), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lam))
}

/** Uzbekistan border — real GeoJSON ring (world.geo.json UZB), simplified to 54 pts. */
const UZ: [number, number][] = [
  [66.519, 37.363],
  [66.546, 37.975],
  [65.216, 38.403],
  [64.170, 38.892],
  [63.518, 39.363],
  [62.374, 40.054],
  [61.883, 41.085],
  [61.547, 41.266],
  [60.466, 41.220],
  [60.083, 41.425],
  [59.976, 42.223],
  [58.629, 42.752],
  [57.787, 42.171],
  [56.932, 41.826],
  [57.096, 41.322],
  [55.968, 41.309],
  [55.929, 44.996],
  [58.503, 45.587],
  [58.690, 45.500],
  [60.240, 44.784],
  [61.058, 44.406],
  [62.013, 43.504],
  [63.186, 43.650],
  [64.901, 43.728],
  [66.098, 42.998],
  [66.023, 41.995],
  [66.511, 41.988],
  [66.714, 41.168],
  [67.986, 41.136],
  [68.260, 40.662],
  [68.632, 40.669],
  [69.070, 41.384],
  [70.389, 42.081],
  [70.962, 42.266],
  [71.259, 42.168],
  [70.420, 41.520],
  [71.158, 41.144],
  [71.870, 41.393],
  [73.055, 40.866],
  [71.775, 40.146],
  [71.014, 40.244],
  [70.601, 40.219],
  [70.458, 40.496],
  [70.667, 40.960],
  [69.329, 40.728],
  [69.012, 40.086],
  [68.536, 39.533],
  [67.701, 39.580],
  [67.442, 39.140],
  [68.176, 38.902],
  [68.392, 38.157],
  [67.830, 37.145],
  [67.076, 37.356],
  [66.519, 37.363],
]
const UZ_CENTER = { lat: 41.4, lon: 64.6 }
const TASHKENT = { lat: 41.31, lon: 69.28 }

let labelTex: THREE.CanvasTexture | null = null
/** "UZBEKISTAN" label (POT 512×128, transparent, amber glow). */
function uzLabelTexture(): THREE.CanvasTexture {
  if (labelTex) return labelTex
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#F2B441'
  ctx.shadowBlur = 18
  ctx.fillStyle = '#FFE7B0'
  let size = 72
  ctx.font = `800 ${size}px "Sora", system-ui, sans-serif`
  while (size > 30 && ctx.measureText('UZBEKISTAN').width > 440) {
    size -= 2
    ctx.font = `800 ${size}px "Sora", system-ui, sans-serif`
  }
  ctx.fillText('UZBEKISTAN', 256, 64)
  labelTex = new THREE.CanvasTexture(c)
  labelTex.colorSpace = THREE.SRGBColorSpace
  labelTex.anisotropy = 8
  return labelTex
}

const PLANET_TEXTURES = [
  asset('textures/planets/earth_atmos_2048.jpg'),
  asset('textures/planets/earth_lights_2048.png'),
  asset('textures/planets/earth_clouds_1024.png'),
  asset('textures/planets/earth_specular_2048.jpg'),
]
useTexture.preload(PLANET_TEXTURES)

function Earth({ speed }: { speed: number }) {
  const group = useRef<THREE.Group>(null)
  const clouds = useRef<THREE.Mesh>(null)
  const beaconHead = useRef<THREE.Mesh>(null)

  const [day, lights, cloudsMap, specular] = useTexture(PLANET_TEXTURES)
  day.colorSpace = THREE.SRGBColorSpace
  lights.colorSpace = THREE.SRGBColorSpace
  day.anisotropy = lights.anisotropy = 8

  // Uzbekistan patch: exact spherical projection. The polygon is triangulated in lon/lat space,
  // then every vertex is projected onto the sphere — no tangent-plane distortion. Scaled 1.35×
  // about the centroid so the country reads clearly, with a border wall for the raised look.
  const { uzGeo, uzWallGeo } = useMemo(() => {
    const SCALE = 1.35
    const LIFT = R * 1.055
    const grow = ([lon, lat]: [number, number]): [number, number] => [
      UZ_CENTER.lon + (lon - UZ_CENTER.lon) * SCALE,
      UZ_CENTER.lat + (lat - UZ_CENTER.lat) * SCALE,
    ]
    const ring = UZ.map(grow)
    // top shell: triangulate in degree space, then bend onto the sphere
    const shape = new THREE.Shape()
    ring.forEach(([lon, lat], i) => (i === 0 ? shape.moveTo(lon, lat) : shape.lineTo(lon, lat)))
    shape.closePath()
    const uzGeo = new THREE.ShapeGeometry(shape, 2)
    const pos = uzGeo.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const v = onSphere(pos.getY(i), pos.getX(i), LIFT)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    uzGeo.computeVertexNormals()
    // border wall: quads from the surface up to the shell along the ring
    const wall: number[] = []
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const a0 = onSphere(a[1], a[0], R * 1.002)
      const a1 = onSphere(a[1], a[0], LIFT)
      const b0 = onSphere(b[1], b[0], R * 1.002)
      const b1 = onSphere(b[1], b[0], LIFT)
      wall.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, a1.x, a1.y, a1.z)
      wall.push(b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z)
    }
    const uzWallGeo = new THREE.BufferGeometry()
    uzWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3))
    uzWallGeo.computeVertexNormals()
    return { uzGeo, uzWallGeo }
  }, [])

  const beaconPos = useMemo(() => onSphere(TASHKENT.lat, TASHKENT.lon, R + 0.14), [])
  const beaconDir = useMemo(() => beaconPos.clone().normalize(), [beaconPos])
  const beaconQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), beaconDir),
    [beaconDir],
  )

  useFrame(({ clock }, dt) => {
    if (group.current) group.current.rotation.y += dt * speed
    if (clouds.current) clouds.current.rotation.y += dt * speed * 0.35
    if (beaconHead.current) beaconHead.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.5) * 0.25)
  })

  return (
    <group rotation={[0.2, 0, 0]}>
      {/* fixed sun so the day/night terminator reads like the three.js earth example */}
      <directionalLight position={[2, 3, 9]} intensity={4.4} color="#fff4e0" />
      <ambientLight intensity={0.18} />
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshPhongMaterial
            map={day}
            specularMap={specular}
            specular={new THREE.Color('#3a3a3a')}
            shininess={14}
            emissiveMap={lights}
            emissive={new THREE.Color('#ffdf9e')}
            emissiveIntensity={0.7}
          />
        </mesh>
        {/* clouds — additive, drift slower than the ground */}
        <mesh ref={clouds}>
          <sphereGeometry args={[R * 1.012, 48, 48]} />
          <meshBasicMaterial map={cloudsMap} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Uzbekistan — raised amber relief, exact GeoJSON shape on the sphere */}
        <mesh geometry={uzGeo}>
          <meshBasicMaterial color="#F2B441" toneMapped={false} transparent opacity={0.95} side={THREE.DoubleSide} forceSinglePass />
        </mesh>
        <mesh geometry={uzWallGeo}>
          <meshBasicMaterial color="#c98d2a" toneMapped={false} transparent opacity={0.9} side={THREE.DoubleSide} forceSinglePass />
        </mesh>
        {/* Tashkent beacon */}
        <mesh position={beaconPos} quaternion={beaconQuat}>
          <cylinderGeometry args={[0.012, 0.03, 0.45, 8]} />
          <meshBasicMaterial color="#FFD27A" transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh ref={beaconHead} position={beaconPos.clone().addScaledVector(beaconDir, 0.26)}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#FFE7B0" toneMapped={false} />
        </mesh>
        {/* UZBEKISTAN label at the beacon tip — billboarded so it reads from anywhere */}
        <Billboard position={beaconPos.clone().addScaledVector(beaconDir, 0.44)}>
          <mesh>
            <planeGeometry args={[0.85, 0.21]} />
            <meshBasicMaterial map={uzLabelTexture()} transparent toneMapped={false} depthWrite={false} />
          </mesh>
        </Billboard>
      </group>
      {/* atmosphere rim glow */}
      <mesh>
        <sphereGeometry args={[R * 1.045, 48, 48]} />
        <meshBasicMaterial color="#3d9fd4" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Real textured Earth (three.js planet textures) — atrium centrepiece. */
export function DigitalGlobe({ position = [0, 6, 0] as [number, number, number], speed = 0.1 }) {
  return (
    <group position={position}>
      <Earth speed={speed} />
    </group>
  )
}
