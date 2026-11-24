# Own direct findings (main session) — 2026-08-23

## Market / trend signals
- Immersive 3D sites won 61% of Awwwards SOTD in Q1 2026 (vs 23% in 2024) — digitalstrategyforce.com
- Messenger (messenger.abeto.co) — Awwwards Developer Site of the Year 2025; tiny WebGL planet, 5.7 MB load, three-mesh-bvh + WS multiplayer
- Bruno Simon 2025 portfolio — Awwwards SOTM Jan 2026; Three.js + Cannon.js driving
- Lando Norris (OFF+BRAND) — SOTY 2025
- Samsy.ninja (Gen-02) — Awwwards SOTD + Dev Award Oct 2025; WebGPU, TSL, Vue + GSAP, first-person cyberpunk city, 120 FPS, multiplayer avatars, DJ system
- Iventions.com — Three.js spotlit "installations", guided walkthrough feel; CSSDA WOTM Oct 2025
- Cartier Watches & Wonders — 6 rooms/alcoves per watch, scroll between rooms, Web Audio, hidden gestures (museum-like pavilion)
- The Unconventional Gallery (Ruinart × makemepulse) — WebGL gallery exhibition walkthrough
- Jordan Breton — floating island, fixed camera points, FWA SOTD Oct 2025
- JReyes MC — Minecraft circuit scroll tour, Awwwards HM
- Thibault Introvigne — R3F spaceman world with 10 collectibles
- Jay Ransijn — fully playable 3D world (bike, drive)
- Aimee Weis — papercraft R3F + Blender + Krita, scroll path
- Ameen Abdullah — WebGPU + Vue sakura island, Awwwards winner

## Tech status
- Three.js WebGPURenderer production-ready since r171 (Sep 2025); Safari 26 added WebGPU → ~95% coverage, auto WebGL2 fallback
- TSL = write shaders once → WGSL/GLSL
- First Three.js Conference: Paris, Sep 2026 (Bruno rebuilding portfolio on WebGPU/TSL; Anderson Mancini r3f-webgpu-perf, SSGI+SSR; Chrome HTML-in-Canvas talk; sunag "Tour of TSL", deferred rendering coming)
- HTML-in-Canvas API (drawElementImage / texElementImage2D): Chrome 148-150 origin trial (May-Jul 2026), stable est. late 2026, Chrome-only → live DOM as WebGL texture = real web pages on in-world screens
- Spark 2.0 (World Labs, Apr 2026): streaming LOD Gaussian splats in Three.js, WebGL2, formats PLY/SPZ/SPLAT/KSPLAT/SOG
- Marble (World Labs, early 2026): text/image/video → explorable 3D world, exports splats + collider mesh + hi-q mesh; render with Spark
- pmndrs/ecctrl: physics character controller (rapier), joystick, FixedCamera mode; pmndrs/BVHEcctrl: physics-free (three-mesh-bvh), 139★, demo bvhecctrl.vercel.app
- drei MeshPortalMaterial — Wawa Sensei tutorial for portal worlds
- Tesseract refs: ciechanow.ski/tesseract, tsherif tesseract-explorer (WebGL2), topoviz.org, 4d.pardesco.com, baileysnyder interactive-4d

## Judging criteria (Hon Tran, Awwwards jury)
1. Static frames strong w/o animation; 2. survives 4× CPU throttle + Fast 3G; 3. transitions carry choreography.
Winning combo: Next.js + GSAP + Three.js. Restraint over spectacle. 60fps on mid-range mobile. prefers-reduced-motion.

## Metabole principles
single direction; scene logic not page logic; heavy effects only where they matter; mobile-first mandatory; sessions +40% on immersive sites.
