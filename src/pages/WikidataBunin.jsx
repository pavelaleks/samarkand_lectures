import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadText } from '../lab/textUtils'
import {
  BUNIN_Q,
  CORPUS_PLACES,
  STORY_OPTIONS,
  bindingsToRows,
  buildPresets,
  parseWktPoint,
  runSparql,
} from '../lab/tools/wikidataBuninData'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm font-mono'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
const btnPrimary = 'btn-primary !py-2 !px-4 !min-h-0 text-sm disabled:opacity-50'

function MiniMap({ points }) {
  const pts = points.filter((p) => p.lat != null && p.lon != null)
  if (!pts.length) return null
  const lon0 = -10
  const lon1 = 60
  const lat0 = 25
  const lat1 = 65
  const W = 640
  const H = 300
  const xy = (lat, lon) => [
    Math.max(10, Math.min(W - 10, ((lon - lon0) / (lon1 - lon0)) * W)),
    Math.max(10, Math.min(H - 10, ((lat1 - lat) / (lat1 - lat0)) * H)),
  ]
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/40 p-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl mx-auto" role="img" aria-label="Карта Wikidata">
        <text x={14} y={22} fontSize="12" className="fill-gray-400">
          Места из ответа SPARQL (схема Европа / зап. Азия)
        </text>
        {pts.map((p, i) => {
          const [x, y] = xy(p.lat, p.lon)
          return (
            <g key={`${p.label}-${i}`}>
              <circle cx={x} cy={y} r={7} fill="#0d9488" />
              <text x={x + 10} y={y + 4} fontSize="11" className="fill-gray-800 dark:fill-gray-100">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function WikidataBunin() {
  const [storySlug, setStorySlug] = useState('all')
  const [presetId, setPresetId] = useState('places-coords')
  const [sparql, setSparql] = useState('')
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ranAt, setRanAt] = useState(null)

  const places = useMemo(() => {
    if (storySlug === 'all') return CORPUS_PLACES
    return CORPUS_PLACES.filter((p) => p.slug === storySlug)
  }, [storySlug])

  const presets = useMemo(() => buildPresets(places), [places])

  const applyPreset = (id) => {
    const p = presets.find((x) => x.id === id) || presets[0]
    setPresetId(p.id)
    setSparql(p.sparql)
    setRows([])
    setErr('')
  }

  useEffect(() => {
    const list = buildPresets(places)
    const p = list.find((x) => x.id === presetId) || list[0]
    if (p) setSparql(p.sparql)
  }, [storySlug, presetId, places])

  const mapPoints = useMemo(() => {
    return rows
      .map((r) => {
        const pt = parseWktPoint(r.coord)
        if (!pt) return null
        return { ...pt, label: r.placeLabel || r.place || r.countryLabel || '?' }
      })
      .filter(Boolean)
  }, [rows])

  const run = async () => {
    setBusy(true)
    setErr('')
    setRows([])
    try {
      const json = await runSparql(sparql)
      setRows(bindingsToRows(json))
      setRanAt(new Date().toLocaleTimeString('ru-RU'))
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  const csv = useMemo(() => {
    if (!rows.length) return ''
    const keys = Object.keys(rows[0])
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    return `\uFEFF${keys.join(',')}\n${rows.map((r) => keys.map((k) => esc(r[k])).join(',')).join('\n')}\n`
  }, [rows])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <Link
        to="/courses/digital-humanities/demo/pipeline"
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline font-medium"
      >
        ← К стенду Л11 (API / DeepSeek)
      </Link>

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">Лекция 11 · открытый API</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Wikidata SPARQL · «Тёмные аллеи»
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 border-l-4 border-teal-500 pl-4">
          Как программно спросить базу знаний о местах и авторе цикла — и получить таблицу для карты и сети, без ключа.
        </p>
      </header>

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-2">
        <p>
          <strong>Скажите вслух:</strong> «Wikidata — не сюжет рассказа. Это внешний слой фактов: координаты Парижа,
          тип сущности „Кавказ“, даты Бунина. Смысл всё равно проверяем по тексту.»
        </p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          Endpoint: <code className="text-xs">https://query.wikidata.org/sparql</code> · автор цикла:{' '}
          <a className="underline" href={`https://www.wikidata.org/wiki/${BUNIN_Q.id}`} target="_blank" rel="noreferrer">
            {BUNIN_Q.id}
          </a>
        </p>
      </div>

      {/* Step 1: scope */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Объект: один рассказ или набор мест цикла</h2>
        <div className="flex flex-wrap gap-2">
          {STORY_OPTIONS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => {
                setStorySlug(s.slug)
                setRows([])
                const nextPlaces = s.slug === 'all' ? CORPUS_PLACES : CORPUS_PLACES.filter((p) => p.slug === s.slug)
                const nextPresets = buildPresets(nextPlaces)
                const p = nextPresets.find((x) => x.id === presetId) || nextPresets[1] || nextPresets[0]
                setPresetId(p.id)
                setSparql(p.sparql)
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                storySlug === s.slug
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500 text-left">
              <tr>
                <th className="p-2">Рассказ</th>
                <th className="p-2">Место</th>
                <th className="p-2">Q-id</th>
                <th className="p-2">Заметка</th>
              </tr>
            </thead>
            <tbody>
              {places.map((p) => (
                <tr key={`${p.slug}-${p.qid}-${p.label}`} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2">{p.story}</td>
                  <td className="p-2 font-semibold">{p.label}</td>
                  <td className="p-2 font-mono text-xs">
                    <a className="underline text-teal-700 dark:text-teal-300" href={`https://www.wikidata.org/wiki/${p.qid}`} target="_blank" rel="noreferrer">
                      {p.qid}
                    </a>
                  </td>
                  <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{p.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 2: query */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Готовый SPARQL (можно править)</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`text-left rounded-xl border p-3 ${
                presetId === p.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-400'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="font-semibold text-sm">{p.title}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.blurb}</div>
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold">
          Запрос
          <textarea className={field} rows={14} value={sparql} onChange={(e) => setSparql(e.target.value)} spellCheck={false} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={busy || !sparql.trim()} onClick={run}>
            {busy ? 'Запрос к Wikidata…' : '▶ Выполнить SPARQL'}
          </button>
          <a
            className={btnSecondary}
            href={`https://query.wikidata.org/#${encodeURIComponent(sparql)}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть в query.wikidata.org
          </a>
        </div>
        {err && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            {err}
            <p className="mt-1 text-xs">Если браузер режет запрос — откройте тот же SPARQL на query.wikidata.org или скрипт wikidata_place.py из ZIP Л11.</p>
          </div>
        )}
      </section>

      {/* Step 3: results */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">
          3. Результат {ranAt ? <span className="text-sm font-normal text-gray-500">· {ranAt} · {rows.length} строк</span> : null}
        </h2>
        <MiniMap points={mapPoints} />
        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-[28rem]">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500 text-left sticky top-0">
                  <tr>
                    {Object.keys(rows[0]).map((k) => (
                      <th key={k} className="p-2 font-mono">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800 align-top">
                      {Object.entries(r).map(([k, v]) => (
                        <td key={k} className="p-2 text-xs max-w-[14rem] break-words">
                          {String(v).startsWith('http') ? (
                            <a className="underline text-teal-700 dark:text-teal-300" href={v} target="_blank" rel="noreferrer">
                              {v.replace('http://www.wikidata.org/entity/', '')}
                            </a>
                          ) : (
                            v
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => downloadText(`wikidata_${storySlug}_${presetId}.csv`, csv, 'text/csv;charset=utf-8')}
            >
              Скачать CSV
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Нажмите «Выполнить SPARQL» — здесь появится таблица.</p>
        )}
      </section>

      <section className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20 p-5 space-y-2 text-sm">
        <h2 className="text-lg font-bold">4. Как стыковать с конвейером Л11</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>DeepSeek / LLM размечает фрагменты (тезисы, цитаты, place_mentions).</li>
          <li>Этот стенд или Photon даёт координаты и типы мест из Wikidata / OSM.</li>
          <li>Аудит: цитата в тексте? Q-id соответствует смыслу рассказа (не омоним)?</li>
          <li>
            В работе пишите: «карта — распределение кандидатов; поэтика места — после close reading» — см.{' '}
            <Link className="underline font-semibold" to="/courses/digital-humanities/demo/pipeline">
              стенд API
            </Link>
            .
          </li>
        </ol>
      </section>

      <p className="text-xs text-gray-500">
        Данные © участники Wikidata · запросы с учебной User-Agent строки курса · не долбите endpoint без паузы.
      </p>
    </div>
  )
}
