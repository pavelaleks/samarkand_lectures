import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { STYLO_CYCLE } from './stylometryCycleData'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/stylometry`

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

function burrowsDelta(va, vb, means, stds) {
  let s = 0
  let n = 0
  for (let i = 0; i < means.length; i++) {
    const sd = stds[i]
    if (sd < 1e-12) continue
    s += Math.abs((va[i] - means[i]) / sd - (vb[i] - means[i]) / sd)
    n++
  }
  return s / Math.max(n, 1)
}

function fwDiffBars(slugA, slugB, n = 12) {
  const sa = STYLO_CYCLE.stories.find((s) => s.slug === slugA)
  const sb = STYLO_CYCLE.stories.find((s) => s.slug === slugB)
  if (!sa?.vec || !sb?.vec) return []
  return STYLO_CYCLE.functionWords
    .map((w, i) => ({ w, fa: sa.vec[i], fb: sb.vec[i], diff: Math.abs(sa.vec[i] - sb.vec[i]) }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, n)
}

function DualBarPanel({ rows, titleA, titleB }) {
  if (!rows?.length) return null
  const max = Math.max(...rows.flatMap((r) => [r.fa, r.fb]), 0.001)
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex flex-wrap gap-4 text-xs font-semibold">
        <span className="text-teal-700 dark:text-teal-300">■ {titleA}</span>
        <span className="text-indigo-600 dark:text-indigo-300">■ {titleB}</span>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.w} className="text-sm">
            <div className="flex justify-between font-mono mb-0.5">
              <span>{r.w}</span>
              <span className="text-gray-500 text-xs">|Δ|={(r.diff * 100).toFixed(2)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-1 h-2">
              <div className="rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-teal-500/90" style={{ width: `${(r.fa / max) * 100}%` }} />
              </div>
              <div className="rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-indigo-500/90" style={{ width: `${(r.fb / max) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MeanBar({ label, value, max, tone }) {
  const pct = Math.min(100, (value / max) * 100)
  const colors = {
    teal: 'bg-teal-500',
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
  }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
        <span className="font-mono font-bold">{value.toFixed(2)}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${colors[tone] || colors.teal}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MdsMap({ highlight = [], filterAuthor = 'all' }) {
  let stories = STYLO_CYCLE.stories.filter((s) => typeof s.x === 'number')
  if (filterAuthor === 'bunin') stories = stories.filter((s) => s.author === 'bunin')
  if (filterAuthor === 'chekhov') stories = stories.filter((s) => s.author === 'chekhov')
  const xs = stories.map((s) => s.x)
  const ys = stories.map((s) => s.y)
  const pad = 0.08
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const W = 560
  const H = 380
  const sx = (x) => ((x - minX) / (maxX - minX || 1)) * (W - 40) + 20
  const sy = (y) => H - 20 - ((y - minY) / (maxY - minY || 1)) * (H - 40)
  const labelSlugs = new Set([
    ...highlight,
    'holodnaya-osen',
    'dama-s-sobachkoj',
    'ionyich',
    'kryzhovnik',
    'natali',
    'temnye-allei',
  ])

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto">
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {stories.map((s) => {
          const hi = highlight.includes(s.slug)
          const chekhov = s.author === 'chekhov'
          return (
            <g key={s.slug}>
              <circle
                cx={sx(s.x)}
                cy={sy(s.y)}
                r={hi ? 7 : 4.5}
                fill={chekhov ? '#f43f5e' : hi ? '#0d9488' : '#94a3b8'}
                opacity={hi || chekhov ? 1 : 0.55}
              />
              {labelSlugs.has(s.slug) && (
                <text x={sx(s.x) + 7} y={sy(s.y) + 3} fontSize={9} fill="currentColor">
                  {s.title.length > 16 ? `${s.title.slice(0, 14)}…` : s.title}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 text-xs mt-2 text-gray-600 dark:text-gray-400">
        <span>■ серый / бирюзовый — Бунин</span>
        <span className="text-rose-600">■ красный — Чехов</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        MDS по матрице учебной Delta · не «карта сюжетов», а геометрия служебных профилей
      </p>
    </div>
  )
}

function CycleExplorer() {
  const S = STYLO_CYCLE.summary
  const [slugA, setSlugA] = useState('dama-s-sobachkoj')
  const [slugB, setSlugB] = useState('ionyich')
  const [mapFilter, setMapFilter] = useState('all')

  const storyA = STYLO_CYCLE.stories.find((s) => s.slug === slugA)
  const storyB = STYLO_CYCLE.stories.find((s) => s.slug === slugB)

  const delta = useMemo(() => {
    const preset = STYLO_CYCLE.pairs.find((p) => p.a === slugA && p.b === slugB)
    if (preset) return preset.delta
    const rev = STYLO_CYCLE.pairs.find((p) => p.a === slugB && p.b === slugA)
    if (rev) return rev.delta
    if (storyA?.vec && storyB?.vec) {
      return burrowsDelta(storyA.vec, storyB.vec, STYLO_CYCLE.means, STYLO_CYCLE.stds)
    }
    return null
  }, [slugA, slugB, storyA, storyB])

  const diffKey = `${slugA}__${slugB}`
  const diffRev = `${slugB}__${slugA}`
  const barRows =
    STYLO_CYCLE.demoDiffs[diffKey] || STYLO_CYCLE.demoDiffs[diffRev] || fwDiffBars(slugA, slugB)

  const buninStories = STYLO_CYCLE.stories.filter((s) => s.author === 'bunin')
  const chekhovStories = STYLO_CYCLE.stories.filter((s) => s.author === 'chekhov')
  const barMax = Math.max(
    S.meanDeltaWithinBunin,
    S.meanDeltaWithinChekhov,
    S.meanDeltaBuninVsChekhov,
    S.meanDeltaCrossMatched,
    1.2
  )

  const pairKind =
    storyA && storyB
      ? storyA.author === storyB.author
        ? storyA.author === 'chekhov'
          ? 'внутри Чехова'
          : 'внутри Бунина'
        : 'Чехов ↔ Бунин'
      : ''

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Зачем эта лекция
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
          Можно ли «увидеть» сходство авторов по служебным словам — на Чехове и Бунине?
        </h3>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          Сравнивать Бунина с лирикой Ахматовой бессмысленно: разные жанры. Здесь контраст —{' '}
          <strong>аналогичные рассказы</strong> Чехова («Дама с собачкой», «Ионыч», «Крыжовник»…). Сначала
          доказываем, что <em>внутри</em> Чехова профили близки, <em>внутри</em> Бунина — тоже; потом смотрим,
          насколько дальше типичная пара Чехов–Бунин.
        </p>
        <div className="rounded-xl bg-gray-900 text-teal-100 font-mono text-sm px-4 py-3">
          Delta(A,B) = среднее |z<sub>w</sub>(A) − z<sub>w</sub>(B)| &nbsp;·&nbsp; z = (доля − μ) / σ &nbsp;·&nbsp;
          служебные слова: и, в, не, она…
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Меньше Delta → ближе грамматический каркас. Это <strong>не судебная атрибуция</strong> и не замена
          чтения. Лекция 4 — Ципф (частотный хвост); лекция 6 — Natasha (имена и места).
        </p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 1 · Три средних Delta (главный результат)
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          На объединённом корпусе ({S.nBunin} рассказов Бунина + {S.nChekhov} рассказов Чехова) считаем все пары и
          берём среднее. Чем ниже столбик — тем ближе тексты друг к другу.
        </p>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
          <MeanBar
            label={`Внутри Чехова (${S.nPairsChekhov} пар)`}
            value={S.meanDeltaWithinChekhov}
            max={barMax}
            tone="indigo"
          />
          <MeanBar
            label={`Внутри Бунина (${S.nPairsBunin} пар)`}
            value={S.meanDeltaWithinBunin}
            max={barMax}
            tone="teal"
          />
          <MeanBar
            label={`Чехов ↔ Бунин (${S.nPairsCross} пар)`}
            value={S.meanDeltaBuninVsChekhov}
            max={barMax}
            tone="rose"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm leading-relaxed">
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 p-4 bg-indigo-50/70 dark:bg-indigo-950/20">
            <p className="font-semibold mb-1">1. Чехов похож на Чехова</p>
            <p>
              Средняя Δ ≈ <strong>{S.meanDeltaWithinChekhov.toFixed(2)}</strong>. «Дама с собачкой» и «Ионыч»
              близки по служебному профилю — хотя сюжеты разные. Так мы проверяем: метрика вообще чувствует
              единство автора.
            </p>
          </div>
          <div className="rounded-xl border border-teal-200 dark:border-teal-900 p-4 bg-teal-50/70 dark:bg-teal-950/20">
            <p className="font-semibold mb-1">2. Бунин похож на Бунина</p>
            <p>
              Средняя Δ ≈ <strong>{S.meanDeltaWithinBunin.toFixed(2)}</strong>. Цикл «Тёмные аллеи» держится на
              сходном каркасе <em>и / в / не / она…</em> — это и есть «стилистическое единство» в смысле Delta.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 p-4 bg-rose-50/70 dark:bg-rose-950/20">
            <p className="font-semibold mb-1">3. Между авторами — чуть дальше</p>
            <p>
              Средняя Δ ≈ <strong>{S.meanDeltaBuninVsChekhov.toFixed(2)}</strong>. На одинаковой длине (1200–8000
              токенов) контраст яснее: внутри ≈{S.meanDeltaWithinChekhovMatched.toFixed(2)} /{' '}
              {S.meanDeltaWithinBuninMatched.toFixed(2)}, между ≈{S.meanDeltaCrossMatched.toFixed(2)}. Но
              отдельные пары могут «пересекаться» — смотрите пресеты ниже.
            </p>
          </div>
        </div>
        <Details title="Почему сравниваем именно с Чеховым, а не с Ахматовой?">
          <p>
            Стилиометрия чувствительна к <strong>жанру и длине</strong>. Стих vs проза — это почти всегда «далеко»,
            и такой контраст ничего не говорит о Бунине. Чехов — сосед по истории русской новеллы: короткая проза о
            любви, провинции, случайной встрече. Если Delta различает двух прозаиков-рассказчиков, это уже
            осмысленный эксперимент.
          </p>
        </Details>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 2 · Карта MDS: Бунин и Чехов на одной плоскости
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Каждая точка — рассказ. Расстояния приближают матрицу Delta. Красные точки — Чехов; серые/бирюзовые —
          Бунин. Полного «разделения облаков» ждать не нужно: оба автора — реалистическая проза начала XX в.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'Все'],
            ['bunin', 'Только Бунин'],
            ['chekhov', 'Только Чехов'],
          ].map(([k, lab]) => (
            <button
              key={k}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mapFilter === k ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}
              onClick={() => setMapFilter(k)}
            >
              {lab}
            </button>
          ))}
        </div>
        <MdsMap highlight={[slugA, slugB]} filterAuthor={mapFilter} />
        <p className="text-sm">
          Корпуса:{' '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            «Тёмные аллеи» ({S.nBunin})
          </Link>
          {' · '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/corpus/chekhov-rasskazy">
            рассказы Чехова ({S.nChekhov})
          </Link>
          {' · '}
          признаков: {STYLO_CYCLE.functionWords.length}
        </p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 3 · Пресеты: сначала Чехов–Чехов, потом Чехов–Бунин
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLO_CYCLE.pairs.map((p) => (
            <button
              key={`${p.a}-${p.b}`}
              type="button"
              onClick={() => {
                setSlugA(p.a)
                setSlugB(p.b)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                slugA === p.a && slugB === p.b
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {p.label} (Δ={p.delta.toFixed(2)})
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-sm">
            Текст A
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
              value={slugA}
              onChange={(e) => setSlugA(e.target.value)}
            >
              <optgroup label="Чехов">
                {chekhovStories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} (N={s.tokens})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Бунин">
                {buninStories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} (N={s.tokens})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="block text-sm">
            Текст B
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
              value={slugB}
              onChange={(e) => setSlugB(e.target.value)}
            >
              <optgroup label="Чехов">
                {chekhovStories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} (N={s.tokens})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Бунин">
                {buninStories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} (N={s.tokens})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
        <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-4">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            Учебная Delta = {delta != null ? delta.toFixed(4) : '—'}
            <span className="ml-2 text-sm font-semibold text-teal-800 dark:text-teal-200">({pairKind})</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {storyA?.title} (N={storyA?.tokens}) vs {storyB?.title} (N={storyB?.tokens}). Ориентир: внутри автора
            часто ≈0.5–0.9; между авторами чаще ближе к 1.0 — но не всегда.
          </p>
        </div>
        <DualBarPanel rows={barRows} titleA={storyA?.title} titleB={storyB?.title} />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Большие |Δ| по <em>она / он / в / не</em> часто отражают местоименную сцену (кто в фокусе повествования),
          а не «чужой стиль». Читайте bar chart как подсказку для close reading.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 4 · Ближайшие соседи (кто к кому ближе по Delta)
        </div>
        <div className="overflow-auto max-h-72 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2">Текст</th>
                <th className="p-2">автор</th>
                <th className="p-2">N</th>
                <th className="p-2">ближайший сосед</th>
              </tr>
            </thead>
            <tbody>
              {[...chekhovStories, ...buninStories.slice(0, 12)].map((s) => {
                const nb = STYLO_CYCLE.neighbors.find((n) => n.slug === s.slug)?.nearest?.[0]
                return (
                  <tr key={s.slug} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-2">{s.title}</td>
                    <td className="p-2">
                      <span className={s.author === 'chekhov' ? 'text-rose-600 font-semibold' : 'text-teal-700'}>
                        {s.authorLabel}
                      </span>
                    </td>
                    <td className="p-2">{s.tokens}</td>
                    <td className="p-2 text-xs">
                      {nb
                        ? `${nb.title} (${nb.author === 'chekhov' ? 'Чехов' : 'Бунин'}, Δ=${nb.delta.toFixed(2)})`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          Если у рассказа Чехова ближайший сосед — тоже Чехов, это хороший знак для «внутриавторского» сходства.
          Полная матрица — в Excel после Run в PyCharm.
        </p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 5 · Что можно и нельзя сказать на семинаре
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold mb-2">Можно осторожно</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Рассказы Чехова в нашем наборе сходны по служебной лексике (средняя Δ≈
                {S.meanDeltaWithinChekhov.toFixed(2)}).
              </li>
              <li>
                Цикл Бунина тоже согласован (Δ≈{S.meanDeltaWithinBunin.toFixed(2)}); на сопоставимой длине —
                ещё заметнее.
              </li>
              <li>
                Средняя пара Чехов–Бунин дальше внутриавторских средних — гипотеза различия профилей, не
                «доказательство».
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-4">
            <p className="font-semibold mb-2">Нельзя</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>«Delta=0.7 → точно один автор» / «→ точно Чехов написал Бунина».</li>
              <li>Сравнивать миниатюру на 400 слов с повестью на 18 000 без оговорки о длине.</li>
              <li>Путать служебный профиль с темой любви или с NER-именами (лекция 6).</li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 dark:bg-teal-950/25 p-4 text-sm student-action">
          <strong>Формула для сдачи:</strong> «По учебной Burrows&apos; Delta рассказы Чехова сходны между собой
          (средняя Δ≈{S.meanDeltaWithinChekhov.toFixed(2)}), рассказы Бунина — тоже (≈
          {S.meanDeltaWithinBunin.toFixed(2)}). Средняя Δ между Чеховым и Буниным ≈
          {S.meanDeltaBuninVsChekhov.toFixed(2)}
          {S.meanDeltaBuninVsChekhov > S.meanDeltaWithinChekhov
            ? ' — выше внутричеховской'
            : ''}
          . Метрика не заменяет philological reading и не является экспертизой авторства.»
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
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Практика в PyCharm · Delta на Бунине и Чехове
        </h3>
        <p className="mb-3">
          Цель: получить матрицу Delta, HTML/Excel и графики. В ZIP — 37 рассказов Бунина и 14 рассказов Чехова.
          Natasha здесь <strong>не нужна</strong> (лекция 6).
        </p>
        <div className="rounded-xl bg-white/80 dark:bg-gray-900/60 border border-teal-200 p-3 mb-4 font-mono text-sm">
          <div className="text-xs uppercase font-sans font-bold text-teal-800 mb-1">Папка проекта</div>
          <div>Windows: <strong>C:\Users\&lt;ЛОГИН&gt;\Documents\stylometry_bunin</strong></div>
          <div>macOS: <strong>/Users/&lt;ЛОГИН&gt;/Documents/stylometry_bunin</strong></div>
        </div>
        <a
          className="inline-flex px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
          href={`${DL}/scripts_stylometry_bunin.zip`}
          download
        >
          Скачать ZIP (Бунин + Чехов + stylometry_lab.py)
        </a>
      </div>

      <Details title="Шаг 1 · Папка и содержимое ZIP" defaultOpen>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Создайте <code>Documents/stylometry_bunin</code> (латиница).</li>
          <li>Распакуйте ZIP → скопируйте содержимое в папку проекта.</li>
          <li>
            Должно быть:
            <pre className={codeBox}>{`stylometry_bunin/
  stylometry_lab.py       ← Run
  stylometry_one_pair.py
  stylometry_lib.py
  sample_texts/           ← 37 txt Бунина
  sample_texts_chekhov/   ← 14 txt Чехова
  stories_meta.json
  chekhov_meta.json
  requirements.txt
  out/`}</pre>
          </li>
        </ol>
      </Details>

      <Details title="Шаг 2 · Python + PyCharm + venv">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Python 3:{' '}
            <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
              python.org/downloads
            </a>
            , Windows — Add to PATH.
          </li>
          <li>PyCharm → Open → папка <code>stylometry_bunin</code>.</li>
          <li>Settings → Python Interpreter → Add → Virtualenv → New.</li>
          <li>
            <pre className={codeBox}>python -m pip install -r requirements.txt</pre>
            Mac: <code>python3 -m pip …</code>
          </li>
        </ol>
      </Details>

      <Details title="Шаг 3 · Run и что смотреть в out/">
        <p>Зелёный Run на <code>stylometry_lab.py</code> без параметров.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>report.html</code> — средние Δ внутри Чехова / внутри Бунина / между ними
          </li>
          <li>
            <code>delta_matrix.csv</code>, <code>stylometry_bunin.xlsx</code>
          </li>
          <li>
            <code>plots/</code> — bar charts пар и <code>mds_authors.png</code>
          </li>
        </ul>
      </Details>

      <Details title="Шаг 4 · Что сдавать">
        <ul className="list-disc pl-5 space-y-2">
          <li>Скрин или цитата из report.html: три средних Delta</li>
          <li>Один PNG: пресет «Чехов ↔ Чехов» и один «Чехов ↔ Бунин»</li>
          <li>3–5 предложений по формуле с вкладки «Разбор» (можно / нельзя)</li>
        </ul>
      </Details>

      <Details title="Если не запускается">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>No module named stylometry_lib</strong> — .py не в корне папки проекта.
          </li>
          <li>
            <strong>sample_texts_chekhov пуст</strong> — перераспакуйте ZIP без лишней вложенности.
          </li>
        </ul>
      </Details>
    </div>
  )
}

export function StylometryLesson() {
  const [tab, setTab] = useState('cycle')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === 'cycle')} onClick={() => setTab('cycle')}>
          1 · Чехов и Бунин
        </button>
        <button type="button" className={tabBtn(tab === 'python')} onClick={() => setTab('python')}>
          2 · Python и PyCharm
        </button>
      </div>
      {tab === 'cycle' && <CycleExplorer />}
      {tab === 'python' && <PythonGuide />}
    </div>
  )
}
