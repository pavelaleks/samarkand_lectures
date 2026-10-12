import { useMemo, useState } from 'react'
import { useLabReport } from '../LabReportContext'
import {
  FUNCTION_WORDS as FUNCTION_WORDS_LIST,
  PROMPT_SCENARIOS,
  SAMPLES,
  SENTIMENT_LEXICON,
} from '../samples'
import { countTokens, downloadText, splitChapters, tokenize, topN, ttr } from '../textUtils'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const mono = `${field} font-mono`
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'

const FUNCTION_WORDS = new Set(
  [
    ...FUNCTION_WORDS_LIST,
    'и', 'в', 'на', 'с', 'по', 'к', 'о', 'а', 'но', 'что', 'как', 'не', 'он', 'она', 'они', 'я', 'мы', 'вы',
    'его', 'её', 'ее', 'их', 'это', 'тот', 'эта', 'те', 'был', 'была', 'было', 'были', 'есть', 'будет',
    'бы', 'ли', 'же', 'уже', 'ещё', 'еще', 'или', 'для', 'от', 'до', 'из', 'у', 'за', 'при', 'под', 'над',
    'мне', 'меня', 'мне', 'мне', 'то', 'всё', 'все', 'мне', 'ты', 'мне', 'мне',
  ].map((w) => w.toLowerCase())
)

/** Учебные семантические поля — не NLP «истина», а кандидаты для проверки close reading. */
const MOTIF_FIELDS = [
  {
    id: 'body',
    title: 'Тело / жест',
    color: 'bg-rose-200 dark:bg-rose-800/60',
    re: /рук|глаз|рот|лиц|плеч|перил|вуал|жест|сжал|бледн/i,
  },
  {
    id: 'light',
    title: 'Свет / тьма',
    color: 'bg-slate-300 dark:bg-slate-600/70',
    re: /тёмн|темн|свет|тень|ноч|мрак|вуал/i,
  },
  {
    id: 'motion',
    title: 'Движение / побег',
    color: 'bg-amber-200 dark:bg-amber-800/50',
    re: /бежал|сбеж|вышел|шата|стой|ветру|ворот|каса/i,
  },
  {
    id: 'speech',
    title: 'Речь / диалог',
    color: 'bg-sky-200 dark:bg-sky-800/50',
    re: /сказал|крикн|спрос|отчего|оттого|шутк|забыд/i,
  },
  {
    id: 'feeling',
    title: 'Чувство / состояние',
    color: 'bg-violet-200 dark:bg-violet-800/50',
    re: /печат|счаст|страх|люб|жутк|мучит|задых|умру|терпк|спокойн|улыб/i,
  },
]

function scoreSentiment(tokens) {
  const hits = []
  let sum = 0
  for (const w of tokens) {
    if (SENTIMENT_LEXICON[w] != null) {
      hits.push({ word: w, score: SENTIMENT_LEXICON[w] })
      sum += SENTIMENT_LEXICON[w]
    }
  }
  const label =
    hits.length === 0 ? 'нет опоры в словаре' : sum > 0.4 ? 'скорее «плюс»' : sum < -0.4 ? 'скорее «минус»' : 'смешанный / слабый'
  return { sum, hits, label }
}

