/**
 * Кабинет магистранта: обёртки над открытыми научными API.
 * Все запросы идут прямо из браузера (GitHub Pages — статический сайт, сервера нет).
 * Каждый запрос записывается в «журнал API» — это учебная демонстрация того,
 * как устроена связка «запрос → JSON → таблица», и готовый код для Colab.
 */

// ---------------------------------------------------------------- журнал
const listeners = new Set()
let LOG = []

export function onApiLog(fn) {
  listeners.add(fn)
  fn(LOG)
  return () => listeners.delete(fn)
}

export function clearApiLog() {
  LOG = []
  listeners.forEach((f) => f(LOG))
}

function pushLog(entry) {
  LOG = [entry, ...LOG].slice(0, 60)
  listeners.forEach((f) => f(LOG))
}

/** fetch + журнал. Возвращает разобранный JSON. */
export async function apiGet(service, url, { headers = {}, sample = true } = {}) {
  const t0 = performance.now()
  const shown = String(url).replace(/(api_key=)[^&]+/, '$1***')
  const entry = { id: `${Date.now()}-${Math.random()}`, service, url: shown, status: '…', ms: 0, at: new Date() }
  let res
  try {
    res = await fetch(String(url), { headers: { Accept: 'application/json', ...headers } })
  } catch (e) {
    pushLog({ ...entry, status: 'сеть', ms: Math.round(performance.now() - t0), error: 'Нет связи или сервис не разрешает запросы из браузера (CORS).' })
    throw new Error(`${service}: нет связи с сервисом`)
  }
  const ms = Math.round(performance.now() - t0)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    const hint =
      res.status === 429
        ? 'Слишком много запросов: подождите минуту. Для OpenAlex — вставьте бесплатный ключ в профиле.'
        : txt.slice(0, 160)
    pushLog({ ...entry, status: res.status, ms, error: hint })
    throw new Error(`${service}: ответ ${res.status}${res.status === 429 ? ' (лимит запросов)' : ''}`)
  }
  const data = await res.json()
  pushLog({ ...entry, status: res.status, ms, sample: sample ? JSON.stringify(data, null, 2).slice(0, 3000) : '' })
  return data
}

// ---------------------------------------------------------------- общий формат записи
// { key, source, type, title, authors[], year, venue, volume, issue, pages, publisher,
//   doi, url, oaUrl, cited, lang, abstract, isbn }

const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const yearOf = (v) => {
  const m = String(v ?? '').match(/(1[5-9]\d\d|20\d\d)/)
  return m ? +m[1] : null
}
const normDoi = (d) => (d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase() : '')

export function makeKey(r) {
  if (r.doi) return 'doi:' + normDoi(r.doi)
  if (r.isbn) return 'isbn:' + r.isbn
  return 't:' + clean(r.title).toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '').slice(0, 80) + ':' + (r.year || '')
}

function finish(r) {
  const out = {
    type: 'article',
    authors: [],
    venue: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    doi: '',
    url: '',
    oaUrl: '',
    cited: null,
    lang: '',
    abstract: '',
    isbn: '',
    ...r,
  }
  out.title = clean(out.title) || '—'
  out.doi = normDoi(out.doi)
  if (!out.url && out.doi) out.url = `https://doi.org/${out.doi}`
  out.key = makeKey(out)
  return out
}

function invertAbstract(inv) {
  if (!inv || typeof inv !== 'object') return ''
  const pairs = []
  for (const [w, idx] of Object.entries(inv)) for (const i of idx) pairs.push([i, w])
  return pairs
    .sort((a, b) => a[0] - b[0])
    .map((p) => p[1])
    .join(' ')
}

const OA_TYPES = { article: 'article', 'book-chapter': 'chapter', book: 'book', dissertation: 'thesis', review: 'article' }

// ---------------------------------------------------------------- OpenAlex
const OA = 'https://api.openalex.org'

function oaParams(url, { apiKey } = {}) {
  if (apiKey) url.searchParams.set('api_key', apiKey)
  return url
}

