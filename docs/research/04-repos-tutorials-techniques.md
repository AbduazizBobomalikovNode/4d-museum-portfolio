# Open-source Repos, Tutorials, Techniques, Assets, Deploy (2023–2026) — collected 2026-08-23 (stars/pushes live)

## 1a. Walkable museum / gallery repos
| Repo | ★ | Last push | Stack | Notes | License | Demo |
|---|---|---|---|---|---|---|
| halcyon-video/halcyon-video | 462 | 2026-08-23 | three.js FP | Jellyfin/Plex library as walkable 90s video store; day/sunset/night HDR; shelf gen | GPL-3 (study only) | halcyon-video.github.io/halcyon-video |
| ClementCariou/virtual-art-gallery | 266 | 2024-01 | REGL | procedural gallery on Hilbert curve; Art Institute API; local images | MIT | clementcariou.github.io/virtual-art-gallery/build |
| theringsofsaturn/3D-art-gallery-threejs | 218 | 2024-03 | vanilla three + Vite | classic FPS gallery; 8h YouTube (Emilian Kasemi) | none | emilian-kasemi-3d-art-gallery.vercel.app |
| lbartworks/openvgal | 50 | 2026-08-14 | Babylon.js | turn-key gallery generator: halls from images, FP cam, labels, overview map, ZIP export | MIT | openvgal.com |
| TomPast/artwork-3D-museum | 43 | 2025-03 | R3F+Tailwind | small clean R3F museum skeleton | NOASSERTION | virtual-museum.tompastor.fr |
| theringsofsaturn/virtual-museum-tour-threejs | 48 | 2022 | three | Hallwyl Museum guided camera tour | none | youtu.be/8oQC0ICNtL0 |
| notbigmuzzy/linkwalk | 20 | 2026-01 | three | rooms from Wikipedia API | GPL-2 | notbigmuzzy.github.io/linkwalk |
| iwopant0825/MuseumCBG | 1 | 2025-07 | R3F+rapier+drei+postprocessing+Leva | GLB museum, WASD+jump, adaptive DPR — exact R3F+Rapier museum stack | none | — |
| rahel-yab/Virtual-art-gallery | 2 | 2025-06 | three | pointer-lock FPS CameraController.js | none | — |
| cynthiachiu/3D-Art-Gallery | 41 | 2022 | R3F | older | none | cynthia-3d-art-gallery.netlify.app |

## 1b. Room / game-like portfolios
| Repo | ★ | Push | Notes |
|---|---|---|---|
| henryjeff/portfolio-website | 2,278 | 2025-12 | CRT monitor w/ iframe inner site (portfolio-inner-site); camera zoom-to-screen. MIT |
| enderh3art/Ramen-Shop | 985 | 2025-03 | baked Blender + video screens |
| ITomPoland/portfolio-itom | 307 | 2026-07 | React19/three r182/R3F 9.4/GSAP/Vite7; gl.compileAsync warmup, baked global tint, device tiering, SEO DOM fallback; mermaid arch. MIT. itomdev.com |
| VinayMatta63/threejs-portfolio | 226 | 2026-05 | R3F walking character world |
| Saad-Hisham/3d-room-portfolio | 96 | 2026-03 | cozy room |
| AT010303/Room_Portfolio | 89 | 2024-07 | R3F clickable room |
| adrianhajdin/project_3D_developer_portfolio | 7,113 | 2024-10 | generic, not walkable |

## 1c. Character controllers (core)
| Repo | ★ | Push | Notes |
|---|---|---|---|
| pmndrs/ecctrl | 781 | 2026-08-17 | R3F+rapier floating capsule; FP/3rd; EcctrlJoystick; moving platforms; ecctrl.app. MIT |
| pmndrs/BVHEcctrl | 139 | 2025-08 | three-mesh-bvh, no physics; Static/Kinematic/InstancedStaticCollider; ideal static museum GLB. MIT. bvhecctrl.vercel.app |
| hh-hang/three-player-controller | 253 | 2026-08-22 | vanilla three + BVH (+Rapier vehicles); FP/3rd switch, cam obstacle avoid, foot IK; demos on glTF/3D Tiles/3DGS/office. MIT |
| gkjohnson/three-mesh-bvh | 3,457 | 2026-08 | characterMovement example = basis of non-physics FPS |
| pmndrs/react-three-rapier | 1,423 | 2025-11 | KinematicCharacterController via useRapier; trimesh fixed colliders |
| StarKnightt/jungle-trail | 278 | 2026-08 | clean FPS camera code |
| PauliusOS/pallet-town-3d | 170 | 2026-08 | TS FPS town, src/player/, E interact, pointer lock |
| icurtis1/third-person-controller-splat | 25 | 2026-04 | three r180 + Spark 2.0 LoD + Rapier KCC + postprocessing; Marble splat world template. MIT |
| philchacko/worldsplats | 7 | 2026-02 | FPS in World Labs splat worlds, Spark in R3F |
| mohsenheydari/three-fps | 230 | 2022 | ammo FPS |

