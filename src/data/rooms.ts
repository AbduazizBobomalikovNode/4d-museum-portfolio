import type { Corridor, RailWaypoint, Room, RoomId } from './types'

/**
 * Two-storey floor plan (8 rooms = hypercube cells).
 *
 * Ground floor (y=0):        Upper floor (y=6):
 *
 *        [atrium]-[skills]-[contact]        [experiments]
 *            |                                   |
 *        [projects]              [about]-[timeline]-[atrium mezzanine]
 *            |
 *        [entrance]
 *
 * Rooms are 14×14 (atrium 20×20, double-height). Corridor width 4. Spacing = 20.
 * The atrium holds the stair + mezzanine that connect the floors.
 */
export const ROOM_SIZE = 14
export const ROOM_HEIGHT = 5.2
export const ATRIUM_SIZE = 20
export const ATRIUM_HEIGHT = 12
export const CORRIDOR_WIDTH = 4
export const DOOR_HEIGHT = 3.2
export const SPACING = 20
export const FLOOR2_Y = 6

const SZ: [number, number] = [ROOM_SIZE, ROOM_SIZE]

export const rooms: Room[] = [
  {
    id: 'entrance', fx: 'grid', cell: 0, level: 0, floorY: 0,
    title: { uz: 'Kirish zali', kr: 'Кириш зали', ru: 'Входной зал', en: 'Entrance Hall' }, eyebrow: { uz: 'Muzey kirishi', kr: 'Музей кириши', ru: 'Вход в музей', en: 'Museum entrance' },
    center: [0, SPACING * 2], size: SZ, height: ROOM_HEIGHT, accent: '#F2B441',
    description: { uz: 'Yo‘nalishni tanlang — eshiklar ustidagi belgilar sizni xonalarga olib boradi.', kr: 'Йўналишни танланг — эшиклар устидаги белгилар сизни хоналарга олиб боради.', ru: 'Выберите направление — указатели над дверями приведут вас в залы.', en: 'Pick a direction — the signs above the doors lead to the rooms.' },
  },
  {
    id: 'projects', fx: 'circuit', cell: 1, level: 0, floorY: 0,
    title: { uz: 'Loyihalar qanoti', kr: 'Лойиҳалар қаноти', ru: 'Крыло проектов', en: 'Projects Wing' }, eyebrow: { uz: 'Asosiy ekspozitsiya', kr: 'Асосий экспозиция', ru: 'Основная экспозиция', en: 'Main exhibition' },
    center: [0, SPACING], size: SZ, height: ROOM_HEIGHT, accent: '#F2B441',
    description: { uz: 'Ishlab chiqarishga chiqqan va hozir ham rivojlanayotgan asosiy loyihalar.', kr: 'Ишлаб чиқаришга чиққан ва ҳозир ҳам ривожланаётган асосий лойиҳалар.', ru: 'Основные проекты — те, что дошли до продакшена и живут до сих пор.', en: 'The main projects — the ones that shipped and are still alive.' },
  },
  {
    id: 'atrium', fx: 'neural', cell: 2, level: 0, floorY: 0,
    title: { uz: 'Atrium', kr: 'Атриум', ru: 'Атриум', en: 'Atrium' }, eyebrow: { uz: 'Markaziy zal · 2 qavat', kr: 'Марказий зал · 2 қават', ru: 'Центральный зал · 2 этажа', en: 'Central hall · 2 floors' },
    center: [0, 0], size: [ATRIUM_SIZE, ATRIUM_SIZE], height: ATRIUM_HEIGHT, accent: '#5DE4FF',
    description: { uz: 'Ikki qavatli markaziy zal. Globus shu yerda aylanadi; zina 2-qavatga olib chiqadi.', kr: 'Икки қаватли марказий зал. Глобус шу ерда айланади; зина 2-қаватга олиб чиқади.', ru: 'Двухуровневый центральный зал. Здесь вращается глобус; лестница ведёт на 2-й этаж.', en: 'The double-height central hall. The globe turns here; the stair leads to floor two.' },
  },
  {
    id: 'skills', fx: 'neural', cell: 3, level: 0, floorY: 0,
    title: { uz: 'Ko‘nikmalar laboratoriyasi', kr: 'Кўникмалар лабораторияси', ru: 'Лаборатория навыков', en: 'Skills Lab' }, eyebrow: { uz: 'Texnologiyalar', kr: 'Технологиялар', ru: 'Технологии', en: 'Technologies' },
    center: [SPACING, 0], size: SZ, height: ROOM_HEIGHT, accent: '#5DE4FF',
    description: { uz: 'Kundalik ishimda foydalanadigan tillar, vositalar va yondashuvlar.', kr: 'Кундалик ишимда фойдаланадиган тиллар, воситалар ва ёндашувлар.', ru: 'Языки, инструменты и подходы, с которыми я работаю каждый день.', en: 'The languages, tools and approaches I work with every day.' },
  },
  {
    id: 'contact', fx: 'circuit', cell: 4, level: 0, floorY: 0,
    title: { uz: 'Sovg‘alar do‘koni', kr: 'Совғалар дўкони', ru: 'Сувенирная лавка', en: 'Gift Shop' }, eyebrow: { uz: 'Bog‘lanish', kr: 'Боғланиш', ru: 'Контакты', en: 'Get in touch' },
    center: [SPACING * 2, 0], size: SZ, height: ROOM_HEIGHT, accent: '#F2B441',
    description: { uz: 'Devorda rezyume — o‘qib ham, yuklab olib ham ketasiz. Yonida yigirmata dasturlash kitobi: tugmani bossangiz, bittasi sizga sovg‘a bo‘lib tushadi.', kr: 'Деворда резюме — ўқиб ҳам, юклаб олиб ҳам кетасиз. Ёнида йигирмата дастурлаш китоби: тугмани боссангиз, биттаси сизга совға бўлиб тушади.', ru: 'На стене резюме — можно прочитать и скачать. Рядом двадцать книг по программированию: нажмите кнопку, и одна из них достанется вам в подарок.', en: 'The CV hangs on the wall — read it here or take it with you. Beside it, twenty programming books: press the button and one of them is yours.' },
  },
  {
    id: 'experiments', fx: 'rain', cell: 5, level: 1, floorY: FLOOR2_Y,
    title: { uz: 'Tajribalar', kr: 'Тажрибалар', ru: 'Эксперименты', en: 'Experiments' }, eyebrow: { uz: 'Tajriba maydoni · 2-qavat', kr: 'Тажриба майдони · 2-қават', ru: 'Полигон · 2-й этаж', en: 'Playground · floor 2' },
    center: [0, -SPACING], size: SZ, height: ROOM_HEIGHT, accent: '#5DE4FF',
    description: { uz: 'Buyurtma emas, qiziqish uchun qilingan ishlar: IoT, botlar, yordamchi vositalar.', kr: 'Буюртма эмас, қизиқиш учун қилинган ишлар: IoT, ботлар, ёрдамчи воситалар.', ru: 'Не заказы, а работы из интереса: IoT, боты, вспомогательные утилиты.', en: 'Not client work — things built out of curiosity: IoT, bots, small tools.' },
  },
  {
    id: 'timeline', fx: 'grid', cell: 6, level: 1, floorY: FLOOR2_Y,
    title: { uz: 'Vaqt yo‘lagi', kr: 'Вақт йўлаги', ru: 'Коридор времени', en: 'Timeline Corridor' }, eyebrow: { uz: 'Xronologiya · 2-qavat', kr: 'Хронология · 2-қават', ru: 'Хронология · 2-й этаж', en: 'Chronology · floor 2' },
    center: [-SPACING, 0], size: SZ, height: ROOM_HEIGHT, accent: '#F2B441',
    description: { uz: 'Birinchi kalkulyatordan AI agentlarigacha — yo‘l qanday boshlangani.', kr: 'Биринчи калкулятордан AI агентларигача — йўл қандай бошлангани.', ru: 'От первого калькулятора до ИИ-агентов — как начинался путь.', en: 'From a first calculator to AI agents — how the path began.' },
  },
  {
    id: 'about', fx: 'neural', cell: 7, level: 1, floorY: FLOOR2_Y,
    title: { uz: 'Men haqimda', kr: 'Мен ҳақимда', ru: 'Обо мне', en: 'About me' }, eyebrow: { uz: 'Muallif haqida · 2-qavat', kr: 'Муаллиф ҳақида · 2-қават', ru: 'Об авторе · 2-й этаж', en: 'The author · floor 2' },
    center: [-SPACING * 2, 0], size: SZ, height: ROOM_HEIGHT, accent: '#5DE4FF',
    description: { uz: 'Kim ekanligim, nima ustida ishlayotganim va qanday bog‘lanish mumkinligi.', kr: 'Ким эканлигим, нима устида ишлаётганим ва қандай боғланиш мумкинлиги.', ru: 'Кто я, над чем работаю и как со мной связаться.', en: 'Who I am, what I am working on and how to reach me.' },
  },
]

