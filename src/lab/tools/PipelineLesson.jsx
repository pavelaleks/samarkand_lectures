import { useEffect, useMemo, useRef, useState } from 'react'
import { useLabReport } from '../LabReportContext'
import { downloadText } from '../textUtils'
import {
  BASE_FIELDS,
  BUNIN_PLACES,
  CHAT_DEMO,
  CHAT_VS_API,
  DARK_ALLEYS,
  DEEPSEEK_DEFAULTS,
  DEFAULT_STORIES,
  HYPOTHESES,
  KEY_STORAGE,
  OPEN_API_LAYERS,
  OPEN_API_STEPS,
  TRIANGLE,
  buildBadSystemPrompt,
  buildPythonScript,
  buildSystemPrompt,
  buildUserPrompt,
  makeExcerpt,
  mockAnswer,
  normalizeStory,
  parseExtraFields,
  parseFlags,
  placesToCsv,
  promptVersion,
  rowsToCsv,
  validateAnswer,
  wordCount,
} from './pipelineCycleData'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/llm-pipeline`
const TEXTS = `${base}demo-downloads/stylometry/sample_texts`

const MIN_STORIES = 3
const MAX_STORIES = 8

const tabBtn = (active) =>
  `px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
    active
      ? 'bg-teal-600 text-white shadow'
      : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2.5 text-sm font-normal'
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
const btnPrimary = 'btn-primary !py-2 !px-4 !min-h-0 text-sm disabled:opacity-50'
const codeBox =
  'rounded-xl bg-gray-950 text-gray-100 p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto'

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

function Caption({ say, doing }) {
  return (
    <div className="rounded-xl border-l-4 border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 px-4 py-3 text-sm space-y-1">
      <p>
        <span className="font-bold text-teal-800 dark:text-teal-200">Скажите вслух: </span>«{say}»
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Что делаем: </span>
        {doing}
      </p>
    </div>
  )
}

