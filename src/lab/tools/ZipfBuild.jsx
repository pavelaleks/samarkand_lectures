import { useMemo, useState } from 'react'
import { useLabReport } from '../LabReportContext'
import CodeRunner from '../CodeRunner'
import { SAMPLES } from '../samples'
import { countTokens, tokenize, topN, ttr, windowTtr } from '../textUtils'

const field =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm'
const mono = `${field} font-mono`

const ZIPF_STARTER = `// Учебный фрагмент уже в переменной text.
// ЗАДАЧА: токенизировать, посчитать частоты, напечатать топ-5:
// 1 слово частота

const text = ${JSON.stringify(SAMPLES.cleanChekhov)};

// TODO: замените [] на tokenize(text)
const tokens = [];

const cnt = Counter(tokens);
const top = cnt.most_common(5);

// TODO: напечатайте строки вида "1 и 6"
for (let i = 0; i < top.length; i++) {
  // print(...)
}
`

function Step({ n, title, children, active }) {
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        active
          ? 'border-teal-400 dark:border-teal-600 bg-white dark:bg-gray-800 shadow-md'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40'
      }`}
    >
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-teal-600 text-white text-sm">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

export function ZipfBuild() {
  const [step, setStep] = useState(1)
  const [text, setText] = useState(SAMPLES.cleanChekhov)
  const [guess, setGuess] = useState('')
  const [interp, setInterp] = useState('')

  const stats = useMemo(() => {
    const tokens = tokenize(text)
    const counter = countTokens(tokens)
    const zipf = topN(counter, Math.min(25, counter.size)).map(([w, f], i) => ({
      rank: i + 1,
      word: w,
      freq: f,
      share: tokens.length ? f / tokens.length : 0,
      theory: i === 0 ? f : f, // empirical
      zipfPredict: i === 0 ? f : Math.round((topN(counter, 1)[0]?.[1] || 0) / (i + 1)),
    }))
    // theoretical: f1 / rank
    const f1 = zipf[0]?.freq || 0
    const withTheory = zipf.map((row) => ({
      ...row,
      zipfPredict: Math.max(1, Math.round(f1 / row.rank)),
    }))
    return {
      tokens: tokens.length,
      types: counter.size,
      ttrAll: ttr(tokens),
      zipf: withTheory,
      windows: windowTtr(tokens, 40),
      f1,
    }
  }, [text])

  const maxY = Math.max(stats.f1 || 1, ...stats.zipf.map((r) => r.freq))

  useLabReport(
    () => ({
      title: 'Ципф: теория → график → свой код',
      body: [
        `Шаг: ${step}`,
        '',
        '## Ответ по формуле (шаг 1)',
        guess || '—',
        '',
        `Токенов: ${stats.tokens}; types: ${stats.types}; TTR: ${stats.ttrAll.toFixed(3)}`,
        '',
        '## Ранг–частота (факт vs Ципф)',
        ...stats.zipf.slice(0, 12).map(
          (r) => `- r=${r.rank} ${r.word}: факт=${r.freq}, Ципф≈${r.zipfPredict}, Δ=${r.freq - r.zipfPredict}`
        ),
        '',
        '## TTR по окнам',
        ...stats.windows.map((w) => `- окно ${w.index}: ${w.ttr.toFixed(3)}`),
        '',
        '## Интерпретация расхождений',
        interp || '—',
      ].join('\n'),
    }),
    [step, guess, interp, stats]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`px-3 py-1.5 rounded-lg font-medium ${
              step === n
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Шаг {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Step n={1} title="Теория: что утверждает закон Ципфа" active>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            В первом приближении частота слова <strong>обратно пропорциональна</strong> его рангу:
            самое частое слово (ранг 1) встречается примерно в два раза чаще второго, в три раза чаще
            третьего и т.д. Формула-памятка: <code className="text-sm">f(r) ≈ f₁ / r</code>.
          </p>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 mb-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
              Ваше действие (не пролистывайте)
            </p>
            <label className="block text-sm">
              Своими словами: если слово на 1-м месте встретилось 120 раз, сколько примерно раз
              ожидаем слово на 4-м месте по «идеальному» Ципфу?
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className={field}
                placeholder="например: около 30"
              />
            </label>
            {guess.trim() && (
              <p className="text-sm mt-2 text-teal-800 dark:text-teal-200">
                Эталон: 120 / 4 = <strong>30</strong>. Если написали близко — теория усвоена. Дальше
                проверим на живом тексте.
              </p>
            )}
          </div>
          <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setStep(2)}>
            Дальше: построить график по тексту →
          </button>
        </Step>
      )}

      {step === 2 && (
        <Step n={2} title="Построение: вставьте текст и получите ранг–частоту" active>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Поле ниже — рабочее. Вставьте свой фрагмент или нажмите «Учебный текст», затем смотрите
            таблицу и график: синие столбцы — факт, серая линия — прогноз Ципфа f₁/r.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className="btn-primary !py-2 !px-4 !min-h-0 text-sm"
              onClick={() => setText(SAMPLES.cleanChekhov)}
            >
              Подставить учебный текст
            </button>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className={mono} />
          <div className="grid sm:grid-cols-3 gap-3 text-center my-4">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
              <div className="text-2xl font-bold">{stats.tokens}</div>
              <div className="text-xs text-gray-500">токенов</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
              <div className="text-2xl font-bold">{stats.types}</div>
              <div className="text-xs text-gray-500">уникальных</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
              <div className="text-2xl font-bold">{stats.ttrAll.toFixed(3)}</div>
              <div className="text-xs text-gray-500">TTR целого</div>
            </div>
          </div>

          <h4 className="font-semibold mb-2 text-sm">График: факт vs теория Ципфа</h4>
          <div className="overflow-x-auto mb-4">
            <svg viewBox="0 0 520 220" className="w-full max-w-xl bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700">
              {stats.zipf.slice(0, 12).map((row, i) => {
                const x = 40 + i * 38
                const hEmp = (row.freq / maxY) * 160
                const hTh = (row.zipfPredict / maxY) * 160
                return (
                  <g key={row.word}>
                    <rect x={x} y={180 - hEmp} width={14} height={hEmp} className="fill-teal-500" rx="2" />
                    <rect x={x + 16} y={180 - hTh} width={10} height={hTh} className="fill-gray-400" rx="2" opacity="0.7" />
                    <text x={x + 12} y={198} textAnchor="middle" className="fill-current text-[9px]">
                      {row.rank}
                    </text>
                  </g>
                )
              })}
              <text x={10} y={20} className="fill-current text-[11px]">
                бирюзовый = факт · серый = f₁/r
              </text>
            </svg>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">ранг</th>
                  <th>слово</th>
                  <th>частота</th>
                  <th>Ципф ≈</th>
                  <th>отклонение</th>
                </tr>
              </thead>
              <tbody>
                {stats.zipf.slice(0, 12).map((r) => (
                  <tr key={r.word} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">{r.rank}</td>
                    <td className="font-mono">{r.word}</td>
                    <td>{r.freq}</td>
                    <td>{r.zipfPredict}</td>
                    <td>{r.freq - r.zipfPredict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="block text-sm font-semibold mb-4">
            Ваше действие: где теория расходится с текстом сильнее всего — и почему (норма языка /
            артефакт / поэтика)?
            <textarea value={interp} onChange={(e) => setInterp(e.target.value)} rows={3} className={field} />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={field.replace('mt-1 w-full', '') + ' !w-auto px-4 py-2'} onClick={() => setStep(1)}>
              ← Назад
            </button>
            <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setStep(3)}>
              Дальше: TTR по окнам →
            </button>
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step n={3} title="Сравните TTR целого текста и окон" active>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            TTR целого текста часто врёт на длинных текстах. Разбейте взгляд на окна по 40 токенов.
          </p>
          {stats.windows.length === 0 ? (
            <p className="text-sm text-rose-600">Текст слишком короткий — вернитесь на шаг 2 и вставьте больше.</p>
          ) : (
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">окно</th>
                  <th>токенов</th>
                  <th>TTR</th>
                </tr>
              </thead>
              <tbody>
                {stats.windows.map((w) => (
                  <tr key={w.index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">{w.index}</td>
                    <td>{w.tokens}</td>
                    <td>{w.ttr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-sm mb-4">
            TTR целого = <strong>{stats.ttrAll.toFixed(3)}</strong>. Запишите в конспект одну фразу:
            «вводит / не вводит в заблуждение, потому что…»
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="px-4 py-2 rounded-xl border text-sm" onClick={() => setStep(2)}>
              ← Назад
            </button>
            <button type="button" className="btn-primary !py-2 !px-4 !min-h-0 text-sm" onClick={() => setStep(4)}>
              Дальше: написать код самому →
            </button>
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step n={4} title="Код: посчитайте топ сами и проверьте" active>
          <CodeRunner
            title="Задание на код"
            pythonHint={`import re
from collections import Counter
text = open("sample.txt", encoding="utf-8").read().lower()
tokens = re.findall(r"[а-яёa-z]+", text)
cnt = Counter(tokens)
for i, (w, f) in enumerate(cnt.most_common(5), 1):
    print(i, w, f)`}
            starter={ZIPF_STARTER}
            hint="Подсказка: tokens = tokenize(text); затем print(i + 1, top[i][0], top[i][1])"
            checks={[
              {
                label: 'Есть хотя бы 5 строк вывода с номерами 1…5',
                regex: '1\\s+\\S+\\s+\\d+[\\s\\S]*2\\s+\\S+[\\s\\S]*5\\s+\\S+',
                tip: 'Используйте цикл по top и print(номер, слово, частота).',
              },
              {
                label: 'В топе есть служебное «и» (норма языка на коротком тексте)',
                includes: 'и',
                tip: 'Значит токенизация сработала; дальше спросите себя — это поэтика или грамматика?',
              },
            ]}
          />
          <button type="button" className="mt-4 px-4 py-2 rounded-xl border text-sm" onClick={() => setStep(3)}>
            ← К шагу 3
          </button>
        </Step>
      )}
    </div>
  )
}
