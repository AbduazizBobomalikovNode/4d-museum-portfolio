/**
 * The twenty books on the gift-shop shelf.
 *
 * A note on the links, because it matters: these books are copyrighted. Nothing here
 * hands out a file. Half of them the author or publisher put online for free, and those
 * link straight to that official copy; the rest link to the publisher's own page. The
 * button label changes accordingly — "Bepul o‘qish" vs "Kitob haqida" — so nobody is
 * promised a download that is not ours to give.
 *
 * Covers come from Open Library by ISBN. It answers with CORS, which is required to draw
 * an image into a canvas at all.
 */

import { asset } from './geo'

export interface Book {
  id: string
  title: string
  author: string
  year: string
  isbn: string
  /** Official page: the free copy where one exists, the publisher otherwise. */
  url: string
  free: boolean
  /** One line in Uzbek: what this book actually gives the reader. */
  note: string
}

export const BOOKS: Book[] = [
  {
    id: 'clean-code', title: 'Clean Code', author: 'Robert C. Martin', year: '2008',
    isbn: '9780132350884', url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/', free: false,
    note: 'Kod nafaqat ishlashi, balki o‘qilishi ham kerak. Nomlash, funksiya uzunligi va izohlar haqida — sohaning eng ko‘p bahs qilinadigan kitobi.',
  },
  {
    id: 'pragmatic', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', year: '1999',
    isbn: '9780201616224', url: 'https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/', free: false,
    note: 'Kasb haqida: qanday o‘rganish, qanday qaror qabul qilish, qachon to‘xtash. Til yoki freymvork haqida emas — dasturchi haqida.',
  },
  {
    id: 'gof', title: 'Design Patterns', author: 'Gamma, Helm, Johnson, Vlissides', year: '1994',
    isbn: '9780201633610', url: 'https://www.oreilly.com/library/view/design-patterns-elements/0201633612/', free: false,
    note: 'Yigirma uchta pattern va ular uchun umumiy til. Singleton, Observer, Factory — bu atamalar shu kitobdan chiqqan.',
  },
  {
    id: 'refactoring', title: 'Refactoring', author: 'Martin Fowler', year: '2018',
    isbn: '9780134757599', url: 'https://martinfowler.com/books/refactoring.html', free: false,
    note: 'Ishlayotgan kodni buzmasdan yaxshilash. Har bir usul kichik qadamlarga bo‘lingan — shuning uchun uni haqiqatan qo‘llash mumkin.',
  },
  {
    id: 'clean-arch', title: 'Clean Architecture', author: 'Robert C. Martin', year: '2017',
    isbn: '9780134494166', url: 'https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/', free: false,
    note: 'Chegaralar qayerdan o‘tadi va nima nimaga bog‘liq bo‘lishi kerak. Freymvork — detal, biznes mantiq esa markazda.',
  },
  {
    id: 'ddd', title: 'Domain-Driven Design', author: 'Eric Evans', year: '2003',
    isbn: '9780321125217', url: 'https://www.domainlanguage.com/ddd/', free: false,
    note: 'Murakkab sohani kodga ko‘chirish. Mijoz bilan bir tilda gaplashish — atamalar kodda ham o‘sha nomda turishi kerak.',
  },
  {
    id: 'legacy', title: 'Working Effectively with Legacy Code', author: 'Michael Feathers', year: '2004',
    isbn: '9780131177055', url: 'https://www.oreilly.com/library/view/working-effectively-with/0131177052/', free: false,
    note: 'Testi yo‘q, hujjati yo‘q, lekin ishlab turgan kod bilan nima qilish kerak. Har bir dasturchi ertami-kech shunga duch keladi.',
  },
  {
    id: 'code-complete', title: 'Code Complete', author: 'Steve McConnell', year: '2004',
    isbn: '9780735619678', url: 'https://www.microsoftpressstore.com/store/code-complete-9780735619678', free: false,
    note: 'Amaliy qurilish bo‘yicha eng to‘liq qo‘llanma: o‘zgaruvchidan tortib butun tizim tuzilishigacha.',
  },
  {
    id: 'mythical', title: 'The Mythical Man-Month', author: 'Fred Brooks', year: '1975',
    isbn: '9780201835953', url: 'https://www.oreilly.com/library/view/mythical-man-month-the/0201835959/', free: false,
    note: 'Kechikkan loyihaga odam qo‘shsangiz, u yanada kechikadi. Ellik yil oldin yozilgan, hali ham to‘g‘ri.',
  },
  {
    id: 'clrs', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', year: '2022',
    isbn: '9780262046305', url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/', free: false,
    note: 'Algoritmlar bo‘yicha asosiy manba. Qalin, lekin kerakli bobni ochib o‘qiydigan turdagi kitob.',
  },

  // ── muallif yoki nashriyot bepul qilgan ─────────────────────────────
  {
    id: 'eloquent-js', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', year: '2024',
    isbn: '9781593279509', url: 'https://eloquentjavascript.net/', free: true,
    note: 'JavaScript’ni noldan, lekin jiddiy o‘rgatadi. Brauzerda o‘sha yerning o‘zida kod yozib ko‘rish mumkin.',
  },
  {
    id: 'ydkjs', title: 'You Don’t Know JS', author: 'Kyle Simpson', year: '2015',
    isbn: '9781491924464', url: 'https://github.com/getify/You-Dont-Know-JS', free: true,
    note: 'Tilning “sehrli” joylari: scope, closure, this, prototip. JavaScript’da nima uchun shunday bo‘lishini tushuntiradi.',
  },
  {
    id: 'pro-git', title: 'Pro Git', author: 'Chacon & Straub', year: '2014',
    isbn: '9781484200773', url: 'https://git-scm.com/book', free: true,
    note: 'Git’ning rasmiy kitobi. Faqat buyruqlar emas — ichida nima sodir bo‘layotganini ko‘rsatadi.',
  },
  {
    id: 'rust-book', title: 'The Rust Programming Language', author: 'Klabnik & Nichols', year: '2023',
    isbn: '9781718503106', url: 'https://doc.rust-lang.org/book/', free: true,
    note: 'Rust’ning rasmiy kitobi. Ownership va borrowing — tilning eng qiyin va eng qimmatli qismi shu yerda tushuntirilgan.',
  },
  {
    id: 'automate', title: 'Automate the Boring Stuff with Python', author: 'Al Sweigart', year: '2019',
    isbn: '9781593279929', url: 'https://automatetheboringstuff.com/', free: true,
    note: 'Kundalik zerikarli ishni Python bilan avtomatlashtirish: fayllar, Excel, PDF, veb. Dasturchi bo‘lmaganlar uchun ham.',
  },
  {
    id: 'sicp', title: 'Structure and Interpretation of Computer Programs', author: 'Abelson & Sussman', year: '1996',
    isbn: '9780262510875', url: 'https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html', free: true,
    note: 'MIT’ning mashhur kursi. Dasturlashni til orqali emas, fikrlash usuli sifatida o‘rgatadi.',
  },
  {
    id: 'think-python', title: 'Think Python', author: 'Allen B. Downey', year: '2015',
    isbn: '9781491939369', url: 'https://greenteapress.com/wp/think-python-2e/', free: true,
    note: 'Python orqali kompyuter olimi kabi fikrlashni o‘rgatadi. Qisqa boblar, har birida mashq.',
  },
  {
    id: 'linux-cli', title: 'The Linux Command Line', author: 'William Shotts', year: '2019',
    isbn: '9781593279523', url: 'https://linuxcommand.org/tlcl.php', free: true,
    note: 'Terminal bilan ishlashni boshidan oxirigacha: shell, quvurlar, skriptlar. Serverda ishlaydigan har kimga kerak.',
  },
  {
    id: 'head-first-dp', title: 'Head First Design Patterns', author: 'Freeman & Robson', year: '2020',
    isbn: '9781492078005', url: 'https://www.oreilly.com/library/view/head-first-design/9781492077992/', free: false,
    note: 'Patternlarni rasm, hazil va jonli misollar bilan tushuntiradi — GoF kitobiga eng yengil kirish.',
  },
  {
    id: 'go-book', title: 'The Go Programming Language', author: 'Donovan & Kernighan', year: '2015',
    isbn: '9780134190440', url: 'https://www.gopl.io/', free: false,
    note: 'Go’ning asosiy kitobi. Kernighan — “Hello, World” ni yozgan odam, uslub o‘sha aniqlikda.',
  },
]

/** Grid the shelf is laid out on, as asked: 8 by 8. */
export const SHELF_COLS = 8
export const SHELF_ROWS = 8
/** Which cells hold a book — spread across the board so the spin has somewhere to travel. */
export const BOOK_CELLS: number[] = (() => {
  const cells: number[] = []
  const total = SHELF_COLS * SHELF_ROWS
  // deterministic spread: every third cell, wrapping, until all twenty are placed
  let i = 2
  while (cells.length < BOOKS.length) {
    if (!cells.includes(i % total)) cells.push(i % total)
    i += 3
  }
  return cells.sort((a, b) => a - b)
})()

/**
 * Covers are served from our own origin. Open Library rate-limits by IP — twenty covers
 * asked for back-to-back come back as 157-byte 1×1 JPEGs, so a visitor would find half
 * the shelf blank. `pnpm covers` refreshes public/books/ from Open Library at a pace it
 * accepts; the files are committed on purpose, exactly like public/github-snapshot.json.
 */
export const coverUrl = (book: Pick<Book, 'id'>) => asset(`books/${book.id}.jpg`)
