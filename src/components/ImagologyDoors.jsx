// Вход в курс «Имагология»: лекции → лаборатория (стенды) → практикум и досье.
const BASE = import.meta.env.BASE_URL || '/samarkand_lectures/'
const LAB = `${BASE}imagology/lab/`

const DOORS = [
  {
    n: 1,
    title: 'Понять',
    text: '18 лекций: краткое содержание, параллель «Запад ↔ Россия», цифровой ход и литература в открытом доступе.',
    cta: 'К лекциям',
    href: '#lectures',
    cls: 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/20',
    badge: 'bg-blue-700',
  },
  {
    n: 2,
    title: 'Попробовать',
    text: 'Лаборатория: цифровая Völkertafel, параллельный читатель, карта взгляда, галерея образов Востока и блокноты Colab.',
    cta: 'Открыть лабораторию',
    href: `${LAB}index.html`,
    cls: 'border-teal-300 dark:border-teal-700 bg-teal-50/80 dark:bg-teal-950/20',
    badge: 'bg-teal-700',
  },
  {
    n: 3,
    title: 'Применить',
    text: '9 практических занятий на парах русских и западных текстов и сквозное задание «Досье одного образа».',
    cta: 'Практикум и досье',
    href: `${LAB}practicum.html`,
    cls: 'border-amber-400 dark:border-amber-600 bg-amber-50/90 dark:bg-amber-950/20',
    badge: 'bg-amber-700',
  },
]

const STANDS = [
  { href: 'volkertafel.html', label: 'Цифровая Völkertafel' },
  { href: 'parallel.html', label: 'Параллельный читатель' },
  { href: 'karta.html', label: 'Карта взгляда' },
  { href: 'galereya.html', label: 'Галерея образов Востока' },
  { href: 'practicum.html#dosye', label: '★ Досье одного образа', strong: true },
]

export default function ImagologyDoors() {
  const scrollToLectures = (e) => {
    e.preventDefault()
    document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOORS.map((d) => (
          <a
            key={d.n}
            href={d.href}
            onClick={d.href === '#lectures' ? scrollToLectures : undefined}
            className={`group flex flex-col rounded-2xl border-2 ${d.cls} p-5 sm:p-6 hover:shadow-xl transition-all`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-9 h-9 rounded-full ${d.badge} text-white font-bold flex items-center justify-center flex-shrink-0`}>{d.n}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed flex-1">{d.text}</p>
            <span className="mt-4 font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              {d.cta} →
            </span>
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Стенды:</span>
        {STANDS.map((s) => (
          <a
            key={s.href}
            href={`${LAB}${s.href}`}
            className={`px-3 py-1.5 rounded-full border hover:border-blue-400 ${
              s.strong
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:text-blue-800 dark:hover:text-blue-200'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