export function openAlexFilter({ fromYear, toYear, lang, oaOnly, extraFilter, precise, query } = {}) {
  const f = []
  // «Точный» режим: искать только в названии и аннотации, а не в полных текстах
  if (precise && query) f.push(`title_and_abstract.search:${String(query).replace(/[,:]/g, ' ').trim()}`)
  if (fromYear) f.push(`from_publication_date:${fromYear}-01-01`)
  if (toYear) f.push(`to_publication_date:${toYear}-12-31`)
  if (lang) f.push(`language:${lang}`)
  if (oaOnly) f.push('is_oa:true')
  if (extraFilter) f.push(extraFilter)
  return f.join(',')
}

/** Короткий ID OpenAlex из URL: https://openalex.org/S3127539 → S3127539 */
export const oaShortId = (key) => String(key || '').split('/').pop()

export async function searchOpenAlex(query, opts = {}) {
  const url = new URL(`${OA}/works`)
  url.searchParams.set('search', query) // ранжирование по релевантности; точность даёт фильтр title_and_abstract
  url.searchParams.set('per_page', String(opts.limit || 25))
  if (opts.sort) url.searchParams.set('sort', opts.sort)
  url.searchParams.set(
    'select',
    'id,doi,title,display_name,publication_year,authorships,primary_location,biblio,cited_by_count,open_access,language,type,abstract_inverted_index'
  )
  const filter = openAlexFilter({ ...opts, query })
  if (filter) url.searchParams.set('filter', filter)
  oaParams(url, opts)
  const data = await apiGet('OpenAlex', url)
  return {
    total: data.meta?.count ?? null,
    items: (data.results || []).map((w) =>
      finish({
        source: 'OpenAlex',
        type: OA_TYPES[w.type] || (w.type === 'book' ? 'book' : 'article'),
        title: w.title || w.display_name,
        authors: (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean),
        year: w.publication_year,
        venue: w.primary_location?.source?.display_name || '',
        publisher: w.primary_location?.source?.host_organization_name || '',
        volume: w.biblio?.volume || '',
        issue: w.biblio?.issue || '',
        pages: [w.biblio?.first_page, w.biblio?.last_page].filter(Boolean).join('–'),
        doi: w.doi,
        url: w.doi ? '' : w.primary_location?.landing_page_url || w.id,
        oaUrl: w.open_access?.oa_url || '',
        cited: w.cited_by_count,
        lang: w.language || '',
        abstract: invertAbstract(w.abstract_inverted_index).slice(0, 1500),
      })
    ),
  }
}

/** Агрегаты OpenAlex: group_by=publication_year | primary_location.source.id | authorships.author.id | language | topics.id */
export async function openAlexGroup(query, groupBy, opts = {}) {
  const url = new URL(`${OA}/works`)
  url.searchParams.set('search', query) // ранжирование по релевантности; точность даёт фильтр title_and_abstract
  url.searchParams.set('group_by', groupBy)
  const filter = openAlexFilter({ ...opts, query })
  if (filter) url.searchParams.set('filter', filter)
  oaParams(url, opts)
  const data = await apiGet('OpenAlex', url)
  return {
    total: data.meta?.count ?? null,
    groups: (data.group_by || []).map((g) => ({ key: g.key, name: g.key_display_name || g.key, count: g.count })),
  }
}