## 1d. Gaussian splats
sparkjsdev/spark 3,516★ (2026-07, v2 LoD, PLY/SPZ/SPLAT/KSPLAT/SOG, splats+meshes) — sparkjs.dev; spark-react-r3f (official, extend()); spark-react-nextjs · mkkellogg/GaussianSplats3D 2,867★ (superseded) · huggingface/gsplat.js 1,653★ · lumalabs/luma-web-examples (stale) · reall3d-com/Reall3dViewer 508★ · ektogamat/christmas-threejs (R3F + splats + Blockade skybox)

## 1e. Portals
barnabasbartha/Threejs-Portal 85★ (stencil, OffscreenCanvas) · danielesteban/portals 35★ (walkable, portals.gatunes.com) · metzlr/portals (recursive) · mayacoda/threejs-journey-portal-scene · three.js webgl_portal example · drei MeshPortalMaterial (blend → enter)

## 1f. Infra
react-three-fiber 31.8k · drei 9.8k · react-postprocessing 1.3k · postprocessing 2.8k · glTF-Transform 1.95k · nipplejs 1.9k · theatre 12.6k (dormant since 2024-08) · pmndrs/examples (monorepo all demos — best pattern source)

## 2. Starters
pmndrs/react-three-next 2,862★ (stale 2024-06, Next14-era) · **wass08/r3f-vite-starter 282★ CC0 (recommended SPA)** · ektogamat/threejs-andy-boilerplate 759★ (vanilla+Vite) · **ektogamat/r3f-webgpu-starter 219★ (R3F + WebGPU + post)** · pmndrs/examples · Unity: greggman/better-unity-webgl-template 792★ · Godot 4 web export docs (COOP/COEP) · PlayCanvas Art Gallery demo playcanv.as/p/0gkjlf2w/ · needle-engine-samples · splinetool/react-spline 1,414★ (weak FPS collision)

## 3. Courses / tutorials
- Three.js Journey ($95, 93h): Ch.3 physics/models/Blender/env/realistic/structure; Ch.5 post/perf/loading/HTML mixing; **Ch.6 Portal Scene** (Blender scene 2h04, Baking & exporting 2h11, Importing & optimizing 46m, details); **Ch.7 R3F** (drei, staging, models, Portal w/ R3F, post, Fun & Simple Portfolio, Rapier physics 2h11, Create a game 4h). WebGPU/TSL update in progress.
- Wawa Sensei R3F Ultimate Guide ($85): models, image/video textures, HTML, loading, scroll, physics, camera controls, render target, post, Theatre, optimization, **Ch.6 Portfolio (3D World/HTML Interface/Responsive)**. Free: Third Person Controller (Rapier+joystick) wawasensei.dev/tuto/third-person-controller-react-three-fiber-tutorial ; MeshPortalMaterial; scroll+GSAP; 3D portfolio series.
- Akella three.js workshops (shaders/FX) · Codrops: Theatre.js fly-through 2023; CurveGallery (Blender path + GSAP); Scroll-Reactive 3D Gallery 2026-03; Scroll-Revealed WebGL Gallery (Astro/Barba) 2026-02; "Letting the Creative Process Shape a WebGL Portfolio" 2025-11 · Emilian Kasemi 8h gallery · Andrew Woan cute room (youtube AB6sulUMRGE) · SimonDev FP camera (oqKzxPMLWxo), character controller, 3rd person cam · Maxime Heckel: particles, refraction, caustics, **Field Guide to TSL & WebGPU** · sbcode.net pointerlock/annotations · discoverthreejs.com · Anderson Mancini: GitNation "Game Dev with Three.js", R3F-Ultimate-Lens-Flare, AutoFocusDOF, fake-glow, holographic · forum Character Controller megathread discourse.threejs.org/t/character-controller/89137 · Bandinopla BVH collision & GSAP scroll (Medium) · Machine Words portals

