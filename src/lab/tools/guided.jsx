import { useMemo, useState } from 'react'
import { SAMPLES, SENTIMENT_LEXICON } from '../samples'
import { downloadText, splitChapters, tokenize } from '../textUtils'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const mono = `${field} font-mono`
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'

export function CloseDistant() {
  const [fragment, setFragment] = useState(
    'Он засмеялся от счастья, глядя на пустую комнату, где ещё вчера звучал голос матери.'
  )
  const [closeNote, setCloseNote] = useState('')
  const [distantNote, setDistantNote] = useState('')
  const [claim, setClaim] = useState('')

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold">Фрагмент
        <textarea value={fragment} onChange={(e) => setFragment(e.target.value)} rows={4} className={mono} />
      </label>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm font-semibold">Close reading
          <span className="block font-normal text-gray-500 mb-1">Цитата + смысл, без частот</span>
          <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} rows={5} className={field} placeholder="Контраст «счастья» и пустой комнаты…" />
        </label>
        <label className="block text-sm font-semibold">Distant-гипотеза
          <span className="block font-normal text-gray-500 mb-1">Что бы считал корпус / модель</span>
          <textarea value={distantNote} onChange={(e) => setDistantNote(e.target.value)} rows={5} className={field} placeholder="Доля слов счастья/пустоты по главам…" />
        </label>
      </div>
      <label className="block text-sm font-semibold">Одно утверждение и его статус доказательства
        <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={3} className={field} placeholder="Утверждение… Доказывается close / distant / обоими, потому что…" />
      </label>
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

  const md = useMemo(() => {
    return `# Паспорт корпуса

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
`
  }, [form])

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
        <label key={k} className="block text-sm font-semibold">{label}
          <input value={form[k]} onChange={(e) => set(k, e.target.value)} className={field} />
        </label>
      ))}
      <pre className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-xs overflow-x-auto whitespace-pre-wrap">{md}</pre>
      <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => downloadText('source.md', md)}>
        Скачать source.md
      </button>
    </div>
  )
}