// ---------------------------------------------------------------- Crossref
export async function searchCrossref(query, opts = {}) {
  const url = new URL('https://api.crossref.org/works')
  url.searchParams.set('query.bibliographic', query)
  url.searchParams.set('rows', String(opts.limit || 25))
  url.searchParams.set(
    'select',
    'DOI,title,author,issued,container-title,volume,issue,page,type,URL,is-referenced-by-count,publisher,abstract,ISBN'
  )
  const f = []
  if (opts.fromYear) f.push(`from-pub-date:${opts.fromYear}`)
  if (opts.toYear) f.push(`until-pub-date:${opts.toYear}`)
  if (f.length) url.searchParams.set('filter', f.join(','))
  url.searchParams.set('mailto', 'dh-course@samdu.uz')
  const data = await apiGet('Crossref', url)
  return {
    total: data.message?.['total-results'] ?? null,
    items: (data.message?.items || []).map((w) =>
      finish({
        source: 'Crossref',
        type: /book/.test(w.type || '') ? (w.type === 'book-chapter' ? 'chapter' : 'book') : 'article',
        title: (w.title || [])[0],
        authors: (w.author || []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name).filter(Boolean),
        year: yearOf(w.issued?.['date-parts']?.[0]?.[0]),
        venue: (w['container-title'] || [])[0] || '',
        volume: w.volume || '',
        issue: w.issue || '',
        pages: (w.page || '').replace('-', '–'),
        publisher: w.publisher || '',
        doi: w.DOI,
        cited: w['is-referenced-by-count'] ?? null,
        lang: w.language || '',
        abstract: clean(w.abstract).slice(0, 1500),
        isbn: (w.ISBN || [])[0] || '',
      })
    ),
  }
}

// ---------------------------------------------------------------- Semantic Scholar
export async function searchSemanticScholar(query, opts = {}) {
  const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search')
  url.searchParams.set('query', query)
  url.searchParams.set('limit', String(Math.min(opts.limit || 25, 50)))
  url.searchParams.set('fields', 'title,year,authors,citationCount,externalIds,url,abstract,openAccessPdf,venue,journal')
  if (opts.fromYear || opts.toYear) url.searchParams.set('year', `${opts.fromYear || ''}-${opts.toYear || ''}`)
  const data = await apiGet('Semantic Scholar', url)
  return {
    total: data.total ?? null,
    items: (data.data || []).map((w) =>
      finish({
        source: 'Semantic Scholar',
        title: w.title,
        authors: (w.authors || []).map((a) => a.name).filter(Boolean),
        year: w.year,
        venue: w.journal?.name || w.venue || '',
        volume: w.journal?.volume || '',
        pages: (w.journal?.pages || '').replace('-', '–'),
        doi: w.externalIds?.DOI || '',
        url: w.externalIds?.DOI ? '' : w.url,
        oaUrl: w.openAccessPdf?.url || '',
        cited: w.citationCount ?? null,
        abstract: clean(w.abstract).slice(0, 1500),
      })
    ),
  }
}

// ---------------------------------------------------------------- DOAJ (журналы открытого доступа)
export async function searchDOAJ(query, opts = {}) {
  const q = encodeURIComponent(query)
  const url = new URL(`https://doaj.org/api/search/articles/${q}`)
  url.searchParams.set('pageSize', String(Math.min(opts.limit || 25, 100)))
  const data = await apiGet('DOAJ', url)
  return {
    total: data.total ?? null,
    items: (data.results || [])
      .map((r) => r.bibjson || {})
      .filter((b) => !opts.fromYear || +b.year >= +opts.fromYear)
      .filter((b) => !opts.toYear || +b.year <= +opts.toYear)
      .map((b) =>
        finish({
          source: 'DOAJ',
          title: b.title,
          authors: (b.author || []).map((a) => a.name).filter(Boolean),
          year: yearOf(b.year),
          venue: b.journal?.title || '',
          volume: b.journal?.volume || '',
          issue: b.journal?.number || '',
          pages: [b.start_page, b.end_page].filter(Boolean).join('–'),
          publisher: b.journal?.publisher || '',
          doi: (b.identifier || []).find((i) => (i.type || '').toLowerCase() === 'doi')?.id || '',
          oaUrl: (b.link || [])[0]?.url || '',
          url: (b.link || [])[0]?.url || '',
          lang: (b.journal?.language || [])[0] || '',
          abstract: clean(b.abstract).slice(0, 1500),
        })
      ),
  }
}

