# Immersive 3D / Walkable / Museum-like Portfolio & Exhibition Websites (2021–2026) — Reference Catalogue

## 1. Bruno Simon (canonical)
- bruno-simon.com — 2025 rebuild "folio-2025" (MIT): https://github.com/brunosimon/folio-2025 ; case study https://www.awwwards.com/brunos-portfolio-case-study.html ; HN https://news.ycombinator.com/item?id=46206531
  - Drive a jeep; bump into projects; playground (bowling, RC, race track w/ leaderboard); destructible "social shrines".
  - Nav: WASD/arrows, shift turbo, touch joystick, gamepad; follow cam; no scrolling.
  - Style: matcap/palette-texture low poly, SDF foliage, weather + seasons + day/night (literal 4D time layer).
  - Tech: Three.js WebGPU + TSL, Rapier, Blender as level editor (naming conventions → physics bodies; Empties = colliders/spawns), DRACO+quantization, KTX2, instancing, mobile downgrade. "Whispers" global messages.
  - Criticisms: 30s+ loads, high GPU, Firefox issues.
- My Room in 3D (2021) https://my-room-in-3d.vercel.app/ — https://github.com/brunosimon/my-room-in-3d (4.5k★) — baked atlases; multiple baked lightmaps blended by uniform = cheap day/night.
- Three.js Journey Selection https://threejs-journey.com/selection/1 — best curated feed.

## 2. Award winners (3D/WebGL portfolios & spaces)
| Site | Year | Awards | What |
|---|---|---|---|
| Lusion v3 lusion.co | 2023 | Awwwards SOTY 2023 | scroll WebGL studio portfolio |
| Igloo Inc (abeto+Bureaux) | 2024 | SOTY 2024 + Dev SOTY | Three.js infinite-scroll 3D world, 2-color |
| Samsy Gen-02 samsy.ninja | 2025 | SOTD+Dev Oct 2025 | FIRST-PERSON cyberpunk rooms, WebGPU 120fps, Vue+GSAP |
| Jesse's Ramen jessezhou.com | 2022 | HM, FWA | hotspot→camera fly; baked; adaptive quality <45fps; repo github.com/enderh3art/Ramen-Shop |
| Henry Heffernan henryheffernan.com | 2022 | TJ Selection | zoom into monitor; Win95 React OS via iframe/CSS3D |
| Soo-ah's Room Folio (Andrew Woan) | 2025 | HM Feb 2025 | cute isometric room; repo github.com/andrewwoan/sooahs-room-folio ; freeCodeCamp 8h43m course |
| Jordan Breton jordan-breton.com | 2025 | FWA SOTD Oct 2025 | floating island, fixed camera points |
| JReyes MC | 2025 | HM | Minecraft circuit scroll |
| Ameen Abdullah | 2025 | Awwwards | WebGPU sakura island, Vue |
| Messenger messenger.abeto.co | 2025 | SOTD, Dev SOTY 2025 | multiplayer planet 5.7MB, three-mesh-bvh |
| Egg Hunt (Merci-Michel) | 2023 | SOTD | timing game |
| Equinox equinox.space | 2025 | SOTD | space story |
| Iventions iventions.com | 2025 | CSSDA WOTM, SOTD+Dev | projects as spotlit installations in dark gallery |
| Minh Pham | 2025 | SOTD | GSAP+Three |
| Cartier W&W 2026 (Immersive Garden) | 2026 | SOTD+CSSDA | 6 alcoves scrolled like museum rooms; GLSL, GSAP+Lenis, Web Audio |
| Hubtown (Unseen) | 2026 | SOTD+Dev | monolith, mouse reveal |
| EverSwap (Lusion) | 2026 | SOTD+Dev | |
| Apechain (makemepulse) | 2026 | SOTD+Dev | gamified playground |
| Noomo Labs | 2025 | SOTD | |
| David Heckhoff david-hckh.com | 2021–25 | HM | repo github.com/davidhckh/portfolio-2025 |
Aggregators: awwwards.com/websites/three-js/ ; /websites/webgl/ ; /immersive-webgl-virtual-gallery-exhibition-collection.html

## 3. Virtual museums / galleries
- Bartlett Summer Show 2020 (Hello Monday) — 32 walkable rooms; vertical "spine" landing; 3D room → 2D project page; b/w/gray palette; ambient sound + ghost traces; Three.js + C4D→GLB. SOTD. **Best "walk gallery → click exhibit → detail page" reference.** https://hellomonday.com/work/the-bartlett-school-of-architecture-summer-show-2020
- 20 Years of Xbox Museum (Active Theory/Dreamwave) — 6 galleries + personalized one; multiplayer avatars; insight: users walk one side & rarely look back → content on alternating walls; dwell 13m21s vs 45s. SOTM Dec 2021. https://activetheory.net/work/xbox-museum
- Game Awards Microverse (Active Theory) https://thegameawards.dreamwave.live/
- Elektra Virtual Museum (Locomotive) — CMS-driven 3D museum. https://locomotive.ca/en/work/elektra-virtual-museum
- Zendesk Museum of Annoying Experiences (Phantom) — exhibits = mini-games. https://www.phantom.land/projects/the-museum-of-annoying-experiences
- The Queen and The Crown (Brooklyn Museum×Netflix) https://www.thequeenandthecrown.com/
- Hennessy House of Moves — 3 floors + floor-plan menu. https://www.awwwards.com/sites/hennessy-house-of-moves
- NAOZ (Dogstudio), Penderecki's Garden (photogrammetry), Magical Reflections (WebXR).
- Codrops Fan Museum (Andrew Woan 2025) — curve camera on scroll + parallax; 4K baked→KTX2; chunked Suspense. **Most complete open baked-museum tutorial.** https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/
- Salzzeit 3D Online Museum — R3F first-person + touch joystick, proximity doors. https://salzzeit.animiti.at/
- Glasspile museum portfolio http://portfolio.glasspile.com
- Platforms: Google Arts & Culture Pocket Gallery; Kunstmatrix art.spaces; Artsteps (Unity); Exhibbit; Sketchfab museums; Matterport; Museum of Other Realities (VR).

