import { useMemo, useState } from 'react'
import { useLabReport } from '../LabReportContext'
import { downloadText } from '../textUtils'
import {
  BASE_FIELDS,
  CHAT_VS_API,
  FOLDER_TREE,
  FRAGMENTS,
  MOCK_ANSWERS,
  PIPELINE_STEPS,
  PROMPT_MODES,
  PSEUDOCODE,
} from './pipelineCycleData'

const tabBtn = (active) =>
  `px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
    active
      ? 'bg-teal-600 text-white shadow'
      : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'

function Details({ title, children, defaultOpen = false }) {
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-2"
    >
      <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white py-2">{title}</summary>
      <div className="pb-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">{children}</div>
    </details>
  )
}

function quoteInSource(quote, source) {
  if (!quote?.trim() || !source) return false
  const norm = (s) => s.toLowerCase().replace(/[ё]/g, 'е').replace(/\s+/g, ' ').trim()
  return norm(source).includes(norm(quote))
}

function rowsToCsv(rows) {
  const header = 'id,thesis,quotes,confidence,flags,model,prompt,valid,hallucinated'
  const body = rows
    .map((r) =>
      [
        r.id,
        r.thesis ?? '',
        (r.quotes || []).join(' | '),
        r.confidence,
        (r.flags || []).join(';'),
        r.model || '',
        r.prompt || '',
        r.valid ? '1' : '0',
        r.hallucinated ? '1' : '0',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')
  return `${header}\n${body}\n`
}

/* ——— Tab: Chat vs API ——— */
function IdeaTab() {
  const [picked, setPicked] = useState(null)
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-2">
        <p>
          <strong>Зачем филологу API.</strong> Один удачный ответ в чате — ещё не исследование.
          Исследование начинается, когда процедура повторяется на серии фрагментов, а результат
          складывается в проверяемую таблицу.
        </p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          Сайт не тратит ваши ключи: ниже — учебный стенд. Реальный вызов модели — снаружи (Cursor /
          ChatGPT / локальный сервер).
        </p>
      </div>

      <p className="text-sm font-semibold">Сравните два артефакта — какой легче проверить через месяц?</p>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            id: 'chat',
            title: 'Длинный чат',
            body: `Вы: Разбери иронию в этом куске Бунина…
Модель: В данном фрагменте чувствуется…
Вы: А ещё про формулу «всё проходит»?
Модель: Безусловно, здесь также…
…ещё 40 реплик…`,
            verdict: 'Красиво, но несравнимо и плохо воспроизводимо.',
          },
          {
            id: 'table',
            title: 'Таблица CSV',
            body: `id,thesis,quote,confidence,flag
