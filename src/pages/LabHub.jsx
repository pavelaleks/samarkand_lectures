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

        <div className="rounded-2xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/60 dark:bg-teal-950/25 p-5 sm:p-6 max-w-3xl">
          <h2 className="font-bold text-teal-900 dark:text-teal-200 mb-3">Как пользоваться на лекции</h2>
          <ol className="list-decimal ml-5 space-y-2 text-gray-800 dark:text-gray-200">
            {demos.howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Сцены к лекциям</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {demos.works.map((work, index) => (
          <motion.div
            key={work.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link
              to={`/courses/digital-humanities/demo/${work.slug}`}
              className="block h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-600 transition-all"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs sm:text-sm">
                <span className="font-bold text-teal-700 dark:text-teal-300">Л{work.lecture}</span>
                <span className="px-2 py-0.5 rounded-md font-semibold bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-100">
                  {work.minutes} мин
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                {work.title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{work.question}</p>
              {work.punchline && (
                <p className="text-sm text-teal-800 dark:text-teal-200/90 leading-relaxed">
                  <span className="font-semibold">Итог: </span>
                  {work.punchline}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
