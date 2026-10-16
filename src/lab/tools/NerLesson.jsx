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

function CycleExplorer() {
  const demoSlugs = Object.keys(NER_CYCLE.demoTexts)
  const [demoSlug, setDemoSlug] = useState(demoSlugs.includes('holodnaya-osen') ? 'holodnaya-osen' : demoSlugs[0])
  const [storySlug, setStorySlug] = useState('temnye-allei')
  const [removed, setRemoved] = useState(() => new Set())
  const [audit, setAudit] = useState('')

  const demo = NER_CYCLE.demoTexts[demoSlug]
  const story = NER_CYCLE.stories.find((s) => s.slug === storySlug) || NER_CYCLE.stories[0]

  const visibleCandidates = useMemo(
    () => story.candidates.filter((c) => !removed.has(c.label.toLowerCase())),
    [story, removed]
  )

  const toggleRemove = (label) => {
    const k = label.toLowerCase()
    setRemoved((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 1 · Что такое NER
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Named Entity Recognition — найти в тексте имена, места, организации
        </h3>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          Для цифрового чтения Бунина NER отвечает на вопрос: <strong>кто и где</strong> в потоке слов?
          Типы (схема OntoNotes / Natasha): <strong>PER</strong> — персона, <strong>LOC</strong> — место,{' '}
          <strong>ORG</strong> — организация. На сайте — учебная подсветка; в PyCharm — библиотека{' '}
          <strong>Natasha</strong> (лекция 6). Стилиометрия (Delta) — лекция 5, другой инструмент.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          {Object.entries(NER_CYCLE.typeLabels).map(([k, lab]) => (
            <span key={k} className="px-2 py-1 rounded-lg border" style={{ borderColor: NER_CYCLE.typeColors[k] }}>
              {k}: {lab}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 2 · Интерактивная подсветка (фрагменты)
        </div>
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
          <p className="text-xs text-gray-500 mt-3">
            UNK (серый) — «проверить глазами»: заглавная буква ≠ имя. PER/LOC — гипотеза модели/разметки.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 3 · Кандидаты по рассказам цикла
        </div>
        <label className="block text-sm">
          Рассказ
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
                {s.title} (PER={s.counts.PER}, LOC={s.counts.LOC}, UNK={s.counts.UNK})
              </option>
            ))}
          </select>
        </label>
        <div className="grid sm:grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3">
            <div className="text-xl font-bold">{story.counts.PER}</div>
            <div className="text-xs">PER</div>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
            <div className="text-xl font-bold">{story.counts.LOC}</div>
            <div className="text-xs">LOC</div>
          </div>
          <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-3">
            <div className="text-xl font-bold">{story.counts.UNK}</div>
            <div className="text-xs">проверить</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Клик по строке — «вычеркнуть» ложный кандидат (учебный аудит). Корпус:{' '}
          <Link className="underline" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            «Тёмные аллеи»
          </Link>
        </p>
        <div className="overflow-auto max-h-80 rounded-xl border border-gray-200 dark:border-gray-700">
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
              {story.candidates.slice(0, 25).map((c) => {
                const out = removed.has(c.label.toLowerCase())
                return (
                  <tr
                    key={c.label}
                    className={`border-t border-gray-100 dark:border-gray-800 ${out ? 'opacity-40 line-through' : ''}`}
                  >
                    <td className="p-2 font-medium">{c.label}</td>
                    <td className="p-2">{c.count}</td>
                    <td className="p-2">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ color: NER_CYCLE.typeColors[c.type] }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-xs underline text-teal-700 dark:text-teal-400"
                        onClick={() => toggleRemove(c.label)}
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
        <p className="text-xs">Осталось после аудита: {visibleCandidates.length} кандидатов</p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 4 · Ловушки (false positive)
        </div>
        <ul className="space-y-2 text-sm">
          {NER_CYCLE.traps.map((t) => (
            <li key={t.label} className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-3">
              <strong className="font-mono">{t.label}</strong> — {t.why}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 5 · Упражнение: аудит одной фразой
        </div>
        <label className="block student-action rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-sm font-semibold">
          Запишите: 2 ложных кандидата, 1 пропущенное имя, 1 правило («не считать PER, если…»)
          <textarea
            value={audit}
            onChange={(e) => setAudit(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 font-normal"
          />
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400">{NER_CYCLE.natashaNote}</p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 6 · Границы вывода
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold mb-2">Можно</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Строить список персонажей/мест как гипотезу для чтения.</li>
              <li>Сравнивать эвристику сайта и Natasha в PyCharm.</li>
              <li>Документировать правки словаря — часть метода.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/20 p-4">
            <p className="font-semibold mb-2">Нельзя</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Печатать «Natasha нашла всех героев» без ручной проверки.</li>
              <li>Путать LOC (Сараево) с PER.</li>
              <li>Использовать NER вместо стилиометрии для авторства.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function PythonGuide() {
  const codeBox =
    'mt-2 mb-4 overflow-x-auto rounded-xl bg-gray-900 text-gray-100 p-4 text-[13px] leading-relaxed font-mono'

  return (
    <div className="space-y-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
      <div className="rounded-2xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-950/30 p-4 sm:p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Natasha в PyCharm</h3>
        <p className="mb-3">
          Папка <code>ner_bunin</code>, главный файл <code>ner_natasha_lab.py</code>. Первый запуск скачает
          модели — 1–5 минут. Сравните с <code>ner_heuristic_lab.py</code> и подсветкой на сайте.
        </p>
        <a
          className="inline-flex px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
          href={`${DL}/scripts_ner_natasha_bunin.zip`}
          download
        >
          Скачать ZIP (4 рассказа + Natasha lab)
        </a>
      </div>

      <Details title="Шаг 1 · Папка ner_bunin и ZIP" defaultOpen>
        <pre className={codeBox}>{`ner_bunin/
  ner_natasha_lab.py      ← Run (все sample_texts)
  ner_heuristic_lab.py    ← без Natasha
  sample_texts/
    temnye-allei.txt      ← начните с этого
    holodnaya-osen.txt
    natali.txt
    chistyj-ponedelnik.txt
  requirements.txt
  out/`}</pre>
      </Details>

      <Details title="Шаг 2 · venv + pip install natasha">
        <pre className={codeBox}>python -m pip install -r requirements.txt</pre>
        <p>Mac: <code>python3</code>. При ошибке сети — повторите; модели крупные.</p>
      </Details>

      <Details title="Шаг 3 · Run и out/">
        <ol className="list-decimal pl-5 space-y-2">
          <li>Run <code>ner_natasha_lab.py</code> без параметров.</li>
          <li>Откройте <code>out/ner_report.html</code> и <code>ner_entities.csv</code>.</li>
          <li>Run <code>ner_heuristic_lab.py sample_texts/holodnaya-osen.txt</code> — сравните ложные PER.</li>
          <li>Сдайте: 2 FP + 1 FN + одно правило, как на вкладке «Разбор цикла».</li>
        </ol>
      </Details>

      <Details title="Если Natasha не ставится">
        <p>
          На занятии достаточно <code>ner_heuristic_lab.py</code>, но в отчёте укажите: «Natasha не
          установлена — эвристика». Для полной лаборатории Natasha обязательна.
        </p>
      </Details>
    </div>
  )
}

export function NerLesson() {
  const [tab, setTab] = useState('cycle')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === 'cycle')} onClick={() => setTab('cycle')}>
          1 · Разбор цикла
        </button>
        <button type="button" className={tabBtn(tab === 'python')} onClick={() => setTab('python')}>
          2 · Python и Natasha
        </button>
      </div>
      {tab === 'cycle' && <CycleExplorer />}
      {tab === 'python' && <PythonGuide />}
    </div>
  )
}
