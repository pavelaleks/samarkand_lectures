/** Методы курса для своих текстов (работают в браузере, без сервера). */

export const STOP = new Set(
  ('и в во не что он на я с со как а то все всё она так его но да ты к у же вы за бы по только ее её мне было вот от меня еще ещё нет о об из ему теперь когда даже ну вдруг ли если уже или ни быть был была были него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее неё сейчас куда зачем всех никогда можно при наконец два другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это эта эти свой своей своих свои её мной тебе тебя ему нему ними кому чему весь вся'
  ).split(' ')
)

const WORD_RE = /[а-яёa-z]+(?:-[а-яёa-z]+)*/gi
const norm = (w) => w.toLowerCase().replace(/ё/g, 'е')

export function tokens(text) {
  return (text.match(WORD_RE) || []).map(norm)
}

export function contentTokens(text) {
  return tokens(text).filter((w) => w.length > 2 && !STOP.has(w))
}

export function sentences(text) {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?…])\s+(?=[«"„A-ZА-ЯЁ—–-])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
}

export function segments(text, n) {
  const words = text.split(/\s+/).filter(Boolean)
  const size = Math.max(1, Math.ceil(words.length / n))
  const out = []
  for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size).join(' '))
  return out
}

export function count(arr) {
  const m = new Map()
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1)
  return m
}

export function top(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')).slice(0, n)
}

/* ---------- Правило «слово или начало*» ---------- */
export function parseTerms(str) {
  return str
    .split(/[,;\n]/)
    .map((s) => norm(s.trim()))
    .filter(Boolean)
}

export function termMatcher(terms) {
  const exact = new Set(terms.filter((t) => !t.endsWith('*')))
  const pref = terms.filter((t) => t.endsWith('*')).map((t) => t.slice(0, -1))
  return (w) => exact.has(w) || pref.some((p) => w.startsWith(p))
}

/** «поле: слово, нач*» — по строке на поле (или через |). */
export function parseFields(str) {
  return str
    .split(/\n|\|/)
    .map((line) => {
      const i = line.indexOf(':')
      if (i < 0) return null
      const name = line.slice(0, i).trim()
      const terms = parseTerms(line.slice(i + 1))
      return name && terms.length ? { name, terms, match: termMatcher(terms) } : null
    })
    .filter(Boolean)
}

/* ---------- 1. Частоты и смысловые поля ---------- */
export function fieldTable(units, fields) {
  return units.map((u) => {
    const toks = tokens(u.text)
    const row = { текст: u.name, слов: toks.length }
    for (const f of fields) {
      const hits = toks.filter(f.match).length
      row[f.name] = hits
      row[`${f.name} /1000`] = toks.length ? +((hits * 1000) / toks.length).toFixed(2) : 0
    }
    return row
  })
}

export function fieldForms(units, fields) {
  const rows = []
  for (const f of fields) {
    const c = count(units.flatMap((u) => tokens(u.text).filter(f.match)))
    rows.push({ поле: f.name, формы: top(c, 12).map(([w, n]) => `${w} ${n}`).join(', ') || '—' })
  }
  return rows
}

/* ---------- Контексты (KWIC) ---------- */
export function kwic(units, query, width = 60, limit = 300) {
  const terms = parseTerms(query)
  if (!terms.length) return []
  const match = termMatcher(terms)
  const rows = []
  for (const u of units) {
    const re = new RegExp(WORD_RE.source, 'gi')
    let m
    while ((m = re.exec(u.text)) && rows.length < limit) {
      if (!match(norm(m[0]))) continue
      const a = m.index
      const b = a + m[0].length
      rows.push({
        текст: u.name,
        слева: u.text.slice(Math.max(0, a - width), a).replace(/\s+/g, ' '),
        слово: m[0],
        справа: u.text.slice(b, b + width).replace(/\s+/g, ' '),
      })
    }
  }
  return rows
}

/* ---------- 2. Очистка ---------- */
export function cleanText(text, o = {}) {
  let t = text.replace(/\r\n?/g, '\n').replace(/­/g, '')
  if (o.urls !== false) t = t.replace(/https?:\/\/\S+|www\.\S+/g, '')
  if (o.pages !== false) t = t.replace(/^\s*(?:стр\.?|страница|с\.)?\s*\d{1,4}\s*$/gim, '')
  if (o.hyphens !== false) t = t.replace(/([а-яё])-\n([а-яё])/gi, '$1$2')
  if (o.junk !== false) {
    t = t
      .split('\n')
      .filter((l) => !/^(?:\s*(?:©|copyright|все права|читать (?:далее|онлайн)|скачать|реклама|главная|меню|поиск|войти|регистрация|комментари|поделиться))/i.test(l))
      .join('\n')
  }
  if (o.spaces !== false) t = t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n')
  return t.trim()
}

