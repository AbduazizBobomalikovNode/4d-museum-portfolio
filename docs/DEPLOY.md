# Deploy — Vercel

GitHub Pages'dan Vercel'ga o'tish. Sabab: `api/feedback.js` Vercel'da haqiqiy serverless funksiya bo'lib ishga tushadi, ya'ni fikr-mulohaza formasi nihoyat ishlaydi va Telegram tokeni serverda qoladi.

Repo tomonidagi hamma narsa tayyor: `vercel.json`, CI workflow, testlar. Qolgani — akkaunt va bir necha qiymat.

---

## 1. Akkaunt

[vercel.com/signup](https://vercel.com/signup) → **Continue with GitHub**. Hobby (bepul) reja yetarli.

## 2. Loyihani ulash

Vercel dashboard → **Add New… → Project** → `4D-portfolio` repo'sini tanlang → **Import**.

> **Project Name maydonini `4d-portfolio` qiling** — kichik harf bilan. Vercel loyiha nomlarida katta harfga ruxsat bermaydi (`4D-portfolio` xato beradi). Bu faqat Vercel'dagi nom; GitHub repo nomi o'zgarmaydi. Sayt manzili `4d-portfolio.vercel.app` bo'ladi.

Build sozlamalariga **tegmang** — ular `vercel.json` dan o'qiladi:

| | |
|---|---|
| Build Command | `BASE_PATH=/ VITE_FEEDBACK_ENDPOINT=/api/feedback pnpm build` |
| Output Directory | `dist` |
| Framework | Vite |

## 3. Environment Variables

Project → **Settings → Environment Variables**. Uchalasini **Production** va **Preview** uchun qo'shing:

| Nomi | Qiymati | Nima uchun |
|---|---|---|
| `TG_BOT_TOKEN` | @BotFather bergan token | Fikr formasi Telegram'ga yuboradi |
| `TG_CHAT_ID` | `<your_chat_id>` | Xabar qaysi chatga boradi |
| `GITHUB_TOKEN` | GitHub PAT (`public_repo` scope) | GitHub snapshot'ni 60 emas, 1000 req/soat bilan yangilaydi. **Ixtiyoriy** — bo'lmasa commit qilingan snapshot ishlatiladi |

> **Token haqida:** `TG_BOT_TOKEN` bu yerda server tomonda qoladi va public bundle'ga **tushmaydi**. `VITE_` prefiksli o'zgaruvchilarga hech qachon token qo'ymang — ular bundle'ga inline bo'ladi.

## 4. Deploy

**Import** tugmasini bosganingizdan keyin Vercel birinchi deploy'ni o'zi qiladi. Shundan keyin `main` ga har push avtomatik production deploy, har PR esa preview deploy oladi.

Bu yerda tugadi — CI/CD ishlayapti: deploy'ni Vercel'ning Git integratsiyasi qiladi, GitHub Actions esa faqat tekshiruv o'tkazadi.

---

## GitHub Actions (faqat tekshiruv)

`.github/workflows/deploy-vercel.yml` har push va PR'da `typecheck → lint → test:feedback → build` qiladi. U deploy qilmaydi — deploy'ni Vercel'ning o'z Git integratsiyasi bajaradi, shuning uchun Vercel secret'lari yoki *Ignored Build Step* kerak emas.

---

## Eslatmalar

1. **GitHub Pages ishlatilmaydi.** Pages workflow olib tashlangan; Settings → Pages → Source: None bo'lsin.
2. **`public/github-snapshot.json` ochiq.** U build vaqtida olinadi, repo'ga commit qilinadi va deploy qilingan saytda ko'rinadi. `scripts/fetch-github.mjs` private repolarni filtrlaydi, shuning uchun ularning nomi snapshot'ga tushmaydi.

---

## Fikr-mulohaza himoyasi (origin allowlist)

`/api/feedback` faqat o'z saytingizdan kelgan so'rovlarni qabul qiladi. Tekshiruvlar tartibi:

1. **`Origin`** sarlavhasi (u bo'lmasa `Referer` ning origin'i) allowlist'da bo'lishi shart, aks holda `403 {"error":"origin"}`. Taqqoslash aniq (sxema + host + port), qism-satr yoki qo'shimcha bo'yicha emas — `4d-portfolio.vercel.app.evil.com` o'tmaydi.
2. `Content-Type: application/json` bo'lishi shart, aks holda `415 {"error":"content-type"}`.
3. `name`, `surname`, `message`, `meta`, `kind` satr (`photo` — satr yoki `null`) bo'lmasa `400 {"error":"invalid"}`.
4. Bir IP'dan 10 daqiqada ko'pi bilan 5 ta so'rov, aks holda `429 {"error":"rate"}`.

Allowlist: `https://4d-portfolio.vercel.app` (doim), `FEEDBACK_ALLOWED_ORIGINS` dagi qo'shimchalar, deploy'ning o'z Vercel manzillari (`VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL` — shuning uchun preview deploy'lar avtomatik ishlaydi) va faqat lokal ishlaganda (`VERCEL_ENV` yo'q yoki `development`, masalan `vercel dev`) `http://localhost:*` / `http://127.0.0.1:*`. `preview` va `production`'da localhost **rad etiladi**.

| Nomi | Qiymati | Nima uchun |
|---|---|---|
| `FEEDBACK_ALLOWED_ORIGINS` | `https://domen.uz,https://www.domen.uz` (vergul bilan, **ixtiyoriy**) | Qo'shimcha ruxsat etilgan origin'lar |

> **Custom domen ulasangiz**, uni `FEEDBACK_ALLOWED_ORIGINS` ga qo'shing (`https://` bilan, `www` ko'rinishi ham alohida) — aks holda forma `403` beradi.

