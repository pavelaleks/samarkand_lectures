import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ALWAYS,
  DEFENSE_QA,
  METHODS,
  PAIRS,
  TOPIC_TYPES,
  colabUrl,
  methodById,
} from '../data/dhMethods'
import demos from '../data/demos.json'

const ACCENT = {
  slate: 'border-l-slate-400 dark:border-l-slate-500',
  teal: 'border-l-teal-500 dark:border-l-teal-400',
  indigo: 'border-l-indigo-500 dark:border-l-indigo-400',
  rose: 'border-l-rose-500 dark:border-l-rose-400',
  amber: 'border-l-amber-500 dark:border-l-amber-400',
  emerald: 'border-l-emerald-500 dark:border-l-emerald-400',
  violet: 'border-l-violet-500 dark:border-l-violet-400',
  cyan: 'border-l-cyan-500 dark:border-l-cyan-400',
  sky: 'border-l-sky-500 dark:border-l-sky-400',
  fuchsia: 'border-l-fuchsia-500 dark:border-l-fuchsia-400',
}

const standTitle = (slug) => {
  const w = demos.works.find((x) => x.slug === slug)
  return w ? w.title.replace(/^Лекция \d+ · /, '') : slug
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center">
        {n}
      </span>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{children}</p>
      </div>
    </li>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{children}</dd>
    </div>
  )
}

