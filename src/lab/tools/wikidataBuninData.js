/**
 * Кураторские сущности Wikidata для демо по «Тёмным аллеям».
 * Q-id проверены как учебные якоря; омонимы разбираем на занятии.
 */

export const BUNIN_Q = {
  id: 'Q46602',
  label: 'Иван Бунин',
  labelEn: 'Ivan Bunin',
}

/** Места / реалии, связанные с рассказами цикла (для карты и SPARQL VALUES). */
export const CORPUS_PLACES = [
  { slug: 'temnye-allei', story: 'Тёмные аллеи', label: 'Тула', labelEn: 'Tula', qid: 'Q2770', tip: 'Губернский край дороги у станции' },
  { slug: 'kavkaz', story: 'Кавказ', label: 'Кавказ', labelEn: 'Caucasus', qid: 'Q18869', tip: 'Регион / хребет — не точка курорта' },
  { slug: 'kavkaz', story: 'Кавказ', label: 'Сочи', labelEn: 'Sochi', qid: 'Q39420', tip: 'Уточнение побережья' },
  { slug: 'v-parizhe', story: 'В Париже', label: 'Париж', labelEn: 'Paris', qid: 'Q90', tip: 'Эмигрантский топос' },
  { slug: 'holodnaya-osen', story: 'Холодная осень', label: 'Сараево', labelEn: 'Sarajevo', qid: 'Q11194', tip: '1914, точка большой истории' },
  { slug: 'chistyj-ponedelnik', story: 'Чистый понедельник', label: 'Москва', labelEn: 'Moscow', qid: 'Q649', tip: 'Городской хронотоп' },
  { slug: 'madrid', story: 'Мадрид', label: 'Мадрид', labelEn: 'Madrid', qid: 'Q2807', tip: 'Европейская карта цикла' },
  { slug: 'kamarg', story: 'Камарг', label: 'Камарг', labelEn: 'Camargue', qid: 'Q218151', tip: 'Редкий топоним' },
  { slug: 'vesnoj-v-iudee', story: 'Весной, в Иудее', label: 'Иудея', labelEn: 'Judea', qid: 'Q104028', tip: 'Библейская география ≠ GPS' },
  { slug: 'pozdnij-chas', story: 'Поздний час', label: 'Москва', labelEn: 'Moscow', qid: 'Q649', tip: 'Память о городе' },
]

export const STORY_OPTIONS = [
  { slug: 'all', title: 'Весь учебный набор мест цикла' },
  ...Array.from(
    new Map(
      CORPUS_PLACES.map((p) => [p.slug, { slug: p.slug, title: p.story }])
    ).values()
  ),
]

function qlist(places) {
  return places.map((p) => `wd:${p.qid}`).join(' ')
}

export function buildPresets(places) {
  const values = qlist(places)
  return [
    {
      id: 'bunin-bio',
      title: 'Бунин: даты и Nobel',
      blurb: 'Автор цикла как сущность Wikidata — якорь паспорта корпуса.',
      sparql: `SELECT ?person ?personLabel ?birth ?death ?awardLabel WHERE {
  BIND(wd:${BUNIN_Q.id} AS ?person)
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P166 ?award. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'places-coords',
      title: 'Места цикла → координаты',
      blurb: places.length
        ? `${places.length} сущностей (рассказ(ы): ${[...new Set(places.map((p) => p.story))].join(', ')})`
        : 'Выберите рассказ или весь набор',
      sparql: `SELECT ?place ?placeLabel ?coord ?countryLabel WHERE {
  VALUES ?place { ${values} }
  OPTIONAL { ?place wdt:P625 ?coord. }
  OPTIONAL { ?place wdt:P17 ?country. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'places-types',
      title: 'Тип места (instance of)',
      blurb: 'Город / регион / историческая область — видно, почему «Кавказ» ≠ «Сочи».',
      sparql: `SELECT ?place ?placeLabel ?typeLabel WHERE {
  VALUES ?place { ${values} }
  OPTIONAL { ?place wdt:P31 ?type. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}`,
    },
    {
      id: 'countries',
      title: 'Страны на карте цикла',
      blurb: 'Агрегат: какие государства «держат» выбранные топосы.',
      sparql: `SELECT ?country ?countryLabel (COUNT(?place) AS ?n) WHERE {
  VALUES ?place { ${values} }
  ?place wdt:P17 ?country.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
GROUP BY ?country ?countryLabel
ORDER BY DESC(?n)`,
    },
  ]
}

/** Parse WKT Point(lon lat) from Wikidata */
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
      'User-Agent': 'SamarkandDH-Course/1.0 (Bunin Dark Alleys lab)',
    },
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Wikidata HTTP ${res.status}: ${t.slice(0, 200)}`)
  }
  return res.json()
}

export function bindingsToRows(json) {
  const vars = json?.head?.vars || []
  const bindings = json?.results?.bindings || []
  return bindings.map((b) => {
    const row = {}
    for (const v of vars) {
      row[v] = b[v]?.value ?? ''
    }
    return row
  })
}
