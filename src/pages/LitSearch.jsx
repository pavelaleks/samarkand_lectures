import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadText } from '../lab/textUtils'
import {
  DEEPSEEK_KEY_STORAGE,
  PRESETS,
  S2_KEY_STORAGE,
  dedupeByDoiOrTitle,
  reformulateLocal,
  reformulateWithDeepSeek,
  resultsToCsv,
  searchCrossref,
  searchOpenAlex,
  searchSemanticScholar,
} from '../lab/litSearchLib'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
const btnPrimary = 'btn-primary !py-2 !px-4 !min-h-0 text-sm disabled:opacity-50'

export default function LitSearch() {
  const [topic, setTopic] = useState(PRESETS[0].topic)
  const [reform, setReform] = useState(() => reformulateLocal(PRESETS[0].topic))
  const [queryPick, setQueryPick] = useState('')
  const [sources, setSources] = useState({ openalex: true, crossref: true, s2: true })
  const [useLlm, setUseLlm] = useState(false)
  const [deepseekKey, setDeepseekKey] = useState(() => sessionStorage.getItem(DEEPSEEK_KEY_STORAGE) || '')
  const [s2Key, setS2Key] = useState(() => sessionStorage.getItem(S2_KEY_STORAGE) || '')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [err, setErr] = useState('')
  const [warnings, setWarnings] = useState([])
  const [results, setResults] = useState([])
  const [sort, setSort] = useState('cited')

  const activeQuery = queryPick || reform.queries[0] || ''

  const sorted = useMemo(() => {
    const rows = [...results]
    if (sort === 'cited') rows.sort((a, b) => (b.cited || 0) - (a.cited || 0))
    else if (sort === 'year') rows.sort((a, b) => (b.year || 0) - (a.year || 0))
    else rows.sort((a, b) => String(a.title).localeCompare(String(b.title), 'ru'))
    return rows
  }, [results, sort])

  const applyPreset = (p) => {
    setTopic(p.topic)
    const r = reformulateLocal(p.topic)
    setReform(r)
    setQueryPick(r.queries[0] || '')
    setResults([])
    setErr('')
  }

  const buildReform = async () => {
    if (useLlm && deepseekKey.trim()) {
      try {
        sessionStorage.setItem(DEEPSEEK_KEY_STORAGE, deepseekKey.trim())
        const r = await reformulateWithDeepSeek(topic, deepseekKey.trim())
        return { reform: r, warn: null }
      } catch (e) {
        return {
          reform: { ...reformulateLocal(topic), source: 'local-fallback' },
          warn: `LLM недоступен (${e.message}). Использован локальный перефраз.`,
        }
      }
    }
    return { reform: { ...reformulateLocal(topic), source: 'local' }, warn: null }
  }

  const doReform = async () => {
    setErr('')
    setWarnings([])
    setBusy(true)
    setPhase('Перефраз…')
    try {
      const { reform: r, warn } = await buildReform()
      setReform(r)
      setQueryPick(r.queries?.[0] || '')
      if (warn) setWarnings([warn])
    } finally {
      setBusy(false)
      setPhase('')
    }
  }

  const searchWithQuery = async (q) => {
    const query = (q || '').trim()
    if (!query) {
      setErr('Введите тему или выберите поисковую строку.')
      return
    }
    if (!sources.openalex && !sources.crossref && !sources.s2) {
      setErr('Включите хотя бы один источник.')
      return
    }
    setBusy(true)
    setErr('')
    setResults([])
    const got = []
    const warns = []
    const runSrc = async (name, fn) => {
      try {
        setPhase(name)
        got.push(...(await fn()))
      } catch (e) {
        warns.push(`${name}: ${e.message}`)
      }
    }
    if (sources.openalex) await runSrc('OpenAlex…', () => searchOpenAlex(query))
    if (sources.crossref) await runSrc('Crossref…', () => searchCrossref(query))
    if (sources.s2) {
      if (s2Key.trim()) sessionStorage.setItem(S2_KEY_STORAGE, s2Key.trim())
      await runSrc('Semantic Scholar…', () =>
        searchSemanticScholar(query, { apiKey: s2Key.trim() || undefined })
      )
    }
    setResults(dedupeByDoiOrTitle(got))
    setWarnings((w) => [...w, ...warns])
    setBusy(false)
    setPhase('')
    if (!got.length) {
      setErr('Пусто. Выберите английскую строку поиска или другой пресет; проверьте Semantic Scholar (лимит без ключа).')
    }
  }

  const doSearch = () => searchWithQuery(activeQuery || topic)

  const runAll = async () => {
    setErr('')
    setWarnings([])
    setBusy(true)
    setPhase('Перефраз…')
    let searchQ = topic
    try {
      const { reform: r, warn } = await buildReform()
      setReform(r)
      searchQ = r.queries?.[0] || topic
      setQueryPick(searchQ)
      if (warn) setWarnings([warn])
    } catch (e) {
      setErr(String(e.message || e))
      setBusy(false)
      setPhase('')
      return
    }
    await searchWithQuery(searchQ)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/courses/digital-humanities/demo" className="text-teal-700 dark:text-teal-400 hover:underline font-medium">
          ← Инструменты / ресурсы
        </Link>
        <Link to="/courses/digital-humanities/demo/pipeline" className="text-gray-500 hover:underline">
          Каталог API (Л11)
        </Link>
      </div>

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">Ресурсы курса</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Поиск статей по теме
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Введите исследовательский вопрос → получите академический перефраз и ключевые слова → отправьте запрос в{' '}
          <strong>OpenAlex</strong>, <strong>Crossref</strong> и <strong>Semantic Scholar</strong> (бесплатные API).
        </p>
      </header>

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-1">
        <p>
          <strong>Как на занятии:</strong> тема по-русски → «Собрать ключевые слова» → выбрать английскую строку поиска →
          «Искать в базах». Для обзора литературы этого достаточно; полный текст статьи открывайте по DOI / OA.
        </p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          По умолчанию перефраз <em>локальный</em> (глоссарий курса, без ключа). Опционально — DeepSeek для умного
          перефраза.
        </p>
      </div>

      {/* Presets */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Пресеты</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={btnSecondary} onClick={() => applyPreset(p)}>
              {p.title}
            </button>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
        <label className="block text-sm font-semibold">
          1. Тематический запрос / вопрос исследования
          <textarea
            className={field}
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: память и забвение в «Тёмных аллеях» Бунина"
          />
        </label>

        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className={btnSecondary} disabled={busy} onClick={doReform}>
            2. Собрать ключевые слова / перефраз
          </button>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
            Умный перефраз через DeepSeek
          </label>
        </div>

        {useLlm && (
          <label className="block text-sm font-semibold">
            DeepSeek API key
            <input
              type="password"
              className={field}
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder="sk-…"
              autoComplete="off"
            />
          </label>
        )}

        {(reform.academicRu || reform.keywords?.length > 0) && (
          <div className="rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-4 space-y-3 text-sm">
            <div>
              <div className="text-xs font-bold uppercase text-teal-800 dark:text-teal-200">Перефраз (RU)</div>
              <p className="mt-1">{reform.academicRu}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-teal-800 dark:text-teal-200">Для баз (EN)</div>
              <p className="mt-1">{reform.academicEn}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-teal-800 dark:text-teal-200 mb-1">Ключевые слова</div>
              <div className="flex flex-wrap gap-1.5">
                {(reform.keywords || []).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 border border-teal-300 text-xs hover:bg-teal-100"
                    onClick={() => setQueryPick(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-teal-800 dark:text-teal-200 mb-1">Строки поиска</div>
              <div className="space-y-1">
                {(reform.queries || []).map((q) => (
                  <label key={q} className="flex gap-2 items-start text-sm cursor-pointer">
                    <input type="radio" name="qpick" checked={activeQuery === q} onChange={() => setQueryPick(q)} />
                    <span className="font-mono text-xs">{q}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              Источник перефраза: {reform.source === 'deepseek' ? 'DeepSeek' : 'локальный глоссарий курса'}
            </p>
          </div>
        )}

        <label className="block text-sm font-semibold">
          3. Итоговая поисковая строка (можно править)
          <input className={field} value={activeQuery} onChange={(e) => setQueryPick(e.target.value)} />
        </label>

        <div className="flex flex-wrap gap-4 text-sm">
          {[
            ['openalex', 'OpenAlex (без ключа)'],
            ['crossref', 'Crossref (без ключа)'],
            ['s2', 'Semantic Scholar'],
          ].map(([k, label]) => (
            <label key={k} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={sources[k]}
                onChange={(e) => setSources((s) => ({ ...s, [k]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>

        {sources.s2 && (
          <label className="block text-sm font-semibold">
            Semantic Scholar API key (необязательно, повышает лимит)
            <input
              type="password"
              className={field}
              value={s2Key}
              onChange={(e) => setS2Key(e.target.value)}
              placeholder="получить на semanticscholar.org/product/api"
              autoComplete="off"
            />
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={busy} onClick={runAll}>
            {busy ? phase || 'Работаю…' : '▶ Перефраз + поиск'}
          </button>
          <button type="button" className={btnSecondary} disabled={busy} onClick={doSearch}>
            Только поиск по текущей строке
          </button>
        </div>
      </section>

      {err && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm space-y-1">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {/* Results */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Результаты {results.length > 0 && <span className="text-sm font-normal text-gray-500">· {results.length}</span>}
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm px-3 py-2"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="cited">по цитированиям</option>
              <option value="year">по году</option>
              <option value="title">по названию</option>
            </select>
            {results.length > 0 && (
              <button
                type="button"
                className={btnPrimary}
                onClick={() => downloadText('lit_search_results.csv', resultsToCsv(sorted), 'text/csv;charset=utf-8')}
              >
                Скачать CSV
              </button>
            )}
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">Пока пусто — запустите поиск.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((r) => (
              <li
                key={`${r.source}-${r.id || r.doi || r.title}`}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100 font-bold">
                    {r.source}
                  </span>
                  {r.year && <span className="text-gray-500">{r.year}</span>}
                  {r.cited != null && <span className="text-gray-500">цит. {r.cited}</span>}
                  {r.oa && <span className="text-emerald-700 font-semibold">OA</span>}
                </div>
                <h3 className="font-bold text-base leading-snug">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {r.title}
                    </a>
                  ) : (
                    r.title
                  )}
                </h3>
                {r.authors && <p className="text-sm text-gray-600 dark:text-gray-400">{r.authors}</p>}
                {r.abstract && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.abstract}…</p>}
                <div className="flex flex-wrap gap-3 text-xs">
                  {r.doi && (
                    <a className="underline text-teal-700 dark:text-teal-300" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
                      doi:{r.doi}
                    </a>
                  )}
                  {r.venue && <span className="text-gray-500">{r.venue}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Вежливость к API: не долбите кнопкой. Semantic Scholar без ключа легко упирается в 429 — оформите бесплатный ключ
        или опирайтесь на OpenAlex + Crossref.
      </p>
    </div>
  )
}
