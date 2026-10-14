import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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


const SERVICE_WORDS = new Set(
  `и в на с не я она что он как а ее её все к за по но меня его от у из о до для при без же бы ли да это был была было были ты вы мы нас вас тебя мне мной ним ней них их мой моя мое мои свой своя свое свои тот та то те этот эта эти чтобы уже только еще ещё есть нет так вот там тут когда где кто чем или если ни будто даже ведь лишь почти сам сама само сами себя себе собой под над во со ко об про нибудь ей ему ими вами нами тобой собой нее него них какая какой какое какие какой-то какая-то какой нибудь`.split(
    /\s+/
  )
)

function isServiceWord(w) {
  return SERVICE_WORDS.has(w)
}

function Top20Panel({ words, tokens, cover, modeLabel }) {
  if (!words?.length || !tokens) return null
  const max = words[0][1]
  const serviceN = words.filter(([w]) => isServiceWord(w)).length
  const content = words.filter(([w]) => !isServiceWord(w))
  const coverPct = ((cover ?? words.reduce((s, [, c]) => s + c, 0) / tokens) * 100).toFixed(1)

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">
          Топ-20 словоформ · {modeLabel}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          покрывают ≈{coverPct}% всех токенов · служебных в топе: {serviceN}/20
        </div>
      </div>

      <ol className="space-y-1.5">
        {words.map(([w, c], i) => {
          const svc = isServiceWord(w)
          return (
            <li key={`${w}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="w-6 shrink-0 text-right text-xs text-gray-400 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className={`font-mono font-semibold ${svc ? 'text-gray-800 dark:text-gray-200' : 'text-amber-800 dark:text-amber-300'}`}>
                    {w}
                  </span>
                  <span className="tabular-nums text-gray-600 dark:text-gray-400 shrink-0">
                    {c}
                    <span className="text-xs text-gray-400 ml-1">({((c / tokens) * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${svc ? 'bg-teal-500/80' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(4, (c / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className={`shrink-0 text-[10px] uppercase tracking-wide w-16 text-right ${svc ? 'text-teal-700 dark:text-teal-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {svc ? 'служебн.' : 'знаменат.'}
              </span>
            </li>
          )
        })}
      </ol>

      {content.length > 0 ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          В топ-20 «пробились» знаменательные / именные формы:{' '}
          {content.map(([w, c]) => (
            <span key={w} className="inline-block mr-2 font-mono text-amber-800 dark:text-amber-300">
              {w} ({c})
            </span>
          ))}
          — это уже след сюжета или героя, а не только грамматический каркас.
        </p>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Все 20 позиций — служебные слова и местоимения. Тема рассказа в частотном топе{' '}
          <em>не видна</em>: любовь, сад, осень, смерть почти никогда не входят в топ-20, хотя именно
          они важны для чтения.
        </p>
      )}
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

      <Top20Panel
        words={story.topWords}
        tokens={story.tokens}
        cover={story.top20_cover}
        modeLabel={`рассказ «${story.title}»`}
      />

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


      {/* 4. Top-20 wordforms */}
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 4 · Топ-20 словоформ: цикл и каждый рассказ
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Что чаще всего говорит текст — и чего в топе нет
        </h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Топ-20 — это двадцать словоформ с наибольшей частотой. На всём цикле ({ZIPF_CYCLE.cycleTokens.toLocaleString('ru-RU')}{' '}
          токенов) они покрывают ≈{(ZIPF_CYCLE.cycleTop20Cover * 100).toFixed(0)}% текста: почти четверть
          книги держится на крошечном служебном каркасе. Бирюзовые полоски — союзы, предлоги,
          местоимения; янтарные — знаменательные слова или имена, если они «пробились» в топ.
        </p>

        <Top20Panel
          words={ZIPF_CYCLE.topWords}
          tokens={ZIPF_CYCLE.cycleTokens}
          cover={ZIPF_CYCLE.cycleTop20Cover}
          modeLabel="весь цикл «Тёмные аллеи»"
        />

        <div className="grid md:grid-cols-2 gap-3 text-sm leading-relaxed">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Что это значит</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-200">
              <li>
                В топе цикла — <em>и, в, на, с, не, я, она, он, что, как…</em>: грамматика связного
                нарратива и местоименная сцена «я / она / он», типичная для любовной новеллы.
              </li>
              <li>
                Слово «любовь» (и почти любая «тема» курса) в топ-20 <strong>не входит</strong>. Частотный
                пик — не смысловой пик: тему читают в редких словах и контекстах, а не в первых рангах.
              </li>
              <li>
                Покрытие топ-20 ≈{(ZIPF_CYCLE.cycleTop20Cover * 100).toFixed(0)}% при огромном хвосте
                гапаксов — классическая картина Ципфа: мало «цемента», много одноразовой детали.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Какие выводы можно / нельзя сделать</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-200">
              <li>
                <strong>Можно:</strong> цикл держится на служебном каркасе + сильных местоимениях; редкая
                лексика отвечает за «живопись» мира.
              </li>
              <li>
                <strong>Можно:</strong> если в топ рассказа входит имя (<em>натали, генрих, николай</em>) —
                частотный центр смещён к персонажу; это приглашение смотреть, как имя повторяется в
                композиции.
              </li>
              <li>
                <strong>Нельзя:</strong> вывести «главную тему» рассказа из топ-20 или доказать авторство
                по списку служебных слов — он почти одинаков у любого русского прозаика.
              </li>
              <li>
                <strong>Осторожно на миниатюрах:</strong> при N≈200 в топ попадают слова с частотой 2 —
                это шум малой выборки, не «особый стиль».
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Сравните топ выбранного рассказа с циклом
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Переключатель тот же, что в шаге 3: смените рассказ выше или здесь — топ-20 обновится.
            Ищите янтарные строки: имя героя, предмет, жест.
          </p>
          <label className="block text-sm max-w-md">
            Рассказ для топ-20
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2"
              value={focused.slug}
              onChange={(e) => setFocus(e.target.value)}
            >
              {ZIPF_CYCLE.stories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.order}. {s.title}
                </option>
              ))}
            </select>
          </label>
          <Top20Panel
            words={focused.topWords}
            tokens={focused.tokens}
            cover={focused.top20_cover}
            modeLabel={`«${focused.title}» (N=${focused.tokens})`}
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Задание на семинар: выберите длинный рассказ (<em>Натали</em>, <em>Чистый понедельник</em>) и
            миниатюру (<em>Камарг</em>, <em>Часовня</em>). В длинном топ почти совпадёт с циклом; в коротком
            появятся «случайные» знаменательные слова с частотой 1–2. Запишите один вывод: что в топе
            устойчиво (каркас), а что зависит от длины выборки.
          </p>
        </div>
      </section>

      {/* 5. Compare */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 5 · Сравните короткий и длинный
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

      {/* 6. Interactive charts */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 6 · Интерактивные графики по циклу
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

      {/* 7. Table */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 7 · Таблица всех рассказов
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

      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Шаг 8 · Зачем мы это считали — и что теперь можно сказать о цикле
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Цифры — не ответ, а способ задать литературоведческий вопрос точнее
        </h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Закон Ципфа сам по себе не «объясняет» любовь у Бунина и не заменяет медленное чтение.
          Он нужен, чтобы проверить гипотезы о <em>устройстве словаря</em> цикла и не путать эффект
          длины текста с «сменой стиля».
        </p>

        <div className="grid md:grid-cols-2 gap-3 text-sm leading-relaxed">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Что расчёт подтверждает</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-200">
              <li>
                На всём цикле α≈{ZIPF_CYCLE.cycleAlpha.toFixed(2)} и R²≈{ZIPF_CYCLE.cycleR2.toFixed(2)} —
                словарь ведёт себя как нормальный естественный язык, а не как ломаный эксперимент.
              </li>
              <li>
                Части I–III почти совпадают по среднему α: книга едина по частотному режиму, хотя сюжеты
                и объёмы разные.
              </li>
              <li>
                Высокая доля гапаксов согласуется с ощущением «густой» редкой детали: предметные и
                сенсорные слова часто встречаются по одному разу.
              </li>
              <li>
                В топе частот — союзы, предлоги, местоимения (<em>и, в, на, я, она, он</em>): каркас
                любовного нарратива, а не «ключевые слова сюжета».
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Что расчёт опровергает / ограничивает</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-200">
              <li>
                «У „Камарга“ низкая α → другой стиль / не Бунин» — нет: это в первую очередь короткая
                выборка.
              </li>
              <li>
                «α близка к 1 → доказали авторство» — нет: так устроен почти любой связный текст.
              </li>
              <li>
                «Часть III стилистически иная, потому что среднее α ниже» — осторожно: там просто
                больше миниатюр.
              </li>
              <li>
                Ципф не измеряет тему любви, ритм фразы, иронию, композицию — только распределение
                частот словоформ.
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm leading-relaxed space-y-3">
          <p className="font-semibold text-gray-900 dark:text-white">Как вернуть результат к тексту (медленное чтение)</p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Возьмите рассказ с высокой долей гапаксов и длинный рассказ с α≈0.9. В каждом выпишите
              10–15 слов, встретившихся один раз: быт, тело, пейзаж, чужое имя?
            </li>
            <li>
              Спросите: редкость слова работает на <em>вспышку детали</em> или на сюжетный повтор?
              Ципф показывает редкость; смысл даёт контекст.
            </li>
            <li>
              Сравните диалог и описание «на глаз»: служебные слова держат речь, гапаксы чаще сидят в
              живописи мира — гипотеза для чтения, которую Ципф только подсказывает.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/25 p-4 text-sm leading-relaxed">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Формула вывода для семинара</p>
          <p className="text-gray-800 dark:text-gray-200">
            «По закону Ципфа цикл „Тёмные аллеи“ имеет устойчивый частотный профиль (на корпусе α≈0.95,
            R²≈0.99). Это говорит о единообразии языкового режима книги и о совместимости „служебного
            каркаса“ с большим хвостом редких слов. Разброс α между рассказами в основном связан с
            длиной текста. Сам по себе показатель не атрибутирует авторство и не заменяет анализ
            поэтики; он уточняет, какие различия стоит объяснять объёмом выборки, а какие — искать в
            чтении.»
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-sm leading-relaxed">
          <strong>Итог, который нельзя перепутать.</strong> Мы считали Ципфа не чтобы «получить красивую
          α», а чтобы отличить <em>устройство словаря цикла</em> от иллюзий сравнения короткого и
          длинного текста — и чтобы вернуться к чтению Бунина с более честными вопросами о детали,
          повторе и единстве книги.
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
      <div className="rounded-2xl border-2 border-teal-500 dark:border-teal-500 bg-teal-50 dark:bg-teal-950/30 p-4 sm:p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Практика в PyCharm для абсолютных новичков
        </h3>
        <p className="mb-3">
          Цель: чтобы <strong>у всей группы одинаково получилось</strong> посчитать α и R² и сохранить
          график PNG. Делайте шаги по порядку, ничего не пропускайте.
        </p>
        <div className="rounded-xl bg-white/80 dark:bg-gray-900/60 border border-teal-200 dark:border-teal-800 p-3 mb-4 font-mono text-sm">
          <div className="text-xs uppercase tracking-wide text-teal-800 dark:text-teal-300 font-sans font-bold mb-1">
            Обязательная папка у всех студентов
          </div>
          <div>
            Windows: <strong>C:\Users\&lt;ВАШ_ЛОГИН&gt;\Documents\zipf_bunin</strong>
          </div>
          <div>
            macOS: <strong>/Users/&lt;ВАШ_ЛОГИН&gt;/Documents/zipf_bunin</strong>
          </div>
          <div className="font-sans text-xs text-gray-600 dark:text-gray-400 mt-2">
            Имя папки только латиницей: <code>zipf_bunin</code>. Не «папка6», не «Ципф», не кириллица.
          </div>
        </div>
        <a
          className="inline-flex px-4 py-2.5 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
          href={`${DL}/scripts_zipf_bunin.zip`}
          download
        >
          Скачать ZIP (скрипты + тексты + папка out)
        </a>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 1. Создайте папку проекта (одинаково у всех)
        </h3>
        <Details title="Windows" defaultOpen>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Откройте Проводник.</li>
            <li>
              Слева выберите <strong>Документы</strong> (Documents).
            </li>
            <li>
              ПКМ по пустому месту → <strong>Создать → Папку</strong>.
            </li>
            <li>
              Назовите папку точно так: <code>zipf_bunin</code> и нажмите Enter.
            </li>
            <li>
              Полный путь должен быть:
              <pre className={codeBox}>{`C:\\Users\\ВАШ_ЛОГИН\\Documents\\zipf_bunin`}</pre>
              Вместо ВАШ_ЛОГИН — имя вашей учётной записи Windows.
            </li>
          </ol>
        </Details>
        <Details title="macOS">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Откройте Finder.</li>
            <li>
              Меню <strong>Переход → Документы</strong> (или Go → Documents).
            </li>
            <li>
              ПКМ / Control+клик → <strong>Новая папка</strong>.
            </li>
            <li>
              Имя папки точно: <code>zipf_bunin</code>.
            </li>
            <li>
              Полный путь:
              <pre className={codeBox}>{`/Users/ВАШ_ЛОГИН/Documents/zipf_bunin`}</pre>
            </li>
          </ol>
        </Details>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 2. Установите Python 3 (если ещё не установлен)
        </h3>
        <p>
          PyCharm — это только редактор. Без Python скрипты не запустятся.
        </p>
        <Details title="Windows: поставить Python" defaultOpen>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Сайт:{' '}
              <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
                python.org/downloads
              </a>
              → кнопка Download Python 3.x.
            </li>
            <li>Запустите установщик.</li>
            <li>
              <strong>Самое важное:</strong> внизу окна отметьте галочку{' '}
              <code>Add python.exe to PATH</code>, затем Install Now.
            </li>
            <li>Дождитесь Finish. Закройте старые окна терминала.</li>
            <li>
              Откройте новое окно PowerShell или cmd и выполните:
              <pre className={codeBox}>python --version</pre>
              Должно появиться что-то вроде <code>Python 3.12.7</code>.
            </li>
            <li>
              Если не сработало, попробуйте:
              <pre className={codeBox}>py --version</pre>
            </li>
          </ol>
        </Details>
        <Details title="macOS: поставить Python">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Скачайте установщик с{' '}
              <a className="underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
                python.org/downloads
              </a>{' '}
              и установите.
            </li>
            <li>
              Откройте Terminal и выполните:
              <pre className={codeBox}>python3 --version</pre>
            </li>
            <li>
              На Mac почти всегда используйте команду <code>python3</code>, а не <code>python</code>.
            </li>
          </ol>
        </Details>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 3. Скачайте ZIP и разложите файлы внутрь zipf_bunin
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Нажмите кнопку «Скачать ZIP» вверху этой вкладки.</li>
          <li>Распакуйте архив (ПКМ → Извлечь всё / Разархивировать).</li>
          <li>
            Откройте получившуюся папку и <strong>скопируйте всё её содержимое</strong> в{' '}
            <code>Documents/zipf_bunin</code>.
          </li>
          <li>
            Внутри <code>zipf_bunin</code> должно получиться ровно так (проверьте имена):
            <pre className={codeBox}>{`zipf_bunin/
  zipf_one_story.py
  zipf_several_stories.py
  zipf_lib.py
  requirements.txt
  README.txt
  sample_texts/
  out/`}</pre>
          </li>
          <li>
            В <code>sample_texts/</code> лежат рассказы (<code>holodnaya-osen.txt</code>,{' '}
            <code>chasovnya.txt</code>, <code>natali.txt</code> и др.). Папка <code>out/</code> пока
            почти пустая — туда программа сохранит графики.
          </li>
        </ol>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          Частая ошибка: оставить лишнюю вложенность вроде{' '}
          <code>zipf_bunin/scripts_zipf_bunin/zipf_one_story.py</code>. Файлы{' '}
          <code>.py</code> должны лежать <strong>сразу внутри</strong> <code>zipf_bunin</code>.
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 4. Откройте папку в PyCharm
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Запустите PyCharm.</li>
          <li>
            На стартовом экране нажмите <strong>Open</strong> (не New Project).
          </li>
          <li>
            Найдите и выберите папку <code>Documents/zipf_bunin</code> → OK / Open.
          </li>
          <li>
            Слева в Project должно быть видно: <code>zipf_one_story.py</code>,{' '}
            <code>sample_texts</code>, <code>out</code>.
          </li>
          <li>
            Если PyCharm спросит «Trust Project» — нажмите Trust.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 5. Подключите интерпретатор Python к проекту
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            macOS: <strong>PyCharm → Settings…</strong>
            <br />
            Windows: <strong>File → Settings…</strong>
          </li>
          <li>
            Слева: <strong>Project: zipf_bunin → Python Interpreter</strong>.
          </li>
          <li>
            Справа вверху шестерёнка / Add Interpreter → <strong>Add Local Interpreter…</strong>
          </li>
          <li>
            Выберите <strong>Virtualenv Environment</strong> → New.
          </li>
          <li>
            Base interpreter: укажите установленный Python 3 → OK.
          </li>
          <li>
            Дождитесь создания venv. В правом нижнем углу PyCharm появится надпись вроде{' '}
            <code>Python 3.12 (zipf_bunin)</code>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 6. Установите библиотеки для графиков (один раз)
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Внизу PyCharm откройте вкладку <strong>Terminal</strong>.
          </li>
          <li>
            Убедитесь, что вы в папке проекта. Команда{' '}
            <code>pwd</code> (Mac) или <code>cd</code> (Windows) должна показывать путь с{' '}
            <code>zipf_bunin</code>. Если нет:
            <pre className={codeBox}>{`cd Documents/zipf_bunin`}</pre>
            (при необходимости укажите полный путь к вашей папке).
          </li>
          <li>
            Windows — выполните ровно:
            <pre className={codeBox}>python -m pip install -r requirements.txt</pre>
            Если не сработает:
            <pre className={codeBox}>py -m pip install -r requirements.txt</pre>
          </li>
          <li>
            macOS — выполните ровно:
            <pre className={codeBox}>python3 -m pip install -r requirements.txt</pre>
          </li>
          <li>
            Дождитесь конца установки без красной ошибки. Должны поставиться{' '}
            <code>matplotlib</code> и <code>numpy</code>.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 7. Первый запуск: один рассказ + график (кнопка Run)
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            В дереве проекта дважды кликните <code>zipf_one_story.py</code>.
          </li>
          <li>
            Справа вверху нажмите зелёный треугольник <strong>Run</strong> (или ПКМ по файлу → Run
            &apos;zipf_one_story&apos;).
          </li>
          <li>
            <strong>Параметры указывать не нужно</strong>: скрипт сам возьмёт{' '}
            <code>sample_texts/holodnaya-osen.txt</code> и сохранит график.
          </li>
          <li>
            Внизу в панели Run / Console должны появиться строки с{' '}
            <code>α Ципфа</code> и <code>R²</code>, а также сообщение{' '}
            <code>График сохранён: …</code>.
          </li>
          <li>
            Откройте папку <code>out/</code> в проекте: там появится файл{' '}
            <code>holodnaya-osen_zipf.png</code>. Откройте его двойным кликом — это ваш график Ципфа.
          </li>
        </ol>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
          Если дошли до PNG в <code>out/</code> — установка прошла успешно. Дальше можно менять
          рассказ.
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 8. Другой рассказ через Parameters (тоже просто)
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Меню <strong>Run → Edit Configurations…</strong>
          </li>
          <li>
            Слева выберите конфигурацию <code>zipf_one_story</code>.
          </li>
          <li>
            Поле <strong>Parameters</strong> очистите и вставьте <em>ровно одну</em> из строк:
            <pre className={codeBox}>{`sample_texts/chasovnya.txt
sample_texts/chistyj-ponedelnik.txt
sample_texts/natali.txt
sample_texts/kavkaz.txt`}</pre>
          </li>
          <li>
            <strong>Working directory</strong> должен быть папка <code>zipf_bunin</code> (не
            вложенная).
          </li>
          <li>Apply → OK → снова Run.</li>
          <li>
            Новый график появится в <code>out/</code>, например{' '}
            <code>chasovnya_zipf.png</code>.
          </li>
        </ol>
        <p>
          Сравните для отчёта: короткий (<em>Часовня</em> / <em>Камарг</em> нет в ZIP, есть{' '}
          <em>Часовня</em>) и длинный (<em>Чистый понедельник</em> или <em>Натали</em>) — запишите α и
          R².
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 9. Несколько рассказов сразу
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Откройте <code>zipf_several_stories.py</code>.
          </li>
          <li>
            Нажмите Run <strong>без Parameters</strong>.
          </li>
          <li>
            Скрипт обойдёт всю папку <code>sample_texts/</code>, напечатает таблицу α/R², сохранит:
            <ul className="list-disc pl-5 mt-2">
              <li>
                <code>out/table.csv</code> — таблица для Excel / Numbers
              </li>
              <li>
                <code>out/plots/*.png</code> — график на каждый рассказ
              </li>
            </ul>
          </li>
        </ol>
        <p>Только два файла (Parameters):</p>
        <pre className={codeBox}>sample_texts/kavkaz.txt sample_texts/natali.txt --verbose</pre>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Шаг 10. Что сдавать / что должно получиться
        </h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Скрин или файл <code>out/holodnaya-osen_zipf.png</code>
          </li>
          <li>
            Две строки чисел: α и R² для короткого и длинного рассказа
          </li>
          <li>
            Одна фраза: почему у миниатюры α часто ниже (длина выборки, не «другой автор»)
          </li>
          <li>
            Одна фраза: чего Ципф <em>не</em> доказывает про авторство
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Если не запускается</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>No module named zipf_lib</strong> — файлы лежат не в одной папке.{' '}
            <code>zipf_lib.py</code> должен быть рядом с <code>zipf_one_story.py</code> внутри{' '}
            <code>zipf_bunin</code>.
          </li>
          <li>
            <strong>File not found … holodnaya-osen.txt</strong> — нет папки{' '}
            <code>sample_texts</code> или Working directory не <code>zipf_bunin</code>.
          </li>
          <li>
            <strong>python не является внутренней или внешней командой</strong> — Python не в PATH;
            переустановите с галочкой Add to PATH или используйте <code>py</code> / на Mac{' '}
            <code>python3</code>.
          </li>
          <li>
            <strong>No module named matplotlib</strong> — снова выполните шаг 6 (
            <code>pip install -r requirements.txt</code>) именно в Terminal этого проекта PyCharm.
          </li>
          <li>
            <strong>Run ничего не делает / другой файл</strong> — откройте именно{' '}
            <code>zipf_one_story.py</code> и запускайте его, а не пустой Untitled.
          </li>
        </ul>
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
        <button type="button" className={tabBtn(tab === 'python')} onClick={() => setTab('python')}>
          2 · Python и PyCharm с нуля
        </button>
      </div>

      {tab === 'cycle' && <CycleExplorer />}
      {tab === 'python' && <PythonGuide />}
    </div>
  )
}