export const corridors: Corridor[] = [
  { from: 'entrance', to: 'projects' },
  { from: 'projects', to: 'atrium' },
  { from: 'atrium', to: 'skills' },
  { from: 'skills', to: 'contact' },
  { from: 'atrium', to: 'experiments' }, // upper floor, via mezzanine
  { from: 'atrium', to: 'timeline' },    // upper floor, via mezzanine
  { from: 'timeline', to: 'about' },
]

export const roomById = Object.fromEntries(rooms.map((r) => [r.id, r])) as Record<Room['id'], Room>

/** Adjacency from the corridor graph (room → neighbours). */
export const neighbours: Record<RoomId, RoomId[]> = (() => {
  const m = Object.fromEntries(rooms.map((r) => [r.id, [] as RoomId[]])) as Record<RoomId, RoomId[]>
  for (const c of corridors) { m[c.from].push(c.to); m[c.to].push(c.from) }
  return m
})()

/** True if `a` is `b` or directly connected to it. Used to cull lights/effects to the visible neighbourhood. */
export const isNear = (a: RoomId, b: RoomId) => a === b || neighbours[a].includes(b)

/**
 * Guided-tour rail. Eye height = floor + 1.6 (upper floor: 7.6).
 * Route: entrance → projects → atrium → skills → contact → back → stair up →
 * mezzanine → experiments → mezzanine → timeline → about.
 * Stair: along z=-3.5, from x=-7 (y0) to x=+7 (y6), landing NE, north strip z≈-7.5.
 */
