import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LiveOsmMap from '../components/LiveOsmMap'
import { downloadText } from '../lab/textUtils'
import {
  BUNIN_Q,
  CORPUS_PLACES,
  CYCLE_Q,
  STORY_OPTIONS,
  ZONE_COLORS,
  bindingsToRows,
  buildMapFeatures,
  buildPresets,
  enrichTable,
  runSparql,
} from '../lab/tools/wikidataBuninData'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm font-mono'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
const btnPrimary = 'btn-primary !py-2 !px-4 !min-h-0 text-sm disabled:opacity-50'

function ZoneLegend() {
  const items = [
    ['russia', 'Россия'],
    ['europe', 'Европа'],
    ['caucasus', 'Кавказ'],
    ['balkans', 'Балканы'],
    ['mediterranean', 'Средиземноморье'],
    ['near_east', 'Ближний Восток'],
  ]
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {items.map(([k, label]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: ZONE_COLORS[k] }} />
          {label}
        </span>
      ))}
      <span className="text-gray-500">· пунктир смысла: центроид региона (не адрес)</span>
    </div>
  )
}

export default function WikidataBunin() {
  const [storySlug, setStorySlug] = useState('all')
  const [presetId, setPresetId] = useState('map-rich')
  const [sparql, setSparql] = useState('')
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ranAt, setRanAt] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showSparql, setShowSparql] = useState(false)

  const places = useMemo(() => {
    if (storySlug === 'all') return CORPUS_PLACES
    return CORPUS_PLACES.filter((p) => p.slug === storySlug)
  }, [storySlug])

  const presets = useMemo(() => buildPresets(places), [places])
  const preset = presets.find((p) => p.id === presetId) || presets[0]

  useEffect(() => {
    const list = buildPresets(places)
    const p = list.find((x) => x.id === presetId) || list[0]
    if (p) setSparql(p.sparql)
  }, [storySlug, presetId, places])

  const run = useCallback(
    async (queryText) => {
      const q = (queryText ?? sparql).trim()
      if (!q) return
      setBusy(true)
      setErr('')
      try {
        const json = await runSparql(q)
        setRows(bindingsToRows(json))
        setRanAt(new Date().toLocaleTimeString('ru-RU'))
      } catch (e) {
        setErr(String(e.message || e))
        setRows([])
      } finally {
        setBusy(false)
      }
    },
    [sparql]
  )

  // Автозагрузка карты при смене рассказа / пресета map-rich
  useEffect(() => {
    const list = buildPresets(places)
    const p = list.find((x) => x.id === presetId) || list[0]
    if (!p?.autoMap) return
    run(p.sparql)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storySlug, presetId])

  const features = useMemo(() => buildMapFeatures(places, rows), [places, rows])

  const mapPoints = useMemo(() => {
    return features
      .filter((f) => Number.isFinite(+f.lat) && Number.isFinite(+f.lon))
      .map((f) => ({
        id: f.id,
        lat: f.lat,
        lon: f.lon,
        label: f.label,
        color: f.color,
        popupHtml: `<div style="font:13px/1.4 system-ui,sans-serif">
          <strong>${f.label}</strong> · ${f.story}<br/>
          <em style="color:#555">${f.quote || ''}</em><br/>
          <span style="color:#0f766e">${f.why || ''}</span><br/>
          <small>Q: ${f.qid} · ${f.country || '—'} · источник координат: ${f.source === 'wikidata' ? 'Wikidata P625' : 'учебный центроид'}</small>
        </div>`,
      }))
  }, [features])

  const table = useMemo(() => enrichTable(places, rows), [places, rows])

  const insight = useMemo(() => {
    const withCoords = features.filter((f) => Number.isFinite(+f.lat))
    const zones = {}
    for (const f of withCoords) zones[f.zone] = (zones[f.zone] || 0) + 1
    const topZone = Object.entries(zones).sort((a, b) => b[1] - a[1])[0]
    const centroids = withCoords.filter((f) => f.source === 'centroid').length
    const wd = withCoords.filter((f) => f.source === 'wikidata').length
    return {
      n: withCoords.length,
      wd,
      centroids,
      topZone: topZone ? `${topZone[0]} (${topZone[1]})` : '—',
      stories: new Set(withCoords.map((f) => f.story)).size,
    }
  }, [features])

  const csv = useMemo(() => {
    if (!table.length) return ''
    const keys = Object.keys(table[0])
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    return `\uFEFF${keys.join(',')}\n${table.map((r) => keys.map((k) => esc(r[k])).join(',')).join('\n')}\n`
  }, [table])

  const selectStory = (slug) => {
    setStorySlug(slug)
    setSelectedId(null)
    setRows([])
    if (presetId !== 'map-rich' && presetId !== 'bunin-rich') setPresetId('map-rich')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/courses/digital-humanities/demo/pipeline" className="text-teal-700 dark:text-teal-400 hover:underline font-medium">
          ← Стенд Л11 (DeepSeek + каталог API)
        </Link>
        <Link to="/courses/digital-humanities/demo" className="text-gray-500 hover:underline">
          К инструментам
        </Link>
      </div>

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">Лекция 11 · Wikidata SPARQL</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Геопоэтика «Тёмных аллей» на живой карте
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Зачем API: не «посмотреть Википедию», а <strong>получить проверяемые координаты и типы мест</strong> для
          рассказов цикла — и сразу увидеть разброс Россия / Европа / Кавказ / Восток. Смысл цитаты по-прежнему в тексте;
          карта — слой фактов.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-3">
        {[
          {
            t: 'Исследовательский вопрос',
            d: 'Как географически устроен цикл — и меняется ли картина, если взять один рассказ вместо всех топосов?',
          },
          {
            t: 'Что даёт Wikidata',
            d: 'P625 (координаты), P17 (страна), P31 (тип: город/регион), описание сущности, связь автор↔произведение.',
          },
          {
            t: 'Чего Wikidata не даёт',
            d: 'Поэтику места, иронию, «атмосферу». Для этого — close reading и LLM-конвейер с аудитом цитат.',
          },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{c.t}</div>
            <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>

      {/* Scope */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Выберите масштаб</h2>
        <div className="flex flex-wrap gap-2">
          {STORY_OPTIONS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => selectStory(s.slug)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-colors ${
                storySlug === s.slug
                  ? 'bg-teal-600 text-white border-teal-600 shadow'
                  : 'border-gray-200 dark:border-gray-700 hover:border-teal-400 bg-white dark:bg-gray-900'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </section>

      {/* Live map first — the visual punch */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">2. Живая карта OpenStreetMap</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Маркеры из Wikidata (P625) + учебные центроиды для регионов без точки. Клик — цитата и зачем место в
              анализе.
            </p>
          </div>
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => run()}>
            {busy ? 'Запрос к Wikidata…' : '↻ Обновить из Wikidata'}
          </button>
        </div>
        <ZoneLegend />
        <LiveOsmMap points={mapPoints} height={460} />
        {ranAt && (
          <div className="grid sm:grid-cols-4 gap-2 text-sm">
            <Stat label="точек на карте" value={insight.n} />
            <Stat label="из Wikidata P625" value={insight.wd} />
            <Stat label="центроиды регионов" value={insight.centroids} />
            <Stat label="рассказов" value={insight.stories} />
          </div>
        )}
        {err && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            {err}
            <p className="text-xs mt-1">Карта всё равно покажет учебные центроиды; полный SPARQL откройте на query.wikidata.org.</p>
          </div>
        )}
      </section>

      {/* Place cards */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Топосы: зачем каждый</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {features.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                selectedId === f.id
                  ? 'border-teal-500 ring-2 ring-teal-400/50 bg-teal-50/70 dark:bg-teal-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-teal-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 w-3.5 h-3.5 rounded-full shrink-0" style={{ background: f.color }} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold">{f.label}</span>
                    <span className="text-xs text-gray-500">{f.story}</span>
                    <a
                      className="text-xs font-mono underline text-teal-700 dark:text-teal-300"
                      href={`https://www.wikidata.org/wiki/${f.qid}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {f.qid}
                    </a>
                  </div>
                  <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-1">«{f.quote}»</p>
                  <p className="text-sm mt-2 text-gray-800 dark:text-gray-200">{f.why}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {Number.isFinite(+f.lat) ? (
                      <>
                        {(+f.lat).toFixed(3)}, {(+f.lon).toFixed(3)} · {f.country || 'страна ?'} ·{' '}
                        {f.source === 'wikidata' ? 'Wikidata' : 'центроид'}
                        {f.typeLabel ? ` · ${f.typeLabel}` : ''}
                      </>
                    ) : (
                      'координат нет — только Q-id'
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Другие запросы (с ясной целью)</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPresetId(p.id)
                setSparql(p.sparql)
                setRows([])
                if (p.autoMap) run(p.sparql)
                else run(p.sparql)
              }}
              className={`text-left rounded-2xl border p-4 ${
                presetId === p.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="font-bold text-sm">{p.title}</div>
              <p className="text-xs text-teal-800 dark:text-teal-200 mt-2">
                <strong>Вопрос: </strong>
                {p.researchQuestion}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <strong>Зачем филологу: </strong>
                {p.whyForPhilologist}
              </p>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm">
          <strong>Сейчас:</strong> {preset?.title}. {preset?.researchQuestion}
        </div>
        <button type="button" className={btnSecondary} onClick={() => setShowSparql((v) => !v)}>
          {showSparql ? 'Скрыть SPARQL' : 'Показать / править SPARQL'}
        </button>
        {showSparql && (
          <div className="space-y-2">
            <textarea className={field} rows={12} value={sparql} onChange={(e) => setSparql(e.target.value)} spellCheck={false} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={busy} onClick={() => run()}>
                Выполнить
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
          </div>
        )}
      </section>

      {/* Rich table */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            5. Сводная таблица {ranAt ? <span className="text-sm font-normal text-gray-500">· {ranAt}</span> : null}
          </h2>
          {table.length > 0 && (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => downloadText(`wikidata_temnye_allei_${storySlug}.csv`, csv, 'text/csv;charset=utf-8')}
            >
              Скачать CSV
            </button>
          )}
        </div>
        {table.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-[28rem]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500 text-left sticky top-0">
                <tr>
                  {['story', 'place', 'qid', 'lat', 'lon', 'country', 'type', 'coord_source', 'why'].map((k) => (
                    <th key={k} className="p-2">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={`${r.qid}-${r.story}-${r.place}`} className="border-t border-gray-100 dark:border-gray-800 align-top">
                    <td className="p-2 whitespace-nowrap">{r.story}</td>
                    <td className="p-2 font-semibold">{r.place}</td>
                    <td className="p-2 font-mono text-xs">
                      <a className="underline text-teal-700 dark:text-teal-300" href={`https://www.wikidata.org/wiki/${r.qid}`} target="_blank" rel="noreferrer">
                        {r.qid}
                      </a>
                    </td>
                    <td className="p-2 font-mono text-xs">{r.lat !== '' ? Number(r.lat).toFixed(3) : '—'}</td>
                    <td className="p-2 font-mono text-xs">{r.lon !== '' ? Number(r.lon).toFixed(3) : '—'}</td>
                    <td className="p-2 text-xs">{r.country || '—'}</td>
                    <td className="p-2 text-xs max-w-[8rem]">{r.type || '—'}</td>
                    <td className="p-2 text-xs">{r.coord_source}</td>
                    <td className="p-2 text-xs max-w-[16rem]">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{busy ? 'Ждём ответ Wikidata…' : 'Таблица появится после запроса.'}</p>
        )}

        {presetId === 'bunin-rich' && rows.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
            <p className="font-semibold">Сырой ответ по Бунину ({BUNIN_Q.id})</p>
            <ul className="space-y-1">
              {rows.slice(0, 12).map((r, i) => (
                <li key={i} className="text-xs font-mono break-all">
                  {[r.birth, r.death, r.birthPlaceLabel, r.deathPlaceLabel, r.citizenLabel, r.awardLabel]
                    .filter(Boolean)
                    .join(' · ') || JSON.stringify(r)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              Цикл в Wikidata:{' '}
              <a className="underline" href={`https://www.wikidata.org/wiki/${CYCLE_Q.id}`} target="_blank" rel="noreferrer">
                {CYCLE_Q.id}
              </a>
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-gray-900 p-5 space-y-2 text-sm">
        <h2 className="text-lg font-bold">Как сказать на защите / в курсовой</h2>
        <p>
          «По Wikidata SPARQL для {insight.stories || 'N'} рассказов цикла получены координаты {insight.wd || '…'} мест
          (P625); для регионов без точки использованы явно помеченные центроиды. Карта показывает распределение зон, не
          доказывает поэтику. Интерпретация строится на цитатах; внешний слой — только фактография мест.»
        </p>
        <p>
          Дальше:{' '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/pipeline">
            LLM-конвейер DeepSeek
          </Link>{' '}
          (поле place_mentions) + аудит цитат.
        </p>
      </section>

      <p className="text-xs text-gray-500">
        Тайлы © OpenStreetMap · факты © Wikidata · учебные центроиды — только там, где у сущности нет P625.
      </p>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
      <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}