import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadText } from '../lab/textUtils'
import {
  DEEPSEEK_KEY_STORAGE,
  INTERTEXT_PRESETS,
  analysisToMarkdown,
  analyzeIntertextWithDeepSeek,
  confidenceClass,
} from '../lab/intertextLib'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const mono =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm font-mono leading-relaxed'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
const btnPrimary = 'btn-primary !py-2 !px-4 !min-h-0 text-sm disabled:opacity-50'

const MIN_CHARS = 80
const MAX_CHARS = 8000

export default function IntertextAnalysis() {
  const first = INTERTEXT_PRESETS[0]
  const [presetId, setPresetId] = useState(first.id)
  const [author, setAuthor] = useState(first.author)
  const [work, setWork] = useState(first.work)
  const [focus, setFocus] = useState(first.focus)
  const [extra, setExtra] = useState('')
  const [fragment, setFragment] = useState(first.fragment)
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(DEEPSEEK_KEY_STORAGE) || '')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const abortRef = useRef(null)

  const applyPreset = (p) => {
    setPresetId(p.id)
    setAuthor(p.author)
    setWork(p.work)
    setFocus(p.focus)
    setFragment(p.fragment)
    setAnalysis(null)
    setErr('')
  }

  const run = async () => {
    const text = fragment.trim()
    const key = apiKey.trim()
    if (!key) {
      setErr('Вставьте DeepSeek API key (platform.deepseek.com → API keys).')
      return
    }
    if (text.length < MIN_CHARS) {
      setErr(`Фрагмент слишком короткий (минимум ${MIN_CHARS} знаков).`)
      return
    }
    if (text.length > MAX_CHARS) {
      setErr(`Фрагмент длиннее ${MAX_CHARS} знаков — укоротите: модель лучше держит близкое чтение.`)
      return
    }

    if (remember) sessionStorage.setItem(DEEPSEEK_KEY_STORAGE, key)
    else sessionStorage.removeItem(DEEPSEEK_KEY_STORAGE)

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setBusy(true)
    setErr('')
    setAnalysis(null)
    try {
      const result = await analyzeIntertextWithDeepSeek(
        { fragment: text, author, work, focus, extra },
        key,
        { signal: ctrl.signal }
      )
      setAnalysis(result)
    } catch (e) {
      if (e?.name === 'AbortError') return
      const msg = String(e?.message || e)
      if (/Failed to fetch|NetworkError|CORS/i.test(msg)) {
        setErr(
          'Браузер не смог связаться с DeepSeek (сеть, VPN или блокировка). Проверьте доступ к api.deepseek.com.'
        )
      } else {
        setErr(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setBusy(false)
  }

  const md = analysis
    ? analysisToMarkdown(analysis, { author, work })
    : ''

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/courses/digital-humanities/demo"
          className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
        >
          ← Инструменты / ресурсы
        </Link>
        <Link to="/courses/digital-humanities/demo/prompt" className="text-gray-500 hover:underline">
          Промпт-лаборатория (Л10)
        </Link>
        <Link to="/courses/digital-humanities/demo/pipeline" className="text-gray-500 hover:underline">
          API DeepSeek (Л11)
        </Link>
      </div>

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          Ресурсы курса
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Интертекстуальный анализ фрагмента
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Вставьте фрагмент → DeepSeek разберёт цитаты, аллюзии и реминисценции с уровнями уверенности и чеклистом
          проверки. Ключ уходит только в DeepSeek из браузера, не на сервер курса.
        </p>
      </header>

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-1">
        <p>
          <strong>Как на занятии:</strong> пресет «Холодная осень» → ключ → «Разобрать». Разберите с залом сигнал
          высокой уверенности (Фет) и один «соблазн без опоры». Затем свой фрагмент.
        </p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          Модель подсказывает гипотезы. Интертекст считается найденным только после вашей сверки цитаты и источника.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Учебные пресеты</h2>
        <div className="flex flex-wrap gap-2">
          {INTERTEXT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${btnSecondary} ${
                presetId === p.id ? '!border-violet-500 ring-1 ring-violet-400 bg-violet-50 dark:bg-violet-950/40' : ''
              }`}
              onClick={() => applyPreset(p)}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
        <label className="block text-sm font-semibold">
          DeepSeek API key
          <input
            type="password"
            className={field}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Запомнить ключ в sessionStorage (до закрытия вкладки)
          </label>
          <a
            className="underline text-teal-700 dark:text-teal-300"
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noreferrer"
          >
            Получить ключ →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Автор (необязательно)
            <input className={field} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Произведение (необязательно)
            <input className={field} value={work} onChange={(e) => setWork(e.target.value)} />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Фокус / исследовательский вопрос
          <textarea
            className={field}
            rows={3}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Что именно искать: цитату, жанровый код, библеизм…"
          />
        </label>

        <label className="block text-sm font-semibold">
          Доп. контекст (необязательно)
          <textarea
            className={field}
            rows={2}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Например: интересует связь с Огарёвым; не разбирать биографию Бунина"
          />
        </label>

        <label className="block text-sm font-semibold">
          Фрагмент для анализа{' '}
          <span className="font-normal text-gray-500">
            ({fragment.trim().length} / {MAX_CHARS})
          </span>
          <textarea
            className={mono}
            rows={12}
            value={fragment}
            onChange={(e) => {
              setFragment(e.target.value)
              setPresetId('custom')
            }}
            placeholder="Вставьте фрагмент текста…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={busy} onClick={run}>
            {busy ? 'Разбираю…' : '▶ Разобрать интертекст'}
          </button>
          {busy && (
            <button type="button" className={btnSecondary} onClick={stop}>
              Остановить
            </button>
          )}
          {analysis && (
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                downloadText(
                  `intertext_${(work || 'fragment').replace(/\s+/g, '_').slice(0, 40)}.md`,
                  md
                )
              }
            >
              Скачать Markdown
            </button>
          )}
        </div>
      </section>

      {err && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      )}

      {analysis && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-violet-300 dark:border-violet-700 bg-violet-50/80 dark:bg-violet-950/30 p-5 space-y-2">
            <h2 className="text-lg font-bold text-violet-950 dark:text-violet-100">Краткий вывод</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200">
              {analysis.summary}
            </p>
            {analysis.meta?.model && (
              <p className="text-[11px] text-gray-500">Модель: {analysis.meta.model}</p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">
              Сигналы{' '}
              <span className="text-sm font-normal text-gray-500">· {analysis.signals.length}</span>
            </h2>
            {analysis.signals.length === 0 ? (
              <p className="text-sm text-gray-500">
                Явных сигналов нет — смотрите блок «Чего нет» и чеклист.
              </p>
            ) : (
              <ul className="space-y-3">
                {analysis.signals.map((s, i) => (
                  <li
                    key={`${s.label}-${i}`}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                        {s.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${confidenceClass(s.confidence)}`}>
                        {s.confidence}
                      </span>
                    </div>
                    <h3 className="font-bold text-base leading-snug">{s.label}</h3>
                    {s.probable_source && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Источник: {s.probable_source}
                      </p>
                    )}
                    {s.evidence && (
                      <blockquote className="border-l-4 border-violet-400 pl-3 text-sm italic text-gray-800 dark:text-gray-200">
                        «{s.evidence}»
                      </blockquote>
                    )}
                    {s.function && (
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold">Функция: </span>
                        {s.function}
                      </p>
                    )}
                    {s.note && (
                      <p className="text-sm text-amber-900 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
                        {s.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {analysis.relations && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
              <h2 className="text-lg font-bold">Сеть связей</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.relations}</p>
            </div>
          )}

          {analysis.non_findings && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 p-5 space-y-2 bg-rose-50/50 dark:bg-rose-950/20">
              <h2 className="text-lg font-bold">Чего нет (соблазн без опоры)</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.non_findings}</p>
            </div>
          )}

          {analysis.checklist?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
              <h2 className="text-lg font-bold">Чеклист проверки</h2>
              <ol className="list-decimal list-inside space-y-1.5 text-sm">
                {analysis.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </div>
          )}

          {analysis.limits && (
            <p className="text-xs text-gray-500 leading-relaxed">{analysis.limits}</p>
          )}
        </section>
      )}

      <p className="text-xs text-gray-500">
        Ключ хранится только в браузере (sessionStorage). Не коммитьте ключи в репозиторий и не показывайте их на
        записи экрана.
      </p>
    </div>
  )
}
