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
    id: 'p1',
    pair: 'Пара 1',
    title: 'Частоты и графики',
    minutes: '80–90 мин',
    file: 'Para1_Bunin_Colab_chastoty_grafiki.ipynb',
    goal: 'Загрузить три рассказа Бунина, посчитать поля любовь / память / время на 1000 слов, построить столбцы и Zipf.',
    skills: ['requests + URL корпуса', 'частоты', 'matplotlib', 'паспорт графика'],
    starter: `import requests
BASE = "https://pavelaleks.github.io/samarkand_lectures/demo-corpora/bunin-temnye-allei/txt/"
for fname in ["kavkaz.txt", "holodnaya-osen.txt", "chistyj-ponedelnik.txt"]:
    text = requests.get(BASE + fname, timeout=60).text
    print(fname, len(text.split()), "слов~")`,
  },
  {
    id: 'p2',
    pair: 'Пара 2',
    title: 'Дуга тональности и локации',
    minutes: '80–90 мин',
    file: 'Para2_Bunin_Colab_duga_lokacii.ipynb',
    goal: 'Эмоциональная дуга «Холодной осени», учебная карта мест, сравнение пространства с «Чистым понедельником».',
    skills: ['sentiment-эвристика', 'чанки текста', 'сравнение рассказов', 'ограничения словаря'],
    starter: `story = "Холодная осень"  # затем постройте дугу по 8 частям
# см. полный ноутбук: словари POS/NEG и chunk_text()`,
  },
  {
    id: 'p3',
    pair: 'Если быстро · API',
    title: 'OpenAlex: библиография вокруг Бунина',
    minutes: '25–40 мин',
    file: 'Para3_OpenAlex_API_Bunin.ipynb',
    goal: 'Подключить бесплатный API OpenAlex, сохранить openalex_bunin_raw.txt, отобрать 5 полезных работ.',
    skills: ['REST API', 'JSON → TXT', 'ручной отбор шума'],
    starter: `import requests
r = requests.get(
    "https://api.openalex.org/works",
    params={"search": '"Ivan Bunin"', "per-page": 5},
    timeout=60,
)
print(r.json()["meta"]["count"])
for w in r.json()["results"]:
    print(w["publication_year"], w["display_name"])`,
    extraFiles: ['openalex_bunin.py'],
  },
  {
    id: 'p4',
    pair: 'Если быстро · граф',
    title: 'NetworkX: совстречаемость в «Чистом понедельнике»',
    minutes: '25–40 мин',
    file: 'Para4_NetworkX_graf_Chistyj_ponedelnik.ipynb',
    goal: 'Построить граф узлов/рёбер по правилу окна предложений и обсудить спорное ребро.',
    skills: ['networkx', 'правило ребра', 'порог веса', 'рисунок графа'],
    starter: `!pip -q install networkx
import networkx as nx, matplotlib.pyplot as plt
G = nx.Graph()
G.add_edge("Рассказчик", "Она", weight=5)
G.add_edge("Она", "Москва", weight=3)
nx.draw(G, with_labels=True, node_color="#99f6e4", node_size=1200)
plt.show()`,
  },
  {
    id: 'p5',
    pair: 'Если быстро · API',
    title: 'Gutendex + Open Library',
    minutes: '20–35 мин',
    file: 'Para5_Gutendex_OpenLibrary_API.ipynb',
    goal: 'Два бесплатных книжных API без ключа: найти издания Bunin и построить столбики по годам.',
    skills: ['Gutendex', 'Open Library', 'каталог ≠ история рецепции'],
    starter: `import requests
print(requests.get("https://gutendex.com/books", params={"search": "Bunin"}, timeout=60).json()["count"])
ol = requests.get("https://openlibrary.org/search.json", params={"author": "Ivan Bunin", "limit": 10}, timeout=60).json()
print("Open Library", ol["numFound"])
for d in ol["docs"][:5]:
    print(d.get("first_publish_year"), d.get("title"))`,
  },
  {
    id: 'p6',
    pair: 'Если быстро · API + таблица',
    title: 'Wikidata SPARQL про Бунина',
    minutes: '20–35 мин',
    file: 'Para6_Wikidata_SPARQL_Bunin.ipynb',
    goal: 'Сделать SPARQL-запрос к Wikidata и визуализировать типы связанных сущностей.',
    skills: ['SPARQL', 'Wikidata', 'внешний слой фактов рядом с текстом'],
    starter: `import requests
q = '''SELECT ?item ?itemLabel WHERE {
  ?item ?p wd:Q233005 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
} LIMIT 10'''
r = requests.get(
    "https://query.wikidata.org/sparql",
    params={"query": q, "format": "json"},
    headers={"User-Agent": "SamGU-DH-Course/1.0"},
    timeout=60,
)
print(len(r.json()["results"]["bindings"]), "rows")`,
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
          Практика руками · Google Colab · цикл Бунина
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Лаборатории Colab: частоты, графики, API и графы
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mb-4">
          Базовый Colab <strong>бесплатный</strong> (нужен Google-аккаунт). Платный Colab Pro для этих заданий не
          нужен. Работайте на ноутбуках вместе: один код — общие графики — спор о тексте и методе.
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1 mb-4">
          <li>
            Откройте выбранную лабораторную кнопкой <strong>Открыть в Colab</strong> (или скачайте .ipynb и
            загрузите через «Файл → Загрузить блокнот»).
          </li>
          <li>
            Нажмите <strong>Подключить</strong> → выполняйте ячейки сверху вниз (Shift+Enter).
          </li>
          <li>Если закончили рано — переходите к блокам «Если быстро» (API и графы).</li>
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
            Корпус «Тёмные аллеи»
          </Link>
          <a
            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-semibold"
            href={`${DL}/openalex_bunin.py`}
            download
          >
            Скачать openalex_bunin.py
          </a>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Выберите лабораторную</h3>
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
            Полный пайплайн — в ноутбуке. Если «Открыть в Colab» из GitHub не сработало сразу после деплоя,
            скачайте .ipynb и загрузите вручную: Colab → Файл → Загрузить блокнот.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-teal-400/60 p-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-white">Правило занятия</h3>
        <p>
          <strong>вопрос → процедура → картинка → цитата → ограничение.</strong> Красивый график без цитаты не
          засчитывается как вывод.
        </p>
        <p>
          Бесплатные API на занятии: OpenAlex, Gutendex, Open Library, Wikidata. Не публикуйте ключи. Не долбите
          SPARQL запросами в цикле.
        </p>
      </section>
    </div>
  )
}

export default ColabHandsOn
