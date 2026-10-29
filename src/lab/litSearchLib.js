/**
 * Поиск научной литературы: перефраз темы → ключевые слова → бесплатные API.
 * OpenAlex / Crossref — без ключа; Semantic Scholar — без ключа с лимитом
 * (опционально ключ в sessionStorage).
 */

export const S2_KEY_STORAGE = 'dh_s2_api_key'
export const DEEPSEEK_KEY_STORAGE = 'dh_deepseek_key'

/** Учебный глоссарий RU → EN для литературоведения / DH */
export const GLOSSARY = [
  [/тёмн\w*\s*алле\w*|темн\w*\s*алле\w*|dark\s*avenues?/gi, ['Dark Alleys', 'Dark Avenues', 'Temnye allei']],
  [/бунин\w*/gi, ['Bunin', 'Ivan Bunin']],
  [/чехов\w*/gi, ['Chekhov', 'Anton Chekhov']],
  [/ирони\w*/gi, ['irony', 'ironic']],
  [/памят\w*|забвен\w*/gi, ['memory', 'remembrance', 'forgetting']],
  [/топос\w*|геоп\w*|пространств\w*/gi, ['space', 'place', 'geopoetics', 'topos']],
  [/стилиометр\w*|стилометр\w*/gi, ['stylometry', 'authorship attribution']],
  [/цифров\w*\s*гуманитар\w*|digital\s*humanities|\bDH\b/gi, ['digital humanities', 'computational literary studies']],
  [/distant\s*reading|дальн\w*\s*чтен\w*/gi, ['distant reading', 'Franco Moretti']],
  [/close\s*reading|близк\w*\s*чтен\w*/gi, ['close reading']],
  [/сентимент\w*|тональност\w*/gi, ['sentiment analysis', 'affect']],
  [/NER|именованн\w*\s*сущност\w*|распознаван\w*\s*имён/gi, ['named entity recognition', 'NER']],
  [/промпт\w*|LLM|языков\w*\s*модел\w*/gi, ['large language model', 'prompt engineering', 'LLM']],
  [/корпус\w*|corpus/gi, ['corpus', 'corpus linguistics']],
  [/имаголог\w*|образ\w*\s*другого/gi, ['imagology', 'image of the other']],
  [/эмиграц\w*/gi, ['emigration', 'exile literature']],
  [/наррат\w*|повествован\w*/gi, ['narrative', 'narratology']],
  [/русск\w*\s*литератур\w*/gi, ['Russian literature']],
  [/модернизм\w*/gi, ['modernism']],
  [/рецепц\w*/gi, ['reception', 'reception studies']],
]

export const PRESETS = [
  {
    id: 'bunin-irony',
    title: 'Ирония у Бунина',
    topic: 'Ирония и формула «всё проходит» в цикле И. А. Бунина «Тёмные аллеи»',
  },
  {
    id: 'bunin-space',
    title: 'Пространство цикла',
    topic: 'Геопоэтика и топосы пространства в «Тёмных аллеях» Бунина (Париж, Кавказ, усадьба)',
  },
  {
    id: 'dh-llm',
    title: 'LLM в DH',
    topic: 'Использование больших языковых моделей и API для анализа художественного текста в digital humanities',
  },
  {
    id: 'stylometry',
    title: 'Стилиометрия',
    topic: 'Стилиометрия и атрибуция авторства на корпусе русской прозы XX века',
  },
  {
    id: 'imagology',
    title: 'Имагология',
    topic: 'Имагология и образ Другого в литературе путешествий XIX века',
  },
]

const STOP_RU = new Set(
  'и в во на с со к по о об от из за для при через а но или как что это тот эта эти тот же бы ли не ни уже ещё еще все всё'.split(
    /\s+/
  )
)

function uniq(arr) {
  const seen = new Set()
  const out = []
  for (const x of arr) {
    const k = String(x).trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(String(x).trim())
  }
  return out
}

/** Локальный «промпт»: перефраз + ключевые слова без LLM */
export function reformulateLocal(topic) {
  const raw = String(topic || '').trim()
  if (!raw) {
    return { academicRu: '', academicEn: '', keywords: [], queries: [] }
  }

  const keywords = []
  let enBits = []
  for (const [re, en] of GLOSSARY) {
    if (re.test(raw)) {
      keywords.push(...en)
      enBits.push(...en.slice(0, 2))
    }
    re.lastIndex = 0
  }

  const tokens = (raw.toLowerCase().match(/[а-яёa-z0-9-]{4,}/gi) || []).filter((t) => !STOP_RU.has(t))
  keywords.push(...tokens.slice(0, 8))

  const kw = uniq(keywords).slice(0, 16)
  const enCore = uniq(enBits).slice(0, 8)

  const academicRu = [
    'Обзор исследований по теме:',
    raw.replace(/[.?!]+$/, '') + '.',
    'Фокус: литературоведческие и digital humanities подходы, корпусный и интерпретативный анализ.',
  ].join(' ')

  const academicEn =
    enCore.length > 0
      ? `Scholarly literature on ${enCore.join(', ')} in literary studies and digital humanities.`
      : `Scholarly literature review: ${raw}`

  const queries = uniq([
    enCore.slice(0, 5).join(' '),
    [...enCore.slice(0, 3), 'Russian literature'].filter(Boolean).join(' '),
    kw.filter((k) => /[a-z]/i.test(k)).slice(0, 6).join(' '),
    raw,
  ]).filter((q) => q.length > 3)

  return { academicRu, academicEn, keywords: kw, queries }
}

