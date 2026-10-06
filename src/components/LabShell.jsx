import { Link } from 'react-router-dom'
import { LabDownloadBar, LabReportProvider } from '../lab/LabReportContext'

const ACTIVITY = {
  illustrate: {
    label: 'Иллюстрация метода',
    className: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
    blurb: 'Смотрите, как работает приём, и отвечаете на контрольные вопросы — чтобы закрепить понятие с лекции.',
  },
  build: {
    label: 'Построение',
    className: 'bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100',
    blurb: 'Сами вводите данные, строите таблицу/график и формулируете вывод. Это не картинка — это ваша работа.',
  },
  code: {
    label: 'Код и проверка',
    className: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100',
    blurb: 'Правите учебный код, запускаете его и видите, прошли ли проверки навыка.',
  },
  practice: {
    label: 'Практика письма',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
    blurb: 'Заполняете поля так, как будете вести notes/ в Cursor: паспорт, промпт, таблица доказательств.',
  },
}

export default function LabShell({ work, children, courseSlug = 'digital-humanities' }) {
  const act = ACTIVITY[work.activity] || ACTIVITY.build

  return (
    <LabReportProvider work={work}>
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
            <span className={`px-2.5 py-1 rounded-lg font-semibold ${act.className}`}>{act.label}</span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {work.minutes} мин
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {work.title}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
            <span className="font-semibold text-teal-800 dark:text-teal-300">Чему учимся. </span>
            {work.goal || work.question}
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            <span className="font-semibold">Исследовательский вопрос. </span>
            {work.question}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 p-5 mb-6">
          <h2 className="font-bold text-teal-900 dark:text-teal-100 mb-1">Что делать на этой странице</h2>
          <p className="text-sm text-teal-900/90 dark:text-teal-100/90 mb-3">{act.blurb}</p>
          {work.steps?.length > 0 && (
            <ol className="list-decimal ml-5 space-y-1.5 text-sm sm:text-base text-gray-800 dark:text-gray-200">
              {work.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800/60 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300 mb-2">Метод</h2>
            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.method}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">
              Почему это не «развлечение»
            </h2>
            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.limits}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Рабочая зона</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Жёлтые подсказки «Ваше действие» — обязательные поля. Внизу страницы скачайте итоговый файл.
          </p>
          {children}
        </div>

        <LabDownloadBar />

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
            Строка метода (в notes/)
          </h2>
          <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
            единица = {work.unit}; источник = …; процедура = {work.tool}; n = …; ограничение = см. выше
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/30 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300 mb-2">
            Сдать / принести на семинар
          </h2>
          <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{work.task}</p>
        </div>
      </div>
    </LabReportProvider>
  )
}
