import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ZipfBuild } from './ZipfBuild'
import { ZIPF_CYCLE } from './zipfCycleData'

const base = import.meta.env.BASE_URL || '/'
const DL = `${base}demo-downloads/zipf`

const tabBtn = (active) =>
  `px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
    active
      ? 'bg-teal-600 text-white shadow'
      : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`

function MetricCard({ value, label }) {
  return (
    <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-3 text-center">
      <div className="text-2xl font-bold text-teal-800 dark:text-teal-200">{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug">{label}</div>
    </div>
  )
}

function Details({ title, children, defaultOpen = false }) {
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-2"
    >
      <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white py-2">
        {title}
      </summary>
      <div className="pb-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">{children}</div>
    </details>
  )
}

function alphaPlain(alpha) {
  if (alpha >= 0.88) {
    return {
      tone: 'ok',
      title: 'Близко к «классическому» Ципфу',
      text: 'Частоты падают примерно так, как ожидает закон: первое слово заметно чаще второго, второго — третьего и т.д. Так бывает у достаточно длинных рассказов.',
    }
  }
  if (alpha >= 0.7) {
    return {
      tone: 'mid',
      title: 'Умеренный Ципф',
      text: 'Профиль похож на закон Ципфа, но наклон мягче идеала α≈1. Для многих рассказов цикла это нормальная середина.',
    }
  }
  return {
    tone: 'warn',
    title: 'Низкая α — чаще всего из‑за короткого текста',
    text: 'Не читайте это как «Бунин писал иначе». На миниатюре мало повторов служебных слов, хвост распределения ещё не успел проявиться, поэтому оценка наклона «прыгает» вниз.',
  }
}

function r2Plain(r2) {
  if (r2 >= 0.95) {
    return 'Точки почти идеально ложатся на прямую в log–log: закон Ципфа здесь хорошо описывает частоты.'
  }
  if (r2 >= 0.85) {
    return 'Подгонка приемлемая: общая тенденция есть, но есть заметный разброс (часто у коротких текстов).'
  }
  return 'Подгонка слабая: по таким данным нельзя уверенно говорить о «чистом» Ципфе — слишком мало материала или слишком шумно.'
}

function lengthPlain(n) {
  if (n < 500) return 'Это миниатюра. Все метрики на ней менее устойчивы, чем на повести-новелле.'
  if (n < 1500) return 'Средний по длине рассказ цикла: цифры уже читаемы, но сравнивать лучше с текстами похожей длины.'
  return 'Длинный текст: оценки α и R² обычно стабильнее и ближе к идеалу Ципфа.'
}

function MetricExplain({ label, value, kids }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">{label}</div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{kids}</div>
    </div>
  )
}

