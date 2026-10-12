import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLabReport } from '../LabReportContext'
import { LECTURE1_LEXICONS } from '../data/lecture1Lexicons'
import { FUNCTION_WORDS as FUNCTION_WORDS_LIST, SAMPLES } from '../samples'
import { countTokens, tokenize, topN } from '../textUtils'

const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'
const mono =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm font-mono'

const FUNCTION_WORDS = new Set(
  [
    ...FUNCTION_WORDS_LIST,
    'и', 'в', 'на', 'с', 'по', 'к', 'о', 'а', 'но', 'что', 'как', 'не', 'он', 'она', 'они', 'я', 'мы', 'вы',
    'его', 'её', 'ее', 'их', 'это', 'тот', 'эта', 'те', 'был', 'была', 'было', 'были', 'есть', 'будет',
    'бы', 'ли', 'же', 'уже', 'ещё', 'еще', 'или', 'для', 'от', 'до', 'из', 'у', 'за', 'при', 'под', 'над',
    'мне', 'меня', 'то', 'всё', 'все', 'ты', 'ваш', 'ваше', 'вашего', 'сударя', 'сударь',
  ].map((w) => w.toLowerCase())
)

const MODES = [
  {
    id: 'verse',
    label: '1 · Лирика',
    short: 'Ахматова',
    blurb: 'Один стихотворный текст: сначала глазами, потом подсчёты и дискурсы.',
  },
  {
    id: 'prose',
    label: '2 · Проза',
    short: 'Бунин',
    blurb: 'Рассказ «Тёмные аллеи»: любовь, память, брошенность на одном сюжете.',
  },
  {
    id: 'cycle',
    label: '3 · Цикл',
    short: '37 рассказов',
    blurb: 'Distant reading всего цикла: карта дискурсов по подсчётам.',
  },
]

function normWord(w) {
  return (w || '').toLowerCase().replace(/ё/g, 'е')
}

function wordMatchesDiscourse(word, disc) {
  const w = normWord(word)
  const exact = (disc.exact || []).map(normWord)
  if (exact.includes(w)) return true
  return (disc.stems || []).some((stem) => {
    const s = normWord(stem)
    if (!s || s.length < 2) return false
    if (s.length <= 3) return w === s || (w.startsWith(s) && w.length <= s.length + 4)
    return w.startsWith(s)
  })
}

function fieldForWord(word, discourses) {
  return discourses.find((d) => wordMatchesDiscourse(word, d)) || null
}

function scoreSentiment(tokens, lexicon) {
  const hits = []
  let sum = 0
  const seen = new Set()
  for (const raw of tokens) {
    const w = normWord(raw)
    if (seen.has(w)) continue
    let score = lexicon[w]
    if (score == null && lexicon[raw] != null) score = lexicon[raw]
    if (score == null) {
      for (const [key, val] of Object.entries(lexicon)) {
        const k = normWord(key)
        if (k.length >= 4 && (w.startsWith(k) || k.startsWith(w.slice(0, Math.min(5, w.length))))) {
          score = val
          break
        }
      }
    }
    if (score == null) continue
    seen.add(w)
    hits.push({ word: w, score })
    sum += score
  }
  const label =
    hits.length === 0
      ? 'в учебном словаре нет опор'
      : sum > 0.4
        ? 'скорее «плюс»'
        : sum < -0.4
          ? 'скорее «минус»'
          : 'смешанный / слабый'
  return { sum, hits, label }
}

