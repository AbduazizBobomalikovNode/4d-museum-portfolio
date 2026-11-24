import type { Exhibit } from './types'

const GH = 'https://github.com/AbduazizBobomalikovNode'
const PAGES = 'https://abduazizbobomalikovnode.github.io'

/**
 * Real projects from github.com/AbduazizBobomalikovNode.
 * `local` is room-local (x, z); regular room walls at ±6.95 (door column |x|<2 on door walls).
 */
export const exhibits: Exhibit[] = [
  // ── entrance ──────────────────────────────────────────────
  {
    id: 'welcome', roomId: 'entrance', kind: 'frame',
    title: '4D Portfolio', subtitle: { uz: 'Tesseract Gallery', kr: 'Tesseract Gallery', ru: 'Галерея «Тессеракт»', en: 'Tesseract Gallery' }, year: '2026',
    description: { uz: 'Men Abduaziz — 2021-yildan beri web loyihalar, ERM, CRM, desktop ilovalar, Telegram botlar va IoT qurilmalari hamda tizimlarini quraman. Bu muzey — loyihalarimning ko‘rgazmasi: har xonada bitta yo‘nalish, har eksponatda bitta hal qilingan masala (qiziqarli loyiha) mavjud. Bemalol aylanib, ishlarimdan bahramand bo‘ling!', kr: 'Мен Абдуазиз — 2021-йилдан бери веб лойиҳалар, ERM, CRM, десктоп иловалар, Telegram ботлар ва IoT қурилмалари ҳамда тизимларини қураман. Бу музей — лойиҳаларимнинг кўргазмаси: ҳар хонада битта йўналиш, ҳар экспонатда битта ҳал қилинган масала (қизиқарли лойиҳа) мавжуд. Бемалол айланиб, ишларимдан баҳраманд бўлинг!', ru: 'Я Абдуазиз — с 2021 года создаю веб-проекты, ERM, CRM, десктоп-приложения, Telegram-ботов, а также IoT-устройства и системы. Этот музей — выставка моих работ: в каждом зале одно направление, в каждом экспонате одна решённая задача (интересный проект). Проходите и знакомьтесь!', en: 'I am Abduaziz — since 2021 I have been building web projects, ERM and CRM systems, desktop apps, Telegram bots, and IoT devices and systems. This museum is an exhibition of my work: one direction per room, one solved problem — one interesting project — per exhibit. Walk around and have a look!' },
    local: [-6.95, 0], facing: 90,
  },
  // ── projects (asosiy ishlar) ──────────────────────────────
  {
    id: 'tibsim', roomId: 'projects', kind: 'frame',
    title: 'TibSim', subtitle: { uz: 'Virtual tibbiyot laboratoriyasi', kr: 'Виртуал тиббиёт лабораторияси', ru: 'Виртуальная медицинская лаборатория', en: 'Virtual medical lab' }, year: '2026',
    tags: ['TypeScript', '3D', 'PWA', 'UZ/RU'],
    description: { uz: '10 interaktiv simulyator: rentgen, KT, MRT, UZI, EKG, bemor monitori… Real fizik modellar (IEC, ICRP, NIST), baholash tizimi, oflayn PWA, UZ/RU.', kr: '10 интерактив симулятор: рентген, КТ, МРТ, УЗИ, ЭКГ, бемор монитори… Реал физик моделлар (IEC, ICRP, NIST), баҳолаш тизими, офлайн PWA, UZ/RU.', ru: '10 интерактивных симуляторов: рентген, КТ, МРТ, УЗИ, ЭКГ, монитор пациента… Реальные физические модели (IEC, ICRP, NIST), система оценки, офлайн-PWA, UZ/RU. Демо: abduazizbobomalikovnode.github.io/tibsim', en: '10 interactive simulators: X-ray, CT, MRI, ultrasound, ECG, patient monitor… Real physics models (IEC, ICRP, NIST), assessment system, offline PWA, UZ/RU.' },
    local: [-6.95, 0], facing: 90, link: GH + '/tibsim',
  },
  {
    id: 'tg-ai-analyzer', roomId: 'projects', kind: 'frame',
    title: 'TG AI Analyzer', subtitle: { uz: 'Telegram uchun AI agent', kr: 'Telegram учун AI агент', ru: 'AI-агент для Telegram', en: 'AI agent for Telegram' }, year: '2026',
    tags: ['Python', 'AI', 'Telegram'],
    description: { uz: 'Telegram chatlarini AI orqali tahlil qiluvchi agent: Telethon (MTProto) + aiogram 3, Claude/Gemini/DeepSeek router, PostgreSQL + pgvector, Redis + ARQ, FastAPI Mini App.', kr: 'Telegram чатларини AI орқали таҳлил қилувчи агент: Telethon (MTProto) + aiogram 3, Claude/Gemini/DeepSeek роутер, PostgreSQL + pgvector, Redis + ARQ, FastAPI Mini App.', ru: 'Агент, анализирующий чаты Telegram с помощью ИИ: Telethon (MTProto) + aiogram 3, роутер Claude/Gemini/DeepSeek, PostgreSQL + pgvector, Redis + ARQ, FastAPI Mini App.', en: 'An AI agent that analyses Telegram chats: Telethon (MTProto) + aiogram 3, a Claude/Gemini/DeepSeek router, PostgreSQL + pgvector, Redis + ARQ, FastAPI Mini App.' },
    local: [6.95, 0], facing: -90, link: GH + '/tg-ai-analyzer', demo: PAGES + '/tg-ai-analyzer/',
  },
  {
    id: 'changelog-chat', roomId: 'projects', kind: 'frame',
    title: 'Changelog Chat', subtitle: { uz: 'Swift ilova', kr: 'Swift илова', ru: 'Приложение на Swift', en: 'Swift app' }, year: '2026',
    tags: ['Swift'],
    description: { uz: 'macOS menu-bar widget: lokal git repolardagi tag’lar orasidagi o‘zgarishlarni Claude yordamida o‘zbek tilida, foydalanuvchi tushunadigan changelog’ga aylantiradi. SwiftUI, macOS 14+, universal .dmg.', kr: 'macOS menu-bar виджет: локал git репоlardagi тэглар орасидаги ўзгаришларни Claude ёрдамида ўзбек тилида, фойдаланувчи тушунадиган changelog’га айлантиради. SwiftUI, macOS 14+, универсал .dmg.', ru: 'Виджет строки меню macOS: превращает изменения между тегами в локальных git-репозиториях в понятный changelog на узбекском с помощью Claude. SwiftUI, macOS 14+, универсальный .dmg.', en: 'A macOS menu-bar widget that turns the diff between tags in local git repos into a human-readable changelog in Uzbek, using Claude. SwiftUI, macOS 14+, universal .dmg.' },
    local: [-4.5, -6.95], facing: 0, link: GH + '/changelog-chat', demo: PAGES + '/changelog-chat/',
  },
  {
    id: 'hacking-animation', roomId: 'projects', kind: 'screen',
    title: 'Hacking Animation', subtitle: { uz: 'Electron desktop', kr: 'Electron desktop', ru: 'Electron-приложение', en: 'Electron desktop' }, year: '2025',
    tags: ['Electron', 'JavaScript'],
    description: { uz: 'Cyber-uslubdagi zamonaviy desktop animatsiya ilovasi — Electron’da qurilgan.', kr: 'Cyber-услубдаги замонавий desktop анимация иловаси — Electron’да қурилган.', ru: 'Современное десктоп-приложение с киберанимацией — на Electron.', en: 'A modern cyber-themed desktop animation app built with Electron.' },
    local: [4.5, -6.95], facing: 0, link: GH + '/hacking-animation', demo: PAGES + '/hacking-animation/',
  },
  {
    id: 'sam-tour', roomId: 'projects', kind: 'frame',
    title: 'Sam Tour Services', subtitle: { uz: 'Turizm boti', kr: 'Туризм боти', ru: 'Туристический бот', en: 'Tourism bot' }, year: '2025',
    tags: ['JavaScript'],
    description: { uz: 'Turistik xizmatlar uchun Telegram bot: yo‘nalishlar, narxlar va buyurtma qabuli. Statistika Excel hisobot va grafikka aylanadi.', kr: 'Туристик хизматлар учун Telegram бот: йўналишлар, нархлар ва буюртма қабули. Статистика Excel ҳисобот ва графикка айланади.', ru: 'Telegram-бот для туристических услуг: направления, цены и приём заказов. Статистика превращается в Excel-отчёт и график.', en: 'A Telegram bot for tourism services: destinations, prices and order intake. Statistics become an Excel report and a chart.' },
    local: [-4.5, 6.95], facing: 180, link: GH + '/Sam-Tour-Services', demo: PAGES + '/Sam-Tour-Services/',
  },
  {
    id: 'hayotdriedfruit', roomId: 'projects', kind: 'frame',
    title: 'HayotDriedFruit.uz', subtitle: { uz: 'Ishlab turgan sayt', kr: 'Ишлаб турган сайт', ru: 'Работающий сайт', en: 'Live website' }, year: '2024',
    tags: ['HTML', 'Production'],
    description: { uz: 'Quritilgan meva eksporti kompaniyasi uchun ishlab chiqarishdagi sayt — hayotdriedfruit.uz.', kr: 'Қуритилган мева экспорти компанияси учун ишлаб чиқаришдаги сайт — hayotdriedfruit.uz.', ru: 'Продакшн-сайт компании по экспорту сухофруктов — hayotdriedfruit.uz.', en: 'A production website for a dried-fruit export company — hayotdriedfruit.uz.' },
    local: [4.5, 6.95], facing: 180, link: GH + '/hayotdriedfruit.uz', demo: PAGES + '/hayotdriedfruit.uz/',
  },
  // ── skills ────────────────────────────────────────────────
  {
    id: 'stack', roomId: 'skills', kind: 'screen',
    title: 'Stack', subtitle: { uz: 'C · C++ · C# · TypeScript · Python · Swift · PHP', kr: 'C · C++ · C# · TypeScript · Python · Swift · PHP', ru: 'C · C++ · C# · TypeScript · Python · Swift · PHP', en: 'C · C++ · C# · TypeScript · Python · Swift · PHP' },
    description: { uz: 'C oilasi (C, C++, C#) · Node.js, Telegraf, Express · React va React Native · Electron · Vite/React · 3D (Three.js) · Python (AI agentlar, konvertorlar) · Swift · PHP/Laravel · MQTT va IoT · Docker, Linux, Nginx.', kr: 'C оиласи (C, C++, C#) · Node.js, Telegraf, Express · React ва React Native · Electron · Vite/React · 3D (Three.js) · Python (AI агентлар, конверторлар) · Swift · PHP/Laravel · MQTT ва IoT · Docker, Linux, Nginx.', ru: 'Семейство C (C, C++, C#) · Node.js, Telegraf, Express · React и React Native · Electron · Vite/React · 3D (Three.js) · Python (AI-агенты, конверторы) · Swift · PHP/Laravel · MQTT и IoT · Docker, Linux, Nginx.', en: 'The C family (C, C++, C#) · Node.js, Telegraf, Express · React and React Native · Electron · Vite/React · 3D (Three.js) · Python (AI agents, converters) · Swift · PHP/Laravel · MQTT and IoT · Docker, Linux, Nginx.' },
    local: [0, -6.95], facing: 0,
  },
  // ── contact ───────────────────────────────────────────────
  {
    id: 'github', roomId: 'contact', kind: 'frame',
    title: 'GitHub', subtitle: { uz: '@AbduazizBobomalikovNode', kr: '@AbduazizBobomalikovNode', ru: '@AbduazizBobomalikovNode', en: '@AbduazizBobomalikovNode' },
    description: { uz: 'Barcha ochiq kodli loyihalar — 18 repo. Yulduzcha bosishni unutmang ✦', kr: 'Барча очиқ кодли лойиҳалар — 18 репо. Юлдузча босишни унутманг ✦', ru: 'Все open-source проекты — 18 репозиториев. Не забудьте поставить звезду ✦', en: 'All open-source projects — 18 repos. Do not forget to star ✦' },
    local: [0, -6.95], facing: 0, link: GH,
  },
  {
    id: 'contact-card', roomId: 'contact', kind: 'screen',
    title: 'Bog‘lanish', subtitle: { uz: 'Email · Telegram', kr: 'Email · Telegram', ru: 'Email · Telegram', en: 'Email · Telegram' },
    description: { uz: 'Ish taklifi, savol yoki shunchaki suhbat uchun — shu manzilga yozing. Rezyume qarshi devorda, kodlar esa GitHub’da.', kr: 'Иш таклифи, савол ёки шунчаки суҳбат учун — шу манзилга ёзинг. Резюме қарши деворда, кодлар эса GitHub’да.', ru: 'Предложение о работе, вопрос или просто разговор — пишите на этот адрес. Резюме на стене напротив, код — на GitHub.', en: 'A job offer, a question, or just a conversation — write to this address. The CV is on the wall opposite, the code is on GitHub.' },
    local: [6.95, 0], facing: -90, link: 'mailto:azizbek12234@gmail.com',
  },
  // ── experiments (2-qavat) ─────────────────────────────────
  {
    id: 'smart-call-v2', roomId: 'experiments', kind: 'screen',
    title: 'Smart Call v2', subtitle: { uz: 'Aqlli chaqiruv tizimi', kr: 'Ақлли чақирув тизими', ru: 'Умная система вызова', en: 'Smart call system' }, year: '2024',
    tags: ['JavaScript', 'IoT'],
    description: { uz: 'Chaqiruv tizimining ikkinchi versiyasi: MQTT broker qatlami olib tashlandi, aloqa Socket.io orqali — kod 40 088 qatordan 1 629 qatorga tushdi.', kr: 'Чақирув тизимининг иккинчи версияси: MQTT брокер қатлами олиб ташланди, алоқа Socket.io орқали — код 40 088 қатордан 1 629 қаторга тушди.', ru: 'Вторая версия системы вызова: слой MQTT-брокера убран, связь через Socket.io — код сократился с 40 088 строк до 1 629.', en: 'The second version of the call system: the MQTT broker layer was removed and devices connect over Socket.io — the code went from 40,088 lines to 1,629.' },
    local: [0, -6.95], facing: 0, link: GH + '/system-smart-call-v2', demo: PAGES + '/system-smart-call-v2/',
  },
  {
    id: 'smart-call-service', roomId: 'experiments', kind: 'frame',
    title: 'Smart Call Service', subtitle: { uz: 'IoT chaqiruv tizimi', kr: 'IoT чақирув тизими', ru: 'Система вызова IoT', en: 'IoT call system' }, year: '2024',
    tags: ['CSS'],
    description: { uz: 'IoT tugmadan kelgan chaqiruvni vazifaga aylantiradi va rolga qarab mas’ul xodimga yuboradi. MQTT, MongoDB, real vaqtda panel, DOCX hisobot.', kr: 'IoT тугмадан келган чақирувни вазифага айлантиради ва ролга қараб масъул ходимга юборади. MQTT, MongoDB, реал вақтда панел, DOCX ҳисобот.', ru: 'Превращает вызов с IoT-кнопки в задачу и направляет ответственному сотруднику по роли. MQTT, MongoDB, панель в реальном времени, отчёт DOCX.', en: 'Turns a press on an IoT button into a task and routes it to the responsible staff member by role. MQTT, MongoDB, a real-time panel and DOCX reports.' },
    local: [-6.95, 0], facing: 90, link: GH + '/smart-call-servise', demo: PAGES + '/smart-call-servise/',
  },
  {
    id: 'broker', roomId: 'experiments', kind: 'pedestal',
    title: 'MQTT Broker', subtitle: { uz: 'IoT', kr: 'IoT', ru: 'IoT', en: 'IoT' }, year: '2024',
    tags: ['MQTT', 'IoT'],
    description: { uz: 'Mosca ustida qurilgan MQTT broker va boshqaruv paneli: qurilmalarni ro‘yxatga oladi, topiclarga biriktiradi, kim nimaga yozishini nazorat qiladi.', kr: 'Mosca устида қурилган MQTT брокер ва бошқарув панели: қурилмаларни рўйхатга олади, topicларга бириктиради, ким нимага ёзишини назорат қилади.', ru: 'MQTT-брокер на Mosca и панель управления: регистрирует устройства, привязывает к топикам, контролирует права на запись.', en: 'An MQTT broker built on Mosca with a control panel: registers devices, binds them to topics and controls who may publish where.' },
    local: [-3, 0], facing: 0, link: GH + '/broker', demo: PAGES + '/broker/',
  },
  {
    id: 'ml-convertor', roomId: 'experiments', kind: 'frame',
    title: 'ML Convertor', subtitle: { uz: 'Office fayl konvertori', kr: 'Office файл конвертори', ru: 'Конвертер офисных файлов', en: 'Office file converter' }, year: '2024',
    tags: ['Python'],
    description: { uz: 'Excel, Word, PowerPoint hujjatlarini PDF, HTML, XLSX, DOCX, PPTX va boshqa formatlarga aylantiruvchi Python vositasi.', kr: 'Excel, Word, PowerPoint ҳужжатларини PDF, HTML, XLSX, DOCX, PPTX ва бошқа форматларга айлантирувчи Python воситаси.', ru: 'Python-инструмент для конвертации Excel, Word, PowerPoint в PDF, HTML, XLSX, DOCX, PPTX и другие форматы.', en: 'A Python tool that converts Excel, Word and PowerPoint documents to PDF, HTML, XLSX, DOCX, PPTX and more.' },
    local: [6.95, 0], facing: -90, link: GH + '/ml_convertor_free', demo: PAGES + '/ml_convertor_free/',
  },
  // ── timeline (2-qavat) ────────────────────────────────────
  {
    id: 't-2022', roomId: 'timeline', kind: 'frame',
    title: 'Valyuta kursi', subtitle: { uz: 'Boshlanish', kr: 'Бошланиш', ru: 'Начало', en: 'The beginning' }, year: '2022',
    tags: ['JavaScript'],
    description: { uz: 'Banklar valyuta kurslari, omonat va kredit kalkulyatorlari — ilk jiddiy loyiha.', kr: 'Банклар валюта курслари, омонат ва кредит калкуляторлари — илк жиддий лойиҳа.', ru: 'Курсы валют банков, калькуляторы вкладов и кредитов — первый серьёзный проект.', en: 'Bank exchange rates, deposit and loan calculators — the first serious project.' },
    local: [-4.5, -6.95], facing: 0, link: GH + '/Valyuta-kursi', demo: PAGES + '/Valyuta-kursi/',
  },
  {
    id: 't-2023a', roomId: 'timeline', kind: 'frame',
    title: 'Ishkal.uz', subtitle: { uz: 'PHP web', kr: 'PHP web', ru: 'PHP-сайт', en: 'PHP web' }, year: '2023',
    tags: ['PHP'],
    description: { uz: 'Laravel’da qurilgan universitetlar katalogi: mamlakat, oliygoh va yo‘nalishlar bo‘yicha qidiruv. Repo arxivga olingan.', kr: 'Laravel’да қурилган университетлар каталоги: мамлакат, олийгоҳ ва йўналишлар бўйича қидирув. Репо архивга олинган.', ru: 'Каталог университетов на Laravel: поиск по странам, вузам и направлениям. Репозиторий в архиве.', en: 'A university catalogue built with Laravel — search by country, university and field. The repo is archived.' },
    local: [4.5, -6.95], facing: 0,
  },
  {
    id: 't-2023b', roomId: 'timeline', kind: 'frame',
    title: 'Pay-bot', subtitle: { uz: 'To‘lov boti', kr: 'Тўлов боти', ru: 'Платёжный бот', en: 'Payment bot' }, year: '2023',
    tags: ['JavaScript', 'Telegram'],
    description: { uz: 'Telegram orqali to‘lovlarni qabul qiluvchi bot.', kr: 'Telegram орқали тўловларни қабул қилувчи бот.', ru: 'Бот для приёма платежей через Telegram.', en: 'A bot that accepts payments through Telegram.' },
    local: [-4.5, 6.95], facing: 180, link: GH + '/Pay-bot', demo: PAGES + '/Pay-bot/',
  },
  {
    id: 't-2024', roomId: 'timeline', kind: 'frame',
    title: 'BearPartner Bot', subtitle: { uz: 'Telegraf JS', kr: 'Telegraf JS', ru: 'Telegraf JS', en: 'Telegraf JS' }, year: '2023–2024',
    tags: ['JavaScript', 'Telegraf'],
    description: { uz: 'BearPartner uchun Telegraf JS’da yozilgan bot.', kr: 'BearPartner учун Telegraf JS’да ёзилган бот.', ru: 'Бот для BearPartner, написанный на Telegraf JS.', en: 'A bot for BearPartner written with Telegraf JS.' },
    local: [4.5, 6.95], facing: 180, link: GH + '/BearPartner_bot_js', demo: PAGES + '/BearPartner_bot_js/',
  },
  {
    id: 't-2025', roomId: 'timeline', kind: 'pedestal',
    title: 'IELTS Prep', subtitle: { uz: 'IELTS tayyorgarligi', kr: 'IELTS тайёргарлиги', ru: 'Подготовка к IELTS', en: 'IELTS preparation' }, year: '2025',
    tags: ['TypeScript', 'Vercel'],
    description: { uz: 'IELTS’ga tayyorgarlik ilovasi: 3600 ta so‘z transkripsiya, tarjima va misol gap bilan, hamda tinglash mashqlari.', kr: 'IELTS’га тайёргарлик иловаси: 3600 та сўз транскрипция, таржима ва мисол гап билан, ҳамда тинглаш машқлари.', ru: 'Приложение для подготовки к IELTS: 3600 слов с транскрипцией, переводом и примерами, плюс задания на аудирование.', en: 'An IELTS preparation app: 3600 words with transcription, translation and example sentences, plus listening practice.' },
    local: [0, -3], facing: 0, link: 'https://for-l-elits.vercel.app',
  },
]

export const exhibitById = Object.fromEntries(exhibits.map((e) => [e.id, e])) as Record<string, Exhibit>
