/**
 * Данные для Л11: гипотезы по «Тёмным аллеям», корпус, контракт JSON,
 * учебный mock и сборка промптов для живого вызова DeepSeek.
 */

export const DEEPSEEK_DEFAULTS = {
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  temperature: 0.2,
  maxTokens: 700,
}

export const KEY_STORAGE = 'dh_deepseek_key'

/* ——— Корпус ——— */

export const DARK_ALLEYS = [
  { slug: 'temnye-allei', title: 'Тёмные аллеи', part: 1 },
  { slug: 'kavkaz', title: 'Кавказ', part: 1 },
  { slug: 'ballada', title: 'Баллада', part: 1 },
  { slug: 'stepa', title: 'Степа', part: 1 },
  { slug: 'muza', title: 'Муза', part: 1 },
  { slug: 'pozdnij-chas', title: 'Поздний час', part: 1 },
  { slug: 'rusya', title: 'Руся', part: 2 },
  { slug: 'krasavica', title: 'Красавица', part: 2 },
  { slug: 'durochka', title: 'Дурочка', part: 2 },
  { slug: 'antigona', title: 'Антигона', part: 2 },
  { slug: 'smaragd', title: 'Смарагд', part: 2 },
  { slug: 'volki', title: 'Волки', part: 2 },
  { slug: 'vizitnye-kartochki', title: 'Визитные карточки', part: 2 },
  { slug: 'zojka-i-valeriya', title: 'Зойка и Валерия', part: 2 },
  { slug: 'tanya', title: 'Таня', part: 2 },
  { slug: 'v-parizhe', title: 'В Париже', part: 2 },
  { slug: 'galya-ganskaya', title: 'Галя Ганская', part: 2 },
  { slug: 'genrih', title: 'Генрих', part: 2 },
  { slug: 'natali', title: 'Натали', part: 2 },
  { slug: 'v-odnoj-znakomoj-ulice', title: 'В одной знакомой улице', part: 3 },
  { slug: 'rechnoj-traktir', title: 'Речной трактир', part: 3 },
  { slug: 'kuma', title: 'Кума', part: 3 },
  { slug: 'nachalo', title: 'Начало', part: 3 },
  { slug: 'dubki', title: 'Дубки', part: 3 },
  { slug: 'madrid', title: 'Мадрид', part: 3 },
  { slug: 'vtoroj-kofejnik', title: 'Второй кофейник', part: 3 },
  { slug: 'holodnaya-osen', title: 'Холодная осень', part: 3 },
  { slug: 'parohod-saratov', title: 'Пароход «Саратов»', part: 3 },
  { slug: 'voron', title: 'Ворон', part: 3 },
  { slug: 'kamarg', title: 'Камарг', part: 3 },
  { slug: 'sto-rupij', title: 'Сто рупий', part: 3 },
  { slug: 'mest', title: 'Месть', part: 3 },
  { slug: 'kacheli', title: 'Качели', part: 3 },
  { slug: 'chistyj-ponedelnik', title: 'Чистый понедельник', part: 3 },
  { slug: 'chasovnya', title: 'Часовня', part: 3 },
  { slug: 'vesnoj-v-iudee', title: 'Весной, в Иудее', part: 3 },
  { slug: 'nochleg', title: 'Ночлег', part: 3 },
]

export const DEFAULT_STORIES = ['temnye-allei', 'holodnaya-osen', 'natali', 'chistyj-ponedelnik', 'kavkaz']

/** Нормализация lib.ru-текста: абзацы через пустую строку, без «шапки»/«подвала» сайта. */
export function normalizeStory(raw) {
  let t = String(raw || '').replace(/\r/g, '')
  const footer = t.search(/Главная страница|Поделиться ссылкой/)
  if (footer > 0) t = t.slice(0, footer)
  return t
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}

