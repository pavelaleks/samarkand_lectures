/**
 * Кураторские топосы «Тёмных аллей» ↔ Wikidata.
 * fallbackLat/Lon — если у сущности нет P625 (регион / историческая область).
 * quote / why — чтобы на занятии было ясно, зачем строка в таблице.
 */

export const BUNIN_Q = {
  id: 'Q46602',
  label: 'Иван Бунин',
  labelEn: 'Ivan Bunin',
}

export const CYCLE_Q = {
  id: 'Q99769227',
  label: 'Тёмные аллеи (цикл)',
  labelEn: 'Dark Avenues (collection)',
}
export const TITLE_STORY_Q = {
  id: 'Q3230449',
  label: 'Тёмные аллеи (рассказ)',
  labelEn: 'Dark Avenues (story)',
}

/** Цвета маркеров по «зоне» цикла */
export const ZONE_COLORS = {
  russia: '#0d9488',
  europe: '#2563eb',
  caucasus: '#c2410c',
  mediterranean: '#7c3aed',
  near_east: '#a16207',
  balkans: '#be123c',
}

/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   story: string,
 *   label: string,
 *   labelEn: string,
 *   qid: string,
 *   zone: keyof typeof ZONE_COLORS,
 *   tip: string,
 *   why: string,
 *   quote: string,
 *   fallbackLat?: number,
 *   fallbackLon?: number,
 * }} Place
 */

/** @type {Place[]} */
export const CORPUS_PLACES = [
  {
    id: 'tula',
    slug: 'temnye-allei',
    story: 'Тёмные аллеи',
    label: 'Тула',
    labelEn: 'Tula',
    qid: 'Q2770',
    zone: 'russia',
    tip: 'Тульская дорога у станции',
    why: 'Задаёт «русскую» географию встречи Надежды и Николая — не столица, а губернский край.',
    quote: 'на одной из больших тульских дорог…',
  },
  {
    id: 'moscow-chistyj',
    slug: 'chistyj-ponedelnik',
    story: 'Чистый понедельник',
    label: 'Москва',
    labelEn: 'Moscow',
    qid: 'Q649',
    zone: 'russia',
    tip: 'Городской хронотоп',
    why: 'Плотная карта храмов, ресторанов, улиц — distant reading «городской» части цикла.',
    quote: 'Каждый вечер… я возил её ужинать в Прагу, в Эрмитаж, в Метрополь…',
  },
  {
    id: 'moscow-pozdnij',
    slug: 'pozdnij-chas',
    story: 'Поздний час',
    label: 'Москва',
    labelEn: 'Moscow',
    qid: 'Q649',
    zone: 'russia',
    tip: 'Город памяти',
    why: 'Та же Москва, но как воспоминание эмигранта — полезно сравнить с «Чистым понедельником».',
    quote: 'Я шёл и всё вспоминал…',
  },
  {
    id: 'caucasus',
    slug: 'kavkaz',
    story: 'Кавказ',
    label: 'Кавказ',
    labelEn: 'Caucasus',
    qid: 'Q18869',
    zone: 'caucasus',
    tip: 'Регион (часто без точной точки)',
    why: 'Показывает предел геокодера: «Кавказ» — ареал, не адрес. На карте — учебный центроид.',
    quote: 'Мы приехали в одно и то же местечко на Кавказе…',
    fallbackLat: 42.5,
    fallbackLon: 44.0,
  },
  {
    id: 'sochi',
    slug: 'kavkaz',
    story: 'Кавказ',
    label: 'Сочи',
    labelEn: 'Sochi',
    qid: 'Q39420',
    zone: 'caucasus',
    tip: 'Уточнение побережья',
    why: 'Контраст с «Кавказом-регионом»: конкретный курорт даёт другую геометрию интриги.',
    quote: '…у холодных серых волн… (побережье)',
  },
  {
    id: 'sarajevo',
    slug: 'holodnaya-osen',
    story: 'Холодная осень',
    label: 'Сараево',
    labelEn: 'Sarajevo',
    qid: 'Q11194',
    zone: 'balkans',
    tip: '1914 · большая история',
    why: 'Одна точка связывает интимный «прощальный вечер» с Первой мировой — идеальный мост close/distant.',
    quote: 'В Сараеве убит австрийский кронпринц. Это война!',
  },
  {
    id: 'paris',
    slug: 'v-parizhe',
    story: 'В Париже',
    label: 'Париж',
    labelEn: 'Paris',
    qid: 'Q90',
    zone: 'europe',
    tip: 'Эмигрантский топос',
    why: 'Европейский полюс цикла: без Парижа карта «Тёмных аллей» схлопывается в усадьбу.',
    quote: 'В Париже…',
  },
  {
    id: 'madrid',
    slug: 'madrid',
    story: 'Мадрид',
    label: 'Мадрид',
    labelEn: 'Madrid',
    qid: 'Q2807',
    zone: 'europe',
    tip: 'Ещё один европейский якорь',
    why: 'Расширяет карту цикла на юг Европы — не «только Франция эмиграции».',
    quote: 'Мадрид…',
  },
  {
    id: 'camargue',
    slug: 'kamarg',
    story: 'Камарг',
    label: 'Камарг',
    labelEn: 'Camargue',
    qid: 'Q218151',
    zone: 'mediterranean',
    tip: 'Редкий топоним',
    why: 'Геокодер и Wikidata особенно полезны, когда место «не на слуху» у аудитории.',
    quote: 'Камарг…',
    fallbackLat: 43.53,
    fallbackLon: 4.5,
  },
  {
    id: 'judea',
    slug: 'vesnoj-v-iudee',
    story: 'Весной, в Иудее',
    label: 'Иудея',
    labelEn: 'Judea',
    qid: 'Q104028',
    zone: 'near_east',
    tip: 'Историческая область',
    why: 'Библейская география ≠ современный GPS: учим ставить флаг ambiguity, не «рисовать точность».',
    quote: 'Весной, в Иудее…',
    fallbackLat: 31.7,
    fallbackLon: 35.2,
  },
  {
    id: 'natali-estate',
    slug: 'natali',
    story: 'Натали',
    label: 'Орёл (ориентир усадебного круга)',
    labelEn: 'Oryol',
    qid: 'Q3118',
    zone: 'russia',
    tip: 'Учебный ориентир дворянской провинции',
    why: '«Натали» держится на усадебной географии Центральной России; Орёл — ближайший крупный якорь для карты цикла.',
    quote: 'В то лето я впервые надел студенческий картуз…',
  },
]