function StoryDecoder({ story }) {
  if (!story) return null
  const a = alphaPlain(story.alpha)
  const toneBox =
    a.tone === 'ok'
      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
      : a.tone === 'mid'
        ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'
        : 'border-rose-300 bg-rose-50 dark:bg-rose-950/30'
  const hapaxPct = (story.hapax_ratio * 100).toFixed(1)
  const ttr = story.ttr

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${toneBox}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Расшифровка цифр · часть {story.part} ·{' '}
          <a className="underline font-semibold" href={story.web} target="_blank" rel="noreferrer">
            читать текст «{story.title}»
          </a>
        </p>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{story.title}</h4>
        <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 mb-2">
          <strong>{a.title}.</strong> {a.text}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{lengthPlain(story.tokens)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <MetricExplain label="N — токены" value={story.tokens}>
          Сколько раз в тексте встретилось <em>любое</em> слово (с повторами). В фразе «сад и сад» N = 3.
          Здесь N = {story.tokens}: столько словоупотреблений в рассказе.
        </MetricExplain>
        <MetricExplain label="V — типы" value={story.types}>
          Сколько <em>разных</em> словоформ. В «сад и сад» V = 2 (<em>сад</em>, <em>и</em>). Здесь V ={' '}
          {story.types}: столько уникальных написаний слов.
        </MetricExplain>
        <MetricExplain label="α — альфа Ципфа" value={story.alpha.toFixed(3)}>
          Наклон «лесенки» частот. Идеал ≈ <strong>1</strong>: 1-е слово ~вдвое чаще 2-го, ~втрое чаще 3-го.
          У этого рассказа α = {story.alpha.toFixed(3)} — {a.title.toLowerCase()}.
        </MetricExplain>
        <MetricExplain label="R² — качество прямой" value={story.r2.toFixed(3)}>
          Насколько точки «ранг–частота» похожи на прямую (0…1). R² = {story.r2.toFixed(3)}:{' '}
          {r2Plain(story.r2)}
        </MetricExplain>
        <MetricExplain label="Гапаксы" value={`${hapaxPct}%`}>
          Доля словоформ, которые встретились <strong>ровно один раз</strong>. {hapaxPct}% типов здесь —
          «одиночки». Высокий процент часто значит: много редкой предметной/сенсорной лексики (для
          Бунина это ожидаемо), но на коротком тексте процент ещё и раздут длиной.
        </MetricExplain>
        <MetricExplain label="Guiraud = V/√N" value={story.guiraud.toFixed(2)}>
          Грубый показатель «богатства словаря» с поправкой на длину. Сырой TTR = V/N ={' '}
          {ttr.toFixed(3)} на коротких текстах почти всегда высок и плохо сравнивает миниатюру с
          повестью; Guiraud чуть спокойнее для сопоставления.
        </MetricExplain>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 text-sm leading-relaxed">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">Одной фразой для конспекта</p>
        <p>
          В «{story.title}» при N={story.tokens} закон Ципфа даёт α={story.alpha.toFixed(2)} и R²=
          {story.r2.toFixed(2)}
          {story.tokens < 500
            ? '; цифры нужно читать осторожно — текст короткий.'
            : story.alpha >= 0.88
              ? '; профиль близок к классическому Ципфу.'
              : '; профиль умеренный, типичный для многих новелл цикла.'}{' '}
          Гапаксов {hapaxPct}% — много редких слов, но это не доказательство авторства.
        </p>
      </div>
    </div>
  )
}

