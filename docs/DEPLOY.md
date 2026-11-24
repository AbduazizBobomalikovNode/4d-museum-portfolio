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

Bu yerda tugadi — CI/CD ishlayapti. Quyidagi qadam faqat deploy'ni GitHub Actions nazorati ostiga olishni xohlasangiz kerak.

---

## Ixtiyoriy: deploy'ni GitHub Actions orqali yuritish

`.github/workflows/deploy-vercel.yml` har push'da `typecheck → lint → build` qiladi. Vercel secret'lari qo'yilmagan bo'lsa, u faqat shu tekshiruvni bajaradi va deploy qadamini o'tkazib yuboradi (Vercel o'zining Git integratsiyasi bilan deploy qilaveradi).

Deploy'ni ham Actions qilsin desangiz — repo **Settings → Secrets and variables → Actions** ga uchta secret qo'shing:

| Secret | Qayerdan olinadi |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Project → Settings → General (yoki `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | xuddi o'sha joyda |

Keyin Vercel dashboard'da **Settings → Git → Ignored Build Step** ga `exit 0` qo'ying — aks holda bitta push ikki marta deploy bo'ladi.

---

## Eslatmalar

1. **GitHub Pages ishlatilmaydi.** Pages workflow olib tashlangan; Settings → Pages → Source: None bo'lsin.
2. **`public/github-snapshot.json` ochiq.** U build vaqtida olinadi, repo'ga commit qilinadi va deploy qilingan saytda ko'rinadi. `scripts/fetch-github.mjs` private repolarni filtrlaydi, shuning uchun ularning nomi snapshot'ga tushmaydi.

---

## Tekshirish

```bash
pnpm test:feedback   # relay: metod, validatsiya, XSS ekranlash, Telegram chaqiruvi
pnpm test:counter    # tashrif hisoblagichi shartnomasi
BASE_PATH=/ VITE_FEEDBACK_ENDPOINT=/api/feedback pnpm build && pnpm preview
```

Deploy'dan keyin: saytni oching, About xonasidagi formani to'ldiring — Telegram'ga xabar kelishi kerak.
