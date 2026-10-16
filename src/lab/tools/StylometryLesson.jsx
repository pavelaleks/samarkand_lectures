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

function MdsMap({ highlight = [] }) {
  const stories = STYLO_CYCLE.stories.filter((s) => typeof s.x === 'number')
  const xs = stories.map((s) => s.x)
  const ys = stories.map((s) => s.y)
  const pad = 0.08
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const W = 520
  const H = 360
  const sx = (x) => ((x - minX) / (maxX - minX || 1)) * (W - 40) + 20
  const sy = (y) => H - 20 - ((y - minY) / (maxY - minY || 1)) * (H - 40)

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto">
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {stories.map((s) => {
          const hi = highlight.includes(s.slug)
          const ext = s.external
          return (
            <g key={s.slug}>
              <circle
                cx={sx(s.x)}
                cy={sy(s.y)}
                r={hi ? 7 : ext ? 6 : 4}
                fill={ext ? '#f43f5e' : hi ? '#0d9488' : '#94a3b8'}
                opacity={hi || ext ? 1 : 0.65}
              />
              {(hi || ext || s.slug === 'holodnaya-osen') && (
                <text x={sx(s.x) + 6} y={sy(s.y) + 3} fontSize={9} fill="currentColor">
                  {s.title.length > 18 ? s.title.slice(0, 16) + '…' : s.title}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="text-xs text-gray-500 mt-2 text-center">
        MDS по матрице учебной Delta · красная точка — контраст (Ахматова) · не «карта жанра», а геометрия
        расстояний
      </p>
    </div>
  )
}

function CycleExplorer() {
  const [slugA, setSlugA] = useState('holodnaya-osen')
  const [slugB, setSlugB] = useState('kavkaz')
  const [hoverPair, setHoverPair] = useState(null)

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
    STYLO_CYCLE.demoDiffs[diffKey] ||
    STYLO_CYCLE.demoDiffs[diffRev] ||
    fwDiffBars(slugA, slugB)

  const buninStories = STYLO_CYCLE.stories.filter((s) => !s.external)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 1 · Что такое стилиометрия и Delta
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
          «Стиль» как профиль частот служебных слов — и дистанция между текстами
        </h3>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          Стилиометрия сравнивает не «любовь vs смерть», а <strong>грамматический каркас</strong>:{' '}
          <em>и, в, не, она, что, но…</em> У Джона Burrows идея простая: у автора эти доли стабильны;{' '}
          <strong>Burrows&apos; Delta</strong> — среднее расхождение z-оценок по списку служебных слов.
          Чем <strong>меньше</strong> Delta, тем ближе профили — но это{' '}
          <strong>не судебная атрибуция</strong>.
        </p>
        <div className="rounded-xl bg-gray-900 text-teal-100 font-mono text-sm px-4 py-3">
          Delta(A,B) = среднее |z<sub>w</sub>(A) − z<sub>w</sub>(B)| &nbsp;·&nbsp; z = (доля − μ<sub>корпус</sub>) /
          σ
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          На лекции 4 мы смотрели Ципфа (частотный хвост). Здесь — другой слой:{' '}
          <strong>межтекстовое сравнение</strong>. Natasha (NER) — только в лекции 6.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 2 · Зачем это «Тёмным аллеям»
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm leading-relaxed">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <p className="font-semibold mb-1">Единство цикла</p>
            <p className="text-gray-700 dark:text-gray-300">
              Средняя Delta внутри Бунина ≈ {STYLO_CYCLE.summary.meanDeltaWithinBunin.toFixed(2)} — рассказы
              близки по служебному профилю, хотя сюжеты разные.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <p className="font-semibold mb-1">Контраст с «чужим» текстом</p>
            <p className="text-gray-700 dark:text-gray-300">
              Бунин vs фрагмент Ахматовой: ≈ {STYLO_CYCLE.summary.meanDeltaBuninVsAkhmatova.toFixed(2)} — дальше,
              но одного числа мало для вывода об авторстве.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 p-4 bg-rose-50/80 dark:bg-rose-950/20">
            <p className="font-semibold mb-1">Чего Delta не делает</p>
            <p className="text-gray-700 dark:text-gray-300">
              Не заменяет чтение, не доказывает подлинность, не видит сюжет. Короткие миниатюры дают шум.
            </p>
          </div>
        </div>
        <p className="text-sm">
          Корпус:{' '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            37 рассказов «Тёмных аллей»
          </Link>
          · признаков служебных слов: {STYLO_CYCLE.functionWords.length}
        </p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 3 · Карта цикла (MDS)
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Каждая точка — рассказ. Расстояния на плоскости приближают матрицу Delta (учебная MDS). Кластеры
          «скученности» — не жанры, а близость служебных профилей.
        </p>
        <MdsMap highlight={[slugA, slugB]} />
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 4 · Сравните два рассказа A / B
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
              onMouseEnter={() => setHoverPair(p)}
              onMouseLeave={() => setHoverPair(null)}
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
              {STYLO_CYCLE.stories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title} {s.external ? '(конtrast)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Текст B
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
              value={slugB}
              onChange={(e) => setSlugB(e.target.value)}
            >
              {STYLO_CYCLE.stories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-4">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            Учебная Delta = {delta != null ? delta.toFixed(4) : '—'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {storyA?.title} (N={storyA?.tokens}) vs {storyB?.title} (N={storyB?.tokens}). Меньше — ближе
            служебные профили.
          </p>
          {hoverPair && (
            <p className="text-xs mt-2 text-teal-800 dark:text-teal-200">Пресет: {hoverPair.label}</p>
          )}
        </div>
        <DualBarPanel rows={barRows} titleA={storyA?.title} titleB={storyB?.title} />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Большие столбики |Δ| по <em>в, она, не</em> часто отражают местоименную сцену («я/она» vs «мы/они»), а
          не «другой автор».
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 5 · Сводка по циклу
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 p-3 text-center">
            <div className="text-2xl font-bold text-teal-800">{STYLO_CYCLE.summary.nStories}</div>
            <div className="text-xs text-gray-600">рассказов Бунина</div>
          </div>
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 p-3 text-center">
            <div className="text-2xl font-bold text-teal-800">
              {STYLO_CYCLE.summary.meanDeltaWithinBunin.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">средняя Δ внутри цикла</div>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 p-3 text-center">
            <div className="text-2xl font-bold text-rose-800">
              {STYLO_CYCLE.summary.meanDeltaBuninVsAkhmatova.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">средняя Δ Бунин vs Ахматова</div>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border p-3 text-center">
            <div className="text-2xl font-bold">{STYLO_CYCLE.functionWords.length}</div>
            <div className="text-xs text-gray-600">служебных признаков</div>
          </div>
        </div>
        <div className="overflow-auto max-h-64 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2">Рассказ</th>
                <th className="p-2">N</th>
                <th className="p-2">доля служебн.</th>
                <th className="p-2">ближайший сосед</th>
              </tr>
            </thead>
            <tbody>
              {buninStories.slice(0, 15).map((s) => {
                const nb = STYLO_CYCLE.neighbors.find((n) => n.slug === s.slug)?.nearest?.[0]
                return (
                  <tr key={s.slug} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-2">{s.title}</td>
                    <td className="p-2">{s.tokens}</td>
                    <td className="p-2">{(s.fw_share * 100).toFixed(1)}%</td>
                    <td className="p-2 text-xs">
                      {nb ? `${nb.title} (Δ=${nb.delta.toFixed(2)})` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Полная таблица — в Excel после Run stylometry_lab.py</p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 6 · Выводы и границы
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold mb-2">Можно сказать осторожно</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Цикл держится на сходных профилях служебной лексики.</li>
              <li>Конtrast с Ахматовой дальше, чем «Бунин–Бунин» — гипотеза различия регистров.</li>
              <li>Отдельные слова в bar chart — подсказка, куда смотреть в медленном чтении.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-4">
            <p className="font-semibold mb-2">Нельзя</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>«Delta=0.8 → точно один автор» / «→ точно Бунин».</li>
              <li>Игнорировать длину: миниатюры vs новеллы.</li>
              <li>Путать служебный профиль с темой любви или с NER-именами (лекция 6).</li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 dark:bg-teal-950/25 p-4 text-sm">
          <strong>Формула для семинара:</strong> «По учебной Delta цикл „Тёмные аллеи“ выглядит стилистически
          согласованным по служебной лексике (средняя Δ≈{STYLO_CYCLE.summary.meanDeltaWithinBunin.toFixed(2)}).
          Конtrast с внешним фрагментом сильнее, но метрика не заменяет philological reading и не является
          экспертизой авторства.»
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
          Практика в PyCharm · стилиометрия с нуля
        </h3>
        <p className="mb-3">
          Цель: у всей группы одинаково получить матрицу Delta, HTML/Excel и графики по 37 рассказам.
          Natasha здесь <strong>не нужна</strong> (она — лекция 6).
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
          Скачать ZIP (37 текстов + stylometry_lab.py)
        </a>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Шаг 1–3 · Папка, Python, ZIP</h3>
        <Details title="Создать stylometry_bunin и распаковать ZIP" defaultOpen>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Создайте <code>Documents/stylometry_bunin</code> (латиница).</li>
            <li>Скачайте ZIP выше → распакуйте → скопируйте содержимое в папку проекта.</li>
            <li>
              Должно быть:
              <pre className={codeBox}>{`stylometry_bunin/
  stylometry_lab.py       ← Run
  stylometry_one_pair.py
  stylometry_lib.py
  sample_texts/           ← 37 txt
  stories_meta.json
  requirements.txt
  out/`}</pre>
            </li>
          </ol>
        </Details>
        <Details title="Python 3">
          <p>
            Как в лекции 4:{' '}
            <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
              python.org/downloads
            </a>
            , на Windows — галочка Add to PATH.
          </p>
        </Details>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold">Шаг 4–5 · PyCharm + venv</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Open → папка <code>stylometry_bunin</code>.</li>
          <li>Settings → Python Interpreter → Add Local → Virtualenv → New.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold">Шаг 6 · pip install</h3>
        <pre className={codeBox}>python -m pip install -r requirements.txt</pre>
        <p className="text-xs">Mac: <code>python3 -m pip …</code> · нужны matplotlib, openpyxl.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold">Шаг 7 · Run stylometry_lab.py</h3>
        <p>Зелёный Run без параметров. Смотрите консоль и папку <code>out/</code>.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><code>stylometry_bunin.xlsx</code>, <code>report.html</code></li>
          <li><code>delta_matrix.csv</code>, <code>metrics.csv</code></li>
          <li><code>plots/</code> — bar charts пар и <code>mds_bunin.png</code></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold">Шаг 8 · Что сдавать</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>report.html или скрин витринной пары «Бунин vs Ахматова»</li>
          <li>Один PNG bar chart + 3–5 предложений: почему Delta ≠ атрибуция</li>
          <li>Сравните цифры с вкладкой «Разбор цикла» на сайте</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold">Если не запускается</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>No module named stylometry_lib</strong> — .py не в корне stylometry_bunin.</li>
          <li><strong>No module named matplotlib</strong> — повторите pip install.</li>
          <li><strong>sample_texts пуст</strong> — перераспакуйте ZIP без лишней вложенности.</li>
        </ul>
      </section>
    </div>
  )
}

export function StylometryLesson() {
  const [tab, setTab] = useState('cycle')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === 'cycle')} onClick={() => setTab('cycle')}>
          1 · Разбор цикла
        </button>
        <button type="button" className={tabBtn(tab === 'python')} onClick={() => setTab('python')}>
          2 · Python и PyCharm с нуля
        </button>
      </div>
      {tab === 'cycle' && <CycleExplorer />}
      {tab === 'python' && <PythonGuide />}
    </div>
  )
}
