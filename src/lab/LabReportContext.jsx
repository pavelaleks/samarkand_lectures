import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { downloadText } from './textUtils'

const STORAGE_KEY = 'dh_lab_student_v1'

const COURSE_META = {
  title: 'Анализ художественного текста с помощью ИИ и цифровых технологий',
  instructor: 'проф. П. В. Алексеев',
  university: 'Самаркандский государственный университет им. Шарофа Рашидова',
}

function loadStudent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lastName: '', firstName: '', group: '' }
    const parsed = JSON.parse(raw)
    return {
      lastName: parsed.lastName || '',
      firstName: parsed.firstName || '',
      group: parsed.group || '',
    }
  } catch {
    return { lastName: '', firstName: '', group: '' }
  }
}

const LabReportContext = createContext(null)

export function LabReportProvider({ children, work }) {
  const builderRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [student, setStudent] = useState(loadStudent)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student))
  }, [student])

  const register = useCallback((builder) => {
    builderRef.current = builder
    setReady(typeof builder === 'function')
    return () => {
      if (builderRef.current === builder) {
        builderRef.current = null
        setReady(false)
      }
    }
  }, [])

  const download = useCallback(() => {
    if (!builderRef.current) return
    const payload = builderRef.current()
    const title = (typeof payload === 'object' && payload.title) || work?.title || 'Результат работы'
    const body = typeof payload === 'string' ? payload : payload.body || ''
    const today = new Date().toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const fio = [student.lastName, student.firstName].filter(Boolean).join(' ') || '— не указано —'

    const md = [
      `# ${title}`,
      '',
      '## Титульные данные',
      '',
      `| Поле | Значение |`,
      `|---|---|`,
      `| Фамилия, имя | ${fio} |`,
      `| Группа | ${student.group || '— не указано —'} |`,
      `| Курс | ${COURSE_META.title} |`,
      `| Преподаватель | ${COURSE_META.instructor} |`,
      `| Университет | ${COURSE_META.university} |`,
      `| Лекция | ${work?.lecture ?? '—'} · ${work?.title || ''} |`,
      `| Дата | ${today} |`,
      '',
      '---',
      '',
      '## Содержание работы',
      '',
      body.trim() || '_Рабочая зона пуста — заполните поля выше._',
      '',
      '---',
      '',
      '## Строка метода',
      '',
      `единица = ${work?.unit || '…'}; процедура = ${work?.tool || '…'}; источник = укажите сами`,
      '',
      '## Задание к семинару',
      '',
      work?.task || '',
      '',
    ].join('\n')

    const safeName = (student.lastName || 'student').replace(/[^\wа-яёА-ЯЁ\-]+/gi, '_')
    const safe = (work?.slug || 'lab').replace(/[^\w\-]+/g, '_')
    downloadText(
      `lab_L${work?.lecture || ''}_${safe}_${safeName}.md`,
      md,
      'text/markdown;charset=utf-8'
    )
  }, [work, student])

  const updateStudent = useCallback((patch) => {
    setStudent((s) => ({ ...s, ...patch }))
  }, [])

  return (
    <LabReportContext.Provider
      value={{
        register,
        download,
        ready,
        student,
        updateStudent,
        courseMeta: COURSE_META,
        work,
      }}
    >
      {children}
    </LabReportContext.Provider>
  )
}

export function useLabReport(builder, deps = []) {
  const ctx = useContext(LabReportContext)
  const builderRef = useRef(builder)
  builderRef.current = builder

  useEffect(() => {
    if (!ctx) return undefined
    const stable = () => builderRef.current()
    return ctx.register(stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, ...deps])
}

export function LabDownloadBar() {
  const ctx = useContext(LabReportContext)
  if (!ctx) return null

  const { student, updateStudent, courseMeta, work, download, ready } = ctx
  const today = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const missingId = !student.lastName.trim() || !student.firstName.trim() || !student.group.trim()

  return (
    <div className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-950/40 p-5 mb-6 space-y-4">
      <div>
        <h2 className="text-base font-bold text-teal-900 dark:text-teal-100 mb-1">
          Скачать результат работы
        </h2>
        <p className="text-sm text-teal-900/85 dark:text-teal-100/85 leading-relaxed">
          После заполнения полей выше получите файл Markdown для <code className="text-xs">notes/</code> или
          семинара. Ваши ФИО и группа вводятся вручную; курс, преподаватель, дата и номер лекции
          подставляются автоматически.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
          Фамилия *
          <input
            value={student.lastName}
            onChange={(e) => updateStudent({ lastName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2.5 text-sm"
            placeholder="Иванова"
            autoComplete="family-name"
          />
        </label>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
          Имя *
          <input
            value={student.firstName}
            onChange={(e) => updateStudent({ firstName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2.5 text-sm"
            placeholder="Мария"
            autoComplete="given-name"
          />
        </label>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
          Группа *
          <input
            value={student.group}
            onChange={(e) => updateStudent({ group: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2.5 text-sm"
            placeholder="МФ-21"
          />
        </label>
      </div>

      <div className="rounded-xl bg-white/80 dark:bg-gray-900/50 border border-teal-200 dark:border-teal-800 p-4 text-sm">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Подставляется автоматически</p>
        <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-gray-700 dark:text-gray-300">
          <div>
            <dt className="text-xs text-gray-500">Курс</dt>
            <dd>{courseMeta.title}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Преподаватель</dt>
            <dd>{courseMeta.instructor}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Лекция / задание</dt>
            <dd>
              Л{work?.lecture}: {work?.title}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Дата</dt>
            <dd>{today}</dd>
          </div>
        </dl>
      </div>

      {missingId && (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Укажите фамилию, имя и группу — иначе в файле останется «не указано».
        </p>
      )}

      <button
        type="button"
        onClick={download}
        disabled={!ready}
        className="btn-primary !py-2.5 !px-5 !min-h-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Скачать мой результат (.md)
      </button>
    </div>
  )
}