## 4. Game-like / room / FP portfolios
samsy.ninja (FP rooms) · jessezhou.com · henryheffernan.com · bokoko33.me (cute room original; clones: andrewwoan/abigail-bloom-portolio-bokoko33, oscarqjh/threejs-portfolio) · sooahs-room-folio · thibault-introvigne.com (3rd-person, 10 collectibles, R3F) · jayransijn.com (open world) · worawork.vercel.app (house+garden) · weisdevice.xyz (knobs) · aimees-papercraft-world.com (scroll path, tutorial) · sebastien-lempens.com (Paris scroll tour) · bilal.show · michael-durkin.com (treehouse) · joanramosrefusta.com (FWA game-like) · merodev.net (Codrops article 2025-01) · **skullhotel.io (FP R3F horror, 8 rooms; repo JamesHall38/skullhotel.io — proof R3F does FPS rooms)** · Ibrahim's 3D Portfolio (HM) · p5aholic.me · hamishw.com (repo HamishMW/portfolio) · robbowen.digital

## 5. Studios
Active Theory (Xbox, Dreamwave) · Lusion (v3, Oryzo, EverSwap) · Immersive Garden (Cartier alcoves, Dioriviera) · Merci-Michel (Egg Hunt, **Pierret Dream House dreamhouse.pierret.net — build & walk a house**, Coastal World; catalogue mesh3d.gallery) · Hello Monday (Bartlett) · Locomotive (Elektra) · Phantom · Dogstudio (NAOZ) · makemepulse · Unseen · abeto (Igloo, Messenger) · Agency list: psychoactive.co.nz/content-hub/best-webgl-interactive-3d-agencies

## 6. Showcases / repos
- TJ Selection; Codrops; Wawa Sensei R3F baking portfolio tutorial https://wawasensei.dev/tuto/build-a-3D-portfolio-with-react-three-fiber-baking-scene-with-blender ; freeCodeCamp cute room.
- Walkable repos: theringsofsaturn/3D-art-gallery-threejs ; theringsofsaturn/virtual-museum-tour-threejs ; rahel-yab/Virtual-art-gallery (FP) ; KerimKochekov/Threejs-museum ; unframework/sector3f (R3F WASD+mouselook) ; VinayMatta63/threejs-portfolio (3rd person) ; AT010303/Room_Portfolio ; maxime-mrl/3D-room-portofolio ; iivvaannxx/my-room ; hyperfy-xyz/hyperfy (Three.js+PhysX multiplayer worlds)
- Forum: discourse.threejs.org/t/an-interactive-3d-portfolio-room/93515 ; /t/3d-art-gallery-interactive-custom-exhibitions/72341
- Spline: scroll/hover only — none walkable.

## 7. "4D" interpretations
No branded "4D portfolio" precedent (opportunity). Time layer: Bruno 2025 seasons/day-night; My Room blended lightmaps; THREEx.DayNight; day-and-night-cycle.netlify.app; threejsdemos.com day-cycle; sunposition viewer (three forum 40901). Tesseract: ciechanow.ski/tesseract (gold standard), tsherif tesseract-explorer, topoviz.org, 4d.pardesco.com, baileysnyder interactive-4d, tesseract22.netlify.app. Ideas: time scrubber relights house & swaps exhibits; timeline corridor rooms=years; tesseract hub menu rotating in 4D.

## 8. Brand virtual stores / metaverse galleries
Gucci Garden Roblox (rooms per era) · Nikeland · Balenciaga Afterworld · Burberry · Emperia / Obsess / ByondXR / rooom · Oncyber (browser galleries, portals) · Spatial.io galleries · Mozilla Hubs · Decentraland Sotheby's · Monaverse · Nike Air Montreal (Spline 360).

## Recurring patterns (what the best share)
1. Blender is the level editor; browser only renders (naming conventions, Empties for colliders/spawns).
2. Baked lighting + matcaps; realtime only for 1–2 togglable hero effects.
3. Tiered quality measured at load; mobile often gets lighter navigation.
4. Navigation constrained, not free: (a) scroll/curve cam + parallax, (b) fixed camera points, (c) vehicle/character follow cam, (d) true FP only where it IS the point. Pure WASD museums common on GitHub, rare among winners.
5. Room = section, exhibit = deep link; floor-plan/minimap always available.
6. Discovery mechanics drive dwell (collectibles, destructibles, mini-games, easter eggs, leaderboards).
7. Liveness/shared state makes space inhabited.
8. Sound + restrained palette so exhibits pop.
9. Hybrid 3D + DOM — never render paragraphs in WebGL.
10. Stack convergence: Three.js (WebGPU+TSL), R3F, Rapier, GSAP+Lenis, Draco+KTX2, Vite.
11. Budget the load (Messenger 5.7MB; Fan Museum ~6s; Bruno 30s = #1 complaint).
12. Time as a layer already exists in best refs — cheap and on-brand for "4D".