/* ---------- 3. Паспорт корпуса ---------- */
export function sttr(toks, size = 1000) {
  if (toks.length < size) return toks.length ? new Set(toks).size / toks.length : 0
  const vals = []
  for (let i = 0; i + size <= toks.length; i += size) vals.push(new Set(toks.slice(i, i + size)).size / size)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function passport(units) {
  return units.map((u) => {
    const toks = tokens(u.text)
    const sents = sentences(u.text)
    return {
      текст: u.name,
      знаков: u.text.length,
      слов: toks.length,
      'разных слов': new Set(toks).size,
      TTR: +(toks.length ? new Set(toks).size / toks.length : 0).toFixed(3),
      'STTR (1000)': +sttr(toks).toFixed(3),
      предложений: sents.length,
      'слов в предложении': +(sents.length ? toks.length / sents.length : 0).toFixed(1),
      'частые знаменательные': top(count(contentTokens(u.text)), 6).map(([w]) => w).join(', '),
    }
  })
}

/* ---------- 4. Ципф ---------- */
export function zipf(text, n = 60) {
  const toks = tokens(text)
  const c = count(toks)
  const ranked = top(c, c.size)
  const pts = ranked.slice(0, Math.min(500, ranked.length)).map(([w, f], i) => ({ rank: i + 1, word: w, freq: f, rf: +(f * (i + 1)).toFixed(0) }))
  const fit = pts.slice(0, Math.min(200, pts.length))
  let slope = 0
  if (fit.length > 3) {
    const xs = fit.map((p) => Math.log10(p.rank))
    const ys = fit.map((p) => Math.log10(p.freq))
    const mx = xs.reduce((a, b) => a + b) / xs.length
    const my = ys.reduce((a, b) => a + b) / ys.length
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
    const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    slope = den ? num / den : 0
  }
  const hapax = ranked.filter(([, f]) => f === 1).length
  const table = pts.slice(0, n).map((p) => ({ ранг: p.rank, слово: p.word, частота: p.freq, 'ранг × частота': p.rf }))
  return { total: toks.length, types: c.size, hapax, hapaxShare: c.size ? hapax / c.size : 0, slope, points: pts, table }
}

/* ---------- 5. Ключевые слова (log-likelihood G²) ---------- */
export function keywords(targetText, refText, n = 40, minFreq = 3) {
  const a = count(contentTokens(targetText))
  const b = count(contentTokens(refText))
  const A = [...a.values()].reduce((s, x) => s + x, 0)
  const B = [...b.values()].reduce((s, x) => s + x, 0)
  if (!A || !B) return []
  const rows = []
  for (const [w, fa] of a) {
    if (fa < minFreq) continue
    const fb = b.get(w) || 0
    const e1 = (A * (fa + fb)) / (A + B)
    const e2 = (B * (fa + fb)) / (A + B)
    const g2 = 2 * (fa * Math.log(fa / e1) + (fb ? fb * Math.log(fb / e2) : 0))
    if (fa / A <= fb / B) continue
    rows.push({ слово: w, 'в изучаемом': fa, 'в фоне': fb, 'на 1000 (изуч.)': +((fa * 1000) / A).toFixed(2), 'на 1000 (фон)': +((fb * 1000) / B).toFixed(2), G2: +g2.toFixed(1) })
  }
  return rows.sort((x, y) => y.G2 - x.G2).slice(0, n)
}

/* ---------- 5. Стилометрия: Delta Берроуза ---------- */
export function delta(units, mfw = 100) {
  const toks = units.map((u) => tokens(u.text))
  const all = count(toks.flat())
  const words = top(all, mfw).map(([w]) => w)
  const rel = toks.map((t) => {
    const c = count(t)
    return words.map((w) => (t.length ? (c.get(w) || 0) / t.length : 0))
  })
  const z = words.map((_, j) => {
    const col = rel.map((r) => r[j])
    const m = col.reduce((a, b) => a + b, 0) / col.length
    const sd = Math.sqrt(col.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, col.length - 1)) || 1
    return col.map((x) => (x - m) / sd)
  })
  const n = units.length
  const D = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, k) => (i === k ? 0 : z.reduce((s, col) => s + Math.abs(col[i] - col[k]), 0) / words.length))
  )
  const nearest = units.map((u, i) => {
    let best = -1
    for (let k = 0; k < n; k++) if (k !== i && (best < 0 || D[i][k] < D[i][best])) best = k
    return { текст: u.name, 'ближайший по стилю': best >= 0 ? units[best].name : '—', Delta: best >= 0 ? +D[i][best].toFixed(3) : 0 }
  })
  return { words, D, nearest }
}

