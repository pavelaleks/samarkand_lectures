import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/colab-bunin`
const GH_BLOB =
  'https://github.com/pavelaleks/samarkand_lectures/blob/main/public/demo-downloads/colab-bunin'
const COLAB_GH =
  'https://colab.research.google.com/github/pavelaleks/samarkand_lectures/blob/main/public/demo-downloads/colab-bunin'

const LABS = [
  {
    id: 'p01',
    pair: 'Пара 1',
    track: 'Бунин · демо',
    title: 'Частоты и графики',
    minutes: '80–90 мин',
    file: 'Para01_Bunin_chastoty_grafiki.ipynb',
    goal: 'Три рассказа Бунина: поля любовь/память/время на 1000 слов, столбцы и Zipf. Освоить пайплайн до переноса на диссертацию.',
    skills: ['корпус с сайта', 'частоты', 'matplotlib', 'паспорт графика'],
    starter: `import requests
BASE = "https://pavelaleks.github.io/samarkand_lectures/demo-corpora/bunin-temnye-allei/txt/"
for fname in ["kavkaz.txt", "holodnaya-osen.txt", "chistyj-ponedelnik.txt"]:
    text = requests.get(BASE + fname, timeout=60).text
    print(fname, len(text.split()), "слов~")`,
  },
  {
    id: 'p02',
    pair: 'Пара 2',
    track: 'Бунин · демо',
    title: 'Дуга тональности и локации',
    minutes: '80–90 мин',
    file: 'Para02_Bunin_duga_lokacii.ipynb',
    goal: 'Чанки «Холодной осени», учебный sentiment, сравнение мест с «Чистым понедельником».',
    skills: ['чанки', 'словарь POS/NEG', 'ограничения метода'],
    starter: `story = "Холодная осень"  # дуга по 8 чанкам — полный код в ноутбуке`,
  },
  {
    id: 'p03',
    pair: 'Пара 3',
    track: 'Диссертация',
    title: 'Паспорт корпуса и очистка',
    minutes: '80–90 мин',
    file: 'Para03_Korpus_pasport_dissertaciya.ipynb',
    goal: 'Загрузить свои .txt магистерской (или демо-Чехова), заполнить паспорт, зафиксировать правила очистки.',
    skills: ['паспорт корпуса', 'bias', 'clean.txt', 'опасные правила'],
    starter: `MODE = "thesis"  # или "demo"
THESIS_FILES = ["glava1.txt", "glava2.txt"]  # загрузите слева в Colab`,
  },
  {
    id: 'p04',
    pair: 'Пара 4',
    track: 'Диссертация',
    title: 'Zipf и частоты на своём тексте',
    minutes: '80–90 мин',
    file: 'Para04_Zipf_svoy_tekst.ipynb',
    goal: 'Перенос пары 1: свои смысловые поля под гипотезу диссертации + Zipf.',
    skills: ['свои стеммы', 'на 1000 слов', 'проверка цитатой'],
    starter: `MODE = "thesis"
FIELDS = {"поле_A": ["стем1"], "поле_B": ["стем2"]}  # под ваш вопрос`,
  },
  {
    id: 'p05',
    pair: 'Пара 5',
    track: 'Диссертация',
    title: 'Ключевые слова: текст vs фон',
    minutes: '80–90 мин',
    file: 'Para05_Klyuchevye_slova_kontrast.ipynb',
    goal: 'Contrast target (ваш материал) vs reference (Бунин/Чехов/второй автор); вручную отсеять мусор.',
    skills: ['keywords', 'корпус сравнения', 'ручной отбор'],
    starter: `# target = Path("glava1.txt").read_text(encoding="utf-8")
# reference = другой текст диссертации или рассказ с сайта`,
  },
  {
    id: 'p06',
    pair: 'Пара 6',
    track: 'Диссертация / Чехов',
    title: 'Стилиометрия mini-Delta',
    minutes: '80–90 мин',
    file: 'Para06_Stiliometriya_Delta_mini.ipynb',
    goal: 'Матрица близости по MFW для глав диссертации или рассказов Чехова. Гипотеза, не атрибуция.',
    skills: ['MFW', 'z-оценки', 'Delta', 'жанровый шум'],
    starter: `!pip -q install  # sklearn/numpy уже в Colab
# docs = {"глава1": ..., "глава2": ..., "контроль": ...}`,
  },
  {
    id: 'p07',
    pair: 'Пара 7',
    track: 'Диссертация',
    title: 'Дуга тональности на своём тексте',
    minutes: '80–90 мин',
    file: 'Para07_Duga_tonalnosti_dissertaciya.ipynb',
    goal: 'Свои POS/NEG под тему диссертации; экстремум дуги проверить чтением.',
    skills: ['свой словарь', 'чанки', 'ложная тональность'],
    starter: `MODE = "thesis"
THESIS_FILE = "glava1.txt"
POS = {"…"}; NEG = {"…"}  # под вашу тему`,
  },
  {
    id: 'p08',
    pair: 'Пара 8',
    track: 'Диссертация',
    title: 'Места и имена (учебный NER)',
    minutes: '80–90 мин',
    file: 'Para08_Mesta_imena_NER.ipynb',
    goal: 'Свои якоря мест/персон → таблица частот → бар; найти ложное срабатывание.',
    skills: ['списки якорей', 'false positive', 'зачем в главе'],
    starter: `PLACES = ["…"]  # места вашего текста
PERSONS = ["…"]`,
  },
  {
    id: 'p09',
    pair: 'Пара 9',
    track: 'Граф · Бунин или свой',
    title: 'NetworkX: граф совстречаемости',
    minutes: '80–90 мин',
    file: 'Para09_NetworkX_graf.ipynb',
    goal: 'Узлы = герои/мотивы (Бунин-демо или диссертация); правило ребра + порог веса.',
    skills: ['networkx', 'правило ребра', 'спорное ребро'],
    starter: `!pip -q install networkx
NODES = ["он", "она", "Москва"]  # замените на своих`,
  },
  {
    id: 'p10',
    pair: 'Пара 10',
    track: 'Диссертация / корпус',
    title: 'LDA: темы мини-корпуса',
    minutes: '80–90 мин',
    file: 'Para10_LDA_temy_mini_korpus.ipynb',
    goal: '6–12 документов (главы диссертации или рассказы); именование тем + таблица сомнений.',
    skills: ['sklearn LDA', 'K тем', 'тема ≠ мотив'],
    starter: `from sklearn.decomposition import LatentDirichletAllocation
K = 4  # попробуйте 3–5`,
  },
  {
    id: 'p11',
    pair: 'Пара 11',
    track: 'Диссертация · API',
    title: 'OpenAlex: библиография темы',
    minutes: '80–90 мин',
    file: 'Para11_OpenAlex_bibliografiya_temy.ipynb',
    goal: 'Три поисковых запроса под ваш вопрос → openalex_thesis_raw.txt → 5 полезных + 3 шумных.',
    skills: ['OpenAlex', 'JSON→TXT', 'отбор'],
    starter: `QUERIES = [
  '"Ваш Автор" keyword',
  'Ваш_термин AND literature',
]`,
    extraFiles: ['openalex_bunin.py'],
  },
  {
    id: 'p12',
    pair: 'Пара 12',
    track: 'Диссертация · API',
    title: 'Gutendex + Open Library + Wikidata',
    minutes: '80–90 мин',
    file: 'Para12_API_Gutendex_OL_Wikidata.ipynb',
    goal: 'Каталожный слой по автору диссертации + протокол сверки ответа LLM по изданию.',
    skills: ['Gutendex', 'Open Library', 'SPARQL', 'антигаллюцинация'],
    starter: `AUTHOR = "Ivan Bunin"  # автор вашей диссертации
AUTHOR_QID = "Q233005"  # найдите Q-id на wikidata.org`,
  },
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
  const [active, setActive] = useState(LABS[0].id)
  const lab = useMemo(() => LABS.find((l) => l.id === active) || LABS[0], [active])
  const colabUrl = `${COLAB_GH}/${lab.file}`
  const ghUrl = `${GH_BLOB}/${lab.file}`
  const dlUrl = `${DL}/${lab.file}`

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-teal-500/40 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/20 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200 mb-2">
          12 пар · Google Colab · Бунин + тексты магистерской
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Лаборатории Colab на весь курс
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mb-4">
          Пары 1–2 — общий пайплайн на Бунине. Пары 3–12 — в основном на{' '}
          <strong>ваших текстах диссертации</strong> (загрузка .txt в Colab); если файлов ещё нет, в ноутбуке есть
          демо на Чехове/Бунине. Базовый Colab бесплатный.
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1 mb-4">
          <li>
            Выберите пару → <strong>Открыть в Colab</strong> или скачайте .ipynb.
          </li>
          <li>
            Для диссертационных пар загрузите свои `.txt` (UTF-8) и поставьте <code>MODE = &quot;thesis&quot;</code>.
          </li>
          <li>Сдать с пары: график/таблица + цитата + ограничение метода.</li>
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
          <a
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-semibold"
            href={`${DL}/openalex_bunin.py`}
            download
          >
            openalex_bunin.py
          </a>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">12 лабораторных пар</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`text-left rounded-2xl p-4 border transition-all ${
                active === item.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 shadow'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">
                {item.pair} · {item.minutes}
              </div>
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 mb-1">{item.track}</div>
              <div className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.goal}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 space-y-4">
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
                {f}
              </a>
            ))}
          </div>
        ) : null}

        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">Стартовый код (скопировать в ячейку)</h4>
          <CopyBlock code={lab.starter} />
          <p className="text-xs text-gray-500 mt-2">
            Полный пайплайн — в ноутбуке. Если Colab из GitHub не открылся, скачайте .ipynb → Colab → Файл → Загрузить
            блокнот.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-teal-400/60 p-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-white">Правило занятия</h3>
        <p>
          <strong>вопрос → процедура → картинка → цитата → ограничение.</strong> Красивый график без цитаты не
          засчитывается.
        </p>
        <p>
          Диссертационные пары рассчитаны на ваши произведения: курс даёт метод, материал — из магистерской. Демо-корпуса
          Бунина и Чехова — запасной аэродром и общий язык группы.
        </p>
      </section>
    </div>
  )
}

export default ColabHandsOn