// ---------------------------------------------------------------- Google Books
export async function searchGoogleBooks(query, opts = {}) {
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', String(Math.min(opts.limit || 20, 40)))
  url.searchParams.set('printType', 'books')
  if (opts.lang) url.searchParams.set('langRestrict', opts.lang)
  const data = await apiGet('Google Books', url)
  return {
    total: data.totalItems ?? null,
    items: (data.items || [])
      .map((v) => v.volumeInfo || {})
      .filter((b) => !opts.fromYear || (yearOf(b.publishedDate) || 0) >= +opts.fromYear)
      .filter((b) => !opts.toYear || (yearOf(b.publishedDate) || 9999) <= +opts.toYear)
      .map((b) =>
        finish({
          source: 'Google Books',
          type: 'book',
          title: [b.title, b.subtitle].filter(Boolean).join(' : '),
          authors: b.authors || [],
          year: yearOf(b.publishedDate),
          publisher: b.publisher || '',
          pages: b.pageCount ? String(b.pageCount) : '',
          isbn: (b.industryIdentifiers || []).find((i) => /ISBN_13/.test(i.type))?.identifier || '',
          url: b.infoLink || b.previewLink || '',
          oaUrl: b.accessInfo?.pdf?.isAvailable ? b.previewLink : '',
          lang: b.language || '',
          abstract: clean(b.description).slice(0, 1200),
        })
      ),
  }
}

// ---------------------------------------------------------------- Open Library
export async function searchOpenLibrary(query, opts = {}) {
  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(Math.min(opts.limit || 20, 50)))
  url.searchParams.set('fields', 'key,title,subtitle,author_name,first_publish_year,publisher,isbn,language,edition_count,number_of_pages_median')
  const data = await apiGet('Open Library', url)
  return {
    total: data.numFound ?? null,
    items: (data.docs || [])
      .filter((b) => !opts.fromYear || (b.first_publish_year || 0) >= +opts.fromYear)
      .filter((b) => !opts.toYear || (b.first_publish_year || 9999) <= +opts.toYear)
      .map((b) =>
        finish({
          source: 'Open Library',
          type: 'book',
          title: [b.title, b.subtitle].filter(Boolean).join(' : '),
          authors: b.author_name || [],
          year: b.first_publish_year,
          publisher: (b.publisher || [])[0] || '',
          pages: b.number_of_pages_median ? String(b.number_of_pages_median) : '',
          isbn: (b.isbn || [])[0] || '',
          url: `https://openlibrary.org${b.key}`,
          lang: (b.language || [])[0] || '',
          abstract: b.edition_count ? `Изданий в каталоге: ${b.edition_count}` : '',
        })
      ),
  }
}

export const SOURCES = [
  { id: 'openalex', name: 'OpenAlex', fn: searchOpenAlex, what: 'Статьи, книги, диссертации; ~250 млн записей; цитирования, открытый доступ', on: true },
  { id: 'crossref', name: 'Crossref', fn: searchCrossref, what: 'Все работы с DOI, в т. ч. русскоязычные журналы', on: true },
  { id: 's2', name: 'Semantic Scholar', fn: searchSemanticScholar, what: 'Научный поиск с аннотациями (лимит запросов строгий)', on: false },
  { id: 'doaj', name: 'DOAJ', fn: searchDOAJ, what: 'Статьи из журналов открытого доступа — все с полным текстом', on: true },
  { id: 'gbooks', name: 'Google Books', fn: searchGoogleBooks, what: 'Книги и монографии, в т. ч. на русском', on: true },
  { id: 'openlib', name: 'Open Library', fn: searchOpenLibrary, what: 'Каталог книг и изданий (Internet Archive)', on: false },
]

/** Поиск во всех выбранных источниках параллельно, слияние дублей по DOI/ISBN/названию. */
export async function searchAll(query, sourceIds, opts = {}) {
  const chosen = SOURCES.filter((s) => sourceIds.includes(s.id))
  const settled = await Promise.allSettled(chosen.map((s) => s.fn(query, opts)))
  const status = {}
  const merged = new Map()
  settled.forEach((r, i) => {
    const s = chosen[i]
    if (r.status === 'fulfilled') {
      status[s.id] = { ok: true, n: r.value.items.length, total: r.value.total }
      for (const it of r.value.items) {
        const prev = merged.get(it.key)
        if (!prev) merged.set(it.key, { ...it, sources: [it.source] })
        else {
          // дополняем пустые поля из другого источника
          for (const k of Object.keys(it)) if (!prev[k] && it[k]) prev[k] = it[k]
          if (!prev.sources.includes(it.source)) prev.sources.push(it.source)
          prev.cited = Math.max(prev.cited ?? 0, it.cited ?? 0) || prev.cited
        }
      }
    } else {
      status[s.id] = { ok: false, error: r.reason?.message || 'ошибка' }
    }
  })
  return { items: [...merged.values()], status }
}