/** Отрезок ~maxChars по границе предложения: начало или финал рассказа. */
export function makeExcerpt(text, maxChars = 2000, position = 'start') {
  if (text.length <= maxChars) return text
  if (position === 'end') {
    const tail = text.slice(-maxChars)
    const cut = tail.search(/[.!?…]\s+[А-ЯЁ"«-]/)
    return (cut >= 0 && cut < maxChars * 0.4 ? tail.slice(cut + 1) : tail).trim()
  }
  const head = text.slice(0, maxChars)
  const last = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '), head.lastIndexOf('.\n'))
  return (last > maxChars * 0.6 ? head.slice(0, last + 1) : head).trim()
}

export function wordCount(text) {
  return (String(text).match(/[а-яёa-z]+/gi) || []).length
}

/* ——— Зачем API ——— */

export const CHAT_DEMO = {
  question: 'Где в «Тёмных аллеях» формула «всё проходит» опровергается памятью героев?',
  chat: `Вы: Посмотри «Тёмные аллеи» — есть там ирония забвения?
Модель: Безусловно! Бунин мастерски показывает, как…
Вы: А в «Натали»?
Модель: Здесь тоже прослеживается глубокая тема…
Вы: А в «Холодной осени»? Сравни.
Модель: В отличие от предыдущих, здесь… (тон уже другой,
        критерий «опровержения» незаметно поменялся)
…ещё 30 реплик, три эссе разной длины…`,
  csv: `id,memory_stance,thesis,quotes,confidence
temnye-allei,persistence,"Формула спорит с памятью","Все проходит, да не все забывается",0.86
holodnaya-osen,persistence,"Жизнь сведена к одному вечеру","только тот холодный осенний вечер",0.82
kavkaz,none,,,0.12`,
}

export const CHAT_VS_API = {
  chat: {
    title: 'Чат (ChatGPT, Claude, DeepSeek в окне)',
    items: [
      'Каждый новый вопрос — в контексте прошлых ответов: тон дрейфует',
      'Формулировка задачи меняется от реплики к реплике',
      'Ответ — эссе; 5 эссе нельзя сложить в таблицу',
      'Хорош для пилота: 2–3 фрагмента, отладка промпта',
      'Через месяц не воспроизвести: какая модель? какой промпт?',
    ],
  },
  api: {
    title: 'API-конвейер (скрипт или этот стенд)',
    items: [
      'Каждый фрагмент — отдельный «чистый» запрос, без памяти',
      'Один шаблон промпта на весь корпус (prompt_v1.md)',
      'Ответ — JSON с фиксированными полями → строка CSV',
      'Пустая цитата и выдумка видны как метрики',
      'Лог: модель, temperature, дата, версия промпта',
    ],
  },
}

export const TRIANGLE = [
  {
    id: 'corpus',
    title: 'Корпус',
    q: 'Фрагментов больше, чем можно честно перечитать с одним критерием за вечер?',
    example: '37 рассказов «Тёмных аллей» в корпусе курса × начало и финал = 74 фрагмента.',
  },
  {
    id: 'feature',
    title: 'Сложность признака',
    q: 'Признак нельзя поймать словарём или регуляркой, но можно описать правилом?',
    example: '«Оценка + её опровержение» — не ключевое слово, а отношение между репликами.',
  },
  {
    id: 'audit',
    title: 'Аудит',
    q: 'Можно проверить каждую строку по источнику за 30 секунд?',
    example: 'Цитата дословная → Ctrl+F. Нет цитаты → честный ноль, а не «вдохновение».',
  },
]

/* ——— Гипотезы ——— */

export const BASE_FIELDS = [
  { key: 'id', desc: 'строка: повтори fragment_id без изменений' },
  { key: 'thesis', desc: 'одно предложение о наблюдаемом во фрагменте или null' },
  { key: 'quotes', desc: 'массив 0–3 дословных цитат из фрагмента (до 25 слов каждая), символ в символ' },
  { key: 'confidence', desc: 'число от 0 до 1 — сигнал для очереди проверки, не истина' },
  { key: 'flags', desc: 'массив строк из разрешённого списка' },
]

export const HYPOTHESES = [
  {
    id: 'irony',
    title: 'Ирония: оценка ↔ опровержение',
    short: 'Где утверждение героя или рассказчика опровергается в том же фрагменте?',
    question:
      'Где в «Тёмных аллеях» оценка (героя или рассказчика) сталкивается с опровержением в пределах одного фрагмента — и всегда ли это ирония?',
    operationalization:
      'Ирония засчитывается, только если во фрагменте есть (а) явная оценка или утверждение и (б) реплика, деталь или событие, которые её опровергают. Грустный тон без столкновения — не ирония.',
    unit: 'Начало или финал рассказа, ~2000 знаков (одна сцена).',
    extraFields: `evaluation_span: дословная оценка/утверждение из фрагмента или null
rebuttal_span: дословное опровержение из фрагмента или null
irony_type: одно из "verbal" | "situational" | "none"`,
    flags: 'irony_risk, reported_speech, no_irony_evidence, insufficient_context',
    honestZero:
      'Если пары «оценка — опровержение» нет: thesis=null, quotes=[], evaluation_span=null, rebuttal_span=null, irony_type="none", flags=["no_irony_evidence"].',
    whyApi:
      'В чате модель «находит» иронию везде. Контракт требует обе половины столкновения дословно — каждую строку проверяют поиском по тексту.',
    cue: /притвор|будто|как будто|однако|впрочем|усмех|смеш|шутк|ну и что|разумеется|конечно/i,
    mockThesis: 'Кандидат на столкновение оценки и опровержения',
  },
  {
    id: 'memory',
    title: 'Память и «всё проходит»',
    short: 'Подтверждает фрагмент забвение — или стойкость памяти?',
    question:
      'Как в цикле работает формула забвения («всё проходит», «всё забывается»): утверждается она или опровергается памятью героев?',
    operationalization:
      'Отмечаем высказывания о прошлом, воспоминании, забвении. Позиция фрагмента: забвение / стойкость памяти / двойственность. Без слов о прошлом или памяти — честный ноль.',
    unit: 'Финал рассказа, ~2000 знаков (там чаще звучит итог).',
    extraFields: `memory_stance: одно из "forgetting" | "persistence" | "ambivalent" | "none"
memory_trigger: дословная деталь, запускающая воспоминание, или null
time_gap: дистанция во времени словами текста (напр. «тридцать лет») или null`,
    flags: 'formula_present, retrospective_narration, reported_speech, no_memory_evidence',
    honestZero:
      'Если о памяти/забвении во фрагменте ничего нет: thesis=null, quotes=[], memory_stance="none", memory_trigger=null, time_gap=null, flags=["no_memory_evidence"].',
    whyApi:
      'Формула «всё проходит» звучит в одном рассказе явно, в других — скрыто. Серия с одним критерием показывает, где позиция действительно есть, а где мы её «вчитываем».',
    cue: /помн|вспомин|забыв|забуд|проход|прошл|давно|лет назад|никогда|тогда/i,
    mockThesis: 'Кандидат: фрагмент говорит о памяти или забвении',
  },
  {
    id: 'space',
    title: 'Пространство и топосы',
    short: 'Сад, аллея, дорога, станция, Париж: где встреча, где разлука?',
    question:
      'Какие топосы (сад, аллея, дорога, станция, усадьба, город, Париж, Кавказ…) несут сюжет встречи или разлуки и как они оценены?',
    operationalization:
      'Фиксируем только места, названные во фрагменте дословно. Функция топоса: встреча / разлука / ожидание / воспоминание / фон. Место, о котором «известно из биографии», не считается.',
    unit: 'Начало рассказа, ~2000 знаков (экспозиция места).',
    extraFields: `toposes: массив дословных названий мест из фрагмента
topos_function: одно из "meeting" | "parting" | "waiting" | "memory" | "background" | "none"
contrast_pair: противопоставление мест словами текста (напр. «усадьба ↔ город») или null`,
    flags: 'named_place, interior, exterior, no_topos_evidence',
    honestZero:
      'Если мест во фрагменте не названо: thesis=null, quotes=[], toposes=[], topos_function="none", contrast_pair=null, flags=["no_topos_evidence"].',
    whyApi:
      'Топосов десятки, рассказов 37. Таблица «рассказ × место × функция» — основа для карты цикла в Л12; в чате получится только эссе о «бунинском саде».',
    cue: /сад|алле|дорог|станци|вокзал|усадьб|Москв|Париж|Кавказ|море|поезд|изб|горниц|улиц|гостиниц|вагон|Арбат/i,
    mockThesis: 'Кандидат: во фрагменте назван топос',
  },
  {
    id: 'voice',
    title: 'Ненадёжность и чужая речь',
    short: 'Чей голос несёт оценку? Где рассказчику нельзя верить на слово?',
    question:
      'Чей голос несёт оценку во фрагменте — рассказчика, героя или «чужое слово»? Есть ли текстуальные сигналы ненадёжности рассказчика?',
    operationalization:
      'Различаем прямую речь, несобственно-прямую, пересказ. Флаг ненадёжности ставим только при сигнале в тексте: самоопровержение, оговорка, «казалось», противоречие с событием.',
    unit: 'Начало рассказа, ~2000 знаков.',
    extraFields: `voice: одно из "narrator" | "character" | "free_indirect" | "mixed"
speaker: кто говорит (словами текста) или null
unreliability_signal: дословная цитата-сигнал ненадёжности или null`,
    flags: 'reported_speech, first_person, self_correction, no_unreliability_evidence',
    honestZero:
      'Если сигнала ненадёжности нет: unreliability_signal=null и flags содержит "no_unreliability_evidence"; thesis описывает только голос, без домыслов.',
    whyApi:
      'Модели любят приписывать «ненадёжного рассказчика» любой прозе от первого лица. Поле-сигнал с дословной цитатой отделяет наблюдение от модного ярлыка.',
    cue: /сказал|казал|думал|будто|кажется|может быть|должно быть|право|помнится/i,
    mockThesis: 'Кандидат: оценка дана через чужую речь',
  },
  {
    id: 'time',
    title: 'Время и «единственный вечер»',
    short: '«Холодная осень»: жизнь = один вечер. Частный случай или модель цикла?',
    question:
      'Повторяется ли в цикле модель «Холодной осени» — жизнь, сведённая к одному вечеру или мгновению, — или это частный случай?',
    operationalization:
      'Фиксируем временные маркеры и сжатие/растяжение времени. «Единственный момент» засчитываем только при явной формуле итога («только тот вечер», «это всё, что было»).',
    unit: 'Финал рассказа, ~2000 знаков.',
    extraFields: `time_markers: массив дословных временных маркеров из фрагмента
single_moment: true или false — есть ли явная формула «единственного момента»
time_scale: одно из "moment" | "day" | "season" | "years" | "life"`,
    flags: 'retrospective_narration, summary_formula, ellipsis_in_time, no_time_evidence',
    honestZero:
      'Если формулы итога нет: single_moment=false и flags содержит "no_time_evidence"; quotes — только временные маркеры, без «вчитанной» трагедии.',
    whyApi:
      'Сравнить «Холодную осень» с 36 другими финалами вручную можно, но долго и с дрейфом критерия. API применяет одно правило ко всем финалам — дальше проверяем пики.',
    cue: /вечер|ночь|утр|осен|зим|весн|лет |год|час|минут|никогда|навсегда|всю жизнь/i,
    mockThesis: 'Кандидат: временной маркер или формула итога',
  },
  {
    id: 'custom',
    title: 'Своя гипотеза',
    short: 'Сформулируйте признак сами — поля JSON соберутся из формы.',
    question: '',
    operationalization: '',
    unit: 'Фрагмент ~2000 знаков.',
    extraFields: `feature_span: дословная цитата-опора для признака или null
feature_present: true или false`,
    flags: 'feature_candidate, insufficient_context, no_evidence',
    honestZero: 'Если признака нет: thesis=null, quotes=[], feature_span=null, feature_present=false, flags=["no_evidence"].',
    whyApi: 'Опишите, почему признак не ловится словарём, но проверяется по цитате.',
    cue: /./,
    mockThesis: 'Кандидат по своей гипотезе',
  },
]

/** "key: описание" построчно → [{key, desc}] */
export function parseExtraFields(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      const key = (i > 0 ? line.slice(0, i) : line).trim().replace(/[^a-zA-Z0-9_]/g, '_')
      return { key, desc: i > 0 ? line.slice(i + 1).trim() : 'строка или null' }
    })
    .filter((f) => f.key)
}