export const STORY_OPTIONS = [
  { slug: 'all', title: 'Вся карта цикла (учебный набор)' },
  ...Array.from(new Map(CORPUS_PLACES.map((p) => [p.slug, { slug: p.slug, title: p.story }])).values()),
]

function qlist(places) {
  // unique qids
  const seen = new Set()
  const ids = []
  for (const p of places) {
    if (seen.has(p.qid)) continue
    seen.add(p.qid)
    ids.push(`wd:${p.qid}`)
  }
  return ids.join(' ')
}

export function buildPresets(places) {
  const values = qlist(places)
  const stories = [...new Set(places.map((p) => p.story))].join(', ')
  return [
    {
      id: 'map-rich',
      title: 'Карта топосов цикла',
      whyForPhilologist:
        'Получаем координаты, страну, тип и краткое описание сущности — чтобы увидеть географический разброс рассказов и не путать регион с городом.',
      researchQuestion: 'Где на карте «живут» выбранные рассказы — и какие зоны (Россия / Европа / Кавказ / Восток) доминируют?',
      blurb: `${places.length} строк · ${stories}`,
      autoMap: true,
      sparql: `SELECT ?place ?placeLabel ?placeDescription ?coord ?countryLabel ?typeLabel ?population WHERE {
  VALUES ?place { ${values} }
  OPTIONAL { ?place wdt:P625 ?coord. }
  OPTIONAL { ?place wdt:P17 ?country. }
  OPTIONAL { ?place wdt:P31 ?type. }
  OPTIONAL { ?place wdt:P1082 ?population. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'bunin-rich',
      title: 'Бунин: биография для паспорта',
      whyForPhilologist:
        'В паспорт корпуса и методологию работы нужны проверяемые даты, места жизни и награды — не «Википедия с экрана», а таблица с Q-id.',
      researchQuestion: 'Какие биографические факты об авторе цикла мы фиксируем как внешний слой (не как интерпретацию текста)?',
      blurb: `Сущность ${BUNIN_Q.id}`,
      autoMap: true,
      sparql: `SELECT ?person ?personLabel ?birth ?death ?birthPlaceLabel ?deathPlaceLabel ?citizenLabel ?awardLabel WHERE {
  BIND(wd:${BUNIN_Q.id} AS ?person)
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P19 ?birthPlace. }
  OPTIONAL { ?person wdt:P20 ?deathPlace. }
  OPTIONAL { ?person wdt:P27 ?citizen. }
  OPTIONAL { ?person wdt:P166 ?award. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'cycle-work',
      title: 'Произведение «Тёмные аллеи»',
      whyForPhilologist:
        'Связка автор ↔ произведение в Wikidata — якорь библиографии и рецепции (рядом с Open Library / Crossref).',
      researchQuestion: 'Как база знаний кодирует сам цикл: автор, язык, дата?',
      blurb: `Q-id цикла ${CYCLE_Q.id}`,
      autoMap: false,
      sparql: `SELECT ?work ?workLabel ?authorLabel ?inception ?langLabel WHERE {
  BIND(wd:${CYCLE_Q.id} AS ?work)
  OPTIONAL { ?work wdt:P50 ?author. }
  OPTIONAL { ?work wdt:P571 ?inception. }
  OPTIONAL { ?work wdt:P407 ?lang. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'types-contrast',
      title: 'Типы мест: город vs регион',
      whyForPhilologist:
        'Поле P31 (instance of) объясняет, почему «Кавказ» и «Сочи» нельзя класть на карту одинаковым маркером смысла.',
      researchQuestion: 'Какие сущности — города, а какие — регионы/исторические области?',
      blurb: 'Разбор омонимов и масштаба',
      autoMap: false,
      sparql: `SELECT ?place ?placeLabel (GROUP_CONCAT(DISTINCT ?typeLabel; SEPARATOR=", ") AS ?types) WHERE {
  VALUES ?place { ${values} }
  OPTIONAL { ?place wdt:P31 ?type. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
GROUP BY ?place ?placeLabel
ORDER BY ?placeLabel`,
    },
  ]
}

export function parseWktPoint(wkt) {
  if (!wkt) return null
  const m = String(wkt).match(/Point\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  if (!m) return null
  return { lon: +m[1], lat: +m[2] }
}

export async function runSparql(sparql) {
  const url =
    'https://query.wikidata.org/sparql?' +
    new URLSearchParams({ query: sparql, format: 'json' }).toString()
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
    },
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Wikidata HTTP ${res.status}: ${t.slice(0, 240)}`)
  }
  return res.json()
}

export function bindingsToRows(json) {
  const vars = json?.head?.vars || []
  const bindings = json?.results?.bindings || []
  return bindings.map((b) => {
    const row = {}
    for (const v of vars) row[v] = b[v]?.value ?? ''
    return row
  })
}

/** Свести ответ SPARQL + кураторские места → точки для живой карты */
export function buildMapFeatures(places, sparqlRows) {
  const byQ = new Map()
  for (const r of sparqlRows || []) {
    const q = String(r.place || '').replace('http://www.wikidata.org/entity/', '')
    if (!q) continue
    const pt = parseWktPoint(r.coord)
    byQ.set(q, {
      ...r,
      qid: q,
      lat: pt?.lat,
      lon: pt?.lon,
      fromWikidata: Boolean(pt),
    })
  }

  return places.map((p) => {
    const hit = byQ.get(p.qid) || {}
    const lat = hit.lat ?? p.fallbackLat
    const lon = hit.lon ?? p.fallbackLon
    const source = hit.fromWikidata ? 'wikidata' : p.fallbackLat != null ? 'centroid' : 'none'
    return {
      ...p,
      lat,
      lon,
      source,
      country: hit.countryLabel || '',
      typeLabel: hit.typeLabel || hit.types || '',
      description: hit.placeDescription || '',
      population: hit.population || '',
      color: ZONE_COLORS[p.zone] || '#0d9488',
    }
  })
}

export function enrichTable(places, sparqlRows) {
  const byQ = new Map()
  for (const r of sparqlRows || []) {
    const q = String(r.place || '').replace('http://www.wikidata.org/entity/', '')
    if (q) byQ.set(q, r)
  }
  return places.map((p) => {
    const hit = byQ.get(p.qid) || {}
    const pt = parseWktPoint(hit.coord)
    return {
      story: p.story,
      place: p.label,
      qid: p.qid,
      why: p.why,
      quote: p.quote,
      lat: pt?.lat ?? p.fallbackLat ?? '',
      lon: pt?.lon ?? p.fallbackLon ?? '',
      country: hit.countryLabel || '',
      type: hit.typeLabel || hit.types || '',
      description: hit.placeDescription || '',
      population: hit.population || '',
      coord_source: pt ? 'wikidata:P625' : p.fallbackLat != null ? 'учебный центроид' : 'нет',
    }
  })
}
