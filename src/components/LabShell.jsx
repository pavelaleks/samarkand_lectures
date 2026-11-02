import { Link } from 'react-router-dom'
import { LabReportProvider } from '../lab/LabReportContext'
import { PAIRS, STAND_TO_METHOD, colabUrl, methodById } from '../data/dhMethods'
import { OwnTextsSection } from '../lab/mine/OwnTexts'
import { STAND_PANELS } from '../lab/mine/panels'

export default function LabShell({ work, children, courseSlug = 'digital-humanities' }) {
  const method = methodById(STAND_TO_METHOD[work.slug])
  const own = STAND_PANELS[work.slug]
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
          К инструментам
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {work.title}
          </h1>
          {work.question && (
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 leading-snug border-l-4 border-teal-500 pl-4">
              {work.question}
            </p>
          )}
          {own && (
            <a href="#my-texts" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold">
              🧪 Сразу на своём тексте ↓
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm">
          {children}
        </div>

        {own && <OwnTextsSection panelIds={own} />}

        {method && (
          <aside className="mt-8 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/20 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-1">
              Дальше: перенести на свой текст
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">{method.title}</h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{method.question}</p>
            <div className="flex flex-wrap gap-2">
              {method.pairs.map((p) => (
                <a
                  key={p}
                  href={colabUrl(p)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold"
                >
                  ▶ Colab · Пара {p}: {PAIRS[p].title}
                </a>
              ))}
              <Link
                to={`/courses/${courseSlug}/navigator#method-${method.id}`}
                className="px-4 py-2 rounded-xl border border-amber-400 dark:border-amber-600 text-sm font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                Карточка метода: как написать в диссертации →
              </Link>
            </div>
          </aside>
        )}
      </div>
    </LabReportProvider>
  )
}
