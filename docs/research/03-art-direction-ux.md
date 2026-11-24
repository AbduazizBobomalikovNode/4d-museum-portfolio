# Art Direction, UX & Interaction Patterns for an Immersive "4D Museum-House" Web Portfolio (2025–2026)

*Sources: ~25 web searches + article fetches (Codrops, Awwwards, Three.js forum, NN/g, drei docs, Utsubo, Metabole, CreativeDevJobs, etc.).*

## 0. Executive takeaways
1. Winning pattern 2025–26: "one defended idea, executed with restraint" — scene logic, not page hierarchy; heavy effects only where they land. (Utsubo, Metabole)
2. Free-roam is most praised AND most criticized: Bruno Simon 2025 remake got HN critiques (CPU ~100%, 60–70 W, no load progress, info hard to find). NN/g: free navigation = high interaction cost; guided tours with context-by-default perform best. https://news.ycombinator.com/item?id=46206531 https://www.nngroup.com/articles/virtual-tours/
3. → Hybrid navigation (guided rail/teleport by default + optional free-walk) + HTML-first content layer. https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide
4. WebGPU mainstream (Chrome 113+, Firefox 141+, Safari 26; WebGPURenderer in core); TSL shaders target both. https://www.utsubo.com/blog/webgpu-threejs-migration-guide
5. Portals achievable now (drei MeshPortalMaterial, drei <Mask> stencil, render-target portals) — most on-brand way to express "4D".

## 1. Visual styles (style → conveys → examples → difficulty → perf)
| Style | Conveys | Examples | Difficulty | Perf |
|---|---|---|---|---|
| Low-poly stylized | playful, indie game | bruno-simon.com; worawork.vercel.app (Zelda/AC house); jayransijn.com | Low–Med | Low |
| Isometric diorama / "my room" | cozy, personal | Jesse Zhou ramen; freeCodeCamp cute room course; maxime-mrl/3D-room-portofolio; weisdevice.xyz | Low–Med | Low |
| Photoreal baked (Cycles lightmaps → KTX2) | premium, "real place" | Codrops Fan Museum (Andrew Woan) https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/ ; Wawa Sensei baking guides https://wawasensei.dev/tuto/baking-guide ; tchayen baked lighting R3F | Med–High | Med |
| Clay / matte | calm, design-studio | microsoft.ai | Low–Med | Low |
| Liminal / dreamcore | unease, nostalgia | Dreamcore game, Backrooms resurgence | Low geo / Med atmosphere | Low–Med |
| Brutalist concrete gallery | serious, Ando | HubSpot/Qode brutalism lists; Architizer Japan concrete homes | Med | Low–Med |
| Japanese minimal | calm, craft | samsy.ninja elements; brand.ivress.co.jp (WebGPU+TSL) | Med | Low |
| Neon cyberpunk | tech mastery | samsy.ninja (WebGPU 120fps FP, SOTD+Dev Oct 2025); thibault-introvigne.com | High | High |
| Retro-futurism / sci-fi station | hard sci-fi | themonolithproject.net; equinox.space | High | Med–High |
| Y2K / Frutiger Aero | glossy optimism | Kittl/Frutiga articles | Med | Med |
| Glassmorphism → Liquid Glass | Apple polish | CSS-Tricks liquid glass (backdrop-filter + SVG displacement) | Low UI / Med 3D | Med (mobile) |
| Cel/toon | comic, BotW | MeshToonMaterial + inverted hull | Med | Low–Med |
| PS1 / pixel 3D | nostalgia | Alex Sounalet PS1 museum (three forum); Codrops PS1 jitter shader; Maxime Heckel dithering | Low–Med | Very low |
| Gaussian splats / photogrammetry | "I was there" | Spark (sparkjs.dev, Spark 2.0 streaming); Codrops glass portal card + splats; KHR_gaussian_splatting glTF | Med | Med–High (10–100MB) |
| AI surreal spaces | dreamlike | World Labs Marble → splats/meshes; World API Jan 2026 | Low gen / Med integrate | = splats |