allei_formula,"Формула спорит с памятью","Все проходит, да не все забывается",0.9,irony_risk
allei_calm,,,0.15,no_irony_evidence`,
            verdict: 'Строки сопоставимы; пустая цитата видна сразу.',
          },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setPicked(card.id)}
            className={`text-left rounded-2xl border p-4 transition-all ${
              picked === card.id
                ? 'border-teal-500 ring-2 ring-teal-400/60 bg-teal-50/60 dark:bg-teal-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
              {card.title}
            </div>
            <pre className="mt-3 rounded-xl bg-gray-950 text-gray-100 p-3 text-[11px] whitespace-pre-wrap overflow-x-auto max-h-40">
              {card.body}
            </pre>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{card.verdict}</p>
          </button>
        ))}
      </div>
      {picked && (
        <p className="text-sm rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30 px-4 py-3">
          {picked === 'table'
            ? 'Верно для науки: таблица + лог прогона передаются руководителю. Чат остаётся для пилота промпта.'
            : 'Чат полезен на шаге отладки (2–3 фрагмента). Для серии из 10+ — нужен контракт выхода.'}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {[CHAT_VS_API.chat, CHAT_VS_API.api].map((col) => (
          <div
            key={col.title}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
          >
            <h3 className="font-bold text-lg mb-2">{col.title}</h3>
            <ul className="space-y-2 text-sm">
              {col.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-teal-600 font-bold">·</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Details title="Три слоя, которые новички смешивают" defaultOpen>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Провайдер</strong> — OpenAI, вузовский шлюз, локальная модель.
          </li>
          <li>
            <strong>Протокол</strong> — HTTP, ключ, messages, temperature.
          </li>
          <li>
            <strong>Филологическая спецификация</strong> — фрагмент, поля JSON, аудит. Курс учит
            этому слою в первую очередь.
          </li>
        </ol>
      </Details>
    </div>
  )
}

/* ——— Tab: Pipeline diagram ——— */
function PipelineTab() {
  const [active, setActive] = useState(0)
  const step = PIPELINE_STEPS[active]

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Главный визуальный якорь лекции. Кликните блок — под ним контрольный вопрос филолога.
      </p>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-teal-50/80 via-white to-slate-50 dark:from-teal-950/20 dark:via-gray-900 dark:to-gray-900 p-4 overflow-x-auto">
        <div className="flex flex-wrap items-stretch gap-2 min-w-[720px]">
          {PIPELINE_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-xl border px-3 py-2 w-28 text-left transition-all ${
                  active === i
                    ? 'border-teal-500 bg-teal-600 text-white shadow-lg scale-105'
                    : 'border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 hover:border-teal-400'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase ${active === i ? 'text-teal-100' : 'text-teal-700 dark:text-teal-300'}`}>
                  {i + 1}
                </div>
                <div className="text-sm font-semibold leading-tight">{s.title}</div>
                <div className={`text-[10px] mt-1 ${active === i ? 'text-teal-50' : 'text-gray-500'}`}>
                  {s.short}
                </div>
              </button>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className="text-teal-600 font-bold text-lg" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold">
            {active + 1}. {step.title}
          </h3>
          <span className="text-xs font-mono text-gray-500">{step.id}</span>
        </div>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{step.detail}</p>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm">
          <span className="font-semibold text-amber-900 dark:text-amber-200">Контрольный вопрос: </span>
          {step.control}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={btnSecondary}
            disabled={active === 0}
            onClick={() => setActive((a) => Math.max(0, a - 1))}
          >
            ← Назад
          </button>
          <button
            type="button"
            className="btn-primary !py-2 !px-4 !min-h-0 text-sm"
            disabled={active === PIPELINE_STEPS.length - 1}
            onClick={() => setActive((a) => Math.min(PIPELINE_STEPS.length - 1, a + 1))}
          >
            Дальше →
          </button>
        </div>
      </div>

      <Details title="Базовые поля JSON (учебный стандарт курса)">
        <div className="grid sm:grid-cols-2 gap-2">
          {BASE_FIELDS.map((f) => (
            <div key={f.key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <code className="text-teal-700 dark:text-teal-300 font-bold">{f.key}</code>
              <p className="text-sm mt-1">{f.why}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-2">
          Расширяйте поля только под вопрос. Пустая колонка, которую вы никогда не аудируете, вреднее
          отсутствующей.
        </p>
      </Details>

      <Details title="Структура папок проекта">
        <pre className="rounded-xl bg-gray-950 text-teal-100 p-4 text-xs overflow-x-auto">{FOLDER_TREE}</pre>
        <p className="text-sm">Если raw удалили, а CSV оставили — воспроизводимость убита.</p>
      </Details>
    </div>
  )
}

/* ——— Tab: Mock run ——— */
function RunTab({ onRows }) {
  const [modeId, setModeId] = useState('good')
  const [temperature, setTemperature] = useState(0.2)
  const [modelName, setModelName] = useState('mock-llm-course-v1')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(-1)
  const [liveStage, setLiveStage] = useState('')
  const [rows, setRows] = useState([])
  const [focusId, setFocusId] = useState(FRAGMENTS[0].id)

  const mode = PROMPT_MODES.find((m) => m.id === modeId) || PROMPT_MODES[0]
  const focus = FRAGMENTS.find((f) => f.id === focusId) || FRAGMENTS[0]

  const runPipeline = async () => {
    setRunning(true)
    setRows([])
    setProgress(-1)
    const out = []
    const answers = MOCK_ANSWERS[modeId] || MOCK_ANSWERS.good

    for (let i = 0; i < FRAGMENTS.length; i++) {
      const frag = FRAGMENTS[i]
      setFocusId(frag.id)
      setProgress(i)
      setLiveStage('fragment → prompt')
      await wait(280)
      setLiveStage('model call (учебный mock)')
      await wait(320 + temperature * 200)
      setLiveStage('parse JSON → validate')
      await wait(220)

      const raw = answers[frag.id]
      const row = {
        ...raw,
        model: modelName,
        prompt: modeId === 'good' ? 'irony_v2' : 'find_irony_everywhere_v0',
        temperature,
        source: frag.text,
        title: frag.title,
      }
      // High temperature in demo: occasionally bump confidence noise on good mode
      if (modeId === 'good' && temperature > 0.6 && Math.random() > 0.5) {
        row.confidence = Math.min(0.99, (row.confidence || 0) + 0.12)
        row.flags = [...(row.flags || []), 'high_temp_noise']
      }
      out.push(row)
      setRows([...out])
    }

    setLiveStage('готово: таблица + лог')
    setProgress(FRAGMENTS.length)
    setRunning(false)
    onRows?.(out)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
        Учебный <strong>mock-API</strong>: ответы заранее курированы под фрагменты Бунина. Вы видите
        логику конвейера на экране — без ключей и без отправки текста во внешний сервис.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PROMPT_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={running}
            onClick={() => setModeId(m.id)}
            className={`text-left rounded-xl border p-4 transition-all ${
              modeId === m.id
                ? m.tone === 'rose'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-400'
                  : 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-400'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{m.label}</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  m.tone === 'rose' ? 'bg-rose-200 text-rose-900' : 'bg-teal-200 text-teal-900'
                }`}
              >
                {m.badge}
              </span>
            </div>
            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{m.tip}</p>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm font-semibold">
          Модель (лог)
          <input className={field} value={modelName} onChange={(e) => setModelName(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          temperature: {temperature.toFixed(1)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(+e.target.value)}
            className="mt-3 w-full"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="btn-primary !py-2.5 !px-4 !min-h-0 text-sm w-full"
            disabled={running}
            onClick={runPipeline}
          >
            {running ? 'Идёт прогон…' : '▶ Запустить конвейер'}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-gray-950 text-gray-100 p-4 text-xs font-mono space-y-2">
        <div className="text-teal-300"># system (контракт)</div>
        <div className="whitespace-pre-wrap opacity-90">{mode.system}</div>
        <div className="text-amber-300 pt-2">
          status: {liveStage || 'ожидание'} · fragment {Math.max(progress, 0)}/{FRAGMENTS.length}
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${Math.max(0, (progress / FRAGMENTS.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Фрагменты корпуса (клик)</p>
          <div className="flex flex-wrap gap-2">
            {FRAGMENTS.map((f, i) => {
              const done = rows.some((r) => r.id === f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocusId(f.id)}
                  className={`text-xs rounded-lg border px-2.5 py-1.5 font-medium ${
                    focusId === f.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                      : 'border-gray-200 dark:border-gray-700'
                  } ${done ? 'ring-1 ring-emerald-400' : ''} ${progress === i ? 'animate-pulse' : ''}`}
                >
                  {f.id}
                </button>
              )
            })}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 max-h-64 overflow-y-auto">
            <div className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-2">{focus.title}</div>
            <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap">{focus.text}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Сырой JSON ответа</p>
          <pre className="rounded-xl bg-gray-950 text-emerald-100 p-4 text-[11px] overflow-x-auto min-h-[16rem] whitespace-pre-wrap">
            {rows.find((r) => r.id === focusId)
              ? JSON.stringify(
                  (() => {
                    const r = rows.find((x) => x.id === focusId)
                    return {
                      id: r.id,
                      thesis: r.thesis,
                      quotes: r.quotes,
                      confidence: r.confidence,
                      flags: r.flags,
                    }
                  })(),
                  null,
                  2
                )
              : '// ещё не прогнан — нажмите «Запустить конвейер»'}
          </pre>
          {rows.find((r) => r.id === focusId)?.note && (
            <p className="text-sm text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2">
              {rows.find((r) => r.id === focusId).note}
            </p>
          )}
          {rows.find((r) => r.id === focusId)?.hallucinated && (
            <p className="text-sm font-semibold text-rose-600">⚠ Халлюцинация цитаты — стоп-сигнал аудита.</p>
          )}
        </div>
      </div>

      <Details title="Псевдокод OpenAI-совместимого вызова">
        <pre className="rounded-xl bg-gray-950 text-gray-100 p-4 text-[12px] overflow-x-auto">{PSEUDOCODE}</pre>
      </Details>
    </div>
  )
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ——— Tab: Table ——— */
function TableTab({ rows, setRows }) {
  const emptyQuotes = rows.filter((r) => !(r.quotes || []).join('').trim() && r.thesis).length
  const emptyOk = rows.filter((r) => !(r.quotes || []).join('').trim() && !r.thesis).length
  const halluc = rows.filter((r) => r.hallucinated).length
  const csv = useMemo(() => rowsToCsv(rows), [rows])

  const update = (i, key, val) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)))

  if (!rows.length) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Сначала запустите прогон на вкладке «Прогон» — сюда придёт таблица кандидатов.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Metric
          label="Пустые quotes при thesis"
          value={emptyQuotes}
          warn={emptyQuotes > 0}
          tip="Красный флаг: громкий тезис без опоры"
        />
        <Metric
          label="Честный ноль (null + [])"
          value={emptyOk}
          warn={false}
          tip="Разрешённый отказ модели"
        />
        <Metric label="Халлюцинации цитат" value={halluc} warn={halluc > 0} tip="Цитата не находится в источнике" />
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`rounded-xl border p-3 space-y-2 ${
              r.hallucinated || (!(r.quotes || []).length && r.thesis)
                ? 'border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">{r.id}</span>
              <span className="text-xs text-gray-500">
                conf={(r.confidence ?? 0).toFixed?.(2) ?? r.confidence} · {r.prompt} · {r.model}
              </span>
            </div>
            <input
              className={field}
              value={r.thesis ?? ''}
              placeholder="thesis (пусто = null)"
              onChange={(e) => update(i, 'thesis', e.target.value || null)}
            />
            <input
              className={field}
              value={(r.quotes || []).join(' | ')}
              placeholder="quotes через |"
              onChange={(e) =>
                update(
                  i,
                  'quotes',
                  e.target.value
                    .split('|')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
            <input
              className={field}
              value={(r.flags || []).join(', ')}
              placeholder="flags"
              onChange={(e) =>
                update(
                  i,
                  'flags',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary !py-2 !px-4 !min-h-0 text-sm"
          onClick={() => downloadText('irony_table.csv', csv, 'text/csv;charset=utf-8')}
        >
          Скачать CSV
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() =>
            downloadText(
              'run_log.md',
              [
                '# Лог прогона',
                '',
                `- date: ${new Date().toISOString().slice(0, 10)}`,
                `- model: ${rows[0]?.model || '—'}`,
                `- temperature: ${rows[0]?.temperature ?? '—'}`,
                `- prompt: ${rows[0]?.prompt || '—'}`,
                `- n_fragments: ${rows.length}`,
                `- empty_quotes_with_thesis: ${emptyQuotes}`,
                `- hallucinations: ${halluc}`,
                '',
                '> Смена модели без пометки в таблице — скрытая подмена инструмента.',
              ].join('\n')
            )
          }
        >
          Скачать лог прогона
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value, warn, tip }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn
          ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-700'
          : 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${warn ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'}`}>
        {value}
      </div>
      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{tip}</p>
    </div>
  )
}

/* ——— Tab: Audit ——— */
function AuditTab({ rows }) {
  const [audit, setAudit] = useState({})

  const sample = useMemo(() => {
    if (!rows.length) return []
    const peaks = rows.filter((r) => (r.confidence || 0) >= 0.85)
    const emptyBad = rows.filter((r) => r.thesis && !(r.quotes || []).length)
    const hall = rows.filter((r) => r.hallucinated)
    const rest = rows.filter((r) => !peaks.includes(r) && !emptyBad.includes(r) && !hall.includes(r))
    const random = rest.slice(0, Math.max(1, Math.ceil(rows.length * 0.1)))
    const ids = new Set([...hall, ...emptyBad, ...peaks, ...random].map((r) => r.id))
    return rows.filter((r) => ids.has(r.id))
  }, [rows])

  if (!rows.length) {
    return <p className="text-sm text-gray-600">Сначала получите таблицу на вкладке «Прогон».</p>
  }

  const checked = sample.filter((r) => audit[r.id]).length
  const failed = sample.filter((r) => audit[r.id] === 'fail').length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-2">
        <p>
          <strong>Норма курса:</strong> не интерпретировать график LLM-конвейера без аудита минимум 5–10%
          строк и <em>100% риторически важных пиков</em>.
        </p>
        <p>
          Выборка стенда: все халлюцинации + пустые quotes при thesis + high confidence + ~10%
          случайных. Отметьте pass/fail после сверки цитаты с источником.
        </p>
      </div>

      <p className="text-sm">
        Проверено: <strong>{checked}</strong> / {sample.length}. Браков: <strong className="text-rose-600">{failed}</strong>
      </p>

      <div className="space-y-3">
        {sample.map((r) => {
          const checks = (r.quotes || []).map((q) => ({ q, ok: quoteInSource(q, r.source) }))
          const autoFail = r.hallucinated || checks.some((c) => !c.ok)
          return (
            <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-mono text-sm font-bold">{r.id}</span>
                <span className="text-xs text-gray-500">confidence={r.confidence}</span>
              </div>
              <p className="text-sm">
                <span className="font-semibold">thesis: </span>
                {r.thesis || <em className="text-gray-500">null</em>}
              </p>
              <ul className="space-y-1 text-sm">
                {checks.length === 0 ? (
                  <li className="text-gray-500">quotes: []</li>
                ) : (
                  checks.map((c) => (
                    <li key={c.q} className={c.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}>
                      {c.ok ? '✓ в источнике' : '✗ нет в источнике'}: «{c.q}»
                    </li>
                  ))
                )}
              </ul>
              <details className="text-xs">
                <summary className="cursor-pointer text-teal-700 dark:text-teal-300">Показать источник</summary>
                <p className="mt-2 font-serif whitespace-pre-wrap text-gray-700 dark:text-gray-300">{r.source}</p>
              </details>
              {autoFail && (
                <p className="text-xs text-rose-600 font-semibold">Автоподсказка: строка выглядит бракованной.</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    audit[r.id] === 'pass' ? 'bg-emerald-600 text-white' : btnSecondary
                  }`}
                  onClick={() => setAudit((a) => ({ ...a, [r.id]: 'pass' }))}
                >
                  pass
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    audit[r.id] === 'fail' ? 'bg-rose-600 text-white' : btnSecondary
                  }`}
                  onClick={() => setAudit((a) => ({ ...a, [r.id]: 'fail' }))}
                >
                  fail
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ——— Tab: Design practice ——— */
function DesignTab() {
  const [form, setForm] = useState({
    question: '',
    unit: 'глава',
    extraFields: 'evaluation_span, rebuttal_span',
    honestZero: 'Если столкновения оценки и опровержения нет — thesis=null, quotes=[], flags=[no_irony_evidence]',
    audit: '10% случайных + все пики + все строки с пустыми quotes при thesis',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const md = useMemo(
    () => `# Дизайн LLM-конвейера (Л11)

## Исследовательский вопрос
${form.question || '—'}

## Единица фрагмента
${form.unit}

## JSON-поля
Базовые: id, thesis, quotes, confidence, flags
Дополнительно: ${form.extraFields || '—'}

## Правило честного нуля
${form.honestZero}

## План аудита
${form.audit}

## Формула прозрачности
Автоматически получены кандидаты; подтверждены вручную N из M; интерпретация — только на подтверждённых.
`,
    [form]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Задание к практике: одностраничный дизайн <em>до</em> кода. Без дизайна полей к скрипту не
        приступайте.
      </p>
      {[
        ['question', 'Исследовательский вопрос', 3],
        ['unit', 'Единица фрагмента', 1],
        ['extraFields', '2–3 специальных поля под ваш признак', 1],
        ['honestZero', 'Правило честного нуля', 2],
        ['audit', 'План аудита', 2],
      ].map(([k, label, rows]) => (
        <label key={k} className="block text-sm font-semibold">
          {label}
          <textarea className={rows > 1 ? field : field} rows={rows} value={form[k]} onChange={(e) => set(k, e.target.value)} />
        </label>
      ))}
      <pre className="rounded-xl bg-gray-950 text-gray-100 p-4 text-xs whitespace-pre-wrap">{md}</pre>
      <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => downloadText('pipeline_design.md', md)}>
        Скачать pipeline_design.md
      </button>
    </div>
  )
}

/* ——— Root ——— */
export function PipelineLesson() {
  const [tab, setTab] = useState('idea')
  const [rows, setRows] = useState([])

  useLabReport(
    () => ({
      title: 'Л11 · API и конвейеры LLM',
      body: [
        '## Режим прогона',
        rows[0] ? `prompt=${rows[0].prompt}, model=${rows[0].model}` : 'прогон не выполнен',
        '',
        '## CSV',
        '```csv',
        rows.length ? rowsToCsv(rows).trim() : '—',
        '```',
        '',
        `Пустых quotes при thesis: ${rows.filter((r) => r.thesis && !(r.quotes || []).length).length}`,
        `Халлюцинаций: ${rows.filter((r) => r.hallucinated).length}`,
      ].join('\n'),
    }),
    [rows]
  )

  const tabs = [
    { id: 'idea', label: 'Чат vs API' },
    { id: 'pipe', label: 'Конвейер' },
    { id: 'run', label: 'Прогон' },
    { id: 'table', label: 'Таблица' },
    { id: 'audit', label: 'Аудит' },
    { id: 'design', label: 'Дизайн' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'idea' && <IdeaTab />}
      {tab === 'pipe' && <PipelineTab />}
      {tab === 'run' && <RunTab onRows={setRows} />}
      {tab === 'table' && <TableTab rows={rows} setRows={setRows} />}
      {tab === 'audit' && <AuditTab rows={rows} />}
      {tab === 'design' && <DesignTab />}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
        Punchline Л11: без контракта выхода и аудита LLM-серия — не метод, а размноженный чат. Лучше 12
        проверенных фрагментов, чем 120 непроверенных.
      </div>
    </div>
  )
}

/** Совместимость со старым именем в demos.json */
export function PipelineLab() {
  return <PipelineLesson />
}