// ---------------------------------------------------------------- Автор: Wikidata, Wikipedia, Gutendex
const WD_UA = {}

export async function wikidataSearch(name, lang = 'ru') {
  const url = new URL('https://www.wikidata.org/w/api.php')
  Object.entries({ action: 'wbsearchentities', search: name, language: lang, uselang: lang, type: 'item', limit: '7', format: 'json', origin: '*' }).forEach(
    ([k, v]) => url.searchParams.set(k, v)
  )
  const data = await apiGet('Wikidata', url, { headers: WD_UA })
  return (data.search || []).map((x) => ({ qid: x.id, label: x.label, description: x.description || '' }))
}

async function sparql(query) {
  const url = new URL('https://query.wikidata.org/sparql')
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')
  const data = await apiGet('Wikidata SPARQL', url, { headers: { Accept: 'application/sparql-results+json' } })
  return data.results?.bindings || []
}

export async function wikidataAuthor(qid) {
  const facts = await sparql(`SELECT ?prop ?valLabel WHERE {
  VALUES (?p ?prop) { (wdt:P569 "Дата рождения") (wdt:P570 "Дата смерти") (wdt:P19 "Место рождения")
    (wdt:P20 "Место смерти") (wdt:P27 "Гражданство") (wdt:P1412 "Язык") (wdt:P135 "Направление")
    (wdt:P166 "Награда") (wdt:P69 "Образование") (wdt:P106 "Род занятий") }
  wd:${qid} ?p ?val .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`)
  const works = await sparql(`SELECT ?work ?workLabel (MIN(YEAR(?d)) AS ?year) WHERE {
  ?work wdt:P50 wd:${qid} .
  OPTIONAL { ?work wdt:P577 ?d }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
} GROUP BY ?work ?workLabel ORDER BY ?year LIMIT 300`)
  const site = await sparql(`SELECT ?article ?img WHERE {
  OPTIONAL { ?article schema:about wd:${qid} ; schema:isPartOf <https://ru.wikipedia.org/> . }
  OPTIONAL { wd:${qid} wdt:P18 ?img }
} LIMIT 1`)
  const groups = {}
  for (const b of facts) {
    const p = b.prop.value
    const v = b.valLabel.value.replace(/T00:00:00Z$/, '')
    groups[p] = groups[p] ? [...new Set([...groups[p], v])] : [v]
  }
  return {
    facts: groups,
    works: works
      .map((b) => ({ title: b.workLabel?.value, year: b.year ? +b.year.value : null, url: b.work.value }))
      .filter((w) => w.title && !/^Q\d+$/.test(w.title)),
    wikiUrl: site[0]?.article?.value || '',
    image: site[0]?.img?.value || '',
  }
}

export async function wikipediaSummary(articleUrl) {
  if (!articleUrl) return null
  const title = decodeURIComponent(articleUrl.split('/wiki/')[1] || '')
  if (!title) return null
  const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const d = await apiGet('Wikipedia', url)
  return { extract: d.extract || '', url: d.content_urls?.desktop?.page || articleUrl, thumb: d.thumbnail?.source || '' }
}

export async function gutendexAuthor(nameLatin) {
  const url = new URL('https://gutendex.com/books/')
  url.searchParams.set('search', nameLatin)
  const d = await apiGet('Gutendex', url)
  return (d.results || []).map((b) => ({
    title: b.title,
    langs: (b.languages || []).join(', '),
    downloads: b.download_count,
    txt: b.formats?.['text/plain; charset=utf-8'] || b.formats?.['text/plain; charset=us-ascii'] || b.formats?.['text/plain'] || '',
    url: `https://www.gutenberg.org/ebooks/${b.id}`,
  }))
}