function MethodCard({ m, open, onToggle, highlighted }) {
  return (
    <article
      id={`method-${m.id}`}
      className={`scroll-mt-24 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${
        ACCENT[m.color]
      } ${highlighted ? 'ring-2 ring-teal-400/60 shadow-lg' : 'shadow-sm'} transition-shadow`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{m.short}</p>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug">{m.title}</h3>
          <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{m.question}</p>
        </div>
        <svg
          className={`w-6 h-6 mt-1 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            {m.pairs.map((p) => (
              <a
                key={p}
                href={colabUrl(p)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold"
              >
                ▶ Colab · Пара {p}: {PAIRS[p].title}
              </a>
            ))}
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Что нужно на входе">{m.input}</Field>
            <Field label="Что получите">{m.output}</Field>
            <Field label="Как читать результат">{m.read}</Field>
            <Field label="Когда метод врёт">{m.lies}</Field>
          </dl>

          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
              Как это выглядит в диссертации (образец)
            </p>
            <blockquote className="text-sm sm:text-base text-gray-800 dark:text-gray-100 leading-relaxed italic border-l-2 border-teal-500 pl-3">
              {m.thesis}
            </blockquote>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              <span className="font-semibold">На защите: </span>
              {m.defense}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {m.lectures.map((l) => (
              <Link
                key={l}
                to={`/courses/digital-humanities?open=${l}`}
                className="text-teal-700 dark:text-teal-300 hover:underline font-medium"
              >
                Лекция {l} →
              </Link>
            ))}
            {m.stands.map((s) => (
              <Link
                key={s}
                to={`/courses/digital-humanities/demo/${s}`}
                className="text-teal-700 dark:text-teal-300 hover:underline font-medium"
              >
                Стенд: {standTitle(s)} →
              </Link>
            ))}
            {(m.resources || []).map((r) => (
              <Link key={r.to} to={r.to} className="text-teal-700 dark:text-teal-300 hover:underline font-medium">
                {r.label} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default function MethodNavigator() {
  const location = useLocation()
  const [topic, setTopic] = useState(null)
  const [open, setOpen] = useState(() => new Set())

  // Глубокая ссылка: #method-delta открывает и прокручивает карточку
  useEffect(() => {
    const id = location.hash.replace('#method-', '')
    if (id && methodById(id)) {
      setOpen((s) => new Set(s).add(id))
      setTimeout(() => document.getElementById(`method-${id}`)?.scrollIntoView({ behavior: 'smooth' }), 60)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [location.hash])

  const selected = topic ? TOPIC_TYPES.find((t) => t.id === topic) : null
  const recommended = useMemo(() => (selected ? [...selected.methods, ...ALWAYS] : []), [selected])

  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const pickTopic = (id) => {
    const t = TOPIC_TYPES.find((x) => x.id === id)
    setTopic(id === topic ? null : id)
    if (id !== topic && t) {
      setOpen(new Set(t.methods.slice(0, 1)))
      setTimeout(() => document.getElementById('recommended')?.scrollIntoView({ behavior: 'smooth' }), 60)
    }
  }

  const ordered = selected
    ? [...recommended.map(methodById), ...METHODS.filter((m) => !recommended.includes(m.id))]
    : METHODS

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/courses/digital-humanities"
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
      >
        ← К курсу
      </Link>

      <header className="mb-10">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-2">
          Шаг 3 из 3 · Применить к диссертации
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          От темы диссертации к цифровому методу
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Цифровой метод в филологической диссертации — это не «красивый график», а способ проверить вашу гипотезу на всём
          материале и найти места, которые стоит прочитать внимательно. Выберите тип своей темы — и вы увидите, какие
          методы подходят, как их выполнить в бесплатном Google Colab и как написать о них в работе.
        </p>
      </header>

      <section className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ol className="space-y-4">
          <Step n={1} title="Определите тип темы">
            Ниже — 9 типичных формулировок магистерских тем по литературоведению.
          </Step>
          <Step n={2} title="Откройте карточку метода">
            Вопрос, который он решает, что нужно на входе, как читать результат и когда он врёт.
          </Step>
          <Step n={3} title="Пройдите пару в Colab на своём тексте">
            Сначала — демо на Бунине «как есть», потом — «Мои файлы» (.txt или .docx). Код менять не нужно, только поля формы.
          </Step>
          <Step n={4} title="Перенесите результат в паспорт">
            График + цитата + ограничение → «Методологический паспорт диссертации» → глава и слайд защиты.
          </Step>
        </ol>
        <div className="rounded-2xl bg-slate-900 text-slate-100 p-6 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300 mb-3">Главное правило курса</p>
          <p className="text-xl sm:text-2xl font-semibold leading-snug">
            вопрос → процедура → картинка → <span className="text-amber-300">цитата</span> → ограничение
          </p>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Число без цитаты в диссертацию не идёт. Цитата без числа — обычный close reading, и это тоже нормально: цифровой
            метод нужен там, где он что-то добавляет.
          </p>
          <Link
            to="/courses/digital-humanities/passport"
            className="mt-5 inline-flex self-start px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold"
          >
            Шаблон «Методологический паспорт» →
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">1. Какая у вас тема?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-5">Нажмите на ближайший тип. Можно выбрать другой в любой момент.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOPIC_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickTopic(t.id)}
              aria-pressed={topic === t.id}
              className={`text-left rounded-2xl p-4 border-2 transition-all ${
                topic === t.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-700'
              }`}
            >
              <p className="font-bold text-gray-900 dark:text-white">{t.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-snug">{t.example}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="recommended" className="scroll-mt-24 mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          2. {selected ? `Методы для темы «${selected.title}»` : 'Все методы курса'}
        </h2>
        {selected ? (
          <div className="mb-6 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/20 p-4 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
            <p>
              <span className="font-semibold">Почему эти методы: </span>
              {selected.why}
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Порядок: сначала главные для вашей темы, затем обязательные для любой работы — паспорт корпуса и
              библиография. Остальные методы ниже, приглушённо.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Выберите тип темы выше, чтобы увидеть рекомендованный порядок. «Корпус» и «Библиография» нужны любой работе.
          </p>
        )}
        <div className="space-y-4">
          {ordered.map((m) => {
            const rec = !selected || recommended.includes(m.id)
            return (
              <div key={m.id} className={rec ? '' : 'opacity-60 hover:opacity-100 transition-opacity'}>
                <MethodCard
                  m={m}
                  open={open.has(m.id)}
                  onToggle={() => toggle(m.id)}
                  highlighted={selected && selected.methods.includes(m.id)}
                />
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">3. На защите: частые вопросы комиссии</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-5">Отвечать спокойно и конкретно: процедура, ограничение, цитата.</p>
        <div className="space-y-3">
          {DEFENSE_QA.map((x) => (
            <details
              key={x.q}
              className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5"
            >
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white list-none flex justify-between gap-4">
                <span>«{x.q}»</span>
                <span className="text-teal-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{x.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-5 sm:p-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Где работать</h2>
        <p>
          Всё выполняется в <strong>бесплатном Google Colab</strong> — нужен только аккаунт Google. Устанавливать Python,
          PyCharm или Cursor не обязательно; платные нейросети не нужны. Для идей и помощи с ошибками подойдёт любой
          бесплатный чат ИИ — но цитаты из его ответов проверяются (пара 12).
        </p>
      </section>
    </div>
  )
}
