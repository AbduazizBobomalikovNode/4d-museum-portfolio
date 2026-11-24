# CLAUDE.md — 4D-portfolio

Interaktiv 3D muzey-portfolio (Concept A "Tesseract Gallery"). Batafsil: `README.md`, `docs/CONCEPT.md`, research `docs/research/`.

## Deploy
**Vercel is the target** (`vercel.json` + `.github/workflows/deploy-vercel.yml`, setup steps in `docs/DEPLOY.md`): GitHub Pages was retired in its favour, and Vercel runs `api/feedback.js` as a real function so the feedback form finally delivers with the bot token server-side. Vercel builds with `BASE_PATH=/ VITE_FEEDBACK_ENDPOINT=/api/feedback`, so `base` is `/` there — `asset()` still handles both. The Actions workflow is a quality gate (typecheck → lint → build) that skips its deploy step until `VERCEL_TOKEN` exists, so Vercel's own Git integration can own deployment.

GitHub Pages is no longer used and its workflow was removed. `vite.config.ts` still honours `BASE_PATH` — it defaults to `/4D-portfolio/` for a Pages-style subpath, and Vercel overrides it to `/`. Keep resolving public assets with `asset()` from `src/lib/geo.ts`, never a leading `/`, so both layouts keep working.

## Commands
- `pnpm dev` (port 5173) · `pnpm typecheck` (tsc -b) · `pnpm build` · `pnpm lint` (oxlint) · `pnpm assets:optimize`
- Package manager: **pnpm** only (never npm/yarn install).

