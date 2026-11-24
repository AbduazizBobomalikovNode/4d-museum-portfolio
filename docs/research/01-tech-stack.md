# Tech-Stack Research: Immersive 3D/"4D" Museum Portfolio (Aug 2026)

## TL;DR recommended stack
| Layer | Pick | Why |
|---|---|---|
| Engine | Three.js r184+ via R3F v9.5+ (migrate to R3F v10 when stable — WebGPU-first, alpha Jan 2026, beta in flight Jun 2026) | 110k★, 5M/wk, ~168kB gz core, production WebGPU since r171 + auto WebGL2 fallback |
| Renderer | `WebGPURenderer` from `three/webgpu` + TSL shaders | 70–85% WebGPU coverage 2026 (Chrome/Edge/Firefox 141+/Safari 26); fallback for rest; `forceWebGL:true` to test |
| App | Vite + React 19 + TS SPA (or Next App Router w/ react-three-next; or Astro client:only island) | canvas has no SSR value; keep one persistent canvas, URL = room state |
| Physics/controller | @react-three/rapier v2 + ecctrl (FP/TP, joystick) — or zero-physics capsule vs three-mesh-bvh (BVHEcctrl) | Rapier fastest WASM (+~500kB); BVH ~0kB |
| Assets | Blender → GLB → gltf-transform optimize (Meshopt + KTX2 UASTC/ETC1S) → gltfjsx; baked lightmaps UV2; drei <Detailed> LOD; instancing/BatchedMesh; <100 draw calls | 90%+ size cut, ~10× VRAM cut |
| Animation | GSAP 3.13+ (100% free incl. ScrollTrigger since Apr 2025) + camera-controls/drei CameraControls (setLookAt/lerpLookAt/fitToBox) ; drei ScrollControls; Theatre.js only for authored cinematics (public repo paused); framer-motion-3d DEPRECATED | |
| Post-FX | WebGPU: three RenderPipeline TSL nodes (bloom, DOF, GTAO, SSR, SSGI, TRAA); WebGL: pmndrs/postprocessing + N8AO (not WebGPU yet) ; gate with PerformanceMonitor | legacy EffectComposer = no path forward |
| Lighting | baked lightmaps + drei Environment HDRI; ≤1 realtime shadow light; LightProbeGrid (r184) optional; SSGI only desktop accent | |
| Audio | drei PositionalAudio (HRTF) per exhibit + Howler ambient/UI; unlock via Enter overlay; Opus/WebM | |
| Perf | PerformanceMonitor → adaptive DPR, disable post; DPR ≤1–1.5; KTX2; frameloop demand; poster-first LCP; tiers: full / no-post+half DPR+joystick / guided tour or 360 fallback | |
| Presence (opt) | PartyKit (Cloudflare edge, <30ms) or Colyseus; Liveblocks; Mozilla Hubs discontinued 2024 | ghost avatars 10Hz = weekend feature |
| Capture/AI | Spark 2.0 (3DGS, WebGL2, 98% devices, 4M gaussians 60fps iPhone14+) + SuperSplat (MIT editor, SOG/SPZ); Marble; Blockade Labs Skybox AI (free 5 gens; $20/$48/$112 mo); @lumaai/luma-web DEPRECATED; splats have no collision → invisible collision mesh; mobile ceiling ~2M gaussians | |

## Engines compared
| Engine | Size gz | WebGPU | Physics | Editor | Curve | Fit |
|---|---|---|---|---|---|---|
| Three.js/R3F | ~168kB (+React) | prod r171+, auto fallback | Rapier/cannon-es/BVH | code-first | medium | BEST |
| Babylon.js 9 (Mar 2026: clustered lighting, area lights, volumetric, Frame Graph, 3DGS shadows/SOG) | ~1.4MB | native WGSL since 8.0 | Havok | Playground/NME/Inspector | med-low | very good, XR |
| PlayCanvas (engine 2.19 compute WebGPU splats; SuperSplat; SOG) | 150–300kB | yes | Ammo | cloud editor (paid) | low | good mobile/splats |
| Unity 6.3/6.4 Web | 10+MB (2MB stripped) | experimental | built-in | full | low if Unity | heavy |
| Godot 4.x | 20–40MB | no (WebGL2 only); no C# web | built-in | full | low | heavy, GDScript |
| Needle Engine (Unity/Blender exporters → three.js; Free personal, €49/mo Pro) | three-based | inherits | Rapier | Unity/Blender | low | good (paid) |
| Unreal Pixel Streaming (Arcware €10/mo+€0.15/min; StreamPixel €99/mo; self-host $0.18–0.53/user-h) | video | n/a | built-in | full | high | fidelity, ongoing cost |
| Spline ($9–12/mo) | heavy runtime | — | — | browser | low | hero objects only |
| Wonderland 1.5.2 | WASM | — | — | editor | low | VR-first |
| Verge3D 4.12/4.13 ($290 one-time) | WebGL | no | — | Puzzles | low | no-code artist |
| A-Frame 1.7.1 | three-based | — | — | HTML | low | quick WebXR |

## Key facts
- three r182 Dec 2025, r183 Feb 2026, r184 Apr 2026, r185 Jul 2026. HDRLoader replaces RGBELoader; SimplifyModifier → meshoptimizer; PCFSoftShadowMap removed in WebGPURenderer; PostProcessing renamed RenderPipeline (r182/183); GTAO more physical r184/185; SSRNode new API + denoiser; LightProbeGrid r184.
- R3F v9 WebGPU: `<Canvas gl={async canvas => { const r = new WebGPURenderer({canvas}); await r.init(); return r }}>`; most drei helpers work. v10: state.gl→state.renderer, TSL hooks useUniforms/useNodes/usePostProcessing, Drei 11 alpha.
- WebGPU browser: Chrome/Edge 113+, Chrome Android 121+, Firefox 141+ Win / 145+ mac AS / 147+ all mac (Linux/Android Nightly), Safari 26 default.
- gltf-transform v4: `gltf-transform optimize in.glb out.glb --texture-compress ktx2`; Meshopt default (fast decode), Draco geometry-only; gltfjsx `npx gltfjsx model.glb -T -t -S`.
- Rapier KCC hit-and-slide; ecctrl needs R3F 9.4+, rapier 2.2+, three 0.184+; primitive colliders not trimesh; timeStep 1/30 on weak devices; pointer-lock needs gesture → "click to enter".
- Budgets: <100 draw calls; 40k tris/2.1MB polished demo; 4K texture = 64MB VRAM → KTX2; shadow maps 512–1024 mobile; shadowMap.autoUpdate=false static.

## Risks
R3F v10 alpha/beta (helpers lag on WebGPU); Firefox Linux/Android + iOS<26 need WebGL2 fallback tested; Theatre.js paused; framer-motion-3d & luma-web deprecated; splats no collision + mobile memory.

(Full sources list in agent report — Utsubo, gpuweb wiki, pmndrs discussions #3665, Windows Dev Blog Babylon 8/9, PlayCanvas blog, Unity docs, Godot proposals, GSAP 3.13 blog, rapier.rs, threejsroadmap, Codrops efficient scenes, PartyKit docs, sparkjs.dev, skybox.blockadelabs.com/plans.)
