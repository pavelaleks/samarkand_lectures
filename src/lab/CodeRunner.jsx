import { useMemo, useState } from 'react'
import { countTokens, tokenize, topN, ttr } from './textUtils'

const mono =
  'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-950 text-gray-100 p-3 font-mono text-sm leading-relaxed'

/**
 * Учебный песочница: студент правит код (JS с «питоноподобным» API курса)
 * и проверяет вывод по критериям лекции.
 */
export default function CodeRunner({
  title = 'Свой код',
  pythonHint = '',
  starter,
  checks = [],
  hint = '',
}) {
  const [code, setCode] = useState(starter)
  const [result, setResult] = useState(null)

  const run = () => {
    const logs = []
    const api = {
      print: (...args) => {
        logs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
      },
      tokenize,
      countTokens,
      topN,
      ttr,
      Counter: (tokens) => {
        const m = countTokens(tokens)
        return {
          get: (w) => m.get(w) || 0,
          most_common: (n = 10) => topN(m, n),
          size: m.size,
          total: () => [...m.values()].reduce((s, v) => s + v, 0),
          _map: m,
        }
      },
    }

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'print',
        'tokenize',
        'countTokens',
        'topN',
        'ttr',
        'Counter',
        `"use strict";\n${code}`
      )
      fn(api.print, api.tokenize, api.countTokens, api.topN, api.ttr, api.Counter)
      const output = logs.join('\n')
      const checkResults = checks.map((c) => {
        let ok = false
        if (c.includes) ok = output.includes(c.includes)
        if (c.regex) ok = new RegExp(c.regex, 'i').test(output)
        if (typeof c.test === 'function') ok = c.test(output, logs)
        return { label: c.label, ok, tip: c.tip }
      })
      setResult({ ok: true, output: output || '(код выполнился без print)', checkResults })
    } catch (err) {
      setResult({ ok: false, output: String(err.message || err), checkResults: [] })
    }
  }

  const passed = useMemo(
    () => (result?.checkResults || []).filter((c) => c.ok).length,
    [result]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-4">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">{title}</h3>
        <p className="text-sm text-indigo-900/80 dark:text-indigo-100/80">
          Здесь вы не смотрите картинку — вы <strong>пишете и запускаете</strong> учебный код.
          Синтаксис JavaScript, но функции названы как в курсе Python: <code className="text-xs">tokenize</code>,{' '}
          <code className="text-xs">Counter</code>, <code className="text-xs">print</code>.
        </p>
        {pythonHint && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-indigo-800 dark:text-indigo-200">
              Как это выглядит в Python (на лекции / в Cursor)
            </summary>
            <pre className="mt-2 rounded-lg bg-gray-950 text-gray-100 p-3 text-xs overflow-x-auto whitespace-pre-wrap">
              {pythonHint}
            </pre>
          </details>
        )}
      </div>

      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
        1. Исправьте / дополните код
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={14}
          spellCheck={false}
          className={mono}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary !py-2 !px-5 !min-h-0 text-sm" onClick={run}>
          2. Запустить и проверить
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm"
          onClick={() => {
            setCode(starter)
            setResult(null)
          }}
        >
          Вернуть стартовый код
        </button>
      </div>

      {hint && <p className="text-sm text-gray-600 dark:text-gray-400">{hint}</p>}

      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-xl border p-4 ${
              result.ok
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                : 'border-rose-300 bg-rose-50 dark:bg-rose-950/30'
            }`}
          >
            <h4 className="font-semibold mb-2 text-sm">Вывод программы</h4>
            <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-x-auto">{result.output}</pre>
          </div>
          {result.checkResults?.length > 0 && (
            <div className="rounded-xl border border-teal-200 dark:border-teal-800 p-4">
              <h4 className="font-semibold mb-2 text-sm">
                Проверка навыка: {passed}/{result.checkResults.length}
              </h4>
              <ul className="space-y-2 text-sm">
                {result.checkResults.map((c) => (
                  <li key={c.label} className="flex gap-2 items-start">
                    <span className={c.ok ? 'text-emerald-600' : 'text-rose-600'}>{c.ok ? '✓' : '✗'}</span>
                    <span>
                      {c.label}
                      {!c.ok && c.tip ? (
                        <span className="block text-xs text-gray-500 mt-0.5">{c.tip}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
