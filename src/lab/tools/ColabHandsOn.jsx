import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/colab-bunin`
const GH_BLOB =
  'https://github.com/pavelaleks/samarkand_lectures/blob/main/public/demo-downloads/colab-bunin'
const COLAB_GH =
  'https://colab.research.google.com/github/pavelaleks/samarkand_lectures/blob/main/public/demo-downloads/colab-bunin'

const SETUP_CODE = `import requests, importlib
_u = "https://pavelaleks.github.io/samarkand_lectures/demo-downloads/colab-bunin/dh_utils.py"
open("dh_utils.py", "w", encoding="utf-8").write(requests.get(_u, timeout=60).text)
import dh_utils; importlib.reload(dh_utils)
from dh_utils import *
setup()

texts = load_texts("Мои файлы")          # или load_texts("Бунин (демо)", "Кавказ; Натали")
df, hits = field_table(texts, parse_fields("сад: сад, усадьба, аллея | память: помнить, вспомнить"))
kwic(texts, "сад")`

const LABS = [
  { id: 'p01', pair: 'Пара 1', track: 'Бунин · демо', title: 'Частоты смысловых полей и конкорданс',
    file: 'Para01_Bunin_chastoty_grafiki.ipynb', method: 'fields',
    goal: 'Поля «любовь / память / время» на 1000 слов в трёх рассказах, какие формы дали частоту, конкорданс для цитаты.',
    skills: ['гипотеза до подсчёта', 'леммы', 'на 1000 слов', 'конкорданс'],
    fields: 'STORIES · FIELDS · WORDS' },
  { id: 'p02', pair: 'Пара 2', track: 'Бунин · демо', title: 'Дуга тональности и места',
    file: 'Para02_Bunin_duga_lokacii.ipynb', method: 'arc',
    goal: 'Дуга «Холодной осени» по отрезкам с доказательными словами; сакральные и светские топосы «Чистого понедельника».',
    skills: ['отрезки', 'словарь POS/NEG', 'чтение экстремума', 'топосы'],
    fields: 'POS · NEG · N_SEGMENTS · PLACES' },
  { id: 'p03', pair: 'Пара 3', track: 'Ваш текст', title: 'Корпус диссертации: паспорт и очистка',
    file: 'Para03_Korpus_pasport_dissertaciya.ipynb', method: 'corpus',
    goal: 'Загрузить свои .txt/.docx, получить паспорт корпуса, STTR, очищенные файлы (zip).',
    skills: ['.txt и .docx', 'паспорт', 'STTR', 'опасные правила'],
    fields: 'SOURCE = «Мои файлы» · EDITION · WHY' },
  { id: 'p04', pair: 'Пара 4', track: 'Ваш текст', title: 'Закон Ципфа и частоты на своём тексте',
    file: 'Para04_Zipf_svoy_tekst.ipynb', method: 'fields',
    goal: 'Ципф как диагностика корпуса (α, R²) + смысловые поля под гипотезу вашей темы.',
    skills: ['α и R²', 'TTR vs STTR', 'свои поля'],
    fields: 'TOP_RANKS · FIELDS' },
  { id: 'p05', pair: 'Пара 5', track: 'Ваш текст vs фон', title: 'Ключевые слова: текст против фона',
    file: 'Para05_Klyuchevye_slova_kontrast.ipynb', method: 'keywords',
    goal: 'Log-likelihood (G²): какие слова значимо чаще в вашем тексте, чем в фоне; группировка в смысловые ряды.',
    skills: ['G²', 'выбор фона', 'ручная чистка', 'смысловые ряды'],
    fields: 'STORIES · REF_SOURCE · MIN_FREQ' },
  { id: 'p06', pair: 'Пара 6', track: 'Бунин vs Чехов → ваши', title: "Стилиометрия: Burrows's Delta",
    file: 'Para06_Stiliometriya_Delta_mini.ipynb', method: 'delta',
    goal: 'Матрица Delta и дерево близости по отрезкам; демо: 5 рассказов Бунина против 5 рассказов Чехова.',
    skills: ['MFW', 'отрезки', 'дерево', 'устойчивость'],
    fields: 'группы A и B · MFW · SEGMENT_WORDS' },
  { id: 'p07', pair: 'Пара 7', track: 'Ваш текст', title: 'Дуга тональности на материале диссертации',
    file: 'Para07_Duga_tonalnosti_dissertaciya.ipynb', method: 'arc',
    goal: 'Свой словарь под тему → дуга → таблица экстремумов → чтение отрезка целиком.',
    skills: ['свой словарь', 'экстремумы', 'ирония и отрицание'],
    fields: 'POS · NEG · N_SEGMENTS' },
  { id: 'p08', pair: 'Пара 8', track: 'Ваш текст', title: 'Имена и места (учебный NER)',
    file: 'Para08_Mesta_imena_NER.ipynb', method: 'ner',
    goal: 'Кандидаты в имена и топонимы по морфологии → ваша выверенная таблица сущностей → график.',
    skills: ['кандидаты', 'ручная проверка', 'варианты имён'],
    fields: 'ENTITIES' },
  { id: 'p09', pair: 'Пара 9', track: 'Ваш текст', title: 'Сеть персонажей',
    file: 'Para09_NetworkX_graf.ipynb', method: 'network',
    goal: 'Граф «Натали» (рассказчик, Соня, Натали…), центральность, таблица рёбер с предложением-доказательством.',
    skills: ['правило ребра', 'порог', 'центральность', 'спорное ребро'],
    fields: 'NODES · WINDOW · MIN_WEIGHT' },
  { id: 'p10', pair: 'Пара 10', track: 'Корпус', title: 'Тематическое моделирование (LDA)',
    file: 'Para10_LDA_temy_mini_korpus.ipynb', method: 'topics',
    goal: 'LDA на всём цикле (≈160 отрезков по 400 слов): темы, доли по рассказам, самый «чистый» отрезок темы.',
    skills: ['отрезки', 'K тем', 'ярлык после чтения', 'устойчивость'],
    fields: 'K · SEGMENT_WORDS · EXTRA_STOP' },
  { id: 'p11', pair: 'Пара 11', track: 'Ваша тема', title: 'Библиография под тему: OpenAlex',
    file: 'Para11_OpenAlex_bibliografiya_temy.ipynb', method: 'biblio',
    goal: 'Свои запросы → таблица работ (год, авторы, журнал, цитирования, DOI) в CSV → график по годам → ручной отбор.',
    skills: ['запросы', 'бесплатный ключ', 'CSV', 'ручной отбор'],
    fields: 'QUERIES · API_KEY',
    extraFiles: ['openalex_bunin.py'] },
  { id: 'p12', pair: 'Пара 12', track: 'Ваш автор', title: 'Справочные данные и проверка ответа ИИ',
    file: 'Para12_API_Gutendex_OL_Wikidata.ipynb', method: 'llm',
    goal: 'Wikidata и Open Library по автору; промпт для бесплатного чата ИИ и автоматическая проверка его цитат по тексту.',
    skills: ['Wikidata', 'Open Library', 'промпт', 'проверка цитат'],
    fields: 'AUTHOR · QUESTION · ANSWER' },
  { id: 'p13', pair: 'Пара 13', track: 'Ваша диссертация · веб', title: 'Streamlit: веб-панель своей диссертации',
    file: 'Para13_Streamlit_panel.ipynb', method: 'fields',
    goal: 'Запуск Streamlit прямо в Colab по ссылке (открывается и на телефоне): первое приложение → подключение API OpenAlex → «Панель моей диссертации» на своих текстах; свой раздел для предзащиты.',
    skills: ['Streamlit', 'виджеты', 'API → таблица', 'веб-панель', 'предзащита'],
    fields: 'APP · блок НАСТРОЙКИ в app_03_panel.py',
    extraFiles: ['../streamlit/app_01_hello.py', '../streamlit/app_02_openalex.py', '../streamlit/app_03_panel.py'] },
]

function CopyBlock({ code }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="relative">
      <pre className="text-xs sm:text-sm overflow-x-auto rounded-xl bg-slate-950 text-slate-100 p-4 leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        type="button"
        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-500"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code)
            setOk(true)
            setTimeout(() => setOk(false), 1500)
          } catch {
            setOk(false)
          }
        }}
      >
        {ok ? 'Скопировано' : 'Копировать'}
      </button>
    </div>
  )
}

export function ColabHandsOn() {
  const [active, setActive] = useState(() => {
    try {
      const n = new URLSearchParams(window.location.search).get('pair')
      return n && LABS.some((l) => l.id === `p${String(n).padStart(2, '0')}`) ? `p${String(n).padStart(2, '0')}` : LABS[0].id
    } catch {
      return LABS[0].id
    }
  })
  useEffect(() => {
    if (/[?&]pair=/.test(window.location.search)) {
      setTimeout(() => document.getElementById('lab-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [])
  const pick = (id) => {
    setActive(id)
    setTimeout(() => document.getElementById('lab-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const lab = useMemo(() => LABS.find((l) => l.id === active) || LABS[0], [active])
  const colabUrl = `${COLAB_GH}/${lab.file}`
  const ghUrl = `${GH_BLOB}/${lab.file}`
  const dlUrl = `${DL}/${lab.file}`

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => pick('p13')}
        className="w-full text-left rounded-2xl border-2 border-fuchsia-400 dark:border-fuchsia-600 bg-gradient-to-r from-fuchsia-50 to-violet-50 dark:from-fuchsia-950/30 dark:to-violet-950/20 p-4 sm:p-5 hover:shadow-lg transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <span className="flex-1">
          <span className="block text-xs font-bold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-200">Новое · пара 13</span>
          <span className="block text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Streamlit: веб-панель своей диссертации</span>
          <span className="block text-sm text-gray-700 dark:text-gray-300">Запуск прямо в Colab, ссылка открывается и на телефоне: первое приложение → API → панель на своих текстах.</span>
        </span>
        <span className="font-semibold text-fuchsia-900 dark:text-fuchsia-100 shrink-0">Открыть пару 13 →</span>
      </button>

      <section className="rounded-2xl border-2 border-teal-500/40 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/20 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200 mb-2">
          13 пар · Google Colab · бесплатно · Бунин → ваш текст
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Лаборатории Colab на весь курс
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mb-4">
          Каждая пара устроена одинаково: <strong>код спрятан, вы меняете только поля формы</strong>. Сначала запустите
          блокнот как есть — демо на Бунине или Чехове даёт осмысленный результат. Затем в ячейке «Тексты» выберите{' '}
          <strong>«Мои файлы»</strong> и загрузите главы или произведения своей магистерской (.txt или .docx). Базовый Colab
          бесплатный, устанавливать ничего не нужно.
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1 mb-4">
          <li>
            <strong>Открыть в Colab</strong> → <strong>Файл → Сохранить копию на Диске</strong>.
          </li>
          <li>Ячейки сверху вниз кнопкой ▶. Первая ячейка «Подготовка» ставит всё нужное (≈20 сек).</li>
          <li>В конце блокнота — образец абзаца для диссертации и список «Что сдать с пары».</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <a
            className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-600"
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Открыть Colab
          </a>
          <Link
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-teal-300 dark:border-teal-700 text-sm font-semibold text-teal-900 dark:text-teal-100"
            to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
          >
            Корпус Бунина
          </Link>
          <Link
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-teal-300 dark:border-teal-700 text-sm font-semibold text-teal-900 dark:text-teal-100"
            to="/courses/digital-humanities/demo/corpus/chekhov-rasskazy"
          >
            Корпус Чехова
          </Link>
          <Link
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500"
            to="/courses/digital-humanities/navigator"
          >
            Какой метод нужен моей теме?
          </Link>
          <a
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-semibold"
            href={`${DL}/dh_utils.py`}
            download
          >
            dh_utils.py
          </a>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">13 лабораторных пар</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              className={`text-left rounded-2xl p-4 border transition-all ${
                active === item.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 shadow'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">
                {item.pair} · 80–90 мин
              </div>
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 mb-1">{item.track}</div>
              <div className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.goal}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="lab-detail" className="scroll-mt-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {lab.pair}: {lab.title}
            </h3>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mt-1">{lab.track}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{lab.goal}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500"
              href={colabUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть в Colab
            </a>
            <a
              className="px-3 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
              href={dlUrl}
              download
            >
              Скачать .ipynb
            </a>
            <a
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold"
              href={ghUrl}
              target="_blank"
              rel="noreferrer"
            >
              Файл на GitHub
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {lab.skills.map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100"
            >
              {s}
            </span>
          ))}
        </div>

        {lab.extraFiles?.length ? (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Доп. файлы:{' '}
            {lab.extraFiles.map((f) => (
              <a key={f} className="underline font-semibold mr-3" href={`${DL}/${f}`} download>
                {f.split("/").pop()}
              </a>
            ))}
          </div>
        ) : null}

        <p className="text-sm text-gray-800 dark:text-gray-200">
          <span className="font-semibold">Что менять в форме: </span>
          <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900">{lab.fields}</code>
          {' · '}
          <Link className="text-teal-700 dark:text-teal-300 underline" to={`/courses/digital-humanities/navigator#method-${lab.method}`}>
            карточка метода
          </Link>
        </p>

        <details className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">
            Для продвинутых: те же функции в своём блокноте
          </summary>
          <div className="mt-3">
            <CopyBlock code={SETUP_CODE} />
            <p className="text-xs text-gray-500 mt-2">
              Если Colab из GitHub не открылся: скачайте .ipynb → colab.research.google.com → Файл → Загрузить блокнот.
            </p>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border border-dashed border-teal-400/60 p-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-white">Правило занятия</h3>
        <p>
          <strong>вопрос → процедура → картинка → цитата → ограничение.</strong> Красивый график без цитаты не
          засчитывается.
        </p>
        <p>
          Курс даёт метод, материал — из вашей магистерской. Демо-корпуса Бунина и Чехова — общий язык группы и образец
          того, как должен выглядеть результат. Всё, что получилось, переносите в{' '}
          <Link className="underline" to="/courses/digital-humanities/passport">
            «Методологический паспорт диссертации»
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

export default ColabHandsOn
