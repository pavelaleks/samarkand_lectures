import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const THEME = {
  green: { band: 'from-green-500 to-emerald-600', soft: 'bg-emerald-50 dark:bg-emerald-950/30', ink: 'text-emerald-800 dark:text-emerald-200' },
  blue: { band: 'from-blue-500 to-indigo-600', soft: 'bg-blue-50 dark:bg-blue-950/30', ink: 'text-blue-800 dark:text-blue-200' },
  yellow: { band: 'from-yellow-500 to-amber-600', soft: 'bg-amber-50 dark:bg-amber-950/30', ink: 'text-amber-800 dark:text-amber-200' },
  teal: { band: 'from-teal-500 to-cyan-700', soft: 'bg-teal-50 dark:bg-teal-950/30', ink: 'text-teal-800 dark:text-teal-200' },
}

// Дополнительные входы для отдельных курсов
const EXTRAS = {
  'digital-humanities': {
    facts: ['12 практикумов в Colab', 'интерактивные стенды', 'кабинет магистранта'],
    links: [
      { to: '/courses/digital-humanities/demo', label: 'Инструменты' },
      { to: '/courses/digital-humanities/navigator', label: 'Навигатор методов' },
      { to: '/courses/digital-humanities/cabinet', label: 'Кабинет магистранта' },
    ],
  },
  imagology: {
    facts: ['полные тексты и презентации'],
    links: [{ to: '/courses/imagology/demo/lecture-3', label: 'Лекция 3: Леерссен (интерактивная)' }],
  },
}

const ICONS = {
  imagology: (
    <>
      <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="5" fill="none" />
      <circle cx="50" cy="50" r="9" fill="currentColor" />
      <path d="M14 50 Q50 14 86 50 Q50 86 14 50Z" stroke="currentColor" strokeWidth="5" fill="none" opacity="0.6" />
    </>
  ),
  'digital-humanities': (
    <>
      <rect x="16" y="24" width="30" height="52" rx="4" fill="currentColor" opacity="0.85" />
      <rect x="54" y="24" width="30" height="52" rx="4" fill="currentColor" opacity="0.45" />
      <path d="M60 40 L76 50 L60 60" stroke="white" strokeWidth="5" fill="none" />
    </>
  ),
}

export default function CourseCard({ course, index = 0, lectures = 0 }) {
  const th = THEME[course.color] || THEME.blue
  const extra = EXTRAS[course.slug] || { facts: [], links: [] }
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-shadow overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${th.band}`} />
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
              <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0 focus:outline-none">
                {course.title}
              </Link>
            </h3>
          </div>
          <svg className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 ${th.ink} opacity-80`} viewBox="0 0 100 100" aria-hidden="true">
            {ICONS[course.slug] || ICONS.imagology}
          </svg>
        </div>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{course.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs sm:text-sm">
          {lectures > 0 && <span className={`px-2.5 py-1 rounded-full font-semibold ${th.soft} ${th.ink}`}>{lectures} лекций</span>}
          {extra.facts.map((f) => (
            <span key={f} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {f}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`font-semibold ${th.ink} inline-flex items-center gap-1`}>
            Открыть курс
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
          {extra.links.map((l) => (
            <Link key={l.to} to={l.to} className="relative z-10 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline underline-offset-4 decoration-gray-300 dark:decoration-gray-600">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
