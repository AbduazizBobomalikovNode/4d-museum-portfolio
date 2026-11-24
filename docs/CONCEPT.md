# Concept A — Tesseract Gallery

> Black-box muzey + brutalist beton. Har xona — hypercube (tesseract) ning bitta katagi.
> Atriumda 4D aylanuvchi tesseract. Xonalar portallar bilan non-Euclid bog'lanadi (keyingi bosqich).

## Xonalar (8 = hypercube kataklari)

```
1-qavat (y=0):                          2-qavat (y=6):
        [atrium]-[skills]-[contact]        [experiments]
            |                                   |
        [projects]          [about]-[timeline]-[atrium mezanin]
            |
        [entrance]
```
Atriumda zina (x −7→+7, z=−3.5) va mezanin (shimoliy + g'arbiy strip) 2-qavatga olib chiqadi.

| id | Nomi | Vazifa |
|---|---|---|
| entrance | Kirish zali | intro, onboarding, "Enter" |
| projects | Loyihalar qanoti | asosiy eksponatlar (ramkalar, pedestal) |
| atrium | Tesseract Atrium | hub, 4D markaz, yo'nalish tanlash |
| skills | Ko'nikmalar lab | stack ekranlari |
| contact | Sovg'alar do'koni | CTA, email, CV |
| experiments | Tajribalar | shader/WebGPU demo |
| timeline | Vaqt yo'lagi | yillar bo'ylab; time-dial kuchli ta'sir |
| about | Men haqimda | shaxsiy |

Geometriya: xona 14×14×5.2, atrium 20×20×12 (ikki qavatli), yo'lak 4 keng, spacing 20, 2-qavat y=6. `src/data/rooms.ts`.

## Navigatsiya (hybrid)
- **Rail (default):** Blender/curve bo'ylab scroll / ↑↓ / touch-drag; waypoint'larda `lookAt` (pedestal oldida to'xtash). `src/lib/rail.ts`, `RailCamera.tsx`.
- **Free-walk (M):** ecctrl capsule + PointerLock; mobile: joystick (chap) + drag-look (o'ng). `FreeWalk.tsx`, `TouchLook.tsx`.
- **Mini-map:** hypercube net SVG, click → teleport. `MiniMap.tsx`.
- **Inspect:** click / E / tap → glass DOM panel. `InspectPanel.tsx`.

## "4D"
- **Vaqt:** HUD time-dial (`timeOfDay` 0..1) → `Lighting.tsx` (hozir realtime; keyin baked lightmap blend).
- **Tesseract:** `lib/tesseract.ts` (6 tekislik rotatsiya + w-perspektiv), `Tesseract.tsx`.
- **Portallar (TODO):** drei `MeshPortalMaterial` / stencil `<Mask>`; ≤2 ko'rinadigan, half-res RT.

## Art direction
Palitra: `#0B0C10` ground · beton `#2A2D34 / #4A4E57` · accent amber `#F2B441` (iliq spot) · cyan `#5DE4FF` (tesseract/skills). Yorug'lik: eksponatga iliq 3000K spot, betonga sovuq. AgX tonemap, grain 12%, vignette. Font: Syne (display) · IBM Plex Sans (body) · IBM Plex Mono (HUD).

## Devor animatsiyalari (default fon)
Har xonaning devorlarida protsedural AI/IT patterni (shader, `src/lib/wallFx.ts`):
| Xona | Pattern | Nima ko'rinadi |
|---|---|---|
| entrance, timeline | `grid` | data lattice, gorizontal paket oqimi, miltillovchi status bloklar, skan to'lqini |
| projects, contact | `circuit` | plata izlari, padlar, tok impulslari |
| atrium, skills, about | `neural` | neyron tugunlari + sinaps chiziqlari, yuguruvchi aktivatsiya |
| experiments | `rain` | diskret glif ustunlari (matrix rain) |
Rang — xona aksenti; feature devorda kuchliroq (0.5), qolganida 0.28. Low sifatda o'chadi, medium'da 0.7.

## Roadmap
1. ✅ Greybox + rail + free-walk + HUD + inspect + time-dial + tesseract
2. ✅ Protsedural sirtlar (beton plitkali pol, plaster devorlar + rangli feature devor, panelli shift + chiroq-liniyalar, yog'och zina + shisha panjara) — `src/lib/surfaces.ts` · Keyin: Blender blockout → baked lightmaps → GLB; colliders primitive qoladi
3. Portallar (atrium ↔ xonalar), "memory room" (Gaussian splat, Spark)
4. Audio: PositionalAudio per room, ambient bed, Enter = unlock
5. Kontent: ✅ real GitHub loyihalar (19 repo → 20 eksponat) · ✅ canvas poster'lar (GitHub-card uslubi), til badge devorlari (skills), kod murallari (atrium), eshik signage'lari, GitHub avatar portreti (about) — `src/lib/poster.ts`, `src/scene/Decor.tsx` · TODO video texturalar, iframe screen
6. Perf: ✅ lazy physics/post chunks (eager ≈350 kB gz) · ✅ SpotPool (doimiy yorug'lik soni — shader qayta kompilyatsiya yo'q) · ✅ xona-culling + warm-up compile · ✅ umumiy geometriya (440→65) · ✅ tekstura/material keshi · TODO detect-gpu, KTX2, LOD, Lighthouse
7. WebGPU: `three/webgpu` + TSL (R3F v10 stable bo'lgach), post → RenderPipeline
8. A11y/SEO: react-three-a11y, per-room URL, JSON-LD, guide.html kengaytirish

## Zina balustrade chizmasi (aniq geometriya)

Zina: run 14 m (x −7…+7), rise 6 m (y 0…6). Qiyalik θ = atan(6/14) = **23.2°**. Diagonal: yD(x) = (x+7)·6/14. Panjara balandligi H = 1.05 m.

### Shimoliy panel (z = −4.96) — bitta 8 qirrali poligon
Void (mezz chetidan zinaga 3 m tushish) himoyasi + zina yon devori birlashtirilgan:
| Nuqta | x | y | Izoh |
|---|---|---|---|
| A | −6.85 | 0.00 | pastki post ichida |
| B | +6.85 | 5.82 | diagonal pastki qirra (yD−0.12), 23.2° |
| C | +6.85 | 6.00 | vertikal 90° |
| D | +7.30 | 6.00 | mezz pol chizig'i, gorizontal |
| E | +7.30 | 7.05 | vertikal 90° (landing o'tish cheti) |
| F | −5.00 | 7.05 | yuqori gorizontal (void himoya) |
| G | −5.00 | 1.91 | vertikal 90° (strip↔strip o'tish cheti) |
| H | −6.85 | 0.99 | qiya yuqori qirra (yD+1.05), 23.2° |
8 qirra: 2 ta 23.2° qiya, 3 ta 90° vertikal, 2 ta gorizontal, 1 ta yopuvchi. Yoy yo'q.
Handraillar: qiya bar diagonal bo'ylab (panel yuzasida), gorizontal bar y=7.05 (x −5…7.3).

### Janubiy panel (z = −2.15) — 4 qirrali parallelogram
(−6.85, −0.06) → (+6.85, 5.82) → (+6.85, 6.87) → (−6.85, 0.99). Ikki qiya (23.2°) + ikki vertikal (90°). Landing rail x 6.85…10 dan davom etadi (dublikatsiz).
