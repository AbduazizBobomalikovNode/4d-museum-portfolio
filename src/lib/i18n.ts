export const LANGS = ['uz', 'kr', 'ru', 'en'] as const
export type Lang = (typeof LANGS)[number]

export const LANG_META: Record<Lang, { label: string; native: string; flag: string; locale: string }> = {
  uz: { label: 'O‘zbekcha', native: 'O‘zbekcha', flag: '🇺🇿', locale: 'uz-UZ' },
  kr: { label: 'Ўзбекча', native: 'Ўзбекча (кирилл)', flag: '🇺🇿', locale: 'uz-UZ' },
  ru: { label: 'Русский', native: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  en: { label: 'English', native: 'English', flag: '🇬🇧', locale: 'en-GB' },
}

/** A string that exists in every language. `uz` is the source of truth / fallback. */
export type LS = { uz: string; kr: string; ru: string; en: string }

export const pick = (s: LS | string | undefined, lang: Lang): string =>
  typeof s === 'string' ? s : (s?.[lang] ?? s?.uz ?? '')

/** UI copy. Keys are grouped by surface. */
export const UI = {
  // enter gate
  gateEyebrow: { uz: 'Tesseract Gallery · 4D Portfolio', kr: 'Tesseract Gallery · 4D Portfolio', ru: 'Tesseract Gallery · 4D Portfolio', en: 'Tesseract Gallery · 4D Portfolio' },
  gateTitle: { uz: 'Loyihalarim jamlangan muzeyda yurib tomosha qiling', kr: 'Лойиҳаларим жамланган музейда юриб томоша қилинг', ru: 'Пройдитесь по музею, где собраны мои проекты', en: 'Walk through the museum where my projects are gathered' },
  gateLede: {
    uz: 'Ikki qavat, sakkiz xona, yigirmadan ortiq loyiha. Ekskursiyaga qo‘shiling yoki o‘zingiz aylaning.',
    kr: 'Икки қават, саккиз хона, йигирмадан ортиқ лойиҳа. Экскурсияга қўшилинг ёки ўзингиз айланинг.',
    ru: 'Два этажа, восемь залов, больше двадцати проектов. Присоединяйтесь к экскурсии или гуляйте сами.',
    en: 'Two floors, eight rooms, over twenty projects. Join the tour or explore on your own.',
  },
  loading: { uz: 'Yuklanmoqda…', kr: 'Юкланмоқда…', ru: 'Загрузка…', en: 'Loading…' },
  enterSound: { uz: 'Ovoz bilan kirish', kr: 'Овоз билан кириш', ru: 'Войти со звуком', en: 'Enter with sound' },
  enterMute: { uz: 'Ovozsiz kirish', kr: 'Овозсиз кириш', ru: 'Войти без звука', en: 'Enter muted' },
  skip2d: { uz: '3Dsiz oddiy ro‘yxat →', kr: '3Dсиз оддий рўйхат →', ru: 'Обычный список без 3D →', en: 'Plain list without 3D →' },
  hintScroll: { uz: 'G‘ildirak yoki ↑↓ — yo‘lak bo‘ylab yurish', kr: 'Ғилдирак ёки ↑↓ — йўлак бўйлаб юриш', ru: 'Колёсико или ↑↓ — движение по маршруту', en: 'Scroll wheel or ↑↓ — move along the route' },
  hintClick: { uz: 'Sichqoncha yoki E — eksponatni ochish', kr: 'Сичқонча ёки E — экспонатни очиш', ru: 'Мышь или E — открыть экспонат', en: 'Click or E — open an exhibit' },
  hintWalk: { uz: 'M — erkin yurishga o‘tish (WASD bilan yurasiz)', kr: 'M — эркин юришга ўтиш (WASD билан юрасиз)', ru: 'M — перейти к свободной ходьбе (WASD)', en: 'M — switch to free walk (move with WASD)' },
  hintSwipe: { uz: 'Barmoq bilan suring — yo‘lak bo‘ylab yurasiz', kr: 'Бармоқ билан суринг — йўлак бўйлаб юрасиз', ru: 'Проведите пальцем — идёте по маршруту', en: 'Swipe — move along the route' },
  hintTap: { uz: 'Eksponatga bosing — tafsilotlari ochiladi', kr: 'Экспонатга босинг — тафсилотлари очилади', ru: 'Нажмите на экспонат — откроются детали', en: 'Tap an exhibit — its details open' },
  hintJoystick: { uz: 'Erkin yurishda: chapda joystik, o‘ngda surib qaraysiz', kr: 'Эркин юришда: чапда джойстик, ўнгда суриб қарайсиз', ru: 'В свободной ходьбе: слева джойстик, справа обзор свайпом', en: 'In free walk: joystick on the left, drag on the right to look' },

  // hud
  modeRail: { uz: 'Yo‘lak', kr: 'Йўлак', ru: 'Маршрут', en: 'Route' },
  modeWalk: { uz: 'Erkin yurish', kr: 'Эркин юриш', ru: 'Свободно', en: 'Free walk' },
  soundOn: { uz: 'Ovoz: on', kr: 'Овоз: on', ru: 'Звук: вкл', en: 'Sound: on' },
  soundOff: { uz: 'Ovoz: off', kr: 'Овоз: off', ru: 'Звук: выкл', en: 'Sound: off' },
  fullscreen: { uz: 'To‘liq ekran', kr: 'Тўлиқ экран', ru: 'Во весь экран', en: 'Fullscreen' },
  fullscreenExit: { uz: 'Oynaga qaytish', kr: 'Ойнага қайтиш', ru: 'Выйти из полноэкранного', en: 'Exit fullscreen' },
  bug: { uz: 'Bug | Feedback', kr: 'Bug | Feedback', ru: 'Баг | Отзыв', en: 'Bug | Feedback' },
  lookGate: { uz: 'Qarash uchun bosing', kr: 'Қараш учун босинг', ru: 'Нажмите, чтобы осмотреться', en: 'Click to look around' },
  lookGateSub: { uz: 'WASD — yurish · Esc — chiqish', kr: 'WASD — юриш · Esc — чиқиш', ru: 'WASD — ходьба · Esc — выход', en: 'WASD — walk · Esc — exit' },
  typingMode: { uz: 'Yozish rejimi · Esc — chiqish', kr: 'Ёзиш режими · Esc — чиқиш', ru: 'Режим ввода · Esc — выход', en: 'Typing mode · Esc — exit' },
  hudRail: { uz: 'G‘ildirak / ↑↓ — yurish · Bosing — ochish · M — erkin yurish · Esc×2 — orqaga · Shift+X — bug · H — HUD', kr: 'Ғилдирак / ↑↓ — юриш · Босинг — очиш · M — эркин юриш · Esc×2 — орқага · Shift+X — bug · H — HUD', ru: 'Скролл / ↑↓ — движение · Клик — открыть · M — ходьба · Esc×2 — назад · Shift+X — баг · H — HUD', en: 'Scroll / ↑↓ — move · Click — open · M — free walk · Esc×2 — back · Shift+X — bug · H — HUD' },
  hudWalk: { uz: 'WASD — yurish · Shift — yugurish · Sichqoncha — qarash · E — ochish · Esc×2 — orqaga · Shift+X — bug · H — HUD', kr: 'WASD — юриш · Shift — югуриш · Сичқонча — қараш · E — очиш · Esc×2 — орқага · Shift+X — bug · H — HUD', ru: 'WASD — ходьба · Shift — бег · Мышь — обзор · E — открыть · Esc×2 — назад · Shift+X — баг · H — HUD', en: 'WASD — walk · Shift — run · Mouse — look · E — open · Esc×2 — back · Shift+X — bug · H — HUD' },
  hudRailTouch: { uz: 'Suring — yurish · Bosing — ochish', kr: 'Суринг — юриш · Босинг — очиш', ru: 'Свайп — движение · Тап — открыть', en: 'Swipe — move · Tap — open' },
  hudWalkTouch: { uz: 'Joystik — yurish · O‘ng tomon — qarash', kr: 'Джойстик — юриш · Ўнг томон — қараш', ru: 'Джойстик — ходьба · Справа — обзор', en: 'Joystick — walk · Right side — look' },
  qualityLabel: { uz: 'Sifat', kr: 'Сифат', ru: 'Качество', en: 'Quality' },
  timeLabel: { uz: 'Kun vaqti', kr: 'Кун вақти', ru: 'Время суток', en: 'Time of day' },
  mapLabel: { uz: 'Xaritada xonalar', kr: 'Харитада хоналар', ru: 'Залы на карте', en: 'Rooms on the map' },
  floor2: { uz: '2-qavat', kr: '2-қават', ru: '2-й этаж', en: 'Floor 2' },

  // inspect panel
  openDemo: { uz: 'Sahifani ochish →', kr: 'Саҳифани очиш →', ru: 'Открыть страницу →', en: 'Open page →' },
  openCode: { uz: 'Kodi', kr: 'Коди', ru: 'Код', en: 'Code' },
  open: { uz: 'Ochish →', kr: 'Очиш →', ru: 'Открыть →', en: 'Open →' },
  close: { uz: 'Yopish', kr: 'Ёпиш', ru: 'Закрыть', en: 'Close' },
  pressE: { uz: 'OCHISH · E yoki bosing', kr: 'ОЧИШ · E ёки босинг', ru: 'ОТКРЫТЬ · E или клик', en: 'OPEN · press E or click' },

  // bug report
  bugTitle: { uz: 'Nima muammo?', kr: 'Нима муаммо?', ru: 'В чём проблема?', en: 'What is wrong?' },
  bugPlaceholder: { uz: 'Muammoni tarif qiling: nima noto‘g‘ri, qayerda, nima kutgandingiz…', kr: 'Муаммони тариф қилинг: нима нотўғри, қаерда, нима кутгандингиз…', ru: 'Опишите проблему: что не так, где, чего вы ожидали…', en: 'Describe the problem: what is wrong, where, what you expected…' },
  bugReady: { uz: 'Tayyor — yuklab olish', kr: 'Тайёр — юклаб олиш', ru: 'Готово — скачать', en: 'Done — download' },
  bugSaved: { uz: 'Yuklandi ✓', kr: 'Юкланди ✓', ru: 'Скачано ✓', en: 'Saved ✓' },
  bugCancel: { uz: 'Bekor (Esc)', kr: 'Бекор (Esc)', ru: 'Отмена (Esc)', en: 'Cancel (Esc)' },
  bugHint: { uz: 'PNG + TXT Downloads papkasiga tushadi.', kr: 'PNG + TXT Downloads папкасига тушади.', ru: 'PNG + TXT сохранятся в папку Downloads.', en: 'PNG + TXT go to your Downloads folder.' },
  bugNoShot: { uz: 'Skrinshot olinmadi', kr: 'Скриншот олинмади', ru: 'Скриншот не получен', en: 'No screenshot' },

  // feedback wall
  contactTitle: { uz: 'BOG‘LANISH', kr: 'БОҒЛАНИШ', ru: 'КОНТАКТЫ', en: 'CONTACT' },
  role: { uz: 'Full-stack · Node.js dasturchi', kr: 'Full-stack · Node.js дастурчи', ru: 'Full-stack · Node.js разработчик', en: 'Full-stack · Node.js developer' },
  phone: { uz: 'TELEFON', kr: 'ТЕЛЕФОН', ru: 'ТЕЛЕФОН', en: 'PHONE' },
  telegram: { uz: 'TELEGRAM', kr: 'ТЕЛЕГРАМ', ru: 'ТЕЛЕГРАМ', en: 'TELEGRAM' },
  email: { uz: 'EMAIL', kr: 'EMAIL', ru: 'EMAIL', en: 'EMAIL' },
  place: { uz: 'Toshkent · O‘zbekiston · UTC+5', kr: 'Тошкент · Ўзбекистон · UTC+5', ru: 'Ташкент · Узбекистан · UTC+5', en: 'Tashkent · Uzbekistan · UTC+5' },
  formTitle: { uz: 'Fikringizni qoldiring', kr: 'Фикрингизни қолдиринг', ru: 'Напишите мне', en: 'Write to me' },
  fName: { uz: 'Ism', kr: 'Исм', ru: 'Имя', en: 'First name' },
  fSurname: { uz: 'Familiya', kr: 'Фамилия', ru: 'Фамилия', en: 'Last name' },
  fMessage: { uz: 'Savol, taklif yoki shunchaki fikr…', kr: 'Савол, таклиф ёки шунчаки фикр…', ru: 'Вопрос, предложение или просто отзыв…', en: 'A question, an offer, or just a thought…' },
  send: { uz: 'Yuborish →', kr: 'Юбориш →', ru: 'Отправить →', en: 'Send →' },
  sending: { uz: 'Yuborilmoqda…', kr: 'Юборилмоқда…', ru: 'Отправка…', en: 'Sending…' },
  sent: { uz: 'Yuborildi ✓', kr: 'Юборилди ✓', ru: 'Отправлено ✓', en: 'Sent ✓' },
  sendOkMsg: { uz: 'Yetib bordi. Rahmat — tez orada javob beraman.', kr: 'Етиб борди. Раҳмат — тез орада жавоб бераман.', ru: 'Получено. Спасибо — скоро отвечу.', en: 'Got it. Thanks — I will reply soon.' },
  sendErrMsg: { uz: 'Yuborilmadi. Aloqani tekshirib, qayta urining.', kr: 'Юборилмади. Алоқани текшириб, қайта уринг.', ru: 'Не ушло. Проверьте связь и попробуйте снова.', en: 'Did not go through. Check your connection and retry.' },
  formHintIdle: { uz: 'Maydonni bosing va yozing', kr: 'Майдонни босинг ва ёзинг', ru: 'Нажмите на поле и печатайте', en: 'Click a field and type' },
  formHintTyping: { uz: 'Yozing · Tab — keyingi maydon · Esc — chiqish', kr: 'Ёзинг · Tab — кейинги майдон · Esc — чиқиш', ru: 'Печатайте · Tab — следующее поле · Esc — выход', en: 'Type · Tab — next field · Esc — exit' },

  // quick-travel board on the corner glass
  navEyebrow: { uz: 'TEZKOR O‘TISH', kr: 'ТЕЗКОР ЎТИШ', ru: 'БЫСТРЫЙ ПЕРЕХОД', en: 'QUICK TRAVEL' },
  navHint: { uz: 'Tezroq borish uchun bosing', kr: 'Тезроқ бориш учун босинг', ru: 'Нажмите, чтобы перейти быстрее', en: 'Click a room to jump there' },
  navHere: { uz: 'shu yerdasiz', kr: 'шу ердасиз', ru: 'вы здесь', en: 'you are here' },
  navVisits: { uz: 'ta tashrif', kr: 'та ташриф', ru: 'визитов', en: 'visits' },
  likeTitle: { uz: 'Yoqdi', kr: 'Ёқди', ru: 'Нравится', en: 'Like' },
  likeDone: { uz: 'Rahmat!', kr: 'Раҳмат!', ru: 'Спасибо!', en: 'Thanks!' },
  navStar: { uz: 'GitHub’da yulduzcha qo‘ying', kr: 'GitHub’да юлдузча қўйинг', ru: 'Поставьте звезду на GitHub', en: 'Star it on GitHub' },
  floor1: { uz: '1-qavat', kr: '1-қават', ru: '1-й этаж', en: 'Floor 1' },

  // kiosk
  kioskTitle: { uz: 'TILNI TANLANG', kr: 'ТИЛНИ ТАНЛАНГ', ru: 'ВЫБЕРИТЕ ЯЗЫК', en: 'CHOOSE LANGUAGE' },
  kioskSub: { uz: 'Tanlangan til butun muzeyga qo‘llanadi — belgilar, yozuvlar, forma', kr: 'Танланган тил бутун музейга қўлланади — белгилар, ёзувлар, форма', ru: 'Выбранный язык применится ко всему музею — указатели, подписи, форма', en: 'Your choice applies across the museum — signs, labels and the form' },
  kioskCurrent: { uz: 'Joriy til', kr: 'Жорий тил', ru: 'Текущий язык', en: 'Current language' },

  // github screens
  ghLoading: { uz: 'GitHub yuklanmoqda…', kr: 'GitHub юкланмоқда…', ru: 'Загрузка GitHub…', en: 'Loading GitHub…' },
  ghReadmeLoading: { uz: 'README yuklanmoqda…', kr: 'README юкланмоқда…', ru: 'Загрузка README…', en: 'Loading README…' },
  ghLive: { uz: '● jonli — GitHub API', kr: '● жонли — GitHub API', ru: '● вживую — GitHub API', en: '● live — GitHub API' },
  ghCached: { uz: '◍ saqlangan nusxa', kr: '◍ сақланган нусха', ru: '◍ сохранённая копия', en: '◍ cached copy' },
  ghRepos: { uz: 'repo', kr: 'репо', ru: 'репозиториев', en: 'repos' },
  ghFollowers: { uz: 'follower', kr: 'фолловер', ru: 'подписчиков', en: 'followers' },
  ghFollowing: { uz: 'following', kr: 'фолловинг', ru: 'подписок', en: 'following' },
} as const

export type UIKey = keyof typeof UI

export const tr = (key: UIKey, lang: Lang): string => pick(UI[key] as LS, lang)

/** Uzbek/Russian/English month + weekday names for the wall clock. */
export const MONTHS: Record<Lang, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  kr: ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
export const WEEKDAYS: Record<Lang, string[]> = {
  uz: ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'],
  kr: ['якшанба', 'душанба', 'сешанба', 'чоршанба', 'пайшанба', 'жума', 'шанба'],
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}
export const CITY: Record<Lang, string> = { uz: 'Toshkent', kr: 'Тошкент', ru: 'Ташкент', en: 'Tashkent' }

/** Best-guess starting language from the browser. */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'uz'
  const l = (navigator.language || 'uz').toLowerCase()
  if (l.startsWith('ru')) return 'ru'
  if (l.startsWith('en')) return 'en'
  return 'uz'
}