**Halol eslatma.** `Origin` sarlavhasini brauzer qo'yadi va boshqa veb-sayt uni soxtalashtira olmaydi — shuning uchun bu boshqa saytlardan va oddiy suiiste'moldan himoya qiladi. Lekin brauzerdan tashqari skript (`curl`, Python) istalgan sarlavhani yuborishi mumkin, shuning uchun bu **skript bilan ataylab yog'dirishdan to'liq himoya emas**. IP bo'yicha limit ham xotirada turadi: serverless nusxalari xotirani bo'lishmaydi, demak u kafolat emas, faqat pastki chegara. To'liq himoya uchun CAPTCHA (masalan Cloudflare Turnstile) yoki Vercel Firewall'da `/api/feedback` uchun rate-limit qoidasi kerak.

---

## Statik rasmlar keshi

`vercel.json` da `/assets/*` (nomida hash bor) bir yilga `immutable` keshlanadi. `/books/*`, `/textures/*` va `/cv-preview.jpg` esa `public, max-age=604800, stale-while-revalidate=86400` oladi — ya'ni brauzer ularni bir hafta qayta so'ramasdan ishlatadi (avval har tashrifda ~27 ta faylni qayta tekshirardi).

> **Muhim:** bu fayllarning nomida hash yo'q. Rasmni **almashtirsangiz, yangi fayl nomi bering** (masalan `cv-preview-2.jpg` va `CvWall.tsx` dagi havolani yangilang) — aks holda eski tashrifchilar bir hafta davomida eski rasmni ko'raveradi. `/github-snapshot.json` va `index.html` bu qoidaga kirmaydi: ular doim qayta tekshiriladi.

## Ish unumdorligini o'lchash / o'chirish kalitlari

- `?perf=1` — o'lchov rejimi: chap-pastda kichik panel (fps, p95, draw calls, triangles, programs, textures) va `window.__perf.snapshot()` / `window.__perf.reset()`. Bu rejimda tashrif/like hisoblagichlari **oshirilmaydi** (faqat o'qiladi). `?perf=1` bo'lmasa hech narsa yuklanmaydi.
- `?opt=off` — barcha optimizatsiyalar o'chadi (avvalgi xatti-harakat). `?optOff=stableTree,reflectorCull` — faqat nomi aytilganlari. Kalitlar: `stableTree`, `prefetchPhysics`, `reflectorCull`, `previewCull`, `monitorAfterEnter`, `noPreserveBuffer` (`src/lib/perfFlags.ts`).

---

## Tekshirish

```bash
pnpm test:feedback   # relay: metod, origin allowlist, content-type, turlar, rate limit, validatsiya, XSS ekranlash, Telegram chaqiruvi
pnpm test:counter    # tashrif hisoblagichi shartnomasi
BASE_PATH=/ VITE_FEEDBACK_ENDPOINT=/api/feedback pnpm build && pnpm preview
```

Deploy'dan keyin: saytni oching, About xonasidagi formani to'ldiring — Telegram'ga xabar kelishi kerak.
