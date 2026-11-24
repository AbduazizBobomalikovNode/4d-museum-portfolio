import { EffectComposer, Bloom, Vignette, Noise, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useStore } from '@/state/store'
import { qualityPreset } from '@/lib/quality'

/** WebGL post stack (pmndrs/postprocessing). Gated by quality tier. */
export default function Effects() {
  const quality = useStore((s) => s.quality)
  const preset = qualityPreset[quality]
  if (!preset.post) return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={0.45} luminanceThreshold={0.92} luminanceSmoothing={0.25} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
      {preset.aa ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