export function chunkUnits(units, size) {
  const out = []
  for (const u of units) {
    const w = u.text.split(/\s+/).filter(Boolean)
    if (w.length < size * 1.5) {
      out.push(u)
      continue
    }
    for (let i = 0, k = 1; i < w.length; i += size, k++) {
      if (w.length - i < size / 2) break
      out.push({ name: `${u.name} · ${k}`, text: w.slice(i, i + size).join(' ') })
    }
  }
  return out
}

/* ---------- 6. Имена (кандидаты) ---------- */
const URL_RE = /\S*(?:https?:\/\/|www\.)\S*|\[[^\]]*\]\([^)]*\)/g
const NAME_STOP = new Set('Но И А В На Он Она Они Я Мы Вы Ты Что Как Когда Где Это Так Там Тут Да Нет Ну Вот Все Всё Его Её Их Уже Еще Ещё Потом Теперь Только Даже Если Бог Господи Боже Мой Моя Ах Ох Эх'.split(' '))
export function stemName(w) {
  const s = w.replace(/(ыми|ими|ого|его|ому|ему|ой|ей|ою|ею|ом|ем|ам|ям|ах|ях|ами|ями|ы|и|а|я|у|ю|е|о)$/i, '')
  return (s.length >= 3 ? s : w).toLowerCase().replace(/ё/g, 'е')
}

export function nameCandidates(units, minCount = 2) {
  const caps = new Map()
  const lower = new Set()
  for (const u of units) {
    for (const s of sentences(u.text.replace(URL_RE, ' '))) {
      const words = s.match(/[А-ЯЁA-Zа-яёa-z][а-яёa-z]+/g) || []
      words.forEach((w, i) => {
        if (/^[а-яё]/.test(w)) {
          lower.add(w.toLowerCase())
          return
        }
        if (i === 0 || NAME_STOP.has(w)) return
        const st = stemName(w)
        const e = caps.get(st) || { forms: new Map(), n: 0, texts: new Set() }
        e.n++
        e.forms.set(w, (e.forms.get(w) || 0) + 1)
        e.texts.add(u.name)
        caps.set(st, e)
      })
    }
  }
  const rows = []
  for (const [st, e] of caps) {
    const forms = top(e.forms, 6)
    if (e.n < minCount) continue
    if (forms.every(([f]) => lower.has(f.toLowerCase()))) continue
    rows.push({ имя: forms[0][0], упоминаний: e.n, формы: forms.map(([f, c]) => `${f} ${c}`).join(', '), текстов: e.texts.size, _stem: st })
  }
  return rows.sort((a, b) => b.упоминаний - a.упоминаний)
}

/* ---------- 7. Сеть персонажей ---------- */
export function cooccurrence(units, names, unit = 'sentence') {
  const stems = names.map((n) => stemName(n))
  const edges = new Map()
  const deg = new Map(names.map((n) => [n, 0]))
  for (const u of units) {
    const t = u.text.replace(URL_RE, ' ')
    const chunks = unit === 'paragraph' ? t.split(/\n\s*\n|\n/) : sentences(t)
    for (const ch of chunks) {
      const present = new Set()
      for (const w of ch.match(/[А-ЯЁA-Z][а-яёa-z]+/g) || []) {
        const i = stems.indexOf(stemName(w))
        if (i >= 0) present.add(names[i])
      }
      const arr = [...present].sort()
      for (let i = 0; i < arr.length; i++)
        for (let k = i + 1; k < arr.length; k++) {
          const key = `${arr[i]}|${arr[k]}`
          edges.set(key, (edges.get(key) || 0) + 1)
        }
    }
  }
  const list = [...edges.entries()].map(([k, w]) => {
    const [a, b] = k.split('|')
    deg.set(a, deg.get(a) + w)
    deg.set(b, deg.get(b) + w)
    return { a, b, w }
  })
  return { edges: list.sort((x, y) => y.w - x.w), degree: [...deg.entries()].map(([n, d]) => ({ персонаж: n, 'связей (вес)': d, соседей: list.filter((e) => e.a === n || e.b === n).length })).sort((x, y) => y['связей (вес)'] - x['связей (вес)']) }
}