function analyzeCloseDistant(text) {
  const raw = (text || '').trim()
  const tokens = tokenize(raw)
  const contentTokens = tokens.filter((w) => !FUNCTION_WORDS.has(w) && w.length > 1)
  const contentCounter = countTokens(contentTokens)
  const contentTops = topN(contentCounter, 10)

  const fieldHits = MOTIF_FIELDS.map((f) => {
    const words = [...new Set(contentTokens.filter((w) => f.re.test(w)))]
    return { ...f, words, count: words.length }
  }).filter((f) => f.count > 0)
  fieldHits.sort((a, b) => b.count - a.count)

  const sentiment = scoreSentiment(tokens)
  const posHits = sentiment.hits.filter((h) => h.score > 0)
  const negHits = sentiment.hits.filter((h) => h.score < 0)

  const topFields = fieldHits.slice(0, 3).map((f) => f.title)
  const topWords = contentTops.slice(0, 5).map(([w]) => w)
  const hypothesis =
    topWords.length === 0
      ? 'Текст слишком короткий — distant-гипотезу строить не из чего.'
      : `Гипотеза скрипта: текст тяготеет к полям «${topFields.join('», «') || '—'}»; опорные словоформы — ${topWords
          .map((w) => `«${w}»`)
          .join(', ')}. Наивная тональность: ${sentiment.label}${
          posHits.length && negHits.length
            ? ` (плюс: ${posHits.map((h) => h.word).join(', ')}; минус: ${negHits.map((h) => h.word).join(', ')})`
            : ''
        }.`

  const trapNote =
    posHits.some((h) => /улыб/.test(h.word)) && negHits.length > 0
      ? 'Внимание: словарь увидел «улыб…» как плюс рядом с минусом. Close reading должен решить, ирония это, жест или ловушка метода.'
      : posHits.some((h) => /счаст|радость|блажен/.test(h.word)) && negHits.length > 0
        ? 'Внимание: в тексте есть и «плюс», и «минус» по словарю — без close нельзя решить, что доминирует.'
        : null

  // Close: color by motif field
  const parts = []
  const wordRe = /[а-яёa-z]+|[^а-яёa-z]+/gi
  let m
  while ((m = wordRe.exec(raw))) {
    const chunk = m[0]
    const isWord = /^[а-яёa-z]+$/i.test(chunk)
    const lower = chunk.toLowerCase()
    const field = isWord ? MOTIF_FIELDS.find((f) => f.re.test(lower)) : null
    const sent = isWord && SENTIMENT_LEXICON[lower] != null ? SENTIMENT_LEXICON[lower] : null
    parts.push({ chunk, field, sent })
  }

  return {
    tokens: tokens.length,
    contentN: contentTokens.length,
    contentTops,
    fieldHits,
    sentiment,
    hypothesis,
    trapNote,
    parts,
  }
}