function analyzeFragment(text, config) {
  const raw = (text || '').trim()
  const discourses = config.discourses || []
  const tokens = tokenize(raw)
  const contentTokens = tokens.filter((w) => !FUNCTION_WORDS.has(w) && w.length > 1)
  const contentTops = topN(countTokens(contentTokens), 10)

  const fieldHits = discourses
    .map((f) => {
      const words = [...new Set(contentTokens.filter((w) => wordMatchesDiscourse(w, f)))]
      const counts = countTokens(contentTokens.filter((w) => wordMatchesDiscourse(w, f)))
      return { ...f, words, count: [...counts.values()].reduce((a, b) => a + b, 0), unique: words.length }
    })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count)

  const sentiment = scoreSentiment(tokens, config.sentiment || {})
  const posHits = sentiment.hits.filter((h) => h.score > 0)
  const negHits = sentiment.hits.filter((h) => h.score < 0)
  const lead = fieldHits[0]

  const hypothesis = [
    `Рабочая гипотеза (distant) для проверки close reading.`,
    ``,
    lead
      ? `1) Доминирующий дискурс — «${lead.title}» (формы: ${lead.words
          .slice(0, 5)
          .map((w) => `«${w}»`)
          .join(', ')}). ${lead.why || ''}`
      : `1) По кураторским группам попаданий мало — смотрите close.`,
    fieldHits.length > 1
      ? `2) Рядом: ${fieldHits
          .slice(1, 4)
          .map((f) => `«${f.title}»`)
          .join(', ')}.`
      : `2) Соседние дискурсы почти не проявились.`,
    `3) Тональность по словарю: ${sentiment.label}${
      sentiment.hits.length
        ? ` (плюс: ${posHits.map((h) => `«${h.word}»`).join(', ') || '—'}; минус: ${
            negHits.map((h) => `«${h.word}»`).join(', ') || '—'
          })`
        : ''
    }.`,
    `4) Проверка: какая одна цитата подтверждает или ломает эту гипотезу?`,
  ].join('\n')

  const parts = []
  const wordRe = /[а-яёa-z]+|[^а-яёa-z]+/gi
  let m
  while ((m = wordRe.exec(raw))) {
    const chunk = m[0]
    const isWord = /^[а-яёa-z]+$/i.test(chunk)
    const field = isWord ? fieldForWord(chunk, discourses) : null
    parts.push({ chunk, field })
  }

  return {
    tokens: tokens.length,
    contentTops,
    fieldHits,
    sentiment,
    hypothesis,
    parts,
    trapNote:
      posHits.length && negHits.length
        ? 'В словаре сразу «плюс» и «минус» — сигнал проверить контраст реплик, а не усреднять эмоцию.'
        : null,
  }
}

