import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NER_CYCLE } from './nerCycleData'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/ner-natasha`

const tabBtn = (active) =>
  `px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
    active
      ? 'bg-teal-600 text-white shadow'
      : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`

function Details({ title, children, defaultOpen = false }) {
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-2"
    >
      <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white py-2">{title}</summary>
      <div className="pb-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">{children}</div>
    </details>
  )
}

function HighlightedText({ text, spans }) {
  if (!text) return null
  if (!spans?.length) {
    return <p className="text-sm leading-relaxed font-serif whitespace-pre-wrap">{text}</p>
  }
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const parts = []
  let cur = 0
  sorted.forEach((sp, i) => {
    if (sp.start > cur) parts.push({ t: text.slice(cur, sp.start), key: `p${i}` })
    const color = NER_CYCLE.typeColors[sp.type] || '#94a3b8'
    parts.push({
      t: text.slice(sp.start, sp.end),
      key: `s${i}`,
      hl: true,
      type: sp.type,
      color,
      title: NER_CYCLE.typeLabels[sp.type] || sp.type,
    })
    cur = sp.end
  })
  if (cur < text.length) parts.push({ t: text.slice(cur), key: 'tail' })
  return (
    <p className="text-sm leading-relaxed font-serif">
      {parts.map((p) =>
        p.hl ? (
          <mark
            key={p.key}
            style={{ backgroundColor: `${p.color}33`, borderBottom: `2px solid ${p.color}` }}
            title={p.title}
            className="rounded px-0.5"
          >
            {p.t}
          </mark>
        ) : (
          <span key={p.key}>{p.t}</span>
        )
      )}
    </p>
  )
}

/** Pipeline diagram: text → tokens → NER tags → list */
function PipelineViz() {
  const steps = [
    { t: 'Текст', d: '«Холодная осень»…' },
    { t: 'Сегментация', d: 'предложения, токены (Razdel)' },
    { t: 'NER-модель', d: 'Slovnet + Navec' },
    { t: 'Сущности', d: 'PER / LOC / ORG' },
    { t: 'Аудит', d: 'вы черкаете FP глазами' },
  ]
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-x-auto">
      <div className="flex flex-wrap items-stretch gap-2 min-w-[640px]">
        {steps.map((s, i) => (
          <div key={s.t} className="flex items-center gap-2">
            <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/30 px-3 py-2 w-36">
              <div className="text-xs font-bold text-teal-800 dark:text-teal-300">
                {i + 1}. {s.t}
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-snug">{s.d}</div>
            </div>
            {i < steps.length - 1 && <span className="text-teal-600 font-bold">→</span>}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Natasha = удобный API над проектами{' '}
        <a className="underline" href="https://natasha.github.io" target="_blank" rel="noreferrer">
          natasha.github.io
        </a>
        : Razdel, Navec, Slovnet, Yargy, Ipymarkup.
      </p>
    </div>
  )
}

function TypeCards() {
  const cards = [
    {
      type: 'PER',
      color: NER_CYCLE.typeColors.PER,
      ex: 'Надежда, Николай Алексеевич',
      tip: 'Имя человека. Не путать с обращением «Хозяйка».',
    },
    {
      type: 'LOC',
      color: NER_CYCLE.typeColors.LOC,
      ex: 'Москва, Сараево, Галиция',
      tip: 'Место. В военных рассказах часто важнее PER.',
    },
    {
      type: 'ORG',
      color: NER_CYCLE.typeColors.ORG,
      ex: 'редко в «Тёмных аллеях»',
      tip: 'Организация. В художественной прозе почти нет.',
    },
    {
      type: 'UNK',
      color: NER_CYCLE.typeColors.UNK || '#94a3b8',
      ex: 'Как, Приезжий, Уходи',
      tip: 'На сайте: «слово с заглавной» ≠ сущность. Проверяйте.',
    },
  ]
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {cards.map((c) => (
        <div
          key={c.type}
          className="rounded-xl border p-4"
          style={{ borderColor: `${c.color}66`, background: `${c.color}14` }}
        >
          <div className="font-mono font-bold text-lg" style={{ color: c.color }}>
            {c.type}
          </div>
          <div className="text-sm font-medium mt-1">{NER_CYCLE.typeLabels[c.type] || c.type}</div>
          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-2">{c.ex}</div>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{c.tip}</p>
        </div>
      ))}
    </div>
  )
}

function ConceptsAndResults() {
  const demoSlugs = Object.keys(NER_CYCLE.demoTexts)
  const [demoSlug, setDemoSlug] = useState(demoSlugs.includes('holodnaya-osen') ? 'holodnaya-osen' : demoSlugs[0])
  const [storySlug, setStorySlug] = useState('temnye-allei')
  const [removed, setRemoved] = useState(() => new Set())

  const demo = NER_CYCLE.demoTexts[demoSlug]
  const story = NER_CYCLE.stories.find((s) => s.slug === storySlug) || NER_CYCLE.stories[0]
  const visible = useMemo(
    () => story.candidates.filter((c) => !removed.has(c.label.toLowerCase())),
    [story, removed]
  )

  const maxCount = Math.max(...Object.values(story.counts), 1)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Лекция 6 · зачем NER
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Кто и где в тексте — и как поставить Natasha у себя на ноутбуке
        </h3>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          Стилиометрия (лекция 5) сравнивает <em>как</em> написано (служебные слова). NER отвечает на другой
          вопрос: <strong>какие имена и места</strong> модель выделяет в потоке. Главное умение занятия — не
          «поверить Natasha», а <strong>установить библиотеку и проверить ложные срабатывания</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Понятие 1 · Конвейер Natasha
        </div>
        <PipelineViz />
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Понятие 2 · Типы сущностей
        </div>
        <TypeCards />
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Визуализация · подсветка фрагмента (учебная)
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          На сайте — заранее размеченный пример, чтобы понять идею. «Настоящая» Natasha — во вкладке «Установка»
          и в ZIP.
        </p>
        <div className="flex flex-wrap gap-2">
          {demoSlugs.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setDemoSlug(slug)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                demoSlug === slug ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {slug.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
          <HighlightedText text={demo?.text} spans={demo?.spans} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Визуализация · счётчики по рассказу + аудит FP
        </div>
        <label className="block text-sm">
          Рассказ цикла
          <select
            className="mt-1 w-full max-w-md rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
            value={storySlug}
            onChange={(e) => {
              setStorySlug(e.target.value)
              setRemoved(new Set())
            }}
          >
            {NER_CYCLE.stories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.part ? `Ч.${s.part} · ` : ''}
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          {['PER', 'LOC', 'UNK'].map((k) => (
            <div key={k} className="flex items-center gap-3 text-sm">
              <span className="w-12 font-mono font-bold" style={{ color: NER_CYCLE.typeColors[k] }}>
                {k}
              </span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(story.counts[k] / maxCount) * 100}%`,
                    background: NER_CYCLE.typeColors[k],
                  }}
                />
              </div>
              <span className="w-8 text-right font-bold tabular-nums">{story.counts[k]}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Клик «вычеркнуть» — учебный аудит ложных кандидатов (часто слова с заглавной). Корпус:{' '}
          <Link className="underline" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            «Тёмные аллеи»
          </Link>
        </p>
        <div className="overflow-auto max-h-72 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2">Кандидат</th>
                <th className="p-2">×</th>
                <th className="p-2">тип</th>
                <th className="p-2">аудит</th>
              </tr>
            </thead>
            <tbody>
              {story.candidates.slice(0, 20).map((c) => {
                const out = removed.has(c.label.toLowerCase())
                return (
                  <tr
                    key={c.label}
                    className={`border-t border-gray-100 dark:border-gray-800 ${out ? 'opacity-40 line-through' : ''}`}
                  >
                    <td className="p-2 font-medium">{c.label}</td>
                    <td className="p-2">{c.count}</td>
                    <td className="p-2 font-mono text-xs" style={{ color: NER_CYCLE.typeColors[c.type] }}>
                      {c.type}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-xs underline text-teal-700 dark:text-teal-400"
                        onClick={() => {
                          const k = c.label.toLowerCase()
                          setRemoved((prev) => {
                            const n = new Set(prev)
                            if (n.has(k)) n.delete(k)
                            else n.add(k)
                            return n
                          })
                        }}
                      >
                        {out ? 'вернуть' : 'вычеркнуть'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs">После аудита осталось: {visible.length} из {Math.min(20, story.candidates.length)}</p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Ловушки · false positive / false negative
        </div>
        <ul className="space-y-2 text-sm">
          {NER_CYCLE.traps.map((t) => (
            <li key={t.label} className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-3">
              <strong className="font-mono">{t.label}</strong> — {t.why}
            </li>
          ))}
        </ul>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold mb-2">Можно</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ставить Natasha локально и строить список PER/LOC как гипотезу.</li>
              <li>Сравнивать Natasha и «слова с заглавной» (эвристика).</li>
              <li>Документировать FP/FN — это и есть метод DH.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/20 p-4">
            <p className="font-semibold mb-2">Нельзя</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>«Natasha нашла всех героев» без проверки.</li>
              <li>Путать LOC (Сараево) с PER.</li>
              <li>Использовать NER вместо Delta для авторства (лекция 5).</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function InstallGuide() {
  const codeBox =
    'mt-2 mb-4 overflow-x-auto rounded-xl bg-gray-900 text-gray-100 p-4 text-[13px] leading-relaxed font-mono'

  return (
    <div className="space-y-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
      <div className="rounded-2xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-950/30 p-4 sm:p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Natasha на своём компьютере
        </h3>
        <p className="mb-3">
          Официальный сайт проекта:{' '}
          <a className="underline font-semibold" href="https://natasha.github.io" target="_blank" rel="noreferrer">
            natasha.github.io
          </a>
          . Код:{' '}
          <a
            className="underline font-semibold"
            href="https://github.com/natasha/natasha"
            target="_blank"
            rel="noreferrer"
          >
            github.com/natasha/natasha
          </a>
          . Для занятия достаточно <code>pip install natasha</code>; ниже — и pip, и клон репозитория для
          любознательных.
        </p>
        <a
          className="inline-flex px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
          href={`${DL}/scripts_ner_natasha_bunin.zip`}
          download
        >
          Скачать учебный ZIP (скрипты + 4 рассказа)
        </a>
      </div>

      <Details title="Вариант A · быстрее всего: pip install (рекомендуется)" defaultOpen>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Создайте папку <code>Documents/ner_bunin</code> (латиница).
          </li>
          <li>Распакуйте ZIP выше внутрь папки.</li>
          <li>
            PyCharm → Open → эта папка → New Virtualenv.
          </li>
          <li>
            Terminal:
            <pre className={codeBox}>{`python -m pip install -r requirements.txt
# Mac:
python3 -m pip install -r requirements.txt`}</pre>
          </li>
          <li>
            Run <code>ner_natasha_lab.py</code> → откройте <code>out/ner_report.html</code>.
          </li>
        </ol>
        <p className="text-xs text-gray-500">
          Первый запуск скачивает модели Navec/Slovnet (десятки–сотни МБ) — подождите 1–5 минут.
        </p>
      </Details>

      <Details title="Вариант B · клон с GitHub (как на natasha.github.io)">
        <p>
          Если хотите «потрогать» исходники проекта (не обязательно для сдачи):
        </p>
        <pre className={codeBox}>{`# в Documents/
git clone https://github.com/natasha/natasha.git
cd natasha
python -m pip install -e .

# документация и примеры — в README репозитория
# сайт: https://natasha.github.io`}</pre>
        <p>
          Учебные скрипты курса всё равно держите в <code>ner_bunin/</code> из ZIP — они заточены под «Тёмные
          аллеи». Клон Natasha — справочник API, не замена лабораторной.
        </p>
        <p>
          В ZIP также есть файл <code>clone_natasha.sh</code> / <code>clone_natasha.bat</code> — он клонирует
          репозиторий рядом с вашей папкой.
        </p>
      </Details>

      <Details title="Структура папки ner_bunin" defaultOpen>
        <pre className={codeBox}>{`ner_bunin/
  ner_natasha_lab.py       ← главный Run (Natasha)
  ner_heuristic_lab.py     ← без Natasha: «слова с заглавной»
  sample_texts/
    temnye-allei.txt       ← начните с этого
    holodnaya-osen.txt
    natali.txt
    chistyj-ponedelnik.txt
  requirements.txt         ← natasha, openpyxl
  SETUP.md                 ← эта инструкция текстом
  clone_natasha.sh / .bat
  out/                     ← HTML, CSV, Excel после Run`}</pre>
      </Details>

      <Details title="Минимальный код Natasha (что происходит внутри)">
        <pre className={codeBox}>{`from natasha import (
    Segmenter, MorphVocab, NewsEmbedding,
    NewsNERTagger, Doc
)

segmenter = Segmenter()
morph = MorphVocab()
emb = NewsEmbedding()
ner = NewsNERTagger(emb)

doc = Doc(open("sample_texts/temnye-allei.txt", encoding="utf-8").read())
doc.segment(segmenter)
doc.tag_ner(ner)
for span in doc.spans:
    span.normalize(morph)
    print(span.type, span.normal or span.text)`}</pre>
        <p>
          Модели заточены под <strong>новости</strong>; на художественной прозе качество ниже — поэтому аудит
          обязателен.
        </p>
      </Details>

      <Details title="Что сдавать">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Скрин <code>out/ner_report.html</code> или CSV с PER/LOC по одному рассказу.
          </li>
          <li>
            2 false positive + 1 false negative + одно правило («не считать PER, если…»).
          </li>
          <li>
            Опционально: сравнение с <code>ner_heuristic_lab.py</code> — сколько лишних «имён» дала заглавная
            буква.
          </li>
        </ol>
      </Details>

      <Details title="Если Natasha не ставится">
        <ul className="list-disc pl-5 space-y-2">
          <li>Проверьте Python 3.8+ и что pip идёт в venv PyCharm.</li>
          <li>Повторите pip при обрыве сети (модели крупные).</li>
          <li>
            На занятии можно сдать эвристику + запись «Natasha не установилась», но для полного зачёта нужен
            вариант A.
          </li>
        </ul>
      </Details>
    </div>
  )
}

export function NerLesson() {
  const [tab, setTab] = useState('install')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === 'install')} onClick={() => setTab('install')}>
          1 · Установка Natasha
        </button>
        <button type="button" className={tabBtn(tab === 'concepts')} onClick={() => setTab('concepts')}>
          2 · Понятия и результаты
        </button>
      </div>
      {tab === 'install' && <InstallGuide />}
      {tab === 'concepts' && <ConceptsAndResults />}
    </div>
  )
}