function Metric({ label, value, warn, tip }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        warn
          ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-700'
          : 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${warn ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'}`}>
        {value}
      </div>
      {tip && <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{tip}</p>}
    </div>
  )
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const maskKey = (k) => (k ? `${k.slice(0, 3)}…${k.slice(-4)}` : '<нет ключа>')

function describeHttp(status, text) {
  let msg = text
  try {
    msg = JSON.parse(text)?.error?.message || text
  } catch {
    /* plain text */
  }
  if (status === 401) return `401: ключ не принят DeepSeek. Проверьте, что скопирован целиком (sk-…). ${msg}`
  if (status === 402) return `402: на аккаунте DeepSeek закончился баланс. ${msg}`
  if (status === 429) return `429: слишком частые запросы — подождите минуту. ${msg}`
  if (status >= 500) return `${status}: сервер DeepSeek перегружен, повторите позже. ${msg}`
  return `${status}: ${msg}`
}

/* ——— 1. Зачем API ——— */
function WhyTab() {
  const [picked, setPicked] = useState(null)
  const [tri, setTri] = useState({})
  const yes = TRIANGLE.filter((t) => tri[t.id] === true).length
  const answered = TRIANGLE.filter((t) => tri[t.id] !== undefined).length

  return (
    <div className="space-y-5">
      <Caption
        say="Один и тот же вопрос к «Тёмным аллеям». В чате — пять несравнимых эссе. Через API — таблица, где каждую строку можно проверить."
        doing="Сравниваем два артефакта и решаем по треугольнику, нужен ли API вашему исследованию."
      />

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm">
        <span className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Исследовательский вопрос
        </span>
        <p className="mt-1 text-base font-semibold">{CHAT_DEMO.question}</p>
      </div>

      <p className="text-sm font-semibold">Какой результат вы сможете проверить и показать руководителю через месяц?</p>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { id: 'chat', title: 'Чат: 5 рассказов подряд', body: CHAT_DEMO.chat, verdict: 'Убедительно, но несравнимо: критерий дрейфует, цитаты не проверены.' },
          { id: 'csv', title: 'API: та же задача → CSV', body: CHAT_DEMO.csv, verdict: 'Строки сопоставимы; «Кавказ» честно пуст; каждую цитату проверяет Ctrl+F.' },
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
            <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{card.title}</div>
            <pre className={`${codeBox} mt-3 max-h-48`}>{card.body}</pre>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{card.verdict}</p>
          </button>
        ))}
      </div>
      {picked && (
        <p className="text-sm rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30 px-4 py-3">
          {picked === 'csv'
            ? 'Да. API — это не «умнее чата», это та же модель, но с одним шаблоном на все фрагменты и с контрактом выхода. Чат оставляем для пилота промпта на 2–3 фрагментах.'
            : 'Чат хорош на шаге отладки. Но для серии из 5+ фрагментов вопрос «почему здесь да, а там нет?» без таблицы не решить.'}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {[CHAT_VS_API.chat, CHAT_VS_API.api].map((col) => (
          <div key={col.title} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <h3 className="font-bold mb-2">{col.title}</h3>
            <ul className="space-y-1.5 text-sm">
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

      <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-950/20 dark:to-gray-900 p-4 space-y-3">
        <h3 className="font-bold">Треугольник решения: корпус × сложность признака × аудит</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          API оправдан, когда «да» на все три вопроса. Отметьте вместе с аудиторией.
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {TRIANGLE.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{t.title}</div>
              <p className="text-sm font-semibold">{t.q}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t.example}</p>
              <div className="flex gap-2">
                {[
                  [true, 'да'],
                  [false, 'нет'],
                ].map(([v, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTri((s) => ({ ...s, [t.id]: v }))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      tri[t.id] === v
                        ? v
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-gray-700 text-white border-gray-700'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {answered === 3 && (
          <p
            className={`text-sm font-semibold rounded-xl px-4 py-2 ${
              yes === 3
                ? 'bg-teal-600 text-white'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            {yes === 3
              ? 'Все три «да» → строим конвейер. Дальше: гипотеза и контракт JSON.'
              : 'Не все «да» → честнее прочитать самим или подсчитать словарём. API — не обязательный ритуал.'}
          </p>
        )}
      </div>

      <Details title="Три слоя, которые новички смешивают">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Провайдер</strong> — DeepSeek, OpenAI, вузовский шлюз, локальная модель.
          </li>
          <li>
            <strong>Протокол</strong> — HTTP-запрос: адрес, ключ, messages, temperature. У DeepSeek он
            OpenAI-совместимый: тот же код работает с другими провайдерами.
          </li>
          <li>
            <strong>Филологическая спецификация</strong> — фрагмент, поля JSON, честный ноль, аудит. Курс
            учит именно этому слою.
          </li>
        </ol>
      </Details>
    </div>
  )
}

/* ——— 2. Гипотезы ——— */
function HypothesisTab({ hypId, setHypId, spec, updateSpec, resetSpec }) {
  const extra = parseExtraFields(spec.extraFields)
  return (
    <div className="space-y-5">
      <Caption
        say="Мы не спрашиваем модель «что тут интересного». Мы выбираем одну гипотезу и превращаем её в правило с полями таблицы."
        doing="Выбираем сценарий исследования; при необходимости правим вопрос, поля JSON и правило честного нуля."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HYPOTHESES.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHypId(h.id)}
            className={`text-left rounded-2xl border p-4 transition-all ${
              hypId === h.id
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-400/60'
                : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 bg-white dark:bg-gray-900'
            }`}
          >
            <div className="font-bold">{h.title}</div>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{h.short}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{spec.title}</h3>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-500">{promptVersion(spec)}</code>
            {hypId !== 'custom' && (
              <button type="button" className={`${btnSecondary} !py-1 !px-3 text-xs`} onClick={resetSpec}>
                Сбросить к образцу
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm font-semibold">
              Исследовательский вопрос
              <textarea className={field} rows={3} value={spec.question} onChange={(e) => updateSpec('question', e.target.value)} placeholder="Где в цикле…?" />
            </label>
            <label className="block text-sm font-semibold">
              Операционализация (правило, по которому признак засчитывается)
              <textarea
                className={field}
                rows={4}
                value={spec.operationalization}
                onChange={(e) => updateSpec('operationalization', e.target.value)}
                placeholder="Признак засчитывается, только если во фрагменте есть…"
              />
            </label>
            <label className="block text-sm font-semibold">
              Единица фрагмента
              <input className={field} value={spec.unit} onChange={(e) => updateSpec('unit', e.target.value)} />
            </label>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold">
              Специальные поля JSON (по строке: <code>ключ: описание</code>)
              <textarea
                className={`${field} font-mono text-xs`}
                rows={4}
                value={spec.extraFields}
                onChange={(e) => updateSpec('extraFields', e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Разрешённые flags (через запятую)
              <input className={`${field} font-mono text-xs`} value={spec.flags} onChange={(e) => updateSpec('flags', e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Правило честного нуля
              <textarea className={field} rows={3} value={spec.honestZero} onChange={(e) => updateSpec('honestZero', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm">
            <span className="font-semibold text-amber-900 dark:text-amber-200">Почему здесь помогает API: </span>
            {spec.whyApi}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
            <span className="font-semibold">Контракт строки таблицы: </span>
            <span className="font-mono text-xs">
              {[...BASE_FIELDS.map((f) => f.key), ...extra.map((f) => f.key)].join(' · ')}
            </span>
            <div className="text-xs mt-1 text-gray-500">flags: {parseFlags(spec.flags).join(', ') || '—'}</div>
          </div>
        </div>

        <Details title="Какой system-промпт уйдёт в DeepSeek (собирается из формы)">
          <pre className={codeBox}>{buildSystemPrompt(spec)}</pre>
          <p>
            Это и есть «контракт измерения». Его версия (<code>{promptVersion(spec)}</code>) пишется в каждую
            строку таблицы.
          </p>
        </Details>
      </div>
    </div>
  )
}

/* ——— 3. Корпус ——— */
function CorpusTab({ selected, toggleStory, position, setPosition, maxChars, setMaxChars, fragments, loadState }) {
  const [openId, setOpenId] = useState(null)
  const totalWords = fragments.reduce((s, f) => s + wordCount(f.text), 0)
  return (
    <div className="space-y-5">
      <Caption
        say="На лекции берём 5 отрывков по ~2000 знаков: так запрос идёт секунды и стоит копейки. Полные тексты — дома, в ZIP."
        doing={`Отмечаем ${MIN_STORIES}–${MAX_STORIES} рассказов, выбираем начало или финал, смотрим длину фрагментов.`}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((part) => (
          <div key={part} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-2">Часть {part}</div>
            <div className="flex flex-wrap gap-1.5">
              {DARK_ALLEYS.filter((s) => s.part === part).map((s) => {
                const on = selected.includes(s.slug)
                const disabled = !on && selected.length >= MAX_STORIES
                return (
                  <button
                    key={s.slug}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleStory(s.slug)}
                    className={`text-xs rounded-lg border px-2 py-1 ${
                      on
                        ? 'border-teal-500 bg-teal-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-teal-400 disabled:opacity-40'
                    }`}
                  >
                    {s.title}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <div className="text-sm font-semibold">
          Какая часть рассказа
          <div className="mt-1 flex gap-2">
            {[
              ['start', 'Начало'],
              ['end', 'Финал'],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPosition(v)} className={tabBtn(position === v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm font-semibold">
          Длина фрагмента: ~{maxChars} знаков
          <input type="range" min={1000} max={3000} step={250} value={maxChars} onChange={(e) => setMaxChars(+e.target.value)} className="mt-3 w-full" />
        </label>
        <div className="text-sm rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
          Выбрано: <strong>{selected.length}</strong> · слов во фрагментах: <strong>{totalWords}</strong>
          {selected.length < MIN_STORIES && <div className="text-rose-600 text-xs">Нужно минимум {MIN_STORIES}.</div>}
        </div>
      </div>

      <div className="space-y-2">
        {fragments.map((f) => (
          <div key={f.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">«{f.title}»</span>{' '}
                <code className="text-xs text-gray-500">{f.id}</code>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                {loadState[f.slug] === 'loading' && <span>загрузка…</span>}
                {loadState[f.slug] === 'error' && <span className="text-rose-600">не загрузился</span>}
                {f.text && (
                  <span>
                    {wordCount(f.text)} слов · {f.text.length} знаков · из {f.fullWords} слов рассказа
                  </span>
                )}
                <button type="button" className="underline text-teal-700 dark:text-teal-300" onClick={() => setOpenId(openId === f.id ? null : f.id)}>
                  {openId === f.id ? 'свернуть' : 'текст'}
                </button>
              </div>
            </div>
            {openId === f.id ? (
              <p className="mt-2 text-sm font-serif leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">{f.text}</p>
            ) : (
              f.text && <p className="mt-1 text-xs text-gray-500 font-serif line-clamp-2">{f.text.slice(0, 260)}…</p>
            )}
          </div>
        ))}
      </div>

      <Details title="Почему отрывки, а не целые рассказы?">
        <ul className="list-disc pl-5 space-y-1">
          <li>Скорость: 5 запросов по 2000 знаков проходят за 15–40 секунд — можно ждать вживую.</li>
          <li>Аудит: цитату из 2000 знаков студент проверяет глазами за полминуты.</li>
          <li>
            Сопоставимость: все фрагменты одной длины и одной позиции (начало / финал). «Натали» в 7 раз
            длиннее «Тёмных аллей» — целиком их сравнивать некорректно.
          </li>
          <li>Дома скрипт из ZIP берёт полные тексты и режет их на фрагменты так же.</li>
        </ul>
      </Details>
    </div>
  )
}

/* ——— 4. Живой DeepSeek ——— */
const STAGES = [
  { id: 'fragment', label: 'Фрагмент' },
  { id: 'request', label: 'Запрос' },
  { id: 'json', label: 'JSON' },
  { id: 'validate', label: 'Проверка' },
]

function LiveTab({ spec, fragments, cfg, setCfg, apiKey, setApiKey, remember, setRemember, run, onDownloadScript }) {
  const { running, stage, progress, activeId, setActiveId, logs, fatal, startRun, stopRun } = run
  const active = fragments.find((f) => f.id === activeId) || fragments[0]
  const log = active ? logs[active.id] : null
  const canRun = fragments.length >= MIN_STORIES && fragments.every((f) => f.text) && (cfg.mock || apiKey.trim())
  const stageIdx = STAGES.findIndex((s) => s.id === stage)

  return (
    <div className="space-y-5">
      <Caption
        say={
          cfg.mock
            ? 'Сначала покажу логику на учебном mock: те же шаги, но без сети. Потом — настоящий DeepSeek.'
            : 'Сейчас каждый фрагмент уйдёт в DeepSeek отдельным запросом с одним и тем же контрактом. Смотрим, что вернётся.'
        }
        doing="Вставляем ключ, жмём «Прогнать выбранные», по одному фрагменту разбираем запрос → ответ → проверку."
      />

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-1">
        <p className="font-semibold text-amber-900 dark:text-amber-200">Безопасность ключа</p>
        <ul className="list-disc pl-5 space-y-0.5 text-amber-900/90 dark:text-amber-100/90">
          <li>Ключ не уходит на сервер курса: запрос идёт из вашего браузера напрямую в DeepSeek.</li>
          <li>По умолчанию ключ живёт только в памяти страницы; галочка ниже — сохранит его до закрытия вкладки (sessionStorage).</li>
          <li>Не показывайте ключ на проекторе крупно, не публикуйте его и не вставляйте в код. Студентам — файл <code>.env</code>.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tabBtn(cfg.mock)} disabled={running} onClick={() => setCfg({ mock: true })}>
            Учебный mock (без сети)
          </button>
          <button type="button" className={tabBtn(!cfg.mock)} disabled={running} onClick={() => setCfg({ mock: false })}>
            Живой DeepSeek
          </button>
          <span className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
          <button type="button" className={tabBtn(!cfg.bad)} disabled={running} onClick={() => setCfg({ bad: false })}>
            Контракт {promptVersion(spec)}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => setCfg({ bad: true })}
            className={
              cfg.bad
                ? 'px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white shadow'
                : tabBtn(false)
            }
          >
            Наводящий промпт (антипример)
          </button>
        </div>

        {!cfg.mock && (
          <div className="grid md:grid-cols-[2fr_1fr] gap-3 items-end">
            <label className="text-sm font-semibold">
              DeepSeek API key
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                className={`${field} font-mono`}
                placeholder="sk-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
              />
            </label>
            <div className="flex flex-col gap-1 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                запомнить в этой вкладке
              </label>
              <button type="button" className={`${btnSecondary} !py-1`} onClick={() => setApiKey('')}>
                Стереть ключ
              </button>
            </div>
          </div>
        )}

        <Details title={`Параметры запроса: ${cfg.model}, temperature ${cfg.temperature.toFixed(1)}`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-sm font-semibold sm:col-span-2">
              Endpoint
              <input className={`${field} font-mono text-xs`} value={cfg.endpoint} onChange={(e) => setCfg({ endpoint: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Модель
              <input className={`${field} font-mono text-xs`} value={cfg.model} onChange={(e) => setCfg({ model: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              temperature: {cfg.temperature.toFixed(1)}
              <input type="range" min={0} max={1.5} step={0.1} value={cfg.temperature} onChange={(e) => setCfg({ temperature: +e.target.value })} className="mt-3 w-full" />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={cfg.jsonMode} onChange={(e) => setCfg({ jsonMode: e.target.checked })} />
            <span>
              <code>response_format: json_object</code> — DeepSeek гарантирует синтаксически валидный JSON (но не
              правдивость цитат!)
            </span>
          </label>
          <p className="text-xs">
            temperature 0.2 — почти детерминированно: повторный прогон даёт близкие строки. Поднимите до 1.2 и
            прогоните дважды — увидите, как «плывёт» таблица.
          </p>
        </Details>

        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className={btnPrimary} disabled={running || !canRun} onClick={() => startRun(fragments)}>
            {running ? 'Идёт прогон…' : `▶ Прогнать выбранные (${fragments.length})`}
          </button>
          <button type="button" className={btnSecondary} disabled={running || !canRun || !active} onClick={() => startRun([active])}>
            Только «{active?.title}»
          </button>
          {running && (
            <button type="button" className={btnSecondary} onClick={stopRun}>
              ⏹ Стоп
            </button>
          )}
          {!cfg.mock && !apiKey && <span className="text-xs text-rose-600">Вставьте ключ или включите учебный mock.</span>}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    running && i === stageIdx
                      ? 'bg-teal-600 text-white border-teal-600 scale-105 shadow'
                      : running && i < stageIdx
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 text-teal-800 dark:text-teal-200'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}
                >
                  {i + 1}. {s.label}
                </span>
                {i < STAGES.length - 1 && <span className="text-teal-600 font-bold">→</span>}
              </div>
            ))}
            <span className="ml-2 text-xs text-gray-500">
              {progress.done}/{progress.total || fragments.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {fatal && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 dark:bg-rose-950/30 p-4 space-y-3">
          <p className="font-bold text-rose-800 dark:text-rose-200">{fatal.title}</p>
          <p className="text-sm text-rose-900 dark:text-rose-100 whitespace-pre-wrap">{fatal.message}</p>
          {fatal.kind === 'network' && (
            <div className="space-y-2">
              <p className="text-sm">
                Браузер не дал сделать запрос (блок CORS, VPN/прокси, корпоративная сеть или нет интернета). Это не
                ошибка метода: тот же запрос из Python браузерных ограничений не имеет.
              </p>
              <button type="button" className="px-5 py-3 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800" onClick={onDownloadScript}>
                ⬇ Скачать готовый скрипт с этой конфигурацией
              </button>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ключ в скрипт не вписан: задайте <code>DEEPSEEK_API_KEY</code> в окружении или в <code>.env</code>.
                Пока — переключитесь на «Учебный mock», чтобы продолжить лекцию.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {fragments.map((f) => {
          const l = logs[f.id]
          const icon = !l ? '○' : l.status === 'running' ? '…' : l.status === 'error' ? '✗' : l.row?.valid && !l.row?.hallucinated ? '✓' : '⚠'
          const tone =
            !l || l.status === 'running'
              ? ''
              : l.status === 'error' || l.row?.hallucinated || l.row?.parseError
                ? 'text-rose-700 dark:text-rose-300'
                : l.row?.valid
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveId(f.id)}
              className={`text-xs rounded-lg border px-2.5 py-1.5 font-medium ${
                active?.id === f.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-gray-200 dark:border-gray-700'
              } ${l?.status === 'running' ? 'animate-pulse' : ''}`}
            >
              <span className={`font-bold ${tone}`}>{icon}</span> {f.title}
            </button>
          )
        })}
      </div>

      {active && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Запрос → <code className="text-xs">{cfg.mock ? 'mock (локально)' : cfg.endpoint}</code>
            </p>
            <pre className={`${codeBox} max-h-[22rem]`}>
              <span className="text-teal-300"># system — контракт ({promptVersion(spec, cfg.bad)}){'\n'}</span>
              {(cfg.bad ? buildBadSystemPrompt(spec) : buildSystemPrompt(spec)) + '\n\n'}
              <span className="text-amber-300"># user — фрагмент{'\n'}</span>
              {buildUserPrompt(active)}
            </pre>
            {log?.request && (
              <Details title="Сырое тело HTTP-запроса">
                <pre className={`${codeBox} max-h-72`}>
                  {`POST ${cfg.mock ? '(mock)' : cfg.endpoint}\nAuthorization: Bearer ${maskKey(apiKey)}\nContent-Type: application/json\n\n`}
                  {JSON.stringify(
                    {
                      ...log.request,
                      messages: log.request.messages.map((m) => ({ role: m.role, content: `${m.content.slice(0, 160)}… (${m.content.length} знаков)` })),
                    },
                    null,
                    2
                  )}
                </pre>
              </Details>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Ответ модели
              {log?.latency != null && (
                <span className="text-xs font-normal text-gray-500">
                  {' '}
                  · {(log.latency / 1000).toFixed(1)} с{log.usage ? ` · токены: ${log.usage.prompt_tokens}→${log.usage.completion_tokens}` : ''}
                </span>
              )}
            </p>
            <pre className={`${codeBox} text-emerald-100 min-h-[10rem] max-h-[22rem]`}>
              {log?.content ?? (log?.status === 'running' ? '// ждём ответ…' : '// ещё не прогнан')}
            </pre>
            {log?.error && <p className="text-sm text-rose-600 whitespace-pre-wrap">{log.error}</p>}
            {log?.row && <ValidationCard row={log.row} />}
          </div>
        </div>
      )}

      <Details title="Тот же вызов в Python (OpenAI-совместимый клиент)">
        <pre className={codeBox}>{`from openai import OpenAI          # pip install openai
import os

client = OpenAI(api_key=os.environ["DEEPSEEK_API_KEY"],
                base_url="https://api.deepseek.com")

resp = client.chat.completions.create(
    model="${cfg.model}",
    temperature=${cfg.temperature},
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},   # prompts/${spec.id}_v1.md
        {"role": "user",   "content": fragment_prompt},
    ],
)
data = json.loads(resp.choices[0].message.content)`}</pre>
        <button type="button" className={btnSecondary} onClick={onDownloadScript}>
          Скачать pipeline_from_site.py с текущей гипотезой и корпусом
        </button>
      </Details>
    </div>
  )
}

function ValidationCard({ row }) {
  const items = [
    { ok: !row.parseError, label: row.parseError ? 'JSON не разобран' : 'JSON разобран' },
    { ok: !(row.errors || []).some((e) => e.startsWith('нет ключей')), label: 'все обязательные ключи на месте' },
    { ok: !row.emptyWithThesis, label: row.emptyWithThesis ? 'тезис без цитаты — красный флаг' : 'тезис опирается на цитату (или честный ноль)' },
    {
      ok: !row.hallucinated,
      label: row.quoteChecks?.length
        ? `цитаты в источнике: ${row.quoteChecks.filter((c) => c.ok).length}/${row.quoteChecks.length}`
        : 'цитат нет',
    },
  ]
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2 text-sm">
      {row.honestZero && !row.parseError && (
        <p className="rounded-lg bg-teal-50 dark:bg-teal-950/30 px-3 py-1.5 text-teal-800 dark:text-teal-200 text-xs font-semibold">
          Честный ноль: модель сказала «во фрагменте этого нет». Это результат, а не сбой.
        </p>
      )}
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className={it.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}>
            {it.ok ? '✓' : '✗'} {it.label}
          </li>
        ))}
      </ul>
      {(row.quoteChecks || []).map((c) => (
        <p key={c.q} className={`text-xs ${c.ok ? 'text-gray-600 dark:text-gray-400' : 'text-rose-600 font-semibold'}`}>
          {c.ok ? 'найдено' : 'НЕТ в тексте'}: «{c.q}»
        </p>
      ))}
      {(row.errors || []).length > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">{row.errors.join(' · ')}</p>}
    </div>
  )
}

/* ——— 5. Таблица + аудит ——— */
function AuditTab({ rows, runSpec, setAudit, runMeta }) {
  const spec = runSpec
  const extraKeys = spec ? parseExtraFields(spec.extraFields).map((f) => f.key) : []

  const sample = useMemo(() => {
    const must = rows.filter((r) => r.parseError || r.hallucinated || r.emptyWithThesis || (r.confidence ?? 0) >= 0.85)
    const rest = rows.filter((r) => !must.includes(r))
    const nRandom = Math.max(1, Math.ceil(rows.length * 0.1))
    const random = [...rest].sort((a, b) => a.id.localeCompare(b.id)).slice(0, nRandom)
    const ids = new Set([...must, ...random].map((r) => r.id))
    return rows.filter((r) => ids.has(r.id))
  }, [rows])

  if (!rows.length || !spec) {
    return (
      <div className="space-y-3">
        <Caption say="Таблица появится после прогона. Без неё нет и аудита." doing="Вернитесь на вкладку «Живой DeepSeek» и прогоните фрагменты." />
      </div>
    )
  }

  const n = rows.length
  const parsed = rows.filter((r) => !r.parseError).length
  const valid = rows.filter((r) => r.valid).length
  const emptyBad = rows.filter((r) => r.emptyWithThesis).length
  const zero = rows.filter((r) => r.honestZero && !r.parseError).length
  const totalQuotes = rows.reduce((s, r) => s + (r.quoteChecks || []).length, 0)
  const badQuotes = rows.reduce((s, r) => s + (r.quoteChecks || []).filter((c) => !c.ok).length, 0)
  const checked = sample.filter((r) => r.audit).length
  const failed = rows.filter((r) => r.audit === 'fail').length
  const csv = rowsToCsv(rows, spec)

  const runLog = [
    '# Лог прогона Л11',
    '',
    `- date: ${new Date().toISOString()}`,
    `- mode: ${runMeta.mode}`,
    `- model: ${runMeta.model}`,
    `- temperature: ${runMeta.temperature}`,
    `- prompt_version: ${runMeta.prompt}`,
    `- hypothesis: ${spec.title}`,
    `- fragments: ${n} (${runMeta.position === 'end' ? 'финалы' : 'начала'}, ~${runMeta.maxChars} знаков)`,
    `- json_parsed: ${parsed}/${n}`,
    `- valid_contract: ${valid}/${n}`,
    `- empty_quotes_with_thesis: ${emptyBad}`,
    `- honest_zero: ${zero}`,
    `- quotes_not_in_source: ${badQuotes}/${totalQuotes}`,
    `- audited: ${checked}/${sample.length}, fail: ${failed}`,
    '',
    '## System prompt',
    '',
    '```',
    runMeta.system,
    '```',
  ].join('\n')

  return (
    <div className="space-y-5">
      <Caption
        say="Модель дала кандидатов, а не выводы. Сначала смотрим метрики риска, потом сверяем выборку с текстом — и только после этого интерпретируем."
        doing="Читаем метрики, проверяем каждую строку выборки по источнику, ставим pass/fail, скачиваем CSV и лог."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric label="JSON разобран" value={`${parsed}/${n}`} warn={parsed < n} />
        <Metric label="Контракт соблюдён" value={`${valid}/${n}`} warn={valid < n} tip="все ключи, flags, confidence" />
        <Metric label="Тезис без цитаты" value={emptyBad} warn={emptyBad > 0} tip="громкий тезис без опоры" />
        <Metric label="Цитаты не из текста" value={`${badQuotes}/${totalQuotes}`} warn={badQuotes > 0} tip="стоп-сигнал: выдумка" />
        <Metric label="Честный ноль" value={zero} warn={false} tip="разрешённый отказ" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left">
            <tr>
              {['id', 'thesis', 'quotes', 'conf.', 'flags', ...extraKeys, 'проверка', 'аудит'].map((h) => (
                <th key={h} className="px-2 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-gray-100 dark:border-gray-800 align-top ${
                  r.hallucinated || r.parseError || r.emptyWithThesis ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
                }`}
              >
                <td className="px-2 py-2 font-mono font-bold text-teal-700 dark:text-teal-300">{r.id}</td>
                <td className="px-2 py-2 min-w-[12rem]">{r.thesis ?? <em className="text-gray-400">null</em>}</td>
                <td className="px-2 py-2 min-w-[14rem]">
                  {(r.quoteChecks || []).length === 0 ? (
                    <span className="text-gray-400">[]</span>
                  ) : (
                    r.quoteChecks.map((c) => (
                      <div key={c.q} className={c.ok ? '' : 'text-rose-600 font-semibold'}>
                        {c.ok ? '✓' : '✗'} «{c.q}»
                      </div>
                    ))
                  )}
                </td>
                <td className="px-2 py-2">{r.confidence ?? '—'}</td>
                <td className="px-2 py-2 font-mono">{(r.flags || []).join(', ')}</td>
                {extraKeys.map((k) => (
                  <td key={k} className="px-2 py-2">
                    {Array.isArray(r.extra?.[k]) ? r.extra[k].join(', ') : r.extra?.[k] == null ? <em className="text-gray-400">null</em> : String(r.extra[k])}
                  </td>
                ))}
                <td className="px-2 py-2">
                  {r.parseError ? 'битый JSON' : r.valid ? 'ok' : (r.errors || []).join('; ')}
                </td>
                <td className="px-2 py-2 font-semibold">{r.audit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
        <strong>Норма курса:</strong> не интерпретировать таблицу без аудита минимум 5–10% строк случайно и{' '}
        <em>100% пиков</em> (высокий confidence, пустые цитаты при тезисе, цитаты не из текста). Выборка ниже
        собрана по этому правилу. Проверено: <strong>{checked}</strong>/{sample.length}, брак:{' '}
        <strong className="text-rose-600">{failed}</strong>.
      </div>

      <div className="space-y-3">
        {sample.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">
                «{r.title}» <code className="text-xs text-gray-500">{r.id}</code>
              </span>
              <span className="text-xs text-gray-500">
                confidence={r.confidence ?? '—'}
                {r.hallucinated && ' · цитата не найдена'}
                {r.emptyWithThesis && ' · тезис без цитаты'}
              </span>
            </div>
            <p className="text-sm">
              <span className="font-semibold">thesis: </span>
              {r.thesis || <em className="text-gray-500">null</em>}
            </p>
            {(r.quoteChecks || []).map((c) => (
              <p key={c.q} className={`text-sm ${c.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>
                {c.ok ? '✓ в источнике' : '✗ нет в источнике'}: «{c.q}»
              </p>
            ))}
            <details className="text-xs">
              <summary className="cursor-pointer text-teal-700 dark:text-teal-300">Открыть источник</summary>
              <p className="mt-2 font-serif whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto">{r.source}</p>
            </details>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Вопрос аудитору: цитата дословна? тезис следует из цитаты? соблюдено правило операционализации?
            </p>
            <div className="flex gap-2">
              {['pass', 'fail'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    r.audit === v ? (v === 'pass' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : btnSecondary
                  }`}
                  onClick={() => setAudit(r.id, v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => downloadText(`results_${spec.id}.csv`, csv, 'text/csv;charset=utf-8')}>
          Скачать CSV
        </button>
        <button type="button" className={btnSecondary} onClick={() => downloadText('run_log.md', runLog)}>
          Скачать лог прогона
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() =>
            downloadText(
              'raw_responses.jsonl',
              rows.map((r) => JSON.stringify({ id: r.id, content: r.rawContent })).join('\n') + '\n',
              'application/json'
            )
          }
        >
          Сырые ответы (JSONL)
        </button>
      </div>

      <Details title="Формула прозрачности для статьи / курсовой">
        <p>
          «С помощью {runMeta.model} (temperature {runMeta.temperature}, промпт {runMeta.prompt}) получено {n} строк-кандидатов;
          {badQuotes} цитат не найдено в источнике; вручную проверено {checked} строк, отклонено {failed}. Интерпретация
          строится только на подтверждённых строках.»
        </p>
      </Details>
    </div>
  )
}

/* ——— 6. Другие API (геоданные и открытые сервисы) ——— */

async function geocodePhoton(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3&lang=en`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`)
  const data = await res.json()
  const feat = data?.features?.[0]
  if (!feat) return null
  const [lon, lat] = feat.geometry?.coordinates || []
  const p = feat.properties || {}
  const display = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ')
  return {
    lat,
    lon,
    display_name: display || query,
    osm_link: Number.isFinite(lat) && Number.isFinite(lon) ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=6/${lat}/${lon}` : '',
    raw: feat,
  }
}

async function wikidataPlace(label) {
  const sparql = `SELECT ?item ?itemLabel ?coord ?countryLabel WHERE {
  ?item rdfs:label "${label.replace(/"/g, '')}"@en.
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P17 ?country. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
} LIMIT 3`
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`
  const res = await fetch(url, { headers: { Accept: 'application/sparql-results+json' } })
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`)
  const data = await res.json()
  return (data?.results?.bindings || []).map((b) => ({
    id: b.item?.value,
    label: b.itemLabel?.value,
    coord: b.coord?.value,
    country: b.countryLabel?.value,
  }))
}

async function openLibraryBunin() {
  const url =
    'https://openlibrary.org/search.json?q=Bunin+Dark+Alleys&title=Dark+Alleys&author=Bunin&limit=5'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Library HTTP ${res.status}`)
  const data = await res.json()
  return (data?.docs || []).slice(0, 5).map((d) => ({
    title: d.title,
    year: d.first_publish_year,
    lang: (d.language || []).slice(0, 3).join(', '),
    editions: d.edition_count,
    key: d.key,
  }))
}

function GeoMap({ points }) {
  const pts = points.filter((p) => Number.isFinite(+p.lat) && Number.isFinite(+p.lon))
  if (!pts.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-sm text-gray-500 text-center">
        После геокодирования здесь появится схематическая карта точек цикла.
      </div>
    )
  }
  // Simple equirectangular scatter (Europe-focused crop)
  const lon0 = -10
  const lon1 = 60
  const lat0 = 25
  const lat1 = 65
  const W = 560
  const H = 280
  const xy = (lat, lon) => {
    const x = ((lon - lon0) / (lon1 - lon0)) * W
    const y = ((lat1 - lat) / (lat1 - lat0)) * H
    return [Math.max(8, Math.min(W - 8, x)), Math.max(8, Math.min(H - 8, y))]
  }
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/40 p-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto" role="img" aria-label="Карта топонимов">
        <rect width={W} height={H} fill="transparent" />
        <text x={12} y={20} className="fill-gray-400" fontSize="11">
          схематично: Европа / зап. Азия (не точная проекция)
        </text>
        {pts.map((p) => {
          const [x, y] = xy(+p.lat, +p.lon)
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r={7} fill="#0d9488" opacity={0.9} />
              <text x={x + 10} y={y + 4} fontSize="11" className="fill-gray-800 dark:fill-gray-100">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="text-[11px] text-gray-500 mt-1">Клик по строке таблицы ниже откроет точку в OpenStreetMap.</p>
    </div>
  )
}

function OpenApisTab() {
  const [step, setStep] = useState(1)
  const [layerId, setLayerId] = useState('geo')
  const [picked, setPicked] = useState(() => new Set(BUNIN_PLACES.slice(0, 5).map((p) => p.id)))
  const [customQuery, setCustomQuery] = useState('')
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [wiki, setWiki] = useState(null)
  const [lib, setLib] = useState(null)
  const [err, setErr] = useState('')

  const layer = OPEN_API_LAYERS.find((l) => l.id === layerId) || OPEN_API_LAYERS[0]
  const selectedPlaces = BUNIN_PLACES.filter((p) => picked.has(p.id))

  const togglePlace = (id) =>
    setPicked((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const runGeocode = async () => {
    setBusy(true)
    setErr('')
    setLog('Геокодирование…')
    const out = []
    const list = [...selectedPlaces]
    if (customQuery.trim()) {
      list.push({
        id: 'custom',
        label: customQuery.trim(),
        query: customQuery.trim(),
        story: 'свой запрос',
        tip: '',
      })
    }
    try {
      for (const place of list) {
        setLog(`→ ${place.label} (${place.query})`)
        const hit = await geocodePhoton(place.query)
        await new Promise((r) => setTimeout(r, 350)) // вежливо к Photon
        if (!hit) {
          out.push({
            ...place,
            lat: '',
            lon: '',
            display_name: 'не найдено',
            osm_link: '',
            source_api: 'photon',
          })
        } else {
          out.push({ ...place, ...hit, source_api: 'photon' })
        }
        setRows([...out])
      }
      setLog(`Готово: ${out.length} мест. Скачайте places.csv или откройте OSM.`)
      setStep(5)
    } catch (e) {
      setErr(
        `${e.message || e}. Если сеть блокирует Photon — скачайте geocode_places.py из ZIP и запустите в PyCharm.`
      )
      setLog('')
    } finally {
      setBusy(false)
    }
  }

  const runWiki = async () => {
    setBusy(true)
    setErr('')
    setWiki(null)
    try {
      const label = selectedPlaces[0]?.query.split(' ')[0] || 'Paris'
      setLog(`Wikidata SPARQL: label=${label}`)
      const rowsW = await wikidataPlace(label === 'Caucasus' ? 'Caucasus' : label)
      setWiki({ label, rows: rowsW })
      setLog(`Wikidata: ${rowsW.length} строк`)
    } catch (e) {
      setErr(`${e.message || e}. Wikidata иногда режет браузерные запросы — тогда скрипт wikidata_place.py.`)
    } finally {
      setBusy(false)
    }
  }

  const runLib = async () => {
    setBusy(true)
    setErr('')
    setLib(null)
    try {
      setLog('Open Library: Bunin / Dark Alleys…')
      const docs = await openLibraryBunin()
      setLib(docs)
      setLog(`Open Library: ${docs.length} изданий`)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Caption
        say="DeepSeek — не единственный API. Для «Тёмных аллей» полезны открытые сервисы без ключа: геокодер, Wikidata, каталог изданий."
        doing="Идём по шагам 1→5: слой → места → живой вызов → таблица → стыковка с LLM."
      />

      <div className="flex flex-wrap gap-2">
        {OPEN_API_STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
              step === s.n
                ? 'bg-teal-600 text-white border-teal-600'
                : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
            }`}
          >
            {s.n}. {s.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm">
        <strong>Шаг {step}:</strong> {OPEN_API_STEPS[step - 1]?.say}
      </div>

      {(step === 1 || step === 2) && (
        <div className="grid md:grid-cols-3 gap-3">
          {OPEN_API_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setLayerId(l.id)
                setStep(2)
              }}
              className={`text-left rounded-2xl border p-4 transition-all ${
                layerId === l.id
                  ? 'border-teal-500 ring-2 ring-teal-400/50 bg-teal-50/60 dark:bg-teal-950/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{l.title}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {l.key ? 'нужен ключ' : 'без ключа'}
                </span>
              </div>
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{l.why}</p>
              <p className="text-xs mt-2 text-gray-500">
                <span className="font-semibold">Применение: </span>
                {l.apply}
              </p>
              <code className="block mt-2 text-[10px] text-teal-700 dark:text-teal-300 break-all">{l.endpoint}</code>
            </button>
          ))}
        </div>
      )}

      {step >= 3 && layerId === 'geo' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">Шаг 3. Отметьте топонимы цикла (кураторский список)</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {BUNIN_PLACES.map((p) => (
              <label
                key={p.id}
                className={`flex gap-3 rounded-xl border p-3 cursor-pointer text-sm ${
                  picked.has(p.id) ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePlace(p.id)} className="mt-1" />
                <span>
                  <span className="font-semibold">{p.label}</span>
                  <span className="block text-xs text-gray-500">{p.story}</span>
                  <span className="block text-xs mt-1 text-gray-600 dark:text-gray-400">{p.tip}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="block text-sm font-semibold">
            Свой запрос (опционально)
            <input className={field} value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} placeholder="например: Nice France" />
          </label>
        </div>
      )}

      {step >= 4 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Шаг 4. Живой вызов выбранного слоя</p>
          <div className="flex flex-wrap gap-2">
            {layerId === 'geo' && (
              <button type="button" className={btnPrimary} disabled={busy || selectedPlaces.length === 0} onClick={runGeocode}>
                {busy ? 'Геокодируем…' : `▶ Геокодировать ${selectedPlaces.length + (customQuery.trim() ? 1 : 0)} мест (Photon)`}
              </button>
            )}
            {layerId === 'wikidata' && (
              <button type="button" className={btnPrimary} disabled={busy} onClick={runWiki}>
                {busy ? 'Запрос…' : '▶ Wikidata SPARQL (первое выбранное место)'}
              </button>
            )}
            {layerId === 'openlibrary' && (
              <button type="button" className={btnPrimary} disabled={busy} onClick={runLib}>
                {busy ? 'Запрос…' : '▶ Open Library: издания Bunin / Dark Alleys'}
              </button>
            )}
            <button type="button" className={btnSecondary} onClick={() => setStep(Math.min(5, step + 1))}>
              Дальше →
            </button>
          </div>
          {log && <p className="text-xs font-mono text-teal-700 dark:text-teal-300">{log}</p>}
          {err && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
              {err}
            </div>
          )}
          <Details title={`Что уходит в сеть (${layer.title})`} defaultOpen>
            {layerId === 'geo' && (
              <pre className={codeBox}>{`GET ${layer.endpoint}?q=<query>&limit=3&lang=en
# без ключа; пауза ~0.3 с между запросами
# User-Agent задаёт браузер; в скрипте PyCharm укажите свой контакт`}</pre>
            )}
            {layerId === 'wikidata' && (
              <pre className={codeBox}>{`GET ${layer.endpoint}?format=json&query=
SELECT ?item ?itemLabel ?coord WHERE { … }`}</pre>
            )}
            {layerId === 'openlibrary' && (
              <pre className={codeBox}>{`GET ${layer.endpoint}?q=Bunin+Dark+Alleys&limit=5`}</pre>
            )}
          </Details>
        </div>
      )}

      {layerId === 'geo' && (
        <>
          <GeoMap points={rows} />
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="p-2">Место</th>
                    <th className="p-2">Рассказ</th>
                    <th className="p-2">lat</th>
                    <th className="p-2">lon</th>
                    <th className="p-2">Ответ API</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="p-2 font-semibold">
                        {r.osm_link ? (
                          <a className="underline text-teal-700 dark:text-teal-300" href={r.osm_link} target="_blank" rel="noreferrer">
                            {r.label}
                          </a>
                        ) : (
                          r.label
                        )}
                      </td>
                      <td className="p-2 text-xs">{r.story}</td>
                      <td className="p-2 font-mono text-xs">{r.lat !== '' ? Number(r.lat).toFixed(3) : '—'}</td>
                      <td className="p-2 font-mono text-xs">{r.lon !== '' ? Number(r.lon).toFixed(3) : '—'}</td>
                      <td className="p-2 text-xs">{r.display_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > 0 && (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => downloadText('places_temnye_allei.csv', placesToCsv(rows), 'text/csv;charset=utf-8')}
            >
              Скачать places.csv
            </button>
          )}
        </>
      )}

      {wiki && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
          <p className="font-semibold">Wikidata · «{wiki.label}»</p>
          {wiki.rows.length === 0 ? (
            <p className="text-gray-500">Пусто — уточните английский label или откройте сущность вручную на wikidata.org.</p>
          ) : (
            <ul className="space-y-2">
              {wiki.rows.map((r) => (
                <li key={r.id} className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2">
                  <a className="underline font-medium" href={r.id} target="_blank" rel="noreferrer">
                    {r.label || r.id}
                  </a>
                  {r.country && <span className="text-xs text-gray-500 ml-2">{r.country}</span>}
                  {r.coord && <div className="font-mono text-xs mt-1">{r.coord}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lib && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
          <p className="font-semibold">Open Library · издания</p>
          <ul className="space-y-2">
            {lib.map((d) => (
              <li key={d.key} className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2">
                <a className="underline font-medium" href={`https://openlibrary.org${d.key}`} target="_blank" rel="noreferrer">
                  {d.title}
                </a>
                <span className="text-xs text-gray-500 ml-2">
                  {d.year || '?'} · изд. {d.editions || '?'} · {d.lang || '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 5 && (
        <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-4 space-y-3 text-sm">
          <h3 className="font-bold text-lg">Шаг 5. Как стыковать с DeepSeek-конвейером</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              В гипотезе «Топосы» (вкладка Гипотезы) добавьте поле <code>place_mentions</code> — кандидаты мест из фрагмента.
            </li>
            <li>
              После LLM-прогона прогоните те же имена через геокодер → <code>places.csv</code> (этот стенд или{' '}
              <code>geocode_places.py</code>).
            </li>
            <li>
              Аудит двух таблиц: цитата есть в тексте? координата соответствует смыслу (Кавказ ≠ Сочи автоматически)?
            </li>
            <li>
              В выводе пишите: «карта показывает распределение кандидатов; поэтика места — после close reading пиков».
            </li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <a className="underline text-teal-800 dark:text-teal-300" href={`${DL}/geocode_places.py`} target="_blank" rel="noreferrer">
              geocode_places.py
            </a>
            <a className="underline text-teal-800 dark:text-teal-300" href={`${DL}/wikidata_place.py`} target="_blank" rel="noreferrer">
              wikidata_place.py
            </a>
            <a className="underline text-teal-800 dark:text-teal-300" href={`${DL}/SETUP.md`} target="_blank" rel="noreferrer">
              SETUP.md
            </a>
          </div>
        </div>
      )}

      <Details title="Правила вежливости к открытым API">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Пауза между запросами; не долбите сервис циклом по 37 рассказам без кэша.</li>
          <li>В скриптах укажите понятный User-Agent с контактом (требование OSM/Nominatim-политики).</li>
          <li>Кэшируйте ответы в <code>output/raw/geo/</code> — повторный прогон не должен жечь квоту.</li>
          <li>Геокодер ошибается на омонимах (Галиция, Иудея). Это норма: фиксируйте ambiguity в flags.</li>
        </ul>
      </Details>
    </div>
  )
}

/* ——— 7. Домой ——— */
const HOME_STEPS = [
  'Скачать ZIP и распаковать в папку латиницей, например Documents/llm_bunin',
  'PyCharm → Open → папка → создать Virtualenv (Python 3.10+)',
  'Terminal: python -m pip install -r requirements.txt',
  'Скопировать .env.example → .env и вставить свой ключ DeepSeek (файл не коммитить!)',
  'Открыть prompts/ и выбрать гипотезу (или написать свою с CLAUDE_PROMPT_PACK.md)',
  'Run run_pipeline.py → output/tables/results.csv',
  'Опционально: python geocode_places.py → output/tables/places.csv (открытый геокодер, без ключа)',
  'Аудит: 10% случайных строк + все пики, протокол — в notes/audit.md',
  'Сдать: CSV + лог + протокол аудита + одна страница выводов',
]

function HomeTab({ spec, onDownloadScript, designMd }) {
  const [done, setDone] = useState({})
  return (
    <div className="space-y-5">
      <Caption
        say="Дома то же самое, но на всём цикле: скрипт в PyCharm и Claude как помощник по дизайну полей и коду — не как источник цитат."
        doing="Показываем ZIP, prompt pack для Claude и чеклист сдачи."
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-950/30 p-4 sm:p-5 space-y-3">
          <h3 className="text-lg font-bold">① PyCharm: готовый проект</h3>
          <p className="text-sm">
            <code>run_pipeline.py</code> (DeepSeek) + <code>geocode_places.py</code> / <code>wikidata_place.py</code>{' '}
            (открытые API без ключа) + промпты + 8 рассказов + <code>.env.example</code>. Таблицы — в{' '}
            <code>output/tables/</code>, сырые ответы — в <code>output/raw/</code>.
          </p>
          <a className="inline-flex px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800" href={`${DL}/scripts_llm_pipeline_bunin.zip`} download>
            Скачать scripts_llm_pipeline_bunin.zip
          </a>
          <div className="text-xs space-x-3">
            <a className="underline" href={`${DL}/README.txt`} target="_blank" rel="noreferrer">README</a>
            <a className="underline" href={`${DL}/SETUP.md`} target="_blank" rel="noreferrer">SETUP.md</a>
            <a className="underline" href={`${DL}/run_pipeline.py`} target="_blank" rel="noreferrer">run_pipeline.py</a>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-3">
          <h3 className="text-lg font-bold">② Claude / Cursor: prompt pack</h3>
          <p className="text-sm">
            Готовые промпты: спроектировать поля JSON, адаптировать <code>run_pipeline.py</code>, провести аудит, написать
            формулу прозрачности. И список того, что Claude поручать <strong>нельзя</strong>.
          </p>
          <a className="inline-flex px-4 py-2.5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900" href={`${DL}/CLAUDE_PROMPT_PACK.md`} download>
            Скачать CLAUDE_PROMPT_PACK.md
          </a>
          <p className="text-xs text-gray-500">Для Claude Projects: загрузите pack + ваш pipeline_design.md как Project knowledge.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} onClick={() => downloadText('pipeline_design.md', designMd)}>
          pipeline_design.md по гипотезе «{spec.title}»
        </button>
        <button type="button" className={btnSecondary} onClick={onDownloadScript}>
          pipeline_from_site.py (конфигурация со стенда, без pip)
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="font-bold">Чеклист студента</h3>
        {HOME_STEPS.map((s, i) => (
          <label key={s} className="flex gap-3 items-start text-sm cursor-pointer">
            <input type="checkbox" className="mt-1" checked={!!done[i]} onChange={(e) => setDone((d) => ({ ...d, [i]: e.target.checked }))} />
            <span className={done[i] ? 'line-through text-gray-400' : ''}>
              <strong>{i + 1}.</strong> {s}
            </span>
          </label>
        ))}
        <p className="text-xs text-gray-500">
          Выполнено {Object.values(done).filter(Boolean).length}/{HOME_STEPS.length}
        </p>
      </div>

      <Details title="Сколько это стоит и где взять ключ">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Ключ: <a className="underline" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">platform.deepseek.com → API keys</a>{' '}
            (нужно пополнить баланс на несколько долларов).
          </li>
          <li>Один фрагмент ~2000 знаков ≈ 1,5–2 тыс. токенов на вход и 200–400 на выход: весь корпус (37 рассказов × 2 фрагмента) — центы.</li>
          <li>Если DeepSeek недоступен: тот же код работает с любым OpenAI-совместимым API — меняются только BASE_URL и модель.</li>
        </ul>
      </Details>
    </div>
  )
}

/* ——— Root ——— */
function initialSpecs() {
  return Object.fromEntries(HYPOTHESES.map((h) => [h.id, { ...h }]))
}

function readStoredKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function PipelineLesson() {
  const [tab, setTab] = useState('why')
  const [hypId, setHypId] = useState('irony')
  const [specs, setSpecs] = useState(initialSpecs)
  const spec = specs[hypId]

  const [selected, setSelected] = useState(DEFAULT_STORIES)
  const [position, setPosition] = useState('start')
  const [maxChars, setMaxChars] = useState(2000)
  const [texts, setTexts] = useState({})
  const [loadState, setLoadState] = useState({})

  const [cfg, setCfgState] = useState({
    endpoint: DEEPSEEK_DEFAULTS.endpoint,
    model: DEEPSEEK_DEFAULTS.model,
    temperature: DEEPSEEK_DEFAULTS.temperature,
    jsonMode: true,
    mock: true,
    bad: false,
  })
  const setCfg = (patch) => setCfgState((c) => ({ ...c, ...patch }))

  const [apiKey, setApiKey] = useState(readStoredKey)
  const [remember, setRemember] = useState(() => Boolean(readStoredKey()))

  const [rows, setRows] = useState([])
  const [runSpec, setRunSpec] = useState(null)
  const [runMeta, setRunMeta] = useState({})
  const [logs, setLogs] = useState({})
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState('')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [activeId, setActiveId] = useState(DEFAULT_STORIES[0])
  const [fatal, setFatal] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    try {
      if (remember && apiKey) sessionStorage.setItem(KEY_STORAGE, apiKey)
      else sessionStorage.removeItem(KEY_STORAGE)
    } catch {
      /* private mode */
    }
  }, [apiKey, remember])

  useEffect(() => {
    selected.forEach((slug) => {
      if (texts[slug] || loadState[slug] === 'loading') return
      setLoadState((s) => ({ ...s, [slug]: 'loading' }))
      fetch(`${TEXTS}/${slug}.txt`)
        .then((r) => {
          if (!r.ok) throw new Error(r.status)
          return r.text()
        })
        .then((raw) => {
          setTexts((t) => ({ ...t, [slug]: normalizeStory(raw) }))
          setLoadState((s) => ({ ...s, [slug]: 'ok' }))
        })
        .catch(() => setLoadState((s) => ({ ...s, [slug]: 'error' })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const fragments = useMemo(
    () =>
      selected.map((slug, index) => {
        const meta = DARK_ALLEYS.find((s) => s.slug === slug)
        const full = texts[slug] || ''
        return {
          id: slug,
          slug,
          index,
          title: meta?.title || slug,
          position,
          text: full ? makeExcerpt(full, maxChars, position) : '',
          fullWords: wordCount(full),
        }
      }),
    [selected, texts, position, maxChars]
  )

  const toggleStory = (slug) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length >= MAX_STORIES ? s : [...s, slug]))

  const updateSpec = (key, value) => setSpecs((s) => ({ ...s, [hypId]: { ...s[hypId], [key]: value } }))
  const resetSpec = () => setSpecs((s) => ({ ...s, [hypId]: { ...HYPOTHESES.find((h) => h.id === hypId) } }))

  const scriptConfig = () => ({
    spec,
    stories: fragments.map((f) => ({ slug: f.slug, title: f.title })),
    position,
    maxChars,
    endpoint: cfg.endpoint,
    model: cfg.model,
    temperature: cfg.temperature,
    bad: cfg.bad,
  })
  const downloadScript = () => downloadText('pipeline_from_site.py', buildPythonScript(scriptConfig()), 'text/x-python;charset=utf-8')

  const patchLog = (id, patch) => setLogs((l) => ({ ...l, [id]: { ...(l[id] || {}), ...patch } }))

  const startRun = async (list) => {
    const controller = new AbortController()
    abortRef.current = controller
    const frozen = { ...spec }
    const system = cfg.bad ? buildBadSystemPrompt(frozen) : buildSystemPrompt(frozen)
    const prompt = promptVersion(frozen, cfg.bad)
    const model = cfg.mock ? 'mock-course-v1' : cfg.model
    const single = list.length === 1 && rows.length > 0 && runSpec?.id === frozen.id
    setRunning(true)
    setFatal(null)
    setProgress({ done: 0, total: list.length })
    if (!single) {
      setRows([])
      setLogs({})
    }
    setRunSpec(frozen)
    setRunMeta({ mode: cfg.mock ? 'mock' : 'deepseek', model, temperature: cfg.temperature, prompt, system, position, maxChars })

    for (let i = 0; i < list.length; i++) {
      if (controller.signal.aborted) break
      const frag = list[i]
      setActiveId(frag.id)
      setStage('fragment')
      patchLog(frag.id, { status: 'running', content: null, error: null, row: null, latency: null, usage: null })
      await wait(cfg.mock ? 350 : 150)

      const body = {
        model: cfg.model,
        temperature: cfg.temperature,
        max_tokens: DEEPSEEK_DEFAULTS.maxTokens,
        ...(cfg.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: buildUserPrompt(frag) },
        ],
      }
      setStage('request')
      patchLog(frag.id, { request: body })
      const t0 = performance.now()
      let content = ''
      let usage = null
      let respModel = model
      try {
        if (cfg.mock) {
          await wait(600 + Math.random() * 500)
          content = mockAnswer(frag, frozen, cfg.bad)
        } else {
          let res
          try {
            res = await fetch(cfg.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify(body),
              signal: controller.signal,
            })
          } catch (e) {
            if (e.name === 'AbortError') throw e
            const err = new Error(
              `Запрос к ${cfg.endpoint} не дошёл (${e.message}). Проверьте интернет/VPN и адрес endpoint.`
            )
            err.kind = 'network'
            throw err
          }
          const txt = await res.text()
          if (!res.ok) {
            const err = new Error(describeHttp(res.status, txt))
            err.kind = 'http'
            err.status = res.status
            throw err
          }
          const data = JSON.parse(txt)
          content = data?.choices?.[0]?.message?.content ?? ''
          usage = data?.usage || null
          respModel = data?.model || cfg.model
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          patchLog(frag.id, { status: 'error', error: 'Остановлено' })
          break
        }
        patchLog(frag.id, { status: 'error', error: e.message })
        if (e.kind === 'network' || [401, 402].includes(e.status)) {
          setFatal({
            kind: e.kind,
            title: e.kind === 'network' ? 'Браузер не смог связаться с DeepSeek' : 'DeepSeek отклонил запрос — прогон остановлен',
            message: e.message,
          })
          break
        }
        setProgress({ done: i + 1, total: list.length })
        continue
      }
      const latency = performance.now() - t0

      setStage('json')
      patchLog(frag.id, { content, latency, usage })
      await wait(cfg.mock ? 300 : 150)

      setStage('validate')
      const checked = validateAnswer(content, frag, frozen)
      const row = {
        ...checked,
        title: frag.title,
        position: frag.position,
        source: frag.text,
        rawContent: content,
        model: respModel,
        prompt,
        temperature: cfg.temperature,
        mode: cfg.mock ? 'mock' : 'deepseek',
        audit: '',
      }
      patchLog(frag.id, { status: 'done', row })
      setRows((rs) => [...rs.filter((r) => r.id !== row.id), row].sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id)))
      setProgress({ done: i + 1, total: list.length })
      await wait(cfg.mock ? 250 : 100)
    }
    setStage('')
    setRunning(false)
  }

  const stopRun = () => abortRef.current?.abort()
  const setAudit = (id, v) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, audit: v } : r)))

  const designMd = useMemo(
    () => `# Дизайн LLM-конвейера (Л11) · «Тёмные аллеи»

## Гипотеза
${spec.title}

## Исследовательский вопрос
${spec.question || '—'}

## Операционализация
${spec.operationalization || '—'}

## Единица фрагмента
${spec.unit}

## JSON-поля
Базовые: ${BASE_FIELDS.map((f) => f.key).join(', ')}
${parseExtraFields(spec.extraFields)
  .map((f) => `- ${f.key}: ${f.desc}`)
  .join('\n')}

## Разрешённые flags
${parseFlags(spec.flags).join(', ')}

## Правило честного нуля
${spec.honestZero}

## Корпус
${fragments.map((f) => `- ${f.slug} — «${f.title}»`).join('\n')}
Позиция: ${position === 'end' ? 'финал' : 'начало'}, ~${maxChars} знаков

## План аудита
10% случайных строк + все строки с confidence ≥ 0.85, пустыми quotes при thesis и цитатами не из текста.

## Формула прозрачности
Автоматически получено N кандидатов; подтверждено вручную K из M; интерпретация — только на подтверждённых.
`,
    [spec, fragments, position, maxChars]
  )

  useLabReport(
    () => ({
      title: 'Л11 · API и LLM-конвейер · «Тёмные аллеи»',
      body: [
        `## Гипотеза: ${spec.title}`,
        '',
        runMeta.prompt ? `mode=${runMeta.mode}, model=${runMeta.model}, prompt=${runMeta.prompt}, t=${runMeta.temperature}` : 'прогон не выполнен',
        '',
        '## CSV',
        '```csv',
        rows.length && runSpec ? rowsToCsv(rows, runSpec).replace('\uFEFF', '').trim() : '—',
        '```',
        '',
        `Тезис без цитаты: ${rows.filter((r) => r.emptyWithThesis).length}`,
        `Цитаты не из текста: ${rows.reduce((s, r) => s + (r.quoteChecks || []).filter((c) => !c.ok).length, 0)}`,
        `Аудит: pass ${rows.filter((r) => r.audit === 'pass').length}, fail ${rows.filter((r) => r.audit === 'fail').length}`,
      ].join('\n'),
    }),
    [rows, runMeta, spec, runSpec]
  )

  const tabs = [
    { id: 'why', label: 'Зачем API' },
    { id: 'hypo', label: 'Гипотезы' },
    { id: 'corpus', label: 'Корпус' },
    { id: 'live', label: 'Живой DeepSeek' },
    { id: 'audit', label: 'Таблица + аудит' },
    { id: 'open', label: 'Другие API' },
    { id: 'home', label: 'Домой: PyCharm + Claude' },
  ]
  const tabIdx = tabs.findIndex((t) => t.id === tab)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        {tabs.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <button type="button" className={tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              <span className="opacity-70 mr-1">{i + 1}</span>
              {t.label}
              {t.id === 'audit' && rows.length > 0 && <span className="ml-1 text-xs opacity-80">({rows.length})</span>}
            </button>
            {i < tabs.length - 1 && <span className="hidden md:inline text-gray-300 dark:text-gray-600">›</span>}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Гипотеза: <strong className="text-gray-700 dark:text-gray-200">{spec.title}</strong> · корпус: {fragments.length} рассказ.
        ({position === 'end' ? 'финалы' : 'начала'}) · режим: {cfg.mock ? 'учебный mock' : `DeepSeek ${cfg.model}`}
        {cfg.bad && <span className="text-rose-600"> · наводящий промпт</span>}
      </div>

      {tab === 'why' && <WhyTab />}
      {tab === 'hypo' && <HypothesisTab hypId={hypId} setHypId={setHypId} spec={spec} updateSpec={updateSpec} resetSpec={resetSpec} />}
      {tab === 'corpus' && (
        <CorpusTab
          selected={selected}
          toggleStory={toggleStory}
          position={position}
          setPosition={setPosition}
          maxChars={maxChars}
          setMaxChars={setMaxChars}
          fragments={fragments}
          loadState={loadState}
        />
      )}
      {tab === 'live' && (
        <LiveTab
          spec={spec}
          fragments={fragments}
          cfg={cfg}
          setCfg={setCfg}
          apiKey={apiKey}
          setApiKey={setApiKey}
          remember={remember}
          setRemember={setRemember}
          onDownloadScript={downloadScript}
          run={{ running, stage, progress, activeId, setActiveId, logs, fatal, startRun, stopRun }}
        />
      )}
      {tab === 'audit' && <AuditTab rows={rows} runSpec={runSpec} setAudit={setAudit} runMeta={runMeta} />}
      {tab === 'open' && <OpenApisTab />}
      {tab === 'home' && <HomeTab spec={spec} onDownloadScript={downloadScript} designMd={designMd} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondary} disabled={tabIdx === 0} onClick={() => setTab(tabs[tabIdx - 1].id)}>
          ← {tabs[tabIdx - 1]?.label || 'Назад'}
        </button>
        <button type="button" className={btnPrimary} disabled={tabIdx === tabs.length - 1} onClick={() => setTab(tabs[tabIdx + 1].id)}>
          {tabs[tabIdx + 1]?.label || 'Конец'} →
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
        Punchline Л11: API — не «умнее чата», а та же модель с одним контрактом на весь корпус. Без честного нуля и
        аудита LLM-серия — размноженный чат. Лучше 10 проверенных строк, чем 100 непроверенных.
      </div>
    </div>
  )
}

/** Совместимость со старым именем в demos.json */
export function PipelineLab() {
  return <PipelineLesson />
}