## 4. Technique → best resource
| Technique | Links |
|---|---|
| FP controller w/ collision | ecctrl (FixedCamera/FP, api-reference.md); BVHEcctrl; three-mesh-bvh characterMovement; hh-hang; react-three-rapier KCC; drei PointerLockControls; SimonDev FPS feel |
| Baking Blender → GLB | TJ "Baking and exporting the scene"; free: YouTube DpBhfd-LNVk + pixel-capture.com/tutorials/lightmap-baking-in-blender; svilenkovic.com/3d/how-to-bake-lighting-for-web; forum batch-bake script (82346); lightMap/aoMap need uv2 |
| Draco/KTX2 | `gltf-transform optimize in.glb out.glb --compress draco --texture-compress ktx2`; `gltf-transform uastc in.glb out.glb --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" --level 4 --rdo --rdo-lambda 4 --zstd 18`; draco --method edgebreaker; resize/dedup/prune/instance; guide axl-devhub.me/en/blog/optimizing-3d-models; R3F useGLTF(url,true) + useKTX2 |
| HTML annotations | drei Html (occlude/transform/distanceFactor/onOcclude); CSS2D/CSS3DRenderer |
| Portals | drei MeshPortalMaterial (+blend); Wawa tutorial; thefrontdev stencil Mask; webgl_portal |
| Scroll camera path | drei ScrollControls/useScroll; Codrops Theatre fly-through; CurveGallery; Wawa R3F+GSAP; prefer GSAP + CatmullRomCurve3 (Theatre dormant) |
| Loading | drei useProgress + <Loader/>; ITom ref-driven preloader |
| Mobile | EcctrlJoystick; nipplejs; R3F discussion #2729 |
| Spatial audio | drei PositionalAudio; three PositionalAudio; unlock AudioContext on first click |
| Splats R3F | spark-react-r3f; sparkjs.dev/docs; worldsplats; icurtis1 template; SOG/SPZ + LoD |
| Post | @react-three/postprocessing (Bloom/SMAA/Vignette/N8AO/ToneMapping); AutoFocusDOF; lens flare; r3f-webgpu-starter |
| Reflections | drei MeshReflectorMaterial; 0beqz vanilla port |
| Video screens | drei useVideoTexture; Wawa lesson; Mux blog; Ramen arcade |
| iframe screens | drei Html transform occlude="blending"; henryjeff CSS3D; YouTube SQRqU3N3ehs |
| Day/night | drei Sky sunPosition + swap Environment HDRI + lightMap intensity; forum Complete Sky System (88311); threejsdemos day-cycle; real-sun math (7959); halcyon HDR set; ITom baked global tint |

## 5. Assets
Models: Poly Haven (CC0), Kenney, Quaternius, KayKit, Sketchfab (check license; British Museum CC-BY), Smithsonian 3d.si.edu, NASA 3D, BlenderKit, Fab Megascans free, CGTrader (Interior Art Gallery 04; Art Museum Gallery Interior 4). Textures: ambientCG, Poly Haven. Captures: Polycam GLB export + Blender optimize; Marble/Luma splats. Fonts: Google Fonts (OFL) → drei Text (troika TTF). Audio: Pixabay SFX (footsteps, ambient), Freesound.

## 6. Deploy
Vercel/Netlify/Cloudflare Pages for Vite SPA; CF Pages 25MB/file → assets on R2 (r2drop.com guide); Vercel 100MB static. Draco/KTX2/Meshopt already compressed → Content-Encoding identity; brotli for JS/.splat/.ply; prefer SOG/SPZ. Content-hash + `Cache-Control: public, max-age=31536000, immutable`; CORS on bucket; `Content-Type: model/gltf-binary`; COOP/COEP if SharedArrayBuffer. Room chunks via useGLTF.preload, local /draco/ + basis transcoder, Suspense per room, useProgress overlay.

## Ranked
Top repos: 1 ecctrl · 2 BVHEcctrl · 3 hh-hang/three-player-controller · 4 henryjeff/portfolio-website · 5 enderh3art/Ramen-Shop · 6 ITomPoland/portfolio-itom · 7 halcyon-video (study) · 8 openvgal (data model) · 9 spark + spark-react-r3f + icurtis1 template · 10 pmndrs/examples + wass08/r3f-vite-starter. HM: theringsofsaturn gallery, TomPast museum.
Learning order: discoverthreejs/TJ Ch1–3 → TJ Ch.6 Portal Scene → TJ Ch.7 R3F → Kasemi gallery → SimonDev FP cam → Wawa 3rd-person (then ecctrl) → Bandinopla BVH + characterMovement → Wawa MeshPortalMaterial + thefrontdev stencil → Codrops Theatre/CurveGallery → Wawa Ch.6 Portfolio + Heckel/Mancini polish.
Caveats: no high-star maintained R3F museum template — assemble: r3f-vite-starter + ecctrl/BVHEcctrl + baked GLB + drei Html/useVideoTexture/useProgress. react-three-next & theatre stale; GaussianSplats3D superseded by Spark 2.0.