function CycleExplorer() {
  const [part, setPart] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('order')
  const [focus, setFocus] = useState('kamarg')
  const [compare, setCompare] = useState('chistyj-ponedelnik')
  const [toyRank, setToyRank] = useState(1)
  const [hover, setHover] = useState(null)

  const rows = useMemo(() => {
    let list = ZIPF_CYCLE.stories.slice()
    if (part !== 'all') list = list.filter((s) => String(s.part) === part)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter((s) => s.title.toLowerCase().includes(needle) || s.slug.includes(needle))
    }
    list.sort((a, b) => {
      if (sort === 'alpha') return b.alpha - a.alpha
      if (sort === 'tokens') return b.tokens - a.tokens
      if (sort === 'hapax') return b.hapax_ratio - a.hapax_ratio
      return a.order - b.order
    })
    return list
  }, [part, q, sort])

  const focused = ZIPF_CYCLE.stories.find((s) => s.slug === focus) || ZIPF_CYCLE.stories[0]
  const other = ZIPF_CYCLE.stories.find((s) => s.slug === compare) || ZIPF_CYCLE.stories[33]
  const maxAlpha = Math.max(...ZIPF_CYCLE.stories.map((s) => s.alpha))
  const maxTokens = Math.max(...ZIPF_CYCLE.stories.map((s) => s.tokens))
  const toyF1 = 120
  const toyFreq = Math.round(toyF1 / toyRank)

  return (
    <div className="space-y-8">
      {/* 1. What is Zipf */}
      <section className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 1 · Что такое закон Ципфа
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
          В любом естественном тексте очень мало частых слов и очень много редких
        </h3>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          Возьмите рассказ, посчитайте, сколько раз встречается каждое слово, и выстройте слова по
          убыванию частоты. Самое частое получает <strong>ранг 1</strong>, следующее — ранг 2 и т.д.
          Джордж Ципф заметил: частота примерно обратно пропорциональна рангу. Памятка:
        </p>
        <div className="rounded-xl bg-gray-900 text-teal-100 font-mono text-sm sm:text-base px-4 py-3">
          частота(ранг) ≈ частота₁ / ранг<sup>α</sup> &nbsp;&nbsp;·&nbsp;&nbsp; классика: α ≈ 1
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Пример «на пальцах»: если самое частое слово встретилось <strong>120</strong> раз, то при
          идеальном Ципфе (α=1) слово ранга 2 ≈ 60 раз, ранга 3 ≈ 40, ранга 4 ≈ 30. Двигайте ползунок:
        </p>
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 p-4">
          <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
            Ранг слова: {toyRank}
          </label>
          <input
            type="range"
            min={1}
            max={12}
            value={toyRank}
            onChange={(e) => setToyRank(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-3 grid sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500">ранг</div>
              <div className="text-2xl font-bold">{toyRank}</div>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500">идеал Ципфа ≈</div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{toyFreq}</div>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500">формула</div>
              <div className="text-sm font-mono mt-1">120 / {toyRank}</div>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-1 h-28">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((r) => {
              const f = toyF1 / r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setToyRank(r)}
                  className={`flex-1 rounded-t-md ${r === toyRank ? 'bg-teal-600' : 'bg-teal-300/70 dark:bg-teal-700/50'}`}
                  style={{ height: `${(f / toyF1) * 100}%` }}
                  title={`ранг ${r} ≈ ${Math.round(f)}`}
                />
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Столбики — идеальная «лесенка» Ципфа для f₁=120.</p>
        </div>
      </section>

      {/* 2. Why for literature */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 2 · Зачем это литературоведению
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Не «математика ради математики»</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm leading-relaxed">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <p className="font-semibold mb-1 text-gray-900 dark:text-white">Сделать стиль измеримым</p>
            <p className="text-gray-700 dark:text-gray-300">
              Вместо только впечатления «у Бунина густая деталь» мы видим: много гапаксов (редких слов)
              при обычном служебном каркасе (<em>и, в, на, она…</em>).
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <p className="font-semibold mb-1 text-gray-900 dark:text-white">Сравнивать тексты честно</p>
            <p className="text-gray-700 dark:text-gray-300">
              Миниатюру и длинную новеллу нельзя сравнивать «на глаз» по числу редких слов. Ципф и
              связанные метрики показывают, где различие — длина, а где — устройство словаря.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 p-4 bg-rose-50/80 dark:bg-rose-950/20">
            <p className="font-semibold mb-1 text-gray-900 dark:text-white">Чего закон НЕ делает</p>
            <p className="text-gray-700 dark:text-gray-300">
              Он <strong>не доказывает</strong>, что текст написал Бунин. Почти любой связный текст
              языка даёт похожую «лесенку». Ципф — про устройство частот, не про паспорт автора.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Корпус для разбора:{' '}
          <Link className="underline font-semibold" to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei">
            37 рассказов «Тёмных аллей»
          </Link>
          . На всём цикле α≈{ZIPF_CYCLE.cycleAlpha.toFixed(2)}, R²≈{ZIPF_CYCLE.cycleR2.toFixed(2)} — очень
          устойчивый ципфовский профиль.
        </p>
      </section>

      {/* 3. Decode one story */}
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 3 · Расшифруйте цифры одного рассказа
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Выберите рассказ — справа/ниже каждая буква метрики переведена на человеческий язык.
          Для старта открыт <strong>«Камарг»</strong> (очень короткий): на нём хорошо видно, как длина
          ломает «красивую» α.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['kamarg', 'Камарг (короткий)'],
            ['chasovnya', 'Часовня (короткий)'],
            ['holodnaya-osen', 'Холодная осень'],
            ['chistyj-ponedelnik', 'Чистый понедельник (длинный)'],
            ['natali', 'Натали (самый длинный)'],
          ].map(([slug, label]) => (
            <button
              key={slug}
              type="button"
              onClick={() => setFocus(slug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                focus === slug
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          Или любой рассказ цикла
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
            value={focused.slug}
            onChange={(e) => setFocus(e.target.value)}
          >
            {ZIPF_CYCLE.stories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.order}. {s.title} (N={s.tokens}, α={s.alpha.toFixed(2)})
              </option>
            ))}
          </select>
        </label>
        <StoryDecoder story={focused} />
      </section>

      {/* 4. Compare */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 4 · Сравните короткий и длинный
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Слева — выбранный рассказ, справа — текст для сравнения. Смотрите не «кто лучше», а как
          меняются α и R² с длиной.
        </p>
        <label className="block text-sm max-w-md">
          Сравнить с
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
            value={other.slug}
            onChange={(e) => setCompare(e.target.value)}
          >
            {ZIPF_CYCLE.stories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900 text-left">
              <tr>
                <th className="p-2">Метрика</th>
                <th className="p-2">{focused.title}</th>
                <th className="p-2">{other.title}</th>
                <th className="p-2">Как читать разницу</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['N (длина)', focused.tokens, other.tokens, 'Больше N — обычно стабильнее α'],
                ['α', focused.alpha.toFixed(3), other.alpha.toFixed(3), 'Ближе к 1 — «классический» Ципф'],
                ['R²', focused.r2.toFixed(3), other.r2.toFixed(3), 'Выше — ровнее прямая в log–log'],
                [
                  'Гапаксы',
                  `${(focused.hapax_ratio * 100).toFixed(0)}%`,
                  `${(other.hapax_ratio * 100).toFixed(0)}%`,
                  'Выше % часто у более коротких текстов',
                ],
              ].map(([k, a, b, tip]) => (
                <tr key={k} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2 font-medium">{k}</td>
                  <td className="p-2">{a}</td>
                  <td className="p-2">{b}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">{tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Interactive charts */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 5 · Интерактивные графики по циклу
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Наведите на столбик или точку — внизу появится расшифровка. Клик выбирает рассказ для шага 3.
        </p>
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-3 text-sm min-h-[4.5rem]">
          {hover ? (
            <p>
              <strong>{hover.title}</strong>: N={hover.tokens}, α={hover.alpha.toFixed(3)}, R²=
              {hover.r2.toFixed(3)}. {alphaPlain(hover.alpha).text}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Наведите курсор на столбик или точку…</p>
          )}
        </div>

        <h4 className="font-semibold text-gray-900 dark:text-white">α каждого рассказа (порядок в книге)</h4>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3">
          <div className="flex items-end gap-1 min-w-[760px] h-44">
            {ZIPF_CYCLE.stories.map((s) => (
              <button
                key={s.slug}
                type="button"
                onMouseEnter={() => setHover(s)}
                onFocus={() => setHover(s)}
                onClick={() => setFocus(s.slug)}
                className={`flex-1 rounded-t-sm transition-colors ${
                  focus === s.slug ? 'bg-teal-700' : 'bg-teal-400/80 hover:bg-teal-600'
                }`}
                style={{ height: `${(s.alpha / maxAlpha) * 100}%` }}
                aria-label={s.title}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Выше столбик → α ближе к 1. Пунктирный ориентир идеала — около высоты самых длинных новелл.
          </p>
        </div>

        <h4 className="font-semibold text-gray-900 dark:text-white">Длина (N) и α</h4>
        <div
          className="relative h-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
          onMouseLeave={() => setHover(null)}
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[10px] text-gray-500">
            α выше
          </div>
          {ZIPF_CYCLE.stories.map((s) => {
            const left = (s.tokens / maxTokens) * 88 + 6
            const bottom = ((s.alpha - 0.4) / 0.6) * 78 + 10
            const colors = { 1: 'bg-sky-600', 2: 'bg-orange-600', 3: 'bg-amber-500' }
            return (
              <button
                key={s.slug}
                type="button"
                onMouseEnter={() => setHover(s)}
                onFocus={() => setHover(s)}
                onClick={() => setFocus(s.slug)}
                className={`absolute w-3 h-3 rounded-full ${colors[s.part]} ${
                  focus === s.slug ? 'ring-2 ring-offset-2 ring-teal-500 scale-125' : 'hover:scale-125'
                }`}
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
                aria-label={s.title}
              />
            )
          })}
          <div className="absolute left-3 bottom-1 text-[10px] text-gray-500">короткие</div>
          <div className="absolute right-3 bottom-1 text-[10px] text-gray-500">длинные →</div>
          <div className="absolute right-3 top-2 text-[10px] text-gray-500 flex gap-2">
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> I</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-orange-600 inline-block" /> II</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> III</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Видно главный эффект: слева внизу — миниатюры (низкая α), справа вверху — длинные новеллы.
          Корреляция длины и α ≈ {ZIPF_CYCLE.corrLenAlpha}. Части книги почти не «ломают» закон — ломает
          объём выборки.
        </p>
      </section>

      {/* 6. Table */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 6 · Таблица всех рассказов
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            value={part}
            onChange={(e) => setPart(e.target.value)}
          >
            <option value="all">Все части</option>
            <option value="1">Часть I</option>
            <option value="2">Часть II</option>
            <option value="3">Часть III</option>
          </select>
          <input
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-w-[12rem]"
            placeholder="Поиск названия…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="order">По порядку</option>
            <option value="alpha">По α</option>
            <option value="tokens">По длине</option>
            <option value="hapax">По гапаксам</option>
          </select>
        </div>
        <div className="overflow-auto max-h-96 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2">#</th>
                <th className="p-2">Рассказ</th>
                <th className="p-2">N</th>
                <th className="p-2">α</th>
                <th className="p-2">R²</th>
                <th className="p-2">Смысл α</th>
                <th className="p-2">Текст</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.slug}
                  className={`border-t border-gray-100 dark:border-gray-800 ${
                    focus === s.slug ? 'bg-teal-50 dark:bg-teal-950/40' : ''
                  }`}
                >
                  <td className="p-2">{s.order}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="font-medium underline-offset-2 hover:underline text-left"
                      onClick={() => setFocus(s.slug)}
                    >
                      {s.title}
                    </button>
                  </td>
                  <td className="p-2">{s.tokens}</td>
                  <td className="p-2">{s.alpha.toFixed(3)}</td>
                  <td className="p-2">{s.r2.toFixed(3)}</td>
                  <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{alphaPlain(s.alpha).title}</td>
                  <td className="p-2">
                    <a href={s.web} target="_blank" rel="noreferrer" className="text-teal-700 dark:text-teal-400 underline">
                      читать
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-sm leading-relaxed">
        <strong>Итог, который нельзя перепутать.</strong> Высокие α и R² на длинных текстах и на всём
        цикле говорят: словарь устроен «по-языковому», устойчиво, без ломаной экспериментальной прозы.
        Низкая α у «Камарга» говорит о <em>малой длине выборки</em>, а не о том, что рассказ «не
        бунинский». Для атрибуции авторства Ципфа недостаточно.
      </section>
    </div>
  )
}

function PythonGuide() {
  const codeBox =
    'mt-2 mb-4 overflow-x-auto rounded-xl bg-gray-900 text-gray-100 p-4 text-[13px] leading-relaxed font-mono'

  return (
    <div className="space-y-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
      <div className="rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-950/30 p-4 sm:p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Python и PyCharm с нуля (для тех, кто только установил PyCharm)
        </h3>
        <p className="mb-3">
          Ниже — точные шаги. Рабочую папку назовите, например, <code className="px-1 rounded bg-white/70 dark:bg-gray-900">zipf_bunin</code>.
          Имя может быть любым — главное, чтобы вы сами его помнили.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex px-4 py-2 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
            href={`${DL}/scripts_zipf_bunin.zip`}
            download
          >
            Скачать ZIP со скриптами и текстами
          </a>
          <a
            className="inline-flex px-4 py-2 rounded-xl border border-teal-700 text-teal-900 dark:text-teal-200 font-semibold"
            href={`${DL}/scripts/zipf_one_story.py`}
            download
          >
            zipf_one_story.py
          </a>
          <a
            className="inline-flex px-4 py-2 rounded-xl border border-teal-700 text-teal-900 dark:text-teal-200 font-semibold"
            href={`${DL}/scripts/zipf_several_stories.py`}
            download
          >
            zipf_several_stories.py
          </a>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Шаг 0. Нужен ли Python отдельно?</h3>
        <p>
          PyCharm — это редактор. Чтобы запускать код, на компьютере должен быть установлен{' '}
          <strong>Python 3</strong>. Если Python ещё нет — сначала поставьте его, потом вернитесь в
          PyCharm.
        </p>
        <Details title="Windows: установка Python" defaultOpen>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Откройте сайт{' '}
              <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
                python.org/downloads
              </a>{' '}
              и скачайте Python 3.
            </li>
            <li>
              В установщике <strong>обязательно отметьте</strong> галочку{' '}
              <code>Add python.exe to PATH</code>, затем Install Now.
            </li>
            <li>Закройте и снова откройте PowerShell / cmd.</li>
            <li>
              Проверьте установку точной командой:
              <pre className={codeBox}>python --version</pre>
              Ожидаемый ответ похож на <code>Python 3.12.x</code> (номер может отличаться).
            </li>
            <li>
              Если команда не найдена, попробуйте:
              <pre className={codeBox}>py --version</pre>
            </li>
          </ol>
        </Details>
        <Details title="macOS: установка Python">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Скачайте установщик с{' '}
              <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
                python.org/downloads
              </a>{' '}
              или поставьте через Homebrew: <code>brew install python</code>.
            </li>
            <li>
              Откройте приложение <strong>Terminal</strong> и выполните:
              <pre className={codeBox}>python3 --version</pre>
            </li>
            <li>
              На Mac чаще нужна команда <code>python3</code>, а не <code>python</code>.
            </li>
          </ol>
        </Details>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Шаг 1. Подготовьте папку проекта</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Скачайте ZIP по кнопке выше.
          </li>
          <li>
            Распакуйте архив, например, на Рабочий стол. Получится набор файлов; соберите их в папку
            с понятным именем, например:
            <pre className={codeBox}>Рабочий стол/zipf_bunin/
  sample_texts/
  scripts/
  README.txt</pre>
          </li>
          <li>
            Внутри <code>scripts/</code> должны быть файлы:
            <code>zipf_lib.py</code>, <code>zipf_one_story.py</code>,{' '}
            <code>zipf_several_stories.py</code>, <code>requirements.txt</code>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Шаг 2. Откройте папку в PyCharm</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Запустите PyCharm.</li>
          <li>
            Выберите <strong>Open</strong> (не New Project).
          </li>
          <li>
            Укажите папку <code>zipf_bunin</code> (вашу рабочую папку) и откройте её.
          </li>
          <li>
            Слева в дереве проекта вы должны видеть <code>scripts</code> и <code>sample_texts</code>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 3. Подключите интерпретатор Python в PyCharm
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Меню: <strong>PyCharm → Settings</strong> (на Windows часто{' '}
            <strong>File → Settings</strong>).
          </li>
          <li>
            Раздел: <strong>Project: … → Python Interpreter</strong>.
          </li>
          <li>
            Нажмите шестерёнку / Add Interpreter → <strong>Add Local Interpreter</strong> →{' '}
            <strong>Virtualenv Environment</strong> → New.
          </li>
          <li>
            Base interpreter: выберите установленный Python 3 → OK.
          </li>
          <li>
            Дождитесь создания окружения. В правом нижнем углу PyCharm должно появиться что-то вроде
            <code>Python 3.x (zipf_bunin)</code>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 4. Установите библиотеки для графиков
        </h3>
        <p>
          Откройте внизу вкладку <strong>Terminal</strong> в PyCharm и выполните команды{' '}
          <em>точно</em> так (сначала зайдите в папку scripts):
        </p>
        <p className="font-semibold text-gray-900 dark:text-white">Windows (PowerShell / cmd в PyCharm):</p>
        <pre className={codeBox}>{`cd scripts
python -m pip install -r requirements.txt`}</pre>
        <p className="font-semibold text-gray-900 dark:text-white">macOS / Linux:</p>
        <pre className={codeBox}>{`cd scripts
python3 -m pip install -r requirements.txt`}</pre>
        <p>
          Если <code>python</code> не находится на Windows, замените на <code>py -m pip install -r requirements.txt</code>.
        </p>
        <p>
          Успех: в конце не должно быть красной ошибки. Пакеты <code>matplotlib</code> и{' '}
          <code>numpy</code> нужны для PNG-графиков; сами числа скрипт посчитает и без них.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 5. Запуск одного рассказа — точные примеры
        </h3>
        <p>
          Откройте файл <code>scripts/zipf_one_story.py</code>. Есть два способа запуска.
        </p>
        <Details title="Способ A (проще): через Terminal PyCharm" defaultOpen>
          <p>Убедитесь, что вы в папке <code>scripts</code>, затем:</p>
          <p className="font-semibold">Windows:</p>
          <pre className={codeBox}>{`python zipf_one_story.py ../sample_texts/holodnaya-osen.txt`}</pre>
          <p className="font-semibold">macOS:</p>
          <pre className={codeBox}>{`python3 zipf_one_story.py ../sample_texts/holodnaya-osen.txt`}</pre>
          <p>С сохранением графика:</p>
          <pre className={codeBox}>{`python zipf_one_story.py ../sample_texts/chistyj-ponedelnik.txt --plot ../out_chistyj.png`}</pre>
          <p className="text-xs text-gray-500">
            На macOS снова используйте <code>python3</code> вместо <code>python</code>.
          </p>
        </Details>
        <Details title="Способ B: зелёная кнопка Run в PyCharm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Откройте <code>zipf_one_story.py</code>.</li>
            <li>
              Меню <strong>Run → Edit Configurations…</strong> → + → Python.
            </li>
            <li>
              <strong>Script path</strong>: укажите файл <code>zipf_one_story.py</code>.
            </li>
            <li>
              <strong>Parameters</strong> (важно!): вставьте ровно
              <pre className={codeBox}>../sample_texts/holodnaya-osen.txt</pre>
            </li>
            <li>
              <strong>Working directory</strong>: папка <code>scripts</code> внутри вашего проекта.
            </li>
            <li>Apply → OK → нажмите зелёный треугольник Run.</li>
          </ol>
          <p>Для графика в Parameters:</p>
          <pre className={codeBox}>../sample_texts/chasovnya.txt --plot ../out_chasovnya.png</pre>
        </Details>
        <p>
          В выводе ищите строки <code>α Ципфа</code> и <code>R²</code>. Сравните короткий текст
          (<em>Часовня</em>) и длинный (<em>Чистый понедельник</em>).
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 6. Несколько рассказов — точные примеры
        </h3>
        <p>Из папки <code>scripts</code>:</p>
        <pre className={codeBox}>{`python zipf_several_stories.py ../sample_texts`}</pre>
        <p>С таблицей и графиками:</p>
        <pre className={codeBox}>{`python zipf_several_stories.py ../sample_texts --csv ../table.csv --plots ../plots`}</pre>
        <p>Только выбранные файлы:</p>
        <pre className={codeBox}>{`python zipf_several_stories.py ../sample_texts/kavkaz.txt ../sample_texts/natali.txt --verbose`}</pre>
        <p className="text-xs text-gray-500">На macOS заменяйте <code>python</code> на <code>python3</code>.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Шаг 7. Если что-то сломалось</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>No module named zipf_lib</strong> — запускайте команды из папки{' '}
            <code>scripts</code>, где лежит <code>zipf_lib.py</code>.
          </li>
          <li>
            <strong>File not found</strong> — проверьте путь: от <code>scripts</code> файл
            «Холодная осень» это <code>../sample_texts/holodnaya-osen.txt</code>.
          </li>
          <li>
            <strong>python не является командой</strong> — Windows: поставьте Python с галочкой PATH
            или используйте <code>py</code>; macOS: используйте <code>python3</code>.
          </li>
          <li>
            <strong>Ошибка matplotlib</strong> — повторите{' '}
            <code>python -m pip install -r requirements.txt</code>. Числа всё равно появятся без
            графика, если не передавать <code>--plot</code>.
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Мини-отчёт для практики</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Запустите короткий и длинный рассказ, запишите α и R².</li>
          <li>Одной фразой объясните, почему у миниатюры α может быть ниже.</li>
          <li>Напишите, чего закон Ципфа <em>не</em> доказывает про авторство.</li>
        </ol>
      </section>
    </div>
  )
}

export function ZipfLesson() {
  const [tab, setTab] = useState('cycle')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === 'cycle')} onClick={() => setTab('cycle')}>
          1 · Разбор цикла
        </button>
        <button type="button" className={tabBtn(tab === 'live')} onClick={() => setTab('live')}>
          2 · Стенд лекции
        </button>
        <button type="button" className={tabBtn(tab === 'python')} onClick={() => setTab('python')}>
          3 · Python и PyCharm с нуля
        </button>
      </div>

      {tab === 'cycle' && <CycleExplorer />}
      {tab === 'live' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Короткий интерактивный стенд для показа на паре: теория → график факт vs f₁/r → TTR по
            окнам → мини-код.
          </p>
          <ZipfBuild />
        </div>
      )}
      {tab === 'python' && <PythonGuide />}
    </div>
  )
}