/* ---------- 8. Дуга тональности ---------- */
export function arc(text, posStr, negStr, n = 10) {
  const pos = termMatcher(parseTerms(posStr))
  const neg = termMatcher(parseTerms(negStr))
  return segments(text, n).map((seg, i) => {
    const t = tokens(seg)
    const p = t.filter(pos)
    const q = t.filter(neg)
    return {
      отрезок: i + 1,
      POS: p.length,
      NEG: q.length,
      'баланс /1000': t.length ? +(((p.length - q.length) * 1000) / t.length).toFixed(1) : 0,
      'POS-слова': top(count(p), 5).map(([w]) => w).join(', '),
      'NEG-слова': top(count(q), 5).map(([w]) => w).join(', '),
      _text: seg,
    }
  })
}

/* ---------- 9. Темы (упрощённо): различительная лексика отрезков ---------- */
export function segmentTopics(units, nSeg = 6, perSeg = 8) {
  const parts = units.length >= 3 ? units : units.flatMap((u) => segments(u.text, nSeg).map((t, i) => ({ name: `${u.name} · ${i + 1}`, text: t })))
  return parts.map((p, i) => {
    const rest = parts.filter((_, k) => k !== i).map((x) => x.text).join(' ')
    const kw = keywords(p.text, rest, perSeg, 2)
    return { отрезок: p.name, 'слова-маркеры': kw.map((r) => r.слово).join(', ') || '— (мало повторов)', _text: p.text }
  })
}

/* ---------- 10–11. Промпт для бесплатного ИИ ---------- */
export function llmPrompt(fragment, question) {
  return `Ты — ассистент литературоведа. Работай ТОЛЬКО с фрагментом ниже.

ВОПРОС: ${question}

ПРАВИЛА:
1. Каждый тезис подтверждай точной цитатой из фрагмента в кавычках «…».
2. Не придумывай фактов, которых нет во фрагменте; если данных не хватает — так и скажи.
3. Отдели наблюдение (что в тексте) от интерпретации (что это может значить).
4. Ответ — 5–7 пунктов, по-русски.

ФРАГМЕНТ:
"""
${fragment}
"""`
}

/* ---------- 13. Проверка цитат из ответа ИИ ---------- */
const flat = (s) => norm(s).replace(/[^а-яa-z0-9]+/g, ' ').trim()

export function extractQuotes(answer) {
  const out = []
  const re = /«([^«»]{6,})»|“([^“”]{6,})”|"([^"]{6,})"|„([^“"]{6,})[“"]/g
  let m
  while ((m = re.exec(answer))) {
    const q = (m[1] || m[2] || m[3] || m[4]).trim()
    if (q.split(/\s+/).length >= 2) out.push(q)
  }
  return [...new Set(out)]
}

export function checkQuotes(answer, units) {
  const corp = units.map((u) => ({ name: u.name, flat: flat(u.text), text: u.text }))
  return extractQuotes(answer).map((q) => {
    const f = flat(q)
    const hit = corp.find((c) => c.flat.includes(f))
    if (hit) return { цитата: q, итог: '✅ есть в тексте', где: hit.name, совпадение: '100%' }
    const words = f.split(' ')
    let best = 0
    let where = ''
    for (let i = 0; i < words.length; i++)
      for (let j = words.length; j > i + best; j--) {
        const piece = words.slice(i, j).join(' ')
        const c = corp.find((x) => x.flat.includes(piece))
        if (c) {
          best = j - i
          where = c.name
          break
        }
      }
    const share = words.length ? best / words.length : 0
    return {
      цитата: q,
      итог: share >= 0.6 ? '⚠ неточная (пересказ?)' : '❌ нет в тексте',
      где: share >= 0.6 ? where : '—',
      совпадение: `${Math.round(share * 100)}%`,
    }
  })
}

/* ---------- CSV ---------- */
export function toCsv(rows) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0]).filter((c) => !c.startsWith('_'))
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\n')
}
