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

function CycleExplorer() {
  const [part, setPart] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('order')
  const [focus, setFocus] = useState('chistyj-ponedelnik')

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
  const maxAlpha = Math.max(...ZIPF_CYCLE.stories.map((s) => s.alpha))
  const maxTokens = Math.max(...ZIPF_CYCLE.stories.map((s) => s.tokens))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Яркий пример лекции 4: Ципф на всём цикле «Тёмные аллеи»
        </h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          Ниже — готовый разбор 37 рассказов. Сначала поймите метрики, потом сравните короткий и
          длинный текст, затем повторите расчёт у себя в Python. Закон Ципфа учит читать частоты —
          он <strong>не доказывает авторство</strong> сам по себе.
        </p>
        <Link
          to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200 underline"
        >
          Открыть корпус рассказов Бунина →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard value={ZIPF_CYCLE.cycleAlpha.toFixed(2)} label="α цикла (топ-100)" />
        <MetricCard value={ZIPF_CYCLE.cycleR2.toFixed(2)} label="R² цикла" />
        <MetricCard value={ZIPF_CYCLE.meanAlphaLong.toFixed(2)} label="⟨α⟩ при N ≥ 1500" />
        <MetricCard value={`${Math.round(ZIPF_CYCLE.meanHapax * 100)}%`} label="средняя доля гапаксов" />
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Словарь метрик (с нуля)</h3>
        <Details title="Токены (N) и типы (V)" defaultOpen>
          <p>
            <strong>Токен</strong> — каждое словоупотребление. В фразе «сад и сад» три токена.
          </p>
          <p>
            <strong>Тип</strong> — разная словоформа. В той же фразе два типа: <em>сад</em>, <em>и</em>.
          </p>
        </Details>
        <Details title="α (альфа) — показатель Ципфа">
          <p>
            Насколько круто падает частота слова с ростом ранга. Идеал классического Ципфа:{' '}
            <strong>α ≈ 1</strong>.
          </p>
          <p>
            У длинных новелл цикла α ближе к 1 (<em>Натали</em>, <em>Чистый понедельник</em>). У
            миниатюр α часто ниже — чаще из‑за малой длины, а не «другого стиля».
          </p>
        </Details>
        <Details title="R² (эр-квадрат) — качество подгонки">
          <p>
            Число от 0 до 1: насколько точки «ранг–частота» ложатся на прямую в логарифмических
            координатах. R² = 0.99 значит: модель объясняет 99% разброса.
          </p>
        </Details>
        <Details title="Гапаксы, TTR, Guiraud">
          <p>
            <strong>Гапакс</strong> — слово с частотой 1. Высокая доля гапаксов у Бунина связана с
            редкой «живописной» лексикой.
          </p>
          <p>
            <strong>TTR = V/N</strong> на коротких текстах бывает обманчиво высоким.{' '}
            <strong>Guiraud = V/√N</strong> чуть спокойнее сравнивает тексты разной длины.
          </p>
        </Details>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          α по рассказам (порядок в книге)
        </h3>
        <p className="text-xs text-gray-500 mb-2">Чем выше столбец — тем ближе α к классическому Ципфу.</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3">
          <div className="flex items-end gap-1 min-w-[720px] h-40">
            {ZIPF_CYCLE.stories.map((s) => (
              <button
                key={s.slug}
                type="button"
                title={`${s.title}: α=${s.alpha.toFixed(3)}`}
                onClick={() => setFocus(s.slug)}
                className="flex-1 bg-teal-500/80 hover:bg-teal-600 rounded-t-sm"
                style={{ height: `${(s.alpha / maxAlpha) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Длина текста и α</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Корреляция ≈ {ZIPF_CYCLE.corrLenAlpha}: короткие новеллы слева внизу, длинные — правее и
          выше.
        </p>
        <div className="relative h-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
          {ZIPF_CYCLE.stories.map((s) => {
            const left = (s.tokens / maxTokens) * 92 + 4
            const bottom = ((s.alpha - 0.4) / 0.6) * 82 + 8
            const colors = { 1: 'bg-sky-700', 2: 'bg-orange-700', 3: 'bg-amber-600' }
            return (
              <button
                key={s.slug}
                type="button"
                title={`${s.title}: N=${s.tokens}, α=${s.alpha.toFixed(3)}`}
                onClick={() => setFocus(s.slug)}
                className={`absolute w-2.5 h-2.5 rounded-full ${colors[s.part]} ${
                  focus === s.slug ? 'ring-2 ring-offset-1 ring-teal-500 scale-125' : ''
                }`}
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
              />
            )
          })}
          <div className="absolute left-2 bottom-1 text-[10px] text-gray-500">короткие</div>
          <div className="absolute right-2 bottom-1 text-[10px] text-gray-500">длинные →</div>
          <div className="absolute left-2 top-1 text-[10px] text-gray-500">α выше</div>
        </div>
      </section>

      <section className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20 p-4">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Карточка рассказа</h3>
        <label className="block text-sm mb-3">
          Выберите рассказ
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
        <p className="text-sm mb-2">
          <strong>{focused.title}</strong> · часть {focused.part} ·{' '}
          <a className="underline font-medium" href={focused.web} target="_blank" rel="noreferrer">
            читать текст
          </a>
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          N={focused.tokens}, V={focused.types}, α={focused.alpha.toFixed(3)}, R²=
          {focused.r2.toFixed(3)}, гапаксы={(focused.hapax_ratio * 100).toFixed(1)}%, Guiraud=
          {focused.guiraud.toFixed(2)}
        </p>
      </section>

      <section>
        <div className="flex flex-wrap gap-2 mb-3">
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
        <div className="overflow-auto max-h-80 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2">#</th>
                <th className="p-2">Рассказ</th>
                <th className="p-2">N</th>
                <th className="p-2">α</th>
                <th className="p-2">R²</th>
                <th className="p-2">Открыть</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.slug} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2">{s.order}</td>
                  <td className="p-2">
                    <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setFocus(s.slug)}>
                      {s.title}
                    </button>
                  </td>
                  <td className="p-2">{s.tokens}</td>
                  <td className="p-2">{s.alpha.toFixed(3)}</td>
                  <td className="p-2">{s.r2.toFixed(3)}</td>
                  <td className="p-2">
                    <a href={s.web} target="_blank" rel="noreferrer" className="text-teal-700 dark:text-teal-400 underline">
                      текст
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-sm leading-relaxed">
        <strong>Важно для интерпретации.</strong> Высокий α и R² на цикле показывают устойчивый
        частотный профиль прозы. Это <em>не</em> доказательство «текст написал Бунин»: закон Ципфа
        почти универсален для естественного языка. Для атрибуции нужны контрольные корпуса и другие
        признаки.
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