// ---------------------------------------------------------------- Код для Colab
export function pythonFor(url) {
  return `import requests, pandas as pd
r = requests.get("${url}", timeout=60)
r.raise_for_status()
data = r.json()
data  # посмотрите структуру, затем: pd.json_normalize(data["results"])`
}

/** Одна работа по DOI (Crossref) — для ручного добавления в список. */
export async function fetchByDOI(doiRaw) {
  const doi = String(doiRaw || '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
  if (!/^10\.\d{4,9}\//.test(doi)) throw new Error('Это не похоже на DOI (должно начинаться с 10.)')
  const data = await apiGet('Crossref', `https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  const w = data.message || {}
  return finish({
    source: 'Crossref',
    type: /book/.test(w.type || '') ? (w.type === 'book-chapter' ? 'chapter' : 'book') : 'article',
    title: (w.title || [])[0],
    authors: (w.author || []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name).filter(Boolean),
    year: yearOf(w.issued?.['date-parts']?.[0]?.[0]),
    venue: (w['container-title'] || [])[0] || '',
    volume: w.volume || '',
    issue: w.issue || '',
    pages: (w.page || '').replace('-', '–'),
    publisher: w.publisher || '',
    doi: w.DOI || doi,
    cited: w['is-referenced-by-count'] ?? null,
    abstract: clean(w.abstract).slice(0, 1500),
    isbn: (w.ISBN || [])[0] || '',
  })
}

/** Сколько работ OpenAlex находит по запросу (лёгкий запрос: 1 запись). */
export async function openAlexCount(query, opts = {}) {
  const url = new URL(`${OA}/works`)
  url.searchParams.set('search', query)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('select', 'id')
  const filter = openAlexFilter({ ...opts, query })
  if (filter) url.searchParams.set('filter', filter)
  oaParams(url, opts)
  const data = await apiGet('OpenAlex', url, { sample: false })
  return data.meta?.count ?? 0
}

// Синонимы для расширения слишком узкого запроса (англ. — язык большинства каталогов)
const SYN = [
  [/^(eastern|east|oriental|orient)$/i, ['Orient', 'Orientalism', 'East']],
  [/^(woman|women|female|feminine)$/i, ['women', 'heroine', 'female', 'gender']],
  [/^(memory|memories|remembrance)$/i, ['memory', 'nostalgia', 'past']],
  [/^(love|eros|romance)$/i, ['love', 'eros', 'desire']],
  [/^(space|place|landscape)$/i, ['space', 'landscape', 'topos']],
  [/^(image|images|imagery)$/i, ['image', 'representation']],
  [/^(motif|motifs|theme)$/i, ['motif', 'theme']],
  [/^(death|dying)$/i, ['death', 'mortality']],
  [/^(city|urban)$/i, ['city', 'urban']],
  [/^(heroine|heroines)$/i, ['heroine', 'female character', 'women']],
]

/** Варианты запроса: «имя + понятие/синоним», без одного слова, с синонимами. */
export function queryVariants(q) {
  const words = String(q || '')
    .replace(/["«»]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const syn = (w) => SYN.filter(([re]) => re.test(w)).flatMap(([, alts]) => alts)
  const out = []
  const add = (v) => {
    const k = v.trim()
    if (k && k !== words.join(' ') && !out.includes(k)) out.push(k)
  }
  const name = words.find((w) => /^[A-ZА-ЯЁ]/.test(w))
  if (name) {
    for (const w of words.filter((x) => x !== name)) {
      add(`${name} ${w}`)
      syn(w).forEach((a) => add(`${name} ${a}`))
    }
  }
  if (words.length >= 2) words.forEach((_, i) => add(words.filter((__, j) => j !== i).join(' ')))
  words.forEach((w, i) => syn(w).forEach((a) => add(words.map((x, j) => (j === i ? a : x)).join(' '))))
  return out.slice(0, 10)
}