function ModeTabs({ mode, setMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => {
        const active = mode === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
              active
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {m.label}
            <span className={`block text-xs font-normal ${active ? 'text-teal-100' : 'text-gray-500'}`}>
              {m.short}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function TextMode({ modeId }) {
  const configKey = modeId === 'verse' ? 'akhmatova' : 'buninStory'
  const config = LECTURE1_LEXICONS[configKey]
  const preset = modeId === 'verse' ? SAMPLES.akhmatovaVeil : SAMPLES.buninTemnyeAllei
  const [fragment, setFragment] = useState(preset)
  const [step, setStep] = useState(1)

  useEffect(() => {
    setFragment(preset)
    setStep(1)
  }, [modeId, preset])

  const stats = useMemo(() => analyzeFragment(fragment, config), [fragment, config])

  useLabReport(
    () => ({
      title: `Close / distant · ${config.label}`,
      body: ['## Текст', fragment, '', '## Гипотеза', stats.hypothesis, '', stats.trapNote || ''].join('\n'),
    }),
    [fragment, stats, config.label]
  )

  const steps = [
    { n: 1, title: 'Close: первый взгляд' },
    { n: 2, title: 'Подсчёт форм / «лемм»' },
    { n: 3, title: 'Тональность' },
    { n: 4, title: 'Дискурсы' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4">
        <p className="text-base font-semibold text-violet-950 dark:text-violet-100">{config.label}</p>
        <p className="text-sm text-violet-900/90 dark:text-violet-200/90 mt-1 leading-relaxed">{config.closeHint}</p>
        <p className="text-xs text-violet-800/80 dark:text-violet-300/80 mt-2">
          Группы слов здесь учебные, подобранные под эти тексты — не универсальный анализатор.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            className={`${btnSecondary} ${step === s.n ? '!bg-teal-600 !text-white !border-teal-600' : ''}`}
            onClick={() => setStep(s.n)}
          >
            {s.n}. {s.title}
          </button>
        ))}
        <button type="button" className={btnSecondary} onClick={() => setFragment(preset)}>
          Сбросить пресет
        </button>
      </div>

      {modeId === 'prose' && (
        <details className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Текст рассказа (можно свернуть на проекторе)</summary>
          <textarea
            value={fragment}
            onChange={(e) => setFragment(e.target.value)}
            rows={10}
            className={`${mono} mt-2`}
          />
        </details>
      )}
      {modeId === 'verse' && (
        <textarea value={fragment} onChange={(e) => setFragment(e.target.value)} rows={8} className={mono} />
      )}

      {step === 1 && (
        <div className="rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50/70 dark:bg-violet-950/30 p-5">
          <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 mb-1">Close reading · первый взгляд</h3>
          <p className="text-sm text-violet-800/90 dark:text-violet-200/90 mb-3 leading-relaxed">
            Подсветка — по заранее выбранным смысловым группам этого текста. Сначала прочитайте глазами, потом
            смотрите числа.
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-4">
            {stats.parts.map((p, i) =>
              p.field ? (
                <mark key={i} className={`${p.field.color} text-inherit rounded px-0.5`} title={p.field.title}>
                  {p.chunk}
                </mark>
              ) : (
                <span key={i}>{p.chunk}</span>
              )
            )}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {config.discourses.map((f) => (
              <span key={f.id} className={`px-2 py-1 rounded-md ${f.color}`}>
                {f.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-teal-50/70 dark:bg-teal-950/30 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 mb-1">Что даёт подсчёт форм</h3>
            <p className="text-sm text-teal-900/80 dark:text-teal-200/80 leading-relaxed">
              Здесь нет полного морфоанализатора: считаются заранее отобранные словоформы. Подсчёт помогает
              увидеть уже замеченное глазами, но сам по себе смысл не «находит».
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-bold mb-2">Дискурсы (удары по группам)</h4>
              <ul className="space-y-2 text-sm">
                {stats.fieldHits.map((f) => (
                  <li key={f.id}>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${f.color}`}>{f.title}</span>{' '}
                    <span className="font-mono">
                      n={f.count}
                    </span>
                    <div className="text-gray-700 dark:text-gray-300 font-mono text-xs mt-0.5">
                      {f.words.join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Топ знаменательных словоформ</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-teal-200 dark:border-teal-800">
                    <th className="py-1">слово</th>
                    <th>n</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.contentTops.map(([w, f]) => (
                    <tr key={w} className="border-b border-teal-100/80 dark:border-teal-900/40">
                      <td className="py-1 font-mono">{w}</td>
                      <td>{f}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 p-5">
          <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 mb-1">Тональность по словарю</h3>
          <p className="text-sm mb-3 leading-relaxed text-amber-950/90 dark:text-amber-100/90">
            Наивный словарь: сумма заранее помеченных слов. Не видит иронию, отрицание, жест. Для Ахматовой
            «улыбнулся спокойно» может дать плюс — а сцена убийственная.
          </p>
          <p className="text-base mb-2">
            Итог: <strong>{stats.sentiment.label}</strong>
            {stats.sentiment.hits.length > 0 && <> · сумма {stats.sentiment.sum.toFixed(1)}</>}
          </p>
          <ul className="text-sm space-y-1 columns-1 sm:columns-2 gap-6">
            {stats.sentiment.hits.map((h) => (
              <li key={h.word} className="break-inside-avoid">
                <span className="font-mono">{h.word}</span>{' '}
                <span className={h.score >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                  {h.score > 0 ? '+' : ''}
                  {h.score}
                </span>
              </li>
            ))}
          </ul>
          {stats.trapNote && (
            <p className="mt-3 text-sm font-medium text-amber-900 dark:text-amber-200">{stats.trapNote}</p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-200 mb-2">
              Гипотеза distant → проверка close
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-base text-gray-900 dark:text-gray-100 leading-relaxed">
              {stats.hypothesis}
            </pre>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
            <h3 className="font-bold text-lg">Связь с дискурсами</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Группы собраны вручную по этому тексту (любовь, разлука, память, сожаление…), а не случайным
              списком «эмоций».
            </p>
            {config.discourses.map((d) => {
              const hit = stats.fieldHits.find((f) => f.id === d.id)
              return (
                <div key={d.id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${d.color}`}>{d.title}</span>
                    <span className="text-xs text-gray-500">{hit ? `найдено: ${hit.count}` : 'в этом фрагменте слабо'}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{d.why}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CycleMode() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState(null)
  const [sortKey, setSortKey] = useState('love')

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}demo-corpora/bunin-temnye-allei/cycle-stats.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => {
        setData(j)
        const top = [...j.stories].sort((a, b) => b.love + b.memory + b.regret - (a.love + a.memory + a.regret))[0]
        setSelected(top?.slug || null)
      })
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  useLabReport(
    () => ({
      title: 'Distant reading цикла Бунина «Тёмные аллеи»',
      body: data
        ? [
            `Рассказов: ${data.cycle_totals.stories}`,
            `Словоупотреблений: ${data.cycle_totals.words}`,
            `Любовь: ${data.cycle_totals.love}`,
            `Несчастная любовь: ${data.cycle_totals.unhappy}`,
            `Память: ${data.cycle_totals.memory}`,
            `Сожаление: ${data.cycle_totals.regret}`,
          ].join('\n')
        : 'Загрузка…',
    }),
    [data]
  )

  if (err) {
    return <p className="text-rose-600">Не удалось загрузить cycle-stats.json: {err}</p>
  }
  if (!data) {
    return <p className="text-sm text-gray-500">Считаем цикл…</p>
  }

  const totals = data.cycle_totals
  const discourses = data.discourses
  const maxPer1k = Math.max(...discourses.map((d) => totals[`${d.id}_per1k`] || 0), 1)
  const ranked = [...data.stories].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
  const sel = data.stories.find((s) => s.slug === selected) || ranked[0]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 p-4 leading-relaxed">
        <p className="text-base font-semibold text-teal-950 dark:text-teal-100">
          Цикл «Тёмные аллеи» · {totals.stories} рассказов · {totals.words.toLocaleString('ru-RU')} словоупотреблений
        </p>
        <p className="text-sm text-teal-900/90 dark:text-teal-200/90 mt-1">
          Здесь distant reading уже «большой»: сравниваем плотность дискурсов по всему циклу. Полные тексты для
          чтения на уроке — в{' '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            корпусе «Тёмные аллеи»
          </Link>
          . Источник:{' '}
          <a className="underline" href={data.source} target="_blank" rel="noreferrer">
            bunin-lit.ru
          </a>
          .
        </p>
      </div>

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {discourses.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSortKey(d.id)}
            className={`rounded-xl border p-3 text-left transition ${
              sortKey === d.id ? 'ring-2 ring-teal-500 border-teal-400' : 'border-gray-200 dark:border-gray-700'
            }`}
            style={{ borderTopColor: d.color, borderTopWidth: 4 }}
          >
            <div className="text-xs text-gray-500 mb-1">{d.title}</div>
            <div className="text-2xl font-bold tabular-nums">{totals[d.id]}</div>
            <div className="text-xs text-gray-500">{totals[`${d.id}_per1k`]} на 1000 слов</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h3 className="font-bold text-lg mb-1">Плотность дискурсов в цикле</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Нормировка на 1000 слов — чтобы длинная «Натали» не затмила короткий рассказ только размером.
        </p>
        <div className="space-y-3">
          {discourses.map((d) => {
            const v = totals[`${d.id}_per1k`] || 0
            const pct = Math.round((v / maxPer1k) * 100)
            return (
              <div key={d.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{d.title}</span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">
                    {v} / 1000 · формы: {(totals[`${d.id}_forms`] || []).slice(0, 4).join(', ')}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-lg">Рассказы по дискурсу «{discourses.find((d) => d.id === sortKey)?.title}»</h3>
            <span className="text-xs text-gray-500">клик — карточка справа</span>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-800">
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1">рассказ</th>
                  <th className="py-1">n</th>
                  <th className="py-1">/1000</th>
                  <th className="py-1">слов</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s) => (
                  <tr
                    key={s.slug}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer ${
                      sel?.slug === s.slug ? 'bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                    onClick={() => setSelected(s.slug)}
                  >
                    <td className="py-1.5 pr-2 font-medium">{s.title}</td>
                    <td className="font-mono">{s[sortKey]}</td>
                    <td className="font-mono text-gray-500">{s[`${sortKey}_per1k`]}</td>
                    <td className="font-mono text-gray-500">{s.words}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-950/30 p-5 space-y-3">
          <h3 className="font-bold text-lg text-cyan-950 dark:text-cyan-100">{sel?.title}</h3>
          <p className="text-sm text-cyan-900/90 dark:text-cyan-200/90">
            Числа по дискурсам и типичные словоформы в этом рассказе.
          </p>
          {sel && (
            <div className="space-y-2">
              {discourses.map((d) => (
                <div key={d.id} className="rounded-lg bg-white/80 dark:bg-gray-900/50 p-2.5 text-sm">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="font-semibold" style={{ color: d.color }}>
                      {d.title}
                    </span>
                    <span className="font-mono text-xs">
                      {sel[d.id]} · {sel[`${d.id}_per1k`]} /1000
                    </span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {(sel[`${d.id}_forms`] || []).join(', ') || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CloseDistant() {
  const [mode, setMode] = useState('verse')
  const current = MODES.find((m) => m.id === mode)

  return (
    <div className="space-y-4">
      <ModeTabs mode={mode} setMode={setMode} />
      <p className="text-sm text-gray-600 dark:text-gray-400">{current?.blurb}</p>
      {mode === 'cycle' ? <CycleMode /> : <TextMode modeId={mode} />}
    </div>
  )
}
