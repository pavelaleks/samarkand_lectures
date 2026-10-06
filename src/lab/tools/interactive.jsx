import { useMemo, useState } from 'react'
import { FUNCTION_WORDS, RU_NAMES, SAMPLES, SENTIMENT_LEXICON } from '../samples'
import {
  countTokens,
  downloadText,
  relativeFreq,
  splitChapters,
  tokenize,
  topN,
  ttr,
  windowTtr,
} from '../textUtils'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const mono = `${field} font-mono`
const btnSecondary =
  'px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'

export function CleanText() {
  const [text, setText] = useState(SAMPLES.dirty)
  const [removeUrls, setRemoveUrls] = useState(true)
  const [removePages, setRemovePages] = useState(true)
  const [collapseSpaces, setCollapseSpaces] = useState(true)
  const [removeSiteJunk, setRemoveSiteJunk] = useState(true)

  const { clean, removed } = useMemo(() => {
    let t = text.replace(/\r\n/g, '\n')
    const log = []
    if (removeUrls) {
      const next = t.replace(/https?:\/\/\S+/gi, '')
      if (next !== t) log.push('URL')
      t = next
    }
    if (removePages) {
      const next = t.replace(/^\s*стр\.?\s*\d+\s*$/gim, '')
      if (next !== t) log.push('номера страниц')
      t = next
    }
    if (removeSiteJunk) {
      const next = t.replace(/©[^\n]*/gi, '').replace(/реклама/gi, '').replace(/скачать бесплатно/gi, '')
      if (next !== t) log.push('сайт-мусор')
      t = next
    }
    if (collapseSpaces) {
      const next = t
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((l) => l.trim())
        .join('\n')
        .trim()
      if (next !== t.trim()) log.push('лишние пробелы')
      t = next
    }
    return { clean: t, removed: log }
  }, [text, removeUrls, removePages, collapseSpaces, removeSiteJunk])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setText(SAMPLES.dirty)}>
          Учебный «грязный» пример
        </button>
        <button type="button" className={btnSecondary} onClick={() => downloadText('clean_utf8.txt', clean)}>
          Скачать clean.txt
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          [removeUrls, setRemoveUrls, 'Убирать URL'],
          [removePages, setRemovePages, 'Убирать «стр. N»'],
          [collapseSpaces, setCollapseSpaces, 'Схлопывать пробелы'],
          [removeSiteJunk, setRemoveSiteJunk, 'Сайт-мусор'],
        ].map(([val, set, label]) => (
          <label key={label} className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-semibold">До</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className={mono} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">После</span>
          <textarea readOnly value={clean} rows={12} className={`${mono} border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20`} />
        </label>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Сработавшие правила: {removed.length ? removed.join(', ') : 'ничего не изменено'}.
      </p>
    </div>
  )
}

