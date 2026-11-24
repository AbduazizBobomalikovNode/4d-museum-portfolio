# 4D Muzey-Portfolio — Research (2026-08-23)

Vizual hisobot: https://claude.ai/code/artifact/d44cf575-4995-4029-b9ee-a6e91f8f6b77 (local: `report.html`)

| Fayl | Mazmun |
|---|---|
| `00-own-findings.md` | Asosiy sessiya topilmalari: trend statistikasi, WebGPU/TSL, HTML-in-Canvas, Spark/Marble, jury mezonlari |
| `01-tech-stack.md` | Engine taqqoslash (Three/R3F, Babylon 9, PlayCanvas, Unity, Godot, Unreal PS, Needle…), tavsiya etilgan stack, pipeline, post-FX, lighting, audio, perf, presence, AI capture |
| `02-examples-and-references.md` | 60+ misol: Bruno Simon, Samsy, Bartlett, Xbox Museum, Cartier, Iventions, room portfolios, studiolar, virtual muzeylar, brend metaverse; umumiy patternlar |
| `03-art-direction-ux.md` | Vizual uslublar jadvali, 2026 trendlar, navigatsiya modellari, muzey UX, onboarding, a11y/SEO, yorug'lik, 3 ta konsept (A Tesseract Gallery — tavsiya) |
| `04-repos-tutorials-techniques.md` | GitHub repolar (stars/push), starterlar, kurslar, texnika→link jadvali, assetlar, deploy |

## Qisqa xulosa
- Stack: Vite + React 19 + R3F 9.5 (v10 ga o'tish) + three/webgpu + TSL, rapier+ecctrl (yoki BVHEcctrl), Blender baked → gltf-transform (Meshopt+KTX2), GSAP + camera-controls, RenderPipeline/N8AO, PositionalAudio, PerformanceMonitor + detect-gpu.
- Navigatsiya: hybrid — guided rail default + free-walk toggle + mini-map/teleport.
- "4D": vaqt qatlami (time-dial, timeline corridor) + portallar (MeshPortalMaterial/stencil) + tesseract hub.
- Konsept tavsiyasi: **A — Tesseract Gallery** (black-box brutalist muzey, hypercube xonalar, portallar).