export function parseFlags(text) {
  return String(text || '')
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function requiredKeys(spec) {
  return [...BASE_FIELDS.map((f) => f.key), ...parseExtraFields(spec.extraFields).map((f) => f.key)]
}

export function promptVersion(spec, bad) {
  return bad ? `${spec.id}_leading_v0` : `${spec.id}_v1`
}

/* ——— Сборка промптов ——— */

export function buildSystemPrompt(spec) {
  const extra = parseExtraFields(spec.extraFields)
  const fieldLines = [...BASE_FIELDS, ...extra].map((f) => `- "${f.key}": ${f.desc}`).join('\n')
  return `Ты — измерительный инструмент филолога-исследователя, а не эссеист.
Корпус: И. А. Бунин, цикл «Тёмные аллеи». Анализируй ТОЛЬКО присланный фрагмент.

Исследовательский вопрос: ${spec.question || '(не задан)'}
Операционализация: ${spec.operationalization || '(не задана)'}

Верни ТОЛЬКО один JSON-объект (без markdown, без пояснений) строго с ключами:
${fieldLines}

Разрешённые flags: ${parseFlags(spec.flags).join(', ') || '—'}

Правило честного нуля: ${spec.honestZero || 'если опоры нет — thesis=null, quotes=[]'}

Запрещено: придумывать или «улучшать» цитаты; пересказывать сюжет вне фрагмента; опираться на знание других рассказов цикла и биографии Бунина.`
}

export function buildBadSystemPrompt(spec) {
  const extra = parseExtraFields(spec.extraFields)
  const keys = [...BASE_FIELDS, ...extra].map((f) => f.key).join(', ')
  return `Ты — блестящий литературовед. ${spec.question || 'Найди интересный приём.'}
Этот приём у Бунина есть всегда — обязательно найди его в каждом фрагменте. Всегда заполни thesis и quotes, будь убедителен и глубок.
Ответь JSON с ключами: ${keys}.`
}

export function buildUserPrompt(frag) {
  return `fragment_id: ${frag.id}
рассказ: «${frag.title}» (И. А. Бунин, «Тёмные аллеи»)
часть рассказа: ${frag.position === 'end' ? 'финал' : 'начало'}

ТЕКСТ ФРАГМЕНТА:
"""
${frag.text}
"""

Верни JSON по контракту.`
}

/* ——— Разбор и проверка ответа ——— */

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"„“”]/g, '"')
    .replace(/[—–-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

export function quoteInSource(quote, source) {
  if (!String(quote || '').trim() || !source) return false
  const q = norm(quote).replace(/^[".…\s]+|[".…\s]+$/g, '')
  return norm(source).includes(q)
}

export function extractJson(content) {
  let s = String(content || '').trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) s = s.slice(a, b + 1)
  return JSON.parse(s)
}

/** Возвращает строку таблицы: поля ответа + результаты проверок. */
export function validateAnswer(content, frag, spec) {
  const errors = []
  let data = null
  try {
    data = extractJson(content)
  } catch (e) {
    return {
      id: frag.id,
      parseError: true,
      errors: [`JSON не разобран: ${e.message}`],
      quotes: [],
      flags: [],
      extra: {},
      valid: false,
    }
  }
  const keys = requiredKeys(spec)
  const missing = keys.filter((k) => !(k in data))
  if (missing.length) errors.push(`нет ключей: ${missing.join(', ')}`)
  if (data.id && data.id !== frag.id) errors.push(`id «${data.id}» ≠ ${frag.id}`)
  const quotes = Array.isArray(data.quotes) ? data.quotes.map(String).filter((q) => q.trim()) : []
  if (data.quotes != null && !Array.isArray(data.quotes)) errors.push('quotes не массив')
  const conf = Number(data.confidence)
  if (Number.isNaN(conf) || conf < 0 || conf > 1) errors.push('confidence вне 0..1')
  const flags = Array.isArray(data.flags) ? data.flags.map(String) : []
  const allowed = parseFlags(spec.flags)
  const unknownFlags = allowed.length ? flags.filter((f) => !allowed.includes(f)) : []
  if (unknownFlags.length) errors.push(`неразрешённые flags: ${unknownFlags.join(', ')}`)
  const quoteChecks = quotes.map((q) => ({ q, ok: quoteInSource(q, frag.text) }))
  const extra = {}
  parseExtraFields(spec.extraFields).forEach((f) => {
    extra[f.key] = data[f.key] ?? null
  })
  const thesis = data.thesis == null || String(data.thesis).trim() === '' ? null : String(data.thesis)
  return {
    id: frag.id,
    thesis,
    quotes,
    confidence: Number.isNaN(conf) ? null : conf,
    flags,
    extra,
    quoteChecks,
    hallucinated: quoteChecks.some((c) => !c.ok),
    emptyWithThesis: Boolean(thesis) && quotes.length === 0,
    honestZero: !thesis && quotes.length === 0,
    errors,
    parseError: false,
    valid: errors.length === 0,
  }
}

/* ——— Учебный mock (без сети): честная эвристика по ключевым словам ——— */

function sentences(text) {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

function firstWords(s, n = 22) {
  const words = s.split(/\s+/)
  return words.slice(0, n).join(' ')
}

function mockExtra(field, quote) {
  const d = field.desc
  const options = [...d.matchAll(/"([a-z_]+)"/g)].map((m) => m[1])
  if (/массив/.test(d)) return quote ? [firstWords(quote, 3).replace(/[,.;:!?]+$/, '')] : []
  if (/true или false/.test(d)) return Boolean(quote)
  if (options.length) return quote ? options[0] : options.includes('none') ? 'none' : options[options.length - 1]
  return quote ? firstWords(quote, 10) : null
}

export function mockAnswer(frag, spec, bad = false) {
  const extraFields = parseExtraFields(spec.extraFields)
  const flagsAllowed = parseFlags(spec.flags)
  const zeroFlag = flagsAllowed.find((f) => f.startsWith('no_')) || 'no_evidence'
  const hits = sentences(frag.text).filter((s) => spec.cue.test(s))
  const quote = hits[0] ? firstWords(hits[0]) : null

  const out = { id: frag.id }
  if (bad) {
    const anySentence = hits[0] || sentences(frag.text)[1] || sentences(frag.text)[0] || ''
    const invented = `${firstWords(anySentence, 9)} — и в этом вся горькая усмешка автора`
    out.thesis = `Здесь Бунин блестяще раскрывает: ${spec.title.toLowerCase()}`
    out.quotes = [frag.index % 2 === 1 ? invented : firstWords(anySentence)]
    out.confidence = 0.95
    out.flags = [flagsAllowed[0] || 'feature_candidate']
    extraFields.forEach((f) => {
      out[f.key] = mockExtra(f, anySentence)
    })
  } else if (quote) {
    out.thesis = `${spec.mockThesis} (учебный mock — проверить вручную)`
    out.quotes = [quote]
    out.confidence = Math.min(0.85, 0.45 + hits.length * 0.08)
    out.flags = [flagsAllowed[0] || 'feature_candidate']
    extraFields.forEach((f) => {
      out[f.key] = mockExtra(f, quote)
    })
  } else {
    out.thesis = null
    out.quotes = []
    out.confidence = 0.1
    out.flags = [zeroFlag]
    extraFields.forEach((f) => {
      out[f.key] = mockExtra(f, null)
    })
  }
  return JSON.stringify(out, null, 2)
}

/* ——— Экспорт ——— */

export function rowsToCsv(rows, spec) {
  const extraKeys = parseExtraFields(spec.extraFields).map((f) => f.key)
  const header = [
    'id',
    'title',
    'position',
    'thesis',
    'quotes',
    'confidence',
    'flags',
    ...extraKeys,
    'valid',
    'errors',
    'quotes_not_in_source',
    'empty_quotes_with_thesis',
    'audit',
    'model',
    'prompt_version',
    'temperature',
    'mode',
  ]
  const cell = (v) => {
    const s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const body = rows.map((r) =>
    [
      r.id,
      r.title,
      r.position,
      r.thesis,
      r.quotes,
      r.confidence,
      r.flags,
      ...extraKeys.map((k) => r.extra?.[k]),
      r.valid ? 1 : 0,
      (r.errors || []).join('; '),
      (r.quoteChecks || []).filter((c) => !c.ok).length,
      r.emptyWithThesis ? 1 : 0,
      r.audit || '',
      r.model,
      r.prompt,
      r.temperature,
      r.mode,
    ]
      .map(cell)
      .join(',')
  )
  return `\uFEFF${header.join(',')}\n${body.join('\n')}\n`
}

const pyStr = (s) => JSON.stringify(String(s ?? ''))

/** Самодостаточный .py (только стандартная библиотека) с текущей конфигурацией стенда. Ключ — из переменной окружения. */
export function buildPythonScript({ spec, stories, position, maxChars, endpoint, model, temperature, bad }) {
  const system = bad ? buildBadSystemPrompt(spec) : buildSystemPrompt(spec)
  const keys = requiredKeys(spec)
  const base = endpoint.replace(/\/chat\/completions\/?$/, '')
  return `# -*- coding: utf-8 -*-
"""
Л11 · LLM-конвейер по «Тёмным аллеям» (Бунин) — скрипт, собранный на сайте курса.
Гипотеза: ${spec.title}
Версия промпта: ${promptVersion(spec, bad)}
Создан: ${new Date().toISOString().slice(0, 10)}

Запуск (PyCharm → Terminal):
    export DEEPSEEK_API_KEY=sk-...        # Windows PowerShell: $env:DEEPSEEK_API_KEY="sk-..."
    python pipeline_from_site.py

Или положите рядом файл .env со строкой DEEPSEEK_API_KEY=sk-...
Тексты ищутся в папке sample_texts/ рядом со скриптом (есть в ZIP курса).
Если файла нет — скрипт скачает рассказ с сайта курса.

Только стандартная библиотека Python 3.8+ — pip install не нужен.
КЛЮЧ В КОД НЕ ВПИСЫВАЙТЕ и не публикуйте на GitHub.
"""
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", ${pyStr(base)})
MODEL = ${pyStr(model)}
TEMPERATURE = ${Number(temperature)}
POSITION = ${pyStr(position)}          # "start" — начало рассказа, "end" — финал
MAX_CHARS = ${Number(maxChars)}
STORIES = ${JSON.stringify(stories.map((s) => [s.slug, s.title]), null, 4).replace(/\n/g, '\n')}
REQUIRED_KEYS = ${JSON.stringify(keys)}
PROMPT_VERSION = ${pyStr(promptVersion(spec, bad))}
SITE_TEXTS = "https://pavelaleks.github.io/samarkand_lectures/demo-downloads/stylometry/sample_texts/"

SYSTEM_PROMPT = ${pyStr(system)}


def load_env():
    env = HERE / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def normalize(raw):
    raw = raw.replace("\\r", "")
    m = re.search(r"Главная страница|Поделиться ссылкой", raw)
    if m:
        raw = raw[: m.start()]
    paras = [re.sub(r"\\s+", " ", p).strip() for p in re.split(r"\\n\\s*\\n", raw)]
    return "\\n\\n".join(p for p in paras if p)


def excerpt(text):
    if len(text) <= MAX_CHARS:
        return text
    if POSITION == "end":
        tail = text[-MAX_CHARS:]
        m = re.search(r"[.!?…]\\s+", tail)
        return tail[m.end():].strip() if m and m.start() < MAX_CHARS * 0.4 else tail
    head = text[:MAX_CHARS]
    cut = max(head.rfind(". "), head.rfind("! "), head.rfind("? "))
    return head[: cut + 1] if cut > MAX_CHARS * 0.6 else head


def load_story(slug):
    local = HERE / "sample_texts" / f"{slug}.txt"
    if local.exists():
        return normalize(local.read_text(encoding="utf-8"))
    with urllib.request.urlopen(SITE_TEXTS + slug + ".txt", timeout=30) as r:
        return normalize(r.read().decode("utf-8"))


def user_prompt(fid, title, text):
    part = "финал" if POSITION == "end" else "начало"
    return (
        f"fragment_id: {fid}\\nрассказ: «{title}» (И. А. Бунин, «Тёмные аллеи»)\\n"
        f"часть рассказа: {part}\\n\\nТЕКСТ ФРАГМЕНТА:\\n\\"\\"\\"\\n{text}\\n\\"\\"\\"\\n\\nВерни JSON по контракту."
    )


def call_deepseek(key, user):
    body = {
        "model": MODEL,
        "temperature": TEMPERATURE,
        "max_tokens": ${DEEPSEEK_DEFAULTS.maxTokens},
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
    }
    req = urllib.request.Request(
        BASE_URL.rstrip("/") + "/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def parse_json(content):
    s = content.strip()
    m = re.search(r"\`\`\`(?:json)?\\s*([\\s\\S]*?)\`\`\`", s)
    if m:
        s = m.group(1)
    s = s[s.find("{"): s.rfind("}") + 1]
    return json.loads(s)


def norm(s):
    s = str(s).lower().replace("ё", "е")
    s = re.sub(r"[«»\\"„“”]", '"', s)
    s = re.sub(r"[—–-]", "-", s)
    return re.sub(r"\\s+", " ", s).strip().strip('".… ')


def main():
    load_env()
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        sys.exit("Нет DEEPSEEK_API_KEY: задайте переменную окружения или файл .env")
    out = HERE / "output"
    for sub in ("raw", "tables", "errors"):
        (out / sub).mkdir(parents=True, exist_ok=True)

    rows = []
    for slug, title in STORIES:
        text = excerpt(load_story(slug))
        fid = slug
        print(f"→ {fid}: {len(text.split())} слов … ", end="", flush=True)
        try:
            resp = call_deepseek(key, user_prompt(fid, title, text))
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            (out / "errors" / f"{fid}.txt").write_text(f"HTTP {e.code}\\n{msg}", encoding="utf-8")
            print(f"HTTP {e.code} → output/errors/")
            continue
        content = resp["choices"][0]["message"]["content"]
        (out / "raw" / f"{fid}.json").write_text(json.dumps(resp, ensure_ascii=False, indent=2), encoding="utf-8")
        try:
            data = parse_json(content)
        except Exception as e:
            (out / "errors" / f"{fid}.txt").write_text(f"{e}\\n\\n{content}", encoding="utf-8")
            print("битый JSON → output/errors/")
            continue
        missing = [k for k in REQUIRED_KEYS if k not in data]
        quotes = [q for q in (data.get("quotes") or []) if str(q).strip()]
        not_found = [q for q in quotes if norm(q) not in norm(text)]
        row = {k: data.get(k) for k in REQUIRED_KEYS}
        row.update(
            title=title,
            missing_keys=";".join(missing),
            quotes_not_in_source=len(not_found),
            empty_quotes_with_thesis=int(bool(data.get("thesis")) and not quotes),
            model=resp.get("model", MODEL),
            prompt_version=PROMPT_VERSION,
            temperature=TEMPERATURE,
        )
        rows.append(row)
        print("ok" if not missing and not not_found else f"проверить: missing={missing} not_found={len(not_found)}")
        time.sleep(0.5)

    if rows:
        path = out / "tables" / "results.csv"
        with path.open("w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            for r in rows:
                w.writerow({k: (" | ".join(map(str, v)) if isinstance(v, list) else v) for k, v in r.items()})
        print(f"\\nГотово: {path}  ({len(rows)} строк). Дальше — аудит по источнику!")


if __name__ == "__main__":
    main()
`
}
