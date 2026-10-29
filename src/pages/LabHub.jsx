import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import demos from '../data/demos.json'

export default function LabHub() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/courses/digital-humanities"
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        К курсу
      </Link>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="h-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-700 mb-6" />
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {demos.title}
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed mb-6">
          {demos.subtitle}
        </p>

        <div className="flex flex-col gap-3 max-w-3xl">
          <Link
            to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Бунин · «Тёмные аллеи» — все 37 рассказов
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Читайте тексты прямо здесь: оглавление, поиск, листание.
              </p>
            </div>
            <span className="shrink-0 self-start sm:self-center px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold">
              Читать →
            </span>
          </Link>
          <Link
            to="/courses/digital-humanities/demo/wikidata-bunin"
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-950/30 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Wikidata · геопоэтика «Тёмных аллей»
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Живая карта OSM: топосы рассказов, цитаты, зачем каждый пункт, SPARQL → CSV.
              </p>
            </div>
            <span className="shrink-0 self-start sm:self-center px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold">
              Открыть →
            </span>
          </Link>
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Инструменты</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {demos.works.map((work, index) => {
          const featured = Boolean(work.featured)
          return (
          <motion.div
            key={work.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={featured ? 'md:col-span-2' : undefined}
          >
            <Link
              to={`/courses/digital-humanities/demo/${work.slug}`}
              className={`block h-full rounded-2xl p-5 sm:p-6 hover:shadow-xl transition-all ${
                featured
                  ? 'border-2 border-teal-500 dark:border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/20'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-600'
              }`}
            >
              {featured && (
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white">Пример лекции 4</span>
                  Закон Ципфа · цикл Бунина
                </div>
              )}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                {work.title}
              </h3>
              {work.question && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{work.question}</p>
              )}
              {featured && (
                <p className="mt-3 text-sm font-semibold text-teal-800 dark:text-teal-200">
                  Открыть разбор α / R² + скрипты для PyCharm →
                </p>
              )}
            </Link>
          </motion.div>
          )
        })}
      </div>
    </div>
  )
}
