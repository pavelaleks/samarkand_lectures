import { Link } from 'react-router-dom'

export default function LabShell({ work, children, courseSlug = 'digital-humanities' }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        to={`/courses/${courseSlug}/lab`}
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        К каталогу Лаборатории
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <span className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 font-semibold">
            Лекция {work.lecture}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {work.minutes} мин
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {work.level}
          </span>
          {work.mode === 'interactive' ? (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
              код в браузере
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
              направляемая работа
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {work.title}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="font-semibold text-teal-800 dark:text-teal-300">Вопрос. </span>
          {work.question}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/70 dark:bg-teal-950/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300 mb-2">Метод</h2>
          <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.method}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">Ограничения</h2>
          <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.limits}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Инструмент</h2>
        {children}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">Строка метода</h2>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
          единица = {work.unit}; источник = ваш фрагмент / учебный пример; процедура = {work.tool}; ограничения = см. блок выше
        </p>
      </div>

      <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/30 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300 mb-2">Задание</h2>
        <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.task}</p>
      </div>
    </div>
  )
}
