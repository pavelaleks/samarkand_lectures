import { Link } from 'react-router-dom'

const DOORS = [
  {
    n: 1,
    title: 'Понять',
    text: '13 лекций: идея метода, примеры, ограничения. Полный текст и презентация.',
    cta: 'К лекциям',
    href: '#lectures',
    cls: 'border-sky-300 dark:border-sky-700 bg-sky-50/80 dark:bg-sky-950/20',
    badge: 'bg-sky-600',
  },
  {
    n: 2,
    title: 'Попробовать',
    text: 'Интерактивные стенды к лекциям и 12 пар в Google Colab — всё на рассказах Бунина, ничего не нужно устанавливать.',
    cta: 'Стенды и Colab',
    to: '/courses/digital-humanities/demo',
    cls: 'border-teal-300 dark:border-teal-700 bg-teal-50/80 dark:bg-teal-950/20',
    badge: 'bg-teal-600',
  },
  {
    n: 3,
    title: 'Применить к диссертации',
    text: 'Тип вашей темы → подходящие методы → пара Colab на своём тексте → абзац для главы и слайд для защиты.',
    cta: 'Навигатор методов',
    to: '/courses/digital-humanities/navigator',
    cls: 'border-amber-400 dark:border-amber-600 bg-amber-50/90 dark:bg-amber-950/20',
    badge: 'bg-amber-600',
  },
]

const RESOURCES = [
  { to: '/courses/digital-humanities/cabinet', label: '★ Кабинет магистранта: литература по теме → Word', strong: true },
  { to: '/courses/digital-humanities/demo/corpus/bunin-temnye-allei', label: 'Корпус: Бунин, «Тёмные аллеи»' },
  { to: '/courses/digital-humanities/demo/corpus/chekhov-rasskazy', label: 'Корпус: Чехов, рассказы' },
  { to: '/courses/digital-humanities/passport', label: 'Шаблон «Методологический паспорт»' },
  { to: '/courses/digital-humanities/demo/lit-search', label: 'Поиск статей по теме' },
  { to: '/courses/digital-humanities/demo/intertext', label: 'Интертекстуальный анализ' },
]

export default function DhDoors() {
  const scrollToLectures = (e) => {
    e.preventDefault()
    document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOORS.map((d) => {
          const inner = (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`w-9 h-9 rounded-full ${d.badge} text-white font-bold flex items-center justify-center flex-shrink-0`}
                >
                  {d.n}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed flex-1">{d.text}</p>
              <span className="mt-4 font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {d.cta} →
              </span>
            </>
          )
          const cls = `group flex flex-col rounded-2xl border-2 ${d.cls} p-5 sm:p-6 hover:shadow-xl transition-all`
          return d.to ? (
            <Link key={d.n} to={d.to} className={cls}>
              {inner}
            </Link>
          ) : (
            <a key={d.n} href={d.href} onClick={scrollToLectures} className={cls}>
              {inner}
            </a>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Ресурсы:</span>
        {RESOURCES.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className={`px-3 py-1.5 rounded-full border hover:border-teal-400 ${
              r.strong
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:text-teal-800 dark:hover:text-teal-200'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