/** Опциональный перефраз через DeepSeek (если есть ключ) */
export async function reformulateWithDeepSeek(topic, apiKey) {
  const endpoint = 'https://api.deepseek.com/v1/chat/completions'
  const system = `Ты помощник филолога. По теме исследования верни ТОЛЬКО JSON:
{"academic_ru":"1-2 предложения научного перефраза по-русски",
 "academic_en":"1-2 sentences in English for database search",
 "keywords":["5-12 ключевых слов/фраз, смесь RU и EN"],
 "queries":["3 готовых поисковых строки на английском для Semantic Scholar / OpenAlex"]}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: topic },
      ],
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''))
  return {
    academicRu: parsed.academic_ru || '',
    academicEn: parsed.academic_en || '',
    keywords: parsed.keywords || [],
    queries: parsed.queries || [],
    source: 'deepseek',
  }
}

function yearFrom(v) {
  if (!v) return null
  const m = String(v).match(/(\d{4})/)
  return m ? +m[1] : null
}

export async function searchOpenAlex(query, { perPage = 15, mailto = 'samarkand-dh-course@example.com' } = {}) {
  const url = new URL('https://api.openalex.org/works')
  url.searchParams.set('search', query)
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('sort', 'cited_by_count:desc')
  url.searchParams.set('mailto', mailto)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((w) => ({
    source: 'OpenAlex',
    id: w.id,
    title: w.title || w.display_name || '—',
    year: w.publication_year || yearFrom(w.from_publication_date),
    authors: (w.authorships || [])
      .map((a) => a.author?.display_name)
      .filter(Boolean)
      .slice(0, 6)
      .join(', '),
    cited: w.cited_by_count ?? null,
    doi: w.doi ? w.doi.replace('https://doi.org/', '') : null,
    url: w.primary_location?.landing_page_url || w.id,
    oa: Boolean(w.open_access?.is_oa || w.primary_location?.is_oa),
    abstract: invertOpenAlexAbstract(w.abstract_inverted_index),
  }))
}

function invertOpenAlexAbstract(inv) {
  if (!inv || typeof inv !== 'object') return ''
  const pairs = []
  for (const [word, idxs] of Object.entries(inv)) {
    for (const i of idxs) pairs.push([i, word])
  }
  pairs.sort((a, b) => a[0] - b[0])
  return pairs
    .map((p) => p[1])
    .join(' ')
    .slice(0, 400)
}

export async function searchCrossref(query, { rows = 15 } = {}) {
  const url = new URL('https://api.crossref.org/works')
  url.searchParams.set('query', query)
  url.searchParams.set('rows', String(rows))
  url.searchParams.set('mailto', 'samarkand-dh-course@example.com')
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`)
  const data = await res.json()
  return (data.message?.items || []).map((w) => ({
    source: 'Crossref',
    id: w.DOI || w.URL,
    title: Array.isArray(w.title) ? w.title[0] : w.title || '—',
    year: yearFrom(w.issued?.['date-parts']?.[0]?.[0] || w.published?.['date-parts']?.[0]?.[0]),
    authors: (w.author || [])
      .map((a) => [a.given, a.family].filter(Boolean).join(' '))
      .filter(Boolean)
      .slice(0, 6)
      .join(', '),
    cited: w['is-referenced-by-count'] ?? null,
    doi: w.DOI || null,
    url: w.URL || (w.DOI ? `https://doi.org/${w.DOI}` : null),
    oa: false,
    abstract: (w.abstract || '').replace(/<[^>]+>/g, '').slice(0, 400),
  }))
}

export async function searchSemanticScholar(query, { limit = 15, apiKey } = {}) {
  const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search')
  url.searchParams.set('query', query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('fields', 'title,year,authors,citationCount,externalIds,url,abstract,openAccessPdf,venue')
  const headers = { Accept: 'application/json' }
  if (apiKey) headers['x-api-key'] = apiKey
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Semantic Scholar HTTP ${res.status}${t ? `: ${t.slice(0, 120)}` : ''}`)
  }
  const data = await res.json()
  return (data.data || []).map((w) => ({
    source: 'Semantic Scholar',
    id: w.paperId,
    title: w.title || '—',
    year: w.year || null,
    authors: (w.authors || [])
      .map((a) => a.name)
      .filter(Boolean)
      .slice(0, 6)
      .join(', '),
    cited: w.citationCount ?? null,
    doi: w.externalIds?.DOI || null,
    url: w.url || (w.paperId ? `https://www.semanticscholar.org/paper/${w.paperId}` : null),
    oa: Boolean(w.openAccessPdf?.url),
    abstract: (w.abstract || '').slice(0, 400),
    venue: w.venue || '',
  }))
}

export function resultsToCsv(rows) {
  const keys = ['source', 'title', 'year', 'authors', 'cited', 'doi', 'url', 'oa', 'abstract']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return `\uFEFF${keys.join(',')}\n${rows.map((r) => keys.map((k) => esc(r[k])).join(',')).join('\n')}\n`
}

export function dedupeByDoiOrTitle(rows) {
  const seen = new Set()
  const out = []
  for (const r of rows) {
    const key = (r.doi || r.title || '').toLowerCase().trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}