export function CloseDistant() {
  const [fragment, setFragment] = useState(SAMPLES.akhmatovaVeil)
  const [ran, setRan] = useState(true)

  const stats = useMemo(() => analyzeCloseDistant(fragment), [fragment])

  useLabReport(
    () => ({
      title: 'Close и distant на одном фрагменте',
      body: ['## Фрагмент', fragment, '', '## Гипотеза distant', stats.hypothesis, '', stats.trapNote || ''].join(
        '\n'
      ),
    }),
    [fragment, stats]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/25 p-4 text-base text-gray-800 dark:text-gray-200 leading-relaxed">
        <strong>Зачем этот показ.</strong> Distant на коротком тексте не «доказывает смысл» — он{' '}
        <em>выдвигает гипотезу</em> (поля, опорные слова, наивная тональность). Close reading решает,
        подтвердить её, сузить или опровергнуть. Если distant «врёт» — это и есть учебный результат, а не
        провал метода.
      </div>

      <label className="block text-sm font-semibold">
        Фрагмент
        <textarea
          value={fragment}
          onChange={(e) => {
            setFragment(e.target.value)
            setRan(false)
          }}
          rows={8}
          className={mono}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary !py-2.5 !px-5 !min-h-0 text-sm" onClick={() => setRan(true)}>
          Построить гипотезу distant
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            setFragment(SAMPLES.akhmatovaVeil)
            setRan(true)
          }}
        >
          Ахматова «Сжала руки…»
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            setFragment(SAMPLES.promptFragment)
            setRan(true)
          }}
        >
          Проза: «засмеялся от счастья»
        </button>
      </div>

      {ran && (
        <>
          <div className="rounded-2xl border-2 border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-200 mb-2">
              Гипотеза distant (её и проверяем)
            </h3>
            <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed mb-2">{stats.hypothesis}</p>
            {stats.trapNote && (
              <p className="text-base font-medium text-amber-900 dark:text-amber-200 mt-2">{stats.trapNote}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50/70 dark:bg-violet-950/30 p-5">
              <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 mb-1">Close reading</h3>
              <p className="text-sm text-violet-800/80 dark:text-violet-200/80 mb-3">
                Цвет = семантическое поле-кандидат. Это не «истина текста», а то, куда close может ткнуть
                цитатой.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-gray-900 dark:text-gray-100 mb-4 whitespace-pre-wrap">
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
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                {MOTIF_FIELDS.map((f) => (
                  <span key={f.id} className={`px-2 py-1 rounded-md ${f.color}`}>
                    {f.title}
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
                Вслух: какая одна цитата опровергает или уточняет гипотезу сверху? (для Ахматовой —
                часто «улыбнулся спокойно и жутко».)
              </p>
            </div>

            <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-teal-50/70 dark:bg-teal-950/30 p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 mb-1">Distant reading</h3>
                <p className="text-sm text-teal-800/80 dark:text-teal-200/80">
                  Без служебных слов: поля смысла, топ знаменательных, наивная тональность словаря.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100 mb-2">Семантические поля</h4>
                {stats.fieldHits.length === 0 ? (
                  <p className="text-sm text-gray-600">Поля не сработали — расширьте фрагмент или правьте словарь полей.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {stats.fieldHits.map((f) => (
                      <li key={f.id} className="flex flex-wrap items-baseline gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${f.color}`}>{f.title}</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{f.words.join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100 mb-2">
                  Топ знаменательных словоформ
                </h4>
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

              <div>
                <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100 mb-2">
                  Наивная тональность (словарь)
                </h4>
                <p className="text-sm mb-2">
                  Итог: <strong>{stats.sentiment.label}</strong>
                  {stats.sentiment.hits.length > 0 && (
                    <> · сумма {stats.sentiment.sum.toFixed(1)}</>
                  )}
                </p>
                {stats.sentiment.hits.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {stats.sentiment.hits.map((h) => (
                      <li key={h.word}>
                        <span className="font-mono">{h.word}</span>{' '}
                        <span className={h.score >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                          {h.score > 0 ? '+' : ''}
                          {h.score}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Нет совпадений со словарём — для тональности нужен другой список.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Что сказать студентам</h3>
            <ol className="list-decimal ml-5 space-y-2 text-base text-gray-800 dark:text-gray-200">
              <li>
                Distant здесь ценен не «правдой», а <strong>списком проверяемых гипотез</strong> (поля + опорные слова).
              </li>
              <li>
                Наивная тональность часто <strong>ломается на иронии и жесте</strong> («улыбнулся… жутко») — это мост к лекции про sentiment.
              </li>
              <li>
                На корпусе из сотен текстов те же поля дают карту; на одном стихотворении без close они выглядят грубо — и это нормально.
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}

export function CorpusPassport() {
  const [form, setForm] = useState({
    title: '',
    author: '',
    edition: '',
    year: '',
    source: '',
    encoding: 'UTF-8',
    criteria: '',
    exclusions: '',
    owner: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const md = useMemo(
    () => `# Паспорт корпуса

- Исследователь: ${form.owner || '—'}
- Автор текстов: ${form.author || '—'}
- Рабочее название корпуса: ${form.title || '—'}
- Издание / источник файла: ${form.edition || '—'}
- Год издания (если известен): ${form.year || '—'}
- Откуда взят файл: ${form.source || '—'}
- Кодировка хранения: ${form.encoding || 'UTF-8'}
- Критерии включения: ${form.criteria || '—'}
- Исключения: ${form.exclusions || '—'}
- Дата заполнения: ${new Date().toISOString().slice(0, 10)}

> Без паспорта корпус — папка файлов, а не научный объект.
`,
    [form]
  )

  useLabReport(() => ({ title: 'Паспорт корпуса', body: md }), [md])

  return (
    <div className="space-y-3">
      {[
        ['owner', 'Ваше имя'],
        ['title', 'Название корпуса'],
        ['author', 'Автор(ы) текстов'],
        ['edition', 'Издание'],
        ['year', 'Год'],
        ['source', 'Откуда файл (сайт, скан, архив)'],
        ['encoding', 'Кодировка'],
        ['criteria', 'Критерии включения'],
        ['exclusions', 'Что исключили'],
      ].map(([k, label]) => (
        <label key={k} className="block text-sm font-semibold">
          {label}
          <input value={form[k]} onChange={(e) => set(k, e.target.value)} className={field} />
        </label>
      ))}
      <pre className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-xs overflow-x-auto whitespace-pre-wrap">{md}</pre>
      <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => downloadText('source.md', md)}>
        Скачать только source.md
      </button>
    </div>
  )
}

export function TopicLite() {
  const [text, setText] = useState(SAMPLES.cleanChekhov)
  const [windowSize, setWindowSize] = useState(30)
  const [verify, setVerify] = useState({ motif: '', quote: '', counter: '' })

  const clusters = useMemo(() => {
    const tokens = tokenize(text).filter((w) => w.length > 3)
    const windows = []
    for (let i = 0; i < tokens.length; i += windowSize) {
      const slice = tokens.slice(i, i + windowSize)
      if (slice.length >= 10) windows.push(slice)
    }
    const pair = new Map()
    windows.forEach((w) => {
      const uniq = [...new Set(w)]
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const key = [uniq[i], uniq[j]].sort().join('|')
          pair.set(key, (pair.get(key) || 0) + 1)
        }
      }
    })
    const topPairs = [...pair.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
    const score = new Map()
    topPairs.forEach(([key, c]) => {
      key.split('|').forEach((w) => score.set(w, (score.get(w) || 0) + c))
    })
    const topWords = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    return { topPairs, topWords }
  }, [text, windowSize])

  useLabReport(
    () => ({
      title: 'Темы без магии: кластеры слов',
      body: [
        '## Топ слов совместной встречаемости',
        ...clusters.topWords.map(([w, c]) => `- ${w}: ${c}`),
        '',
        '## Пары',
        ...clusters.topPairs.map(([k, c]) => `- ${k.replace('|', ' — ')} ×${c}`),
        '',
        '## Верификация',
        `Мотив: ${verify.motif || '—'}`,
        `Цитата: ${verify.quote || '—'}`,
        `Опровержение/сужение: ${verify.counter || '—'}`,
      ].join('\n'),
    }),
    [clusters, verify]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
        Это не LDA. Тренируем таблицу верификации — затем скачайте результат.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={mono} />
      <label className="text-sm">
        Размер окна
        <input
          type="number"
          min={15}
          max={80}
          value={windowSize}
          onChange={(e) => setWindowSize(+e.target.value || 30)}
          className={`${field} w-28`}
        />
      </label>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Слова с высокой совместной встречаемостью</h3>
          <ul className="text-sm space-y-1">
            {clusters.topWords.map(([w, c]) => (
              <li key={w} className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                <span className="font-mono">{w}</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Пары в окнах</h3>
          <ul className="text-sm space-y-1">
            {clusters.topPairs.map(([k, c]) => (
              <li key={k} className="font-mono">
                {k.replace('|', ' — ')} <span className="text-gray-500">×{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-teal-200 dark:border-teal-800 p-4 space-y-2">
        <h3 className="font-semibold">Таблица верификации (одна тема)</h3>
        <input
          placeholder="Ожидаемый мотив"
          value={verify.motif}
          onChange={(e) => setVerify({ ...verify, motif: e.target.value })}
          className={field}
        />
        <input
          placeholder="Подтверждающая цитата"
          value={verify.quote}
          onChange={(e) => setVerify({ ...verify, quote: e.target.value })}
          className={field}
        />
        <input
          placeholder="Что опровергает или сужает"
          value={verify.counter}
          onChange={(e) => setVerify({ ...verify, counter: e.target.value })}
          className={field}
        />
      </div>
    </div>
  )
}

export function PromptLab() {
  const [scenarioId, setScenarioId] = useState(PROMPT_SCENARIOS[0].id)
  const scenario = PROMPT_SCENARIOS.find((s) => s.id === scenarioId) || PROMPT_SCENARIOS[0]

  const [role, setRole] = useState(scenario.role)
  const [task, setTask] = useState(scenario.task)
  const [limits, setLimits] = useState(scenario.limits)
  const [format, setFormat] = useState(scenario.format)
  const [fragment, setFragment] = useState(SAMPLES[scenario.sampleKey] || '')
  const [modelAnswer, setModelAnswer] = useState('')
  const [checks, setChecks] = useState({ quote: false, invent: false, limit: false, genre: false })
  const [manualNotes, setManualNotes] = useState('')

  const applyScenario = (id) => {
    const s = PROMPT_SCENARIOS.find((x) => x.id === id) || PROMPT_SCENARIOS[0]
    setScenarioId(s.id)
    setRole(s.role)
    setTask(s.task)
    setLimits(s.limits)
    setFormat(s.format)
    if (s.sampleKey && SAMPLES[s.sampleKey]) setFragment(SAMPLES[s.sampleKey])
    else if (s.genre === 'custom') setFragment('')
    setModelAnswer('')
    setChecks({ quote: false, invent: false, limit: false, genre: false })
  }

  const prompt = `РОЛЬ:\n${role}\n\nЗАДАЧА:\n${task}\n\nОГРАНИЧЕНИЯ:\n${limits}\n\nФОРМАТ ОТВЕТА:\n${format}\n\nЖАНР / ТИП ФРАГМЕНТА: ${scenario.genreLabel}\n\nФРАГМЕНТ:\n"""\n${fragment}\n"""\n`

  useLabReport(
    () => ({
      title: `Промпт-лаборатория: ${scenario.title}`,
      body: [
        `## Сценарий`,
        `${scenario.genreLabel} — ${scenario.title}`,
        '',
        '## Собранный промпт',
        '```',
        prompt,
        '```',
        '',
        '## Ответ модели (вставлен студентом)',
        modelAnswer || '— не вставлен —',
        '',
        '## Чеклист верификации',
        `- Цитаты есть во фрагменте: ${checks.quote ? 'да' : 'нет'}`,
        `- Нет выдуманных деталей: ${checks.invent ? 'да' : 'нет'}`,
        `- Есть оговорка о границах: ${checks.limit ? 'да' : 'нет'}`,
        `- Учтена специфика жанра (${scenario.genreLabel}): ${checks.genre ? 'да' : 'нет'}`,
        '',
        '## Заметки вручную',
        manualNotes || '—',
      ].join('\n'),
    }),
    [scenario, prompt, modelAnswer, checks, manualNotes]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm space-y-2">
        <p>
          <strong>Как работать с промптом.</strong> Выберите жанр → соберите промпт → скопируйте в Cursor /
          ChatGPT / другую модель → вставьте ответ сюда → отметьте проверки → скачайте результат.
        </p>
        <p className="text-amber-900/80 dark:text-amber-100/80">
          Сайт не вызывает API и не тратит ваши ключи. Применение промпта — снаружи; фиксация и
          верификация — здесь.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">1. Выберите тип текста / сценарий</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {PROMPT_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyScenario(s.id)}
              className={`text-left rounded-xl border p-3 transition-all ${
                scenarioId === s.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                {s.genreLabel}
              </span>
              <span className="block font-semibold text-sm mt-0.5">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">2. Соберите промпт (можно править)</p>
        {[
          ['role', role, setRole, 'Роль'],
          ['task', task, setTask, 'Задача'],
          ['limits', limits, setLimits, 'Ограничения'],
          ['format', format, setFormat, 'Формат ответа'],
        ].map(([key, val, setter, label]) => (
          <label key={key} className="block text-sm font-semibold">
            {label}
            <textarea value={val} onChange={(e) => setter(e.target.value)} rows={3} className={field} />
          </label>
        ))}
        <label className="block text-sm font-semibold">
          Фрагмент ({scenario.genreLabel}) — учебный пример или свой текст
          <textarea value={fragment} onChange={(e) => setFragment(e.target.value)} rows={7} className={mono} />
        </label>
        {scenario.sampleKey && (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setFragment(SAMPLES[scenario.sampleKey] || '')}
          >
            Вернуть учебный фрагмент ({scenario.genreLabel})
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">3. Готовый промпт — примените во внешней модели</p>
        <pre className="rounded-xl bg-gray-950 text-gray-100 p-4 text-xs whitespace-pre-wrap overflow-x-auto mb-3">
          {prompt}
        </pre>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary !py-2 !px-4 !min-h-0 text-sm"
            onClick={() => navigator.clipboard.writeText(prompt)}
          >
            Копировать промпт
          </button>
          <button type="button" className={btnSecondary} onClick={() => downloadText('prompt_v1.txt', prompt)}>
            Скачать prompt_v1.txt
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">4. Вставьте ответ модели и проверьте</p>
        <textarea
          value={modelAnswer}
          onChange={(e) => setModelAnswer(e.target.value)}
          rows={8}
          className={mono}
          placeholder="Вставьте сюда ответ LLM…"
        />
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
          {[
            ['quote', 'Каждая цитата реально есть во фрагменте'],
            ['invent', 'Нет выдуманных деталей / реплик / строк'],
            ['limit', 'Есть явная оговорка о границах метода'],
            ['genre', `Учтена специфика жанра (${scenario.genreLabel})`],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checks[k]}
                onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="block text-sm font-semibold">
          Что пришлось поправить вручную / какая галлюцинация
          <textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} rows={3} className={field} />
        </label>
      </div>
    </div>
  )
}

export function PipelineLab() {
  const empty = { chapter: '', thesis: '', quote: '', confidence: 'средняя', flag: '' }
  const [rows, setRows] = useState([
    {
      chapter: '1',
      thesis: 'Контраст утра и внутреннего напряжения',
      quote: 'Утро было ясным',
      confidence: 'высокая',
      flag: '',
    },
    {
      chapter: '3',
      thesis: 'Возможная ирония «блаженства»',
      quote: 'Какое блаженство',
      confidence: 'средняя',
      flag: 'irony_risk',
    },
  ])

  const csv = useMemo(() => {
    const header = 'chapter,thesis,quote,confidence,flag'
    const body = rows
      .map((r) =>
        [r.chapter, r.thesis, r.quote, r.confidence, r.flag]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    return `${header}\n${body}\n`
  }, [rows])

  const emptyQuotes = rows.filter((r) => !r.quote.trim()).length
  const update = (i, k, v) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)))

  useLabReport(
    () => ({
      title: 'От главы к таблице',
      body: ['## CSV', '```csv', csv.trim(), '```', '', `Пустых цитат: ${emptyQuotes}`].join('\n'),
    }),
    [csv, emptyQuotes]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <input
              placeholder="Глава"
              value={r.chapter}
              onChange={(e) => update(i, 'chapter', e.target.value)}
              className={field}
            />
            <input
              placeholder="confidence"
              value={r.confidence}
              onChange={(e) => update(i, 'confidence', e.target.value)}
              className={field}
            />
            <input
              placeholder="Тезис"
              value={r.thesis}
              onChange={(e) => update(i, 'thesis', e.target.value)}
              className={`${field} sm:col-span-2`}
            />
            <input
              placeholder="Цитата"
              value={r.quote}
              onChange={(e) => update(i, 'quote', e.target.value)}
              className={`${field} sm:col-span-2`}
            />
            <input
              placeholder="flag (например irony_risk)"
              value={r.flag}
              onChange={(e) => update(i, 'flag', e.target.value)}
              className={`${field} sm:col-span-2`}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} onClick={() => setRows([...rows, { ...empty }])}>
          Добавить строку
        </button>
        <button
          type="button"
          className="btn-primary !py-2 !px-4 !min-h-0 text-sm"
          onClick={() => downloadText('irony_table.csv', csv, 'text/csv;charset=utf-8')}
        >
          Скачать CSV
        </button>
      </div>
      <p className={`text-sm ${emptyQuotes ? 'text-rose-600' : 'text-emerald-600'}`}>
        Пустых цитат: {emptyQuotes} из {rows.length}. Для учебной таблицы цель — 0.
      </p>
    </div>
  )
}

export function MiniPanel() {
  const [text, setText] = useState(SAMPLES.cleanChekhov)
  const [filter, setFilter] = useState('all')
  const [evalNote, setEvalNote] = useState('')

  const data = useMemo(() => {
    const chapters = splitChapters(text)
    return chapters.map((ch) => {
      const tokens = tokenize(ch.text)
      let sum = 0
      for (const w of tokens) if (SENTIMENT_LEXICON[w] != null) sum += SENTIMENT_LEXICON[w]
      const score = tokens.length ? sum / tokens.length : 0
      return { ...ch, score, tokens: tokens.length }
    })
  }, [text])

  const shown = filter === 'all' ? data : data.filter((d) => String(d.id) === filter)
  const maxAbs = Math.max(0.01, ...data.map((d) => Math.abs(d.score)))

  useLabReport(
    () => ({
      title: 'Мини-панель исследования',
      body: [
        '## Метрики по сегментам',
        ...data.map((d) => `- ${d.title}: score=${d.score.toFixed(4)}, tokens=${d.tokens}`),
        '',
        `Фильтр при сдаче: ${filter}`,
        '',
        '## Оценка панели',
        evalNote || '—',
      ].join('\n'),
    }),
    [data, filter, evalNote]
  )

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className={mono} />
      <label className="text-sm">
        Фильтр сегмента
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={field}>
          <option value="all">Все (честный вид по умолчанию)</option>
          {data.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.title}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <h3 className="text-lg font-bold mb-1">Доля словарной тональности по сегментам</h3>
        <p className="text-xs text-gray-500 mb-4">
          единица = сегмент; метрика = средний score словаря; процедура = MiniPanel
        </p>
        <div className="space-y-2 mb-4">
          {shown.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-sm">
              <span className="w-24 truncate">{d.title}</span>
              <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-950 rounded overflow-hidden relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400" />
                <div
                  className={`absolute top-0 h-full ${d.score >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{
                    left: d.score >= 0 ? '50%' : `${50 - (Math.abs(d.score) / maxAbs) * 50}%`,
                    width: `${(Math.abs(d.score) / maxAbs) * 50}%`,
                  }}
                />
              </div>
              <span className="w-16 text-right font-mono text-xs">{d.score.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
      <label className="student-action block text-sm font-semibold rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 p-4">
        Комментарий к показу: работает / прозрачна / научно ценна — кратко
        <textarea value={evalNote} onChange={(e) => setEvalNote(e.target.value)} rows={3} className={field} />
      </label>
    </div>
  )
}

export function VerifyLab() {
  const items = [
    'Источник и издание указаны',
    'Единица анализа названа явно',
    'Процедуру может повторить другой человек',
    'Есть хотя бы одна проверяемая цитата',
    'Отдельно отмечен риск галлюцинации / артефакта',
    'Вывод сужен до того, что реально показал метод',
  ]
  const [ok, setOk] = useState(() => items.map(() => false))
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const done = ok.filter(Boolean).length

  useLabReport(
    () => ({
      title: 'Верификация и этика вывода',
      body: [
        '## Чеклист',
        ...items.map((label, i) => `- [${ok[i] ? 'x' : ' '}] ${label}`),
        '',
        `Отмечено: ${done}/${items.length}`,
        '',
        '## Было',
        before || '—',
        '',
        '## Стало',
        after || '—',
      ].join('\n'),
    }),
    [ok, before, after, done]
  )

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((label, i) => (
          <li key={label}>
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={ok[i]}
                onChange={(e) => setOk(ok.map((v, idx) => (idx === i ? e.target.checked : v)))}
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        Отмечено: <strong>{done}/{items.length}</strong>
      </p>
      <label className="block text-sm font-semibold">
        Было (красивый вывод)
        <textarea value={before} onChange={(e) => setBefore(e.target.value)} rows={3} className={field} />
      </label>
      <label className="block text-sm font-semibold">
        Стало (после верификации)
        <textarea value={after} onChange={(e) => setAfter(e.target.value)} rows={3} className={field} />
      </label>
    </div>
  )
}
