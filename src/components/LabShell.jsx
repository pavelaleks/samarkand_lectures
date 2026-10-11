import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LabReportProvider } from '../lab/LabReportContext'

export default function LabShell({ work, children, courseSlug = 'digital-humanities' }) {
  const [showTalk, setShowTalk] = useState(false)
  const minutes = work.minutes || '5 мин'

  return (
    <LabReportProvider work={work} mode="demo">
      <div className="demo-stage max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          to={`/courses/${courseSlug}/demo`}
          className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          К каталогу демо
        </Link>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 font-semibold">
              Лекция {work.lecture}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-100 font-semibold">
              Показ · {minutes}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {work.title}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-100 leading-snug font-medium border-l-4 border-teal-500 pl-4">
            {work.question}
          </p>
        </div>

        {work.clickPath?.length > 0 && (
          <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 p-5 mb-6">
            <h2 className="font-bold text-teal-900 dark:text-teal-100 mb-2">Сценарий показа</h2>
            <ol className="list-decimal ml-5 space-y-1.5 text-base text-gray-800 dark:text-gray-200">
              {work.clickPath.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Рабочая зона</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Крупный экран · учебные пресеты сверху в инструменте</p>
          </div>
          {children}
        </div>

        {work.punchline && (
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/80 dark:bg-cyan-950/30 p-5 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-300 mb-2">
              Итог одной фразой
            </h2>
            <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed font-medium">{work.punchline}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">
              Лимит метода
            </h2>
            <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.limits}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/30 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300 mb-2">
              Мост к практике
            </h2>
            <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
              {work.practiceHook || 'Задание даётся отдельно на практике — не через этот раздел.'}
            </p>
          </div>
        </div>

        {work.talkTrack?.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5">
            <button
              type="button"
              onClick={() => setShowTalk((v) => !v)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <span className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Скрипт для преподавателя
              </span>
              <span className="text-sm text-teal-700 dark:text-teal-400 font-medium">
                {showTalk ? 'Скрыть' : 'Показать'}
              </span>
            </button>
            {showTalk && (
              <ol className="mt-4 list-decimal ml-5 space-y-2 text-base text-gray-800 dark:text-gray-200">
                {work.talkTrack.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </LabReportProvider>
  )
}