export const railWaypoints: RailWaypoint[] = [
  { roomId: 'entrance', position: [0, 1.6, 44], label: 'Kirish' },
  { roomId: 'entrance', position: [0, 1.6, 40], lookAt: [-6.9, 1.7, 40], label: 'Xush kelibsiz' },
  { roomId: 'projects', position: [0, 1.6, 24] },
  { roomId: 'projects', position: [-3.4, 1.6, 20], lookAt: [-6.9, 1.7, 20], label: 'TibSim' },
  { roomId: 'projects', position: [3.4, 1.6, 20], lookAt: [6.9, 1.7, 20], label: 'TG AI Analyzer' },
  { roomId: 'projects', position: [-2, 1.6, 15.5], lookAt: [-4.5, 1.7, 13.1], label: 'Changelog Chat' },
  { roomId: 'projects', position: [2, 1.6, 15.5], lookAt: [4.5, 1.7, 13.1], label: 'Hacking Animation' },
  { roomId: 'atrium', position: [0, 1.6, 6], lookAt: [0, 6, 0], label: 'Tesseract' },
  { roomId: 'atrium', position: [5, 1.6, 1] },
  { roomId: 'skills', position: [20, 1.6, 3.4], lookAt: [20, 1.7, 6.9], label: 'Texnologiyalar devori' },
  { roomId: 'skills', position: [20, 1.6, -3.4], lookAt: [20, 1.7, -6.9], label: 'Stack' },
  { roomId: 'contact', position: [37, 1.6, 0], lookAt: [46.9, 1.7, 0], label: 'Bog‘lanish' },
  { roomId: 'skills', position: [20, 1.6, 0] },
  { roomId: 'atrium', position: [-4, 1.6, -1] },
  { roomId: 'atrium', position: [-7, 1.6, -3.5], lookAt: [7, 7.0, -3.5], label: 'Zina — 2-qavat' },
  { roomId: 'atrium', position: [0, 4.6, -3.5], lookAt: [8, 7.8, -4] },
  { roomId: 'atrium', position: [6.6, 7.6, -3.5] },
  { roomId: 'atrium', position: [8, 7.6, -6] },
  { roomId: 'atrium', position: [0, 7.7, -6.3], lookAt: [0.5, 5.6, 0.5], label: 'Mezanin — tesseract' },
  { roomId: 'experiments', position: [0, 7.6, -13] },
  { roomId: 'experiments', position: [0, 7.6, -20], lookAt: [0, 7.7, -26.9], label: 'Smart Call v2' },
  { roomId: 'experiments', position: [-3.4, 7.6, -20], lookAt: [-6.9, 7.7, -20], label: 'Smart Call Service' },
  { roomId: 'experiments', position: [0, 7.6, -14.5] },
  { roomId: 'atrium', position: [0, 7.6, -7.5] },
  { roomId: 'atrium', position: [-7.5, 7.6, -6] },
  { roomId: 'atrium', position: [-7.5, 7.6, 0] },
  { roomId: 'timeline', position: [-14, 7.6, 0] },
  { roomId: 'timeline', position: [-20.5, 7.6, -2.5], lookAt: [-24.5, 7.7, -6.9], label: '2022 · Valyuta kursi' },
  { roomId: 'timeline', position: [-22.5, 7.6, 2], lookAt: [-24.5, 7.7, 6.9], label: '2023 · Pay-bot' },
  { roomId: 'timeline', position: [-17.5, 7.6, 2], lookAt: [-15.5, 7.7, 6.9], label: '2024 · BearPartner' },
  { roomId: 'timeline', position: [-23, 7.6, 0], lookAt: [-24.5, 7.4, -3], label: 'for-lELITS' },
  { roomId: 'about', position: [-35, 7.6, 0], lookAt: [-46.9, 7.7, 0], label: 'Men haqimda' },
]