## Architecture (short)
- Single persistent `<Canvas>` (`src/scene/Experience.tsx`); DOM overlays (`src/ui/*`) over it; state in zustand `src/state/store.ts`.
- Content is data-driven: `src/data/rooms.ts` (two-storey floor plan + rail waypoints; upper floor y=6, atrium stair/mezzanine in `scene/rooms/AtriumMezz.tsx`) and `src/data/exhibits.ts` (real repos from github.com/AbduazizBobomalikovNode). Add a project = add an exhibit entry.
- Navigation: `mode: 'rail' | 'walk'`. Rail = CatmullRom curve (`src/lib/rail.ts`) driven by scroll/keys; walk = Rapier KinematicCharacterController (kinematic capsule, `scene/player/FreeWalk.tsx`) + PointerLock — deterministic, no floating spring (ecctrl's spring limit-cycled at rest); ecctrl is only used for its `ecctrl/input` joystick UI. Create the character controller inside useEffect with cleanup (StrictMode double-mount frees a memoized one).
- Greybox geometry is procedural (`scene/rooms/*`); colliders are primitive cuboids inside `RigidBody type="fixed"`. When Blender GLBs arrive, replace visuals but keep primitive colliders.
- Renderer: WebGL now; WebGPU/TSL path planned behind `VITE_RENDERER` (wait for R3F v10 stable).

## Conventions
- Exhibits are findable by `Object3D.name === 'exhibit-<id>'` (raycast interact depends on it).
- Spotlights need a `target` in the scene graph (see `Exhibit.tsx`) — `target-position` prop does NOT work.
- Physics: fixed `timeStep={1/60}`. Do not switch to `timeStep="vary"` (tunnels through thin floors on slow frames). `computedGrounded()` is only valid after `computeColliderMovement()` — guard the first frame.
- **`transparent` + `side: DoubleSide` needs `forceSinglePass: true`.** Otherwise three draws the mesh twice per frame and sets `material.needsUpdate` between the passes — every such material re-validates its program 120×/s, which showed up as constant stutter in free walk (38% of CPU in `getProgramInfoLog`).
- **Keep `dpr` constant for the session and set `performance={{ min: 1 }}` on the Canvas.** R3F regresses dpr on pointer movement by default; under pointer lock that fires continuously and every change calls `setSize`, rebuilding the framebuffer and post-processing targets. Quality tiers gate effects only — never resolution.
- **Never add or remove a light at runtime.** Three's program cache key includes the light count, so a single added spotlight recompiles EVERY material in the scene — that was the multi-frame hitch when entering a room. `scene/SpotPool.tsx` keeps a fixed pool of 6 exhibit spotlights and re-aims them at the current room instead.
- Rooms outside `isNear(currentRoom, id)` are hidden via `VisibleGroup` in `World.tsx`; `store.warmup` keeps everything visible for one frame so `compileAsync` in `ReadyProbe` warms every shader before the gate opens. Load new wall/exhibit textures through the R3F loader cache (`useTexture` + `preload`) so `<Preload all />` covers them — a texture that arrives later swaps the material and costs a mid-walk recompile.
- Geometry: use `UNIT_BOX`/`UNIT_PLANE` from `src/lib/geo.ts` with `scale=`, never a fresh `<boxGeometry args={…}>` per mesh (that was 440 GPU buffers); `tiled()` and the wall-material cache key on quantised sizes so repeated walls share one texture and one material.
- **Any mesh handed a shared geometry or a cached material MUST set `dispose={null}`.** R3F disposes whatever it receives through `geometry=` / `material=` when the mesh unmounts, so a StrictMode remount (or HMR) hands back an already-disposed object and the mesh silently renders nothing — that is what made every wall disappear once the caches landed.
- Quality tiers (`src/lib/quality.ts`) gate DPR/shadows/post; `PerformanceMonitor` auto-degrades. Keep every new heavy effect gated. Floor reflection = one `MeshReflectorMaterial` plane over the whole ground floor (`scene/ReflectiveFloor.tsx`) — it re-renders the scene, so it is high-tier + rail-mode only; the textured collider floor boxes underneath are the low-quality fallback — don't remove them.
- Keep HTML-first: any text a user must read lives in DOM (panel/HUD), not in WebGL. In-world `drei <Html>` panels are DOM overlays that IGNORE the depth buffer (they show through walls) — do not use them for wall content. Paint it into a CanvasTexture on a plain mesh instead (`src/lib/ghpaint.ts` → GithubLive/GithubReadme): real depth test, fog, lighting and reflections for free. Remote images must be CORS-fetched (`loadImg` handles camo-proxy decode + SVG rasterise); a refused host draws a placeholder chip. Exhibit artwork/wall decor is generated CanvasTexture (`src/lib/poster.ts`, cached; redraws on `document.fonts.ready`) — decorative only, full text stays in the inspect panel. Surface materials (floor tiles, plaster walls, ceiling panels, wood) are procedural too (`src/lib/surfaces.ts`); use `tiled(tex, w, h, tile)` so texel density stays uniform per mesh. Canvas-texture rules: keep canvases power-of-two (NPOT mipmaps shimmer), size text with `fitFont()` (canvas `maxWidth` squashes glyphs unreadably), and never leave a permanent sin-pulse on emissive materials — pulse only on hover/selected.
- Language: UI copy in Uzbek (latin); code/comments in English.

## GitHub wall screens
The About-room screens (`GithubLive`, `GithubReadme`) never call the API directly — the anonymous limit is 60 req/hour per IP and a few reloads blank both walls. Everything goes through `src/lib/github.ts`: memory → localStorage (6h) → `public/github-snapshot.json` → an opportunistic live refresh that republishes to `onGithub()` subscribers. `scripts/fetch-github.mjs` (runs first in `build`, also `pnpm gh:snapshot`) rewrites that snapshot, **filtering out private repos** — it is committed and served from a public page, so a token that can see private repos must not leak their names; a failed fetch keeps the committed file and **never** fails the build, and CI passes `GITHUB_TOKEN` for the 1000 req/h limit. The snapshot is committed on purpose — it is the offline floor. Screens label their source from `snap.source` (`live` / `cache` / `build`), so don't claim "jonli" for data that came off disk.

**Hover state never goes into a big canvas texture.** `NavGlass` painted its hover into the 2048×1024 board, so every card the crosshair crossed cost a full redraw plus an 8MB upload — and `FreeWalk` samples hover 10×/s while you walk, which is what "qotish" on the board turned out to be. Hover is now a separate `HoverGlow` mesh moved into place (a matrix change, no canvas work); the board texture only repaints on language/room/count/star changes.

## Esc ladder
`scene/EscapeLadder.tsx` — Esc steps back out one rung at a time, **two presses per rung**: free walk → guided rail (picked up at `nearestU(camera.position)`, so the visitor keeps their spot) → start of the route (`railU = 0`) → front page (`phase = 'gate'`). Two presses because a locked pointer makes the browser eat the first Esc without ever firing a keydown, so `pointerlockchange` is counted as a press too — that makes the gesture identical whether or not the pointer was locked, and stops a stray Esc from ejecting someone. Rung 1 writes `mode`/`railU`/`railTarget` in one `setState`, NOT via `setMode('rail')`, which snaps u to the current room's entry waypoint and would throw away the position. Panels own Esc while open (inspect / bug report / feedback form); the ladder defers to them.

## Serverless
`api/feedback.js` is the only server code — a Vercel function relaying the 3D form to Telegram. `pnpm test:feedback` drives it with mock req/res and a stubbed fetch: method guard, length limits, the not-configured path, HTML escaping (a visitor's `<b>` must arrive as text), and the outgoing chat id. Never put a token behind a `VITE_` name; those are inlined into the public bundle.

## Like button
HUD chip (`ui/Hud.tsx` → `LikeChip`), counter key `likes`. Deliberately **not** a GitHub star: a like needs no GitHub account and works straight from the deployed page. One like per browser tab (`hasSeen`), so a returning visitor can like again; the chip renders pressed (`★`, accent) once this tab has liked.

## Visit counters
`src/lib/counter.ts` → Abacus (`abacus.jasoncameron.dev`), shown on the nav board: total visits in the headline, per-room entries on each card. Pages is static, so the number has to live off-site. Abacus was picked because it needs **no account and no token** — nothing to inline into the public bundle — sends `Access-Control-Allow-Origin: *`, and is open source, so a shutdown (CountAPI died in 2023) means self-hosting it and changing `BASE`. The namespace is public by design; anyone who finds it can inflate a count, which is the accepted trade for having no secret in a static site. `404` means "key not created yet" → recorded as 0, so the board shows a number and stops re-asking. Updates are coalesced on a 60ms timer — a page load fires nine requests and publishing each reply separately repainted the board's 2048² canvas nine times in a row. Counting is once per tab (`sessionStorage`), and every failure is silent — a counter being down must never break the museum. `pnpm test:counter` checks the contract against a throwaway namespace (get does not increment, hit adds exactly one, fresh key 404s, room keys independent, CORS present).

## Animated walls
`src/lib/wallFx.ts` patches wall materials via `onBeforeCompile` (emissive channel) with a procedural IT/AI pattern per room (`Room.fx` in `data/rooms.ts`: neural | circuit | rain | grid). One shared `fxTime`/`fxIntensity` uniform pair drives every wall — `WallFxDriver` in `World.tsx` advances it and zeroes it on the low tier. `customProgramCacheKey` must vary per mode or three reuses the wrong program. GLSL reserved words (`active`, `sample`, `filter`…) silently break compilation — check the console for "Shader Error" after editing.

## Bundle / chunking (Vite 8 = Rolldown)
- **No manual chunk groups.** Hand-written `advancedChunks` reordered internal dependencies and broke the production bundle with "x is not a function" (dev was fine — the error only appears in a built site). Rolldown's automatic splitting plus `React.lazy` gives a better result anyway.
- Eager `index` ≈ 343 kB gz. Lazy: `PhysicsWorld` (rapier + ecctrl, 853 kB gz, walk mode only), `Effects` (postprocessing, 81 kB gz), `TouchControls`.
- Anything importing `@react-three/rapier` or `ecctrl` must stay behind `React.lazy` — never import them from an eagerly-loaded module. World geometry uses `useBody()` (`scene/physics/BodyContext.tsx`) so it renders with or without physics.
- Always smoke-test a real production build before deploying: `pnpm build && pnpm preview` and open the base path it prints.


## Mobile & fullscreen
Joystick placement follows orientation (`ui/TouchControls.tsx`): upright it stays low and near the edge; turned sideways the screen widens and the phone is held two-handed, so it moves inboard (`6vw` / `8vh`, plus safe-area insets) — measured at 151px from the edge and 131px from the bottom on 844×390. In that orientation the minimap would sit under the joystick, so a `(orientation: landscape) and (pointer: coarse)` rule moves it up under the room title. `TouchLook` claims everything right of 45vw for look-drag; keep the joystick clear of that line.
Fullscreen is a HUD chip that hides itself where the API does not exist (iPhone Safari has none outside `<video>`). Leaving fullscreen with Esc is swallowed by the browser the same way pointer-lock release is — `EscapeLadder` watches `fullscreenchange` and drops its press count for 400ms, so reclaiming your window never counts as a rung.

## Bug-report loop
`src/ui/BugReport.tsx`: Shift+X (or the HUD “Bug | Feedback” chip) → canvas screenshot + description modal → **sent to Telegram** through `api/feedback.js` (`kind:'bug'`, multipart `sendPhoto`, meta in the caption). The capture is JPEG capped at 1600px (~100kB; a full PNG was ~3MB, over the request body limit). Downloading `bug-<stamp>.jpg` + `.txt` is the fallback when no endpoint is configured or the send fails, so a report is never lost. `store.reportOpen` freezes all game input while the modal is open (RailCamera/FreeWalk/Hud check it). Canvas needs `preserveDrawingBuffer: true` for `toDataURL`. The dev session watches ~/Downloads for new `bug-*.txt` and fixes reports as they arrive.

## Feedback form
About room south wall: `scene/FeedbackWall.tsx` — contact card + name/surname/message form painted into a CanvasTexture (no DOM overlay). Picking is UV-based; in walk mode `FreeWalk`'s centre raycast forwards the hit UV via `mesh.userData.onUvHit`. Typing goes through an offscreen `<textarea>` (mobile keyboard + paste + IME); `store.formOpen` freezes movement and hides the look-gate while a field is focused.
Delivery (`src/lib/feedback.ts`): `VITE_FEEDBACK_ENDPOINT` (preferred — `api/feedback.js` keeps `TG_BOT_TOKEN`/`TG_CHAT_ID` server-side) with a direct Telegram call as a dev-only fallback. Never commit a bot token: `VITE_*` values are inlined into the public bundle.

## Known TODO
Baked lightmaps; portals; audio; real content; WebGPU path.