export function TopicLite() {
  const [text, setText] = useState(SAMPLES.cleanChekhov)
  const [windowSize, setWindowSize] = useState(30)

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

  const [verify, setVerify] = useState({ motif: '', quote: '', counter: '' })

  return (
    <div className="space-y-4">
      <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
        Это не LDA. Мы только смотрим, какие слова часто оказываются в одном окне — чтобы потренировать таблицу верификации.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={mono} />
      <label className="text-sm">Размер окна
        <input type="number" min={15} max={80} value={windowSize} onChange={(e) => setWindowSize(+e.target.value || 30)} className={`${field} w-28`} />
      </label>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Слова с высокой совместной встречаемостью</h3>
          <ul className="text-sm space-y-1">
            {clusters.topWords.map(([w, c]) => (
              <li key={w} className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                <span className="font-mono">{w}</span><span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Пары в окнах</h3>
          <ul className="text-sm space-y-1">
            {clusters.topPairs.map(([k, c]) => (
              <li key={k} className="font-mono">{k.replace('|', ' — ')} <span className="text-gray-500">×{c}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-teal-200 dark:border-teal-800 p-4 space-y-2">
        <h3 className="font-semibold">Таблица верификации (одна тема)</h3>
        <input placeholder="Ожидаемый мотив" value={verify.motif} onChange={(e) => setVerify({ ...verify, motif: e.target.value })} className={field} />
        <input placeholder="Подтверждающая цитата" value={verify.quote} onChange={(e) => setVerify({ ...verify, quote: e.target.value })} className={field} />
        <input placeholder="Что опровергает или сужает" value={verify.counter} onChange={(e) => setVerify({ ...verify, counter: e.target.value })} className={field} />
      </div>
    </div>
  )
}

export function PromptLab() {
  const [role, setRole] = useState('Ты помощник филолога. Не выдумывай цитат.')
  const [task, setTask] = useState('Найди возможную иронию в фрагменте и объясни кратко.')
  const [limits, setLimits] = useState('Отвечай по-русски. Каждое наблюдение снабди точной цитатой из фрагмента. Если уверенность низкая — скажи об этом.')
  const [format, setFormat] = useState('1) наблюдение\n2) цитата\n3) уверенность: высокая/средняя/низкая')
  const [fragment, setFragment] = useState(SAMPLES.promptFragment)
  const [checks, setChecks] = useState({ quote: false, invent: false, limit: false })

  const prompt = `РОЛЬ:\n${role}\n\nЗАДАЧА:\n${task}\n\nОГРАНИЧЕНИЯ:\n${limits}\n\nФОРМАТ ОТВЕТА:\n${format}\n\nФРАГМЕНТ:\n"""\n${fragment}\n"""\n`

  return (
    <div className="space-y-3">
      {[
        ['role', role, setRole, 'Роль'],
        ['task', task, setTask, 'Задача'],
        ['limits', limits, setLimits, 'Ограничения'],
        ['format', format, setFormat, 'Формат'],
        ['fragment', fragment, setFragment, 'Фрагмент'],
      ].map(([key, val, setter, label]) => (
        <label key={key} className="block text-sm font-semibold">{label}
          <textarea value={val} onChange={(e) => setter(e.target.value)} rows={key === 'fragment' ? 4 : 3} className={key === 'fragment' ? mono : field} />
        </label>
      ))}
      <pre className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-xs whitespace-pre-wrap overflow-x-auto">{prompt}</pre>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => navigator.clipboard.writeText(prompt)}>
          Копировать промпт
        </button>
        <button type="button" className={btnSecondary} onClick={() => downloadText('prompt_v1.txt', prompt)}>
          Скачать prompt_v1.txt
        </button>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
        <p className="font-semibold">После ответа модели отметьте:</p>
        {[
          ['quote', 'Каждая цитата реально есть во фрагменте'],
          ['invent', 'Нет выдуманных деталей сцены'],
          ['limit', 'Есть явная оговорка о границах метода'],
        ].map(([k, label]) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function PipelineLab() {
  const empty = { chapter: '', thesis: '', quote: '', confidence: 'средняя', flag: '' }
  const [rows, setRows] = useState([
    { chapter: '1', thesis: 'Контраст утра и внутреннего напряжения', quote: 'Утро было ясным', confidence: 'высокая', flag: '' },
    { chapter: '3', thesis: 'Возможная ирония «блаженства»', quote: 'Какое блаженство', confidence: 'средняя', flag: 'irony_risk' },
  ])

  const csv = useMemo(() => {
    const header = 'chapter,thesis,quote,confidence,flag'
    const body = rows
      .map((r) => [r.chapter, r.thesis, r.quote, r.confidence, r.flag].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    return `${header}\n${body}\n`
  }, [rows])

  const emptyQuotes = rows.filter((r) => !r.quote.trim()).length

  const update = (i, k, v) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <input placeholder="Глава" value={r.chapter} onChange={(e) => update(i, 'chapter', e.target.value)} className={field} />
            <input placeholder="confidence" value={r.confidence} onChange={(e) => update(i, 'confidence', e.target.value)} className={field} />
            <input placeholder="Тезис" value={r.thesis} onChange={(e) => update(i, 'thesis', e.target.value)} className={`${field} sm:col-span-2`} />
            <input placeholder="Цитата" value={r.quote} onChange={(e) => update(i, 'quote', e.target.value)} className={`${field} sm:col-span-2`} />
            <input placeholder="flag (например irony_risk)" value={r.flag} onChange={(e) => update(i, 'flag', e.target.value)} className={`${field} sm:col-span-2`} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} onClick={() => setRows([...rows, { ...empty }])}>Добавить строку</button>
        <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => downloadText('irony_table.csv', csv, 'text/csv;charset=utf-8')}>
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

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className={mono} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Фильтр сегмента
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={field}>
            <option value="all">Все (честный вид по умолчанию)</option>
            {data.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.title}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <h3 className="text-lg font-bold mb-1">Доля словарной тональности по сегментам</h3>
        <p className="text-xs text-gray-500 mb-4">единица = сегмент; метрика = средний score словаря; процедура = MiniPanel</p>
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
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">Метод и ограничения</summary>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Словарный sentiment не ловит иронию. Вид по умолчанию — все сегменты. Фильтр сужает картину только после того, как аудитория видела базу.
          </p>
        </details>
      </div>
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
      <p className="text-sm">Отмечено: <strong>{done}/{items.length}</strong>. Зелёный свет не требуется — требуется честность.</p>
      <label className="block text-sm font-semibold">Было (красивый вывод)
        <textarea value={before} onChange={(e) => setBefore(e.target.value)} rows={3} className={field} />
      </label>
      <label className="block text-sm font-semibold">Стало (после верификации)
        <textarea value={after} onChange={(e) => setAfter(e.target.value)} rows={3} className={field} />
      </label>
    </div>
  )
}
