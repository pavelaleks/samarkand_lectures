import { Link } from 'react-router-dom'
import { LabReportProvider } from '../lab/LabReportContext'

export default function LabShell({ work, children, courseSlug = 'digital-humanities' }) {
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
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm">
          {children}
        </div>
      </div>
    </LabReportProvider>
  )
}