Pragmatic: Wawa Sensei "mid-poly + baked Cycles". Codrops efficiency numbers: 27 meshes / 40k tris / 2.1MB, DPR clamp 1.0 desktop/1.5 mobile, env maps over lights, PerformanceMonitor degrade. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/

## 2. 2025–26 trends relevant
- Scrollytelling as craft ("5 focused scenes > 15 sections"); CSS scroll-driven animations native.
- Cartier W&W 2025: museum-like alcoves, scroll between rooms, 3D scene per product.
- WebGPU post: bloom/SSGI/GTAO/TRAA via TSL nodes. https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026 ; Codrops BatchedMesh+WebGPURenderer.
- Kinetic type hero (Obys); morphing custom cursors; grain overlays; sound design differentiator (Codrops 3D audio visualizer); brutalism/bento for 2D layer; dark default; visionOS spatial panels; Liquid Glass; micro-interactions; AI personalization.

## 3. Navigation models
| Model | Examples | Pros | Cons |
|---|---|---|---|
| FP WASD + pointer lock | samsy.ninja; toshihito-endo.com (https://medium.com/@toshihito.endo/why-i-built-my-portfolio-like-a-game-6f55bab8eeff); PS1 museum | max immersion | collision, mobile hard, scary for non-gamers |
| Click-to-move/teleport (Matterport) | Matterport inside/dollhouse/floorplan | no motion sickness, touch OK | less "walking" |
| On-rails scroll camera | Codrops Blender-curve gallery 2026 https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/ ; Theatre.js flythrough (Codrops 2023); Fan Museum; Lempens Paris; Primland | cinematic, mobile trivial, SEO | no agency |
| Third-person char/vehicle | Bruno; Jay Ransijn; Thibault; Messenger | fun, memorable | highest cost; obscures info |
| Isometric room hotspots | Jesse's Ramen | cheap, baked | one room |
| Dollhouse zoom | Matterport | overview | NN/g: confusing |
| Guided tour/auto-camera | Artsteps guide points; Kunstmatrix AI audio guides | lowest cost | allow skipping |
| Mini-map | Matterport floorplan; LakshayD02 gamified radar | fixes "where am I" | mobile space |
| Hotspot + HTML overlays | drei <Html occlude transform distanceFactor>; TJ Journey "Mixing HTML & WebGL" | accessible, SEO | occlusion/order |
| Touch joystick/gyro | nipplejs; three-joystick; Henry Egloff controller | free-roam on phone | gyro nauseating → opt-in |
| Keyboard / skip-3D | react-three-a11y; aurora repo fallback | WCAG | 2 presentations |

NN/g: tour is secondary; content first; context by default; show position. Collectibles motivate exploration (Thibault, Messenger).

## 4. Museum UX conventions
Plaques (Kunstmatrix multi-lang; Fan Museum click→modal, sin-pulse highlight); audio guide/curator narration (optional track per room); rooms as categories (Entrance=intro, wings=projects, lab=skills, corridor=timeline, gift shop=contact; Jesse vending machine/arcade credits); lighting per exhibit; diegetic signage + mini-map; "press E to inspect"; gamification sparingly (Thibault 10 collectibles, LakshayD02 35 nodes, Jay hidden car, Bruno easter eggs); video projection mapping (Codrops 2025-08).

## 5. Onboarding & loading
Fan Museum: chunked Suspense in 4 batches + manual progress + "Enter world" gate. Enter = audio unlock ("Enter with sound / muted"). Loading as art (Ameen sakura petals). Control hints mandatory. detect-gpu tiers (0/15/30/60) → low/med/high presets + manual override; below threshold → static fallback. https://github.com/gsimone/detect-gpu

## 6. Typography & UI overlays
DOM over canvas standard (drei Html; IGC guide). HTML-in-Canvas experimental. HUD minimal: room name, mini-map, sound, "?" Glass panels via backdrop-filter (limit on mobile). Diegetic: plaques, screens, neon signs, monitors. Type: kinetic for room titles; mono/grotesk HUD; large serif plaques; grain unifies DOM+canvas.

## 7. "4D" concepts & refs
- Time: threex.daynight; Stylized Day&Night demo https://day-and-night-cycle.netlify.app/ ; corridor = career timeline; time-dial HUD slider scrubs house.
- Portals: drei MeshPortalMaterial (RenderTexture, blend) https://drei.docs.pmnd.rs/portals/mesh-portal-material ; Pandora's-box portal demo https://immersive-world-xi.vercel.app/ ; stencil via drei <Mask> stencilRef swap https://www.thefrontdev.co.uk/immersive-portals-in-three-and-r3f-unleashing-the-power-of-stencil-masks-from-drei/ ; forum stencil portals/infinite rooms; RT portals w/ oblique clipping https://medium.com/machine-words/creating-portals-in-three-js-944c4f7104ec ; Zucconi non-Euclidean cubes; Antichamber/Manifold Garden fake non-Euclidean. Perf: 1–2 visible portals, half-res RT, disable offscreen.
- Tesseract: 6 rotation planes + w-projection (mysimulator.uk/tesseract); tsherif tesseract-explorer; gulan28/tesseract; ecuber/tesseract; D4Y 4D hypercube viz. Use as logo/loader/hub centrepiece; doors as 8 cells of hypercube net.
- Shifting/memory rooms: portal-swap behind visitor; memory room with dreamcore fog + splats (Marble/Spark).

## 8. A11y & SEO
HTML-first (H1/copy/CTAs before renderer), noscript, per-room URLs, JSON-LD, defer 3D bundle, OffscreenCanvas, LCP<2.5s INP<200ms CLS<0.1, CI budgets. (Utsubo SEO guide; Exonity 100/100 Lighthouse). prefers-reduced-motion: cuts not flythroughs, static poster. react-three-a11y roles + announcer; tab through exhibits; Enter=inspect, Esc=exit. WebGL fallback + context-loss listener.

## 9. Lighting mood
White cube (even, clinical) vs black box (spot pools, hierarchy, immersive). 4000K cool for concrete/metal; 2700–3000K warm for wood/paintings; RGBW wall-wash. ACES/AgX, teal-orange, vignette + grain. (ERCO, XAL, TCP, LIT Awards 2026)

## 10. Three concepts
### A — "Tesseract Gallery" (RECOMMENDED)
Black-box museum + brutalist concrete; each room = hypercube cell; rotating tesseract hub in atrium; portals connect rooms non-Euclideanly. Palette #0B0C10 / #2A2D34 / #4A4E57 + accent cyan #5DE4FF or amber #F2B441; warm 3000K spots, cool 4000K concrete; AgX; grain 3–4%. Nav: guided rail default (scroll/arrows on Blender curve, stops at pedestals) + Free-walk toggle (WASD/pointer-lock, joystick) + mini-map as hypercube net + click-to-teleport. Inspect = E/tap → Liquid-Glass DOM panel. 4D: time-dial scrubs day→night + timeline corridor. Difficulty High, ~3–5 months solo; ≤2 live portals half-res.
### B — "Liminal Dream-House"
Dreamcore pastel fluorescent rooms, fog, wrong proportions, memory rooms w/ Gaussian splat through glass portal; VHS/dither toggle. Palette #F4EFE6 #BFE3D0 #F7E8A4 #F2C6C2 + cold fluorescent. Nav: click-to-move floor hotspots + slow auto-turn, no pointer lock; rooms shift behind you; dollhouse overview. Difficulty Medium.
### C — "Neon Space-Station Archive"
Cyberpunk station, emissive signage, wet floors, holographic plaques, tesseract star-map; WebGPU bloom/SSR w/ TSL fallback. Palette #070B1F #FF3DA6 #29E3FF + acid yellow. Nav: third-person astronaut + collectibles, "tram" scroll mode, joystick, achievements. Difficulty Very High, most perf-risky.

Baseline for all: HTML-first + per-room URLs, Enter w/ or w/o sound, progress loader, detect-gpu tiers + manual toggle, reduced-motion path, a11y focusable exhibits, 2D "skip 3D" guide page, mini-map, restraint.