export function Frequencies() {
  const [text, setText] = useState(SAMPLES.cleanChekhov)
  const [windowSize, setWindowSize] = useState(40)
  const [nTop, setNTop] = useState(15)

  const stats = useMemo(() => {
    const tokens = tokenize(text)
    const counter = countTokens(tokens)
    const ranked = topN(counter, nTop)
    const N = tokens.length
    const zipf = topN(counter, Math.min(40, counter.size)).map(([w, f], i) => ({
      rank: i + 1,
      word: w,
      freq: f,
      share: N ? f / N : 0,
    }))
    return {
      tokens: N,
      types: counter.size,
      ttrAll: ttr(tokens),
      ranked,
      zipf,
      windows: windowTtr(tokens, windowSize),
    }
  }, [text, windowSize, nTop])

  const maxFreq = stats.zipf[0]?.freq || 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setText(SAMPLES.cleanChekhov)}>
          Учебный текст
        </button>
        <label className="text-sm">
          Окно TTR
          <input type="number" min={20} max={200} value={windowSize} onChange={(e) => setWindowSize(+e.target.value || 40)} className={`${field} w-24`} />
        </label>
        <label className="text-sm">
          Топ
          <input type="number" min={5} max={30} value={nTop} onChange={(e) => setNTop(+e.target.value || 15)} className={`${field} w-24`} />
        </label>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className={mono} />
      <div className="grid sm:grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3"><div className="text-2xl font-bold">{stats.tokens}</div><div className="text-xs text-gray-500">токенов</div></div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3"><div className="text-2xl font-bold">{stats.types}</div><div className="text-xs text-gray-500">уникальных</div></div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3"><div className="text-2xl font-bold">{stats.ttrAll.toFixed(3)}</div><div className="text-xs text-gray-500">TTR целого</div></div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Топ словоформ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-200 dark:border-gray-700"><th className="py-2">#</th><th>слово</th><th>частота</th><th>доля</th></tr></thead>
            <tbody>
              {stats.ranked.map(([w, f], i) => (
                <tr key={w} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1.5">{i + 1}</td>
                  <td className="font-mono">{w}</td>
                  <td>{f}</td>
                  <td>{stats.tokens ? (f / stats.tokens).toFixed(4) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Zipf: ранг → частота</h3>
        <div className="space-y-1">
          {stats.zipf.slice(0, 20).map((row) => (
            <div key={row.word} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-6 text-gray-500">{row.rank}</span>
              <span className="w-24 font-mono truncate">{row.word}</span>
              <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <div className="h-full bg-teal-500/80" style={{ width: `${(row.freq / maxFreq) * 100}%` }} />
              </div>
              <span className="w-8 text-right">{row.freq}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">TTR по окнам</h3>
        {stats.windows.length === 0 ? (
          <p className="text-sm text-gray-500">Текст слишком короткий для окон.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">окно</th><th>токенов</th><th>types</th><th>TTR</th></tr></thead>
              <tbody>
                {stats.windows.map((w) => (
                  <tr key={w.index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">{w.index}</td>
                    <td>{w.tokens}</td>
                    <td>{w.types}</td>
                    <td>{w.ttr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function SentimentLab() {
  const [text, setText] = useState(SAMPLES.cleanChekhov)

  const rows = useMemo(() => {
    const chapters = splitChapters(text)
    return chapters.map((ch) => {
      const tokens = tokenize(ch.text)
      const hits = []
      let sum = 0
      for (const w of tokens) {
        if (SENTIMENT_LEXICON[w] != null) {
          sum += SENTIMENT_LEXICON[w]
          hits.push(`${w} (${SENTIMENT_LEXICON[w]})`)
        }
      }
      const score = tokens.length ? sum / tokens.length : 0
      return { ...ch, score, hits, tokens: tokens.length }
    })
  }, [text])

  const maxAbs = Math.max(0.01, ...rows.map((r) => Math.abs(r.score)))

  return (
    <div className="space-y-4">
      <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setText(SAMPLES.cleanChekhov)}>
        Пример с ловушкой иронии (гл. 3)
      </button>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className={mono} />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Сегменты — по маркерам «Глава N» или по абзацам. Словарь крошечный: он специально не видит сарказма.
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between gap-3 mb-2">
              <span className="font-semibold">{r.title}</span>
              <span className={`font-mono ${r.score >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {r.score.toFixed(4)}
              </span>
            </div>
            <div className="h-3 rounded bg-gray-100 dark:bg-gray-900 relative overflow-hidden mb-2">
              <div
                className={`absolute top-0 h-full ${r.score >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{
                  left: r.score >= 0 ? '50%' : `${50 - (Math.abs(r.score) / maxAbs) * 50}%`,
                  width: `${(Math.abs(r.score) / maxAbs) * 50}%`,
                }}
              />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400" />
            </div>
            <p className="text-xs text-gray-500">Hits: {r.hits.length ? r.hits.join(', ') : 'нет словарных слов'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NetworkLab() {
  const [mode, setMode] = useState('edges')
  const [edgesText, setEdgesText] = useState(SAMPLES.network)
  const [namesText, setNamesText] = useState(SAMPLES.names)

  const graph = useMemo(() => {
    const nodes = new Map()
    const edges = []
    const addNode = (name) => {
      const n = name.trim()
      if (!n) return null
      const key = n.toLowerCase()
      if (!nodes.has(key)) nodes.set(key, { id: key, label: n, degree: 0 })
      return key
    }
    const addEdge = (a, b) => {
      if (!a || !b || a === b) return
      const [x, y] = a < b ? [a, b] : [b, a]
      if (edges.some((e) => e.a === x && e.b === y)) return
      edges.push({ a: x, b: y })
      nodes.get(x).degree += 1
      nodes.get(y).degree += 1
    }

    if (mode === 'edges') {
      edgesText.split('\n').forEach((line) => {
        const m = line.split(/—|–|-|,|\t/).map((s) => s.trim()).filter(Boolean)
        if (m.length >= 2) addEdge(addNode(m[0]), addNode(m[1]))
      })
    } else {
      const paras = namesText.split(/\n+/).filter(Boolean)
      const nameSet = new Set(RU_NAMES)
      paras.forEach((p) => {
        const found = []
        const tokens = p.match(/[А-ЯЁA-Z][а-яёa-z]+/g) || []
        tokens.forEach((t) => {
          if (nameSet.has(t.toLowerCase()) || t.length > 3) found.push(addNode(t))
        })
        const uniq = [...new Set(found.filter(Boolean))]
        for (let i = 0; i < uniq.length; i++) {
          for (let j = i + 1; j < uniq.length; j++) addEdge(uniq[i], uniq[j])
        }
      })
    }

    return { nodes: [...nodes.values()].sort((a, b) => b.degree - a.degree), edges }
  }, [mode, edgesText, namesText])

  const width = 420
  const height = 280
  const placed = graph.nodes.map((n, i) => {
    const angle = (i / Math.max(graph.nodes.length, 1)) * Math.PI * 2 - Math.PI / 2
    const r = 90
    return { ...n, x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r }
  })
  const byId = Object.fromEntries(placed.map((n) => [n.id, n]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={mode === 'edges' ? 'btn-primary !py-2 !px-4 !min-h-0 text-sm' : btnSecondary} onClick={() => setMode('edges')}>
          Список рёбер
        </button>
        <button type="button" className={mode === 'auto' ? 'btn-primary !py-2 !px-4 !min-h-0 text-sm' : btnSecondary} onClick={() => setMode('auto')}>
          Имена в абзаце → рёбра
        </button>
      </div>
      {mode === 'edges' ? (
        <textarea value={edgesText} onChange={(e) => setEdgesText(e.target.value)} rows={8} className={mono} placeholder="Иван — Мария" />
      ) : (
        <textarea value={namesText} onChange={(e) => setNamesText(e.target.value)} rows={8} className={mono} />
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {graph.edges.map((e) => (
            <line key={`${e.a}-${e.b}`} x1={byId[e.a]?.x} y1={byId[e.a]?.y} x2={byId[e.b]?.x} y2={byId[e.b]?.y} stroke="currentColor" className="text-teal-500" strokeWidth="2" opacity="0.7" />
          ))}
          {placed.map((n) => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={10 + n.degree * 2} className="fill-teal-600" />
              <text x={n.x} y={n.y + 28} textAnchor="middle" className="fill-current text-[11px]">{n.label}</text>
            </g>
          ))}
        </svg>
        <div>
          <h3 className="font-semibold mb-2">Степени узлов</h3>
          <ul className="text-sm space-y-1">
            {graph.nodes.map((n) => (
              <li key={n.id} className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                <span>{n.label}</span><span className="font-mono">{n.degree}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">Рёбер: {graph.edges.length}. Запишите правило связи одной фразой.</p>
        </div>
      </div>
    </div>
  )
}

export function StylometryLite() {
  const [a, setA] = useState(SAMPLES.twoStylesA)
  const [b, setB] = useState(SAMPLES.twoStylesB)

  const cmp = useMemo(() => {
    const ta = tokenize(a)
    const tb = tokenize(b)
    const ca = relativeFreq(countTokens(ta), ta.length)
    const cb = relativeFreq(countTokens(tb), tb.length)
    const rows = FUNCTION_WORDS.map((w) => {
      const fa = ca.get(w) || 0
      const fb = cb.get(w) || 0
      return { w, fa, fb, diff: Math.abs(fa - fb) }
    }).filter((r) => r.fa + r.fb > 0)
    const distance = rows.reduce((s, r) => s + r.diff, 0) / Math.max(rows.length, 1)
    return { rows: rows.sort((x, y) => y.diff - x.diff).slice(0, 15), distance, na: ta.length, nb: tb.length }
  }, [a, b])

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm font-semibold">Текст A<textarea value={a} onChange={(e) => setA(e.target.value)} rows={7} className={mono} /></label>
        <label className="block text-sm font-semibold">Текст B<textarea value={b} onChange={(e) => setB(e.target.value)} rows={7} className={mono} /></label>
      </div>
      <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-4">
        <p className="text-sm">Учебная дистанция по служебным словам: <strong className="font-mono">{cmp.distance.toFixed(4)}</strong></p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Токенов A={cmp.na}, B={cmp.nb}. Чем меньше число, тем ближе профили — но это ещё не атрибуция.</p>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">слово</th><th>доля A</th><th>доля B</th><th>|Δ|</th></tr></thead>
        <tbody>
          {cmp.rows.map((r) => (
            <tr key={r.w} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-1.5 font-mono">{r.w}</td>
              <td>{r.fa.toFixed(4)}</td>
              <td>{r.fb.toFixed(4)}</td>
              <td>{r.diff.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function NerLite() {
  const [text, setText] = useState(SAMPLES.names)
  const [extra, setExtra] = useState('Раскольников, Соня, Разумихин')
  const [removed, setRemoved] = useState(() => new Set())

  const candidates = useMemo(() => {
    const dict = new Set([...RU_NAMES, ...extra.split(/[,;\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean)])
    const caps = text.match(/[А-ЯЁA-Z][а-яёa-z]+(?:\s+[А-ЯЁA-Z][а-яёa-z]+)?/g) || []
    const map = new Map()
    caps.forEach((c) => {
      const key = c.toLowerCase()
      const inDict = [...dict].some((d) => key === d || key.includes(d))
      const score = inDict ? 2 : 1
      if (!map.has(key)) map.set(key, { label: c, count: 0, score })
      map.get(key).count += 1
      map.get(key).score = Math.max(map.get(key).score, score)
    })
    return [...map.values()].sort((a, b) => b.score - a.score || b.count - a.count)
  }, [text, extra])

  const visible = candidates.filter((c) => !removed.has(c.label.toLowerCase()))

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={mono} />
      <label className="block text-sm">Словарь имён (через запятую)
        <input value={extra} onChange={(e) => setExtra(e.target.value)} className={field} />
      </label>
      <ul className="space-y-2">
        {visible.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
            <span><strong>{c.label}</strong> ×{c.count} {c.score > 1 ? <span className="text-teal-600">словарь</span> : <span className="text-amber-600">эвристика</span>}</span>
            <button type="button" className={btnSecondary} onClick={() => setRemoved(new Set(removed).add(c.label.toLowerCase()))}>убрать</button>
          </li>
        ))}
      </ul>
      <button type="button" className={btnSecondary} onClick={() => setRemoved(new Set())}>Сбросить вычёркивания</button>
    </div>
  )
}
