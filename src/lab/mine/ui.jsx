import { useState } from 'react'
import { downloadText } from '../textUtils'
import { toCsv } from './methods'

export const inputCls = 'mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-sm'

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
      {label}
      {children}
      {hint && <span className="block mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  )
}

export function Note({ children, tone = 'gray' }) {
  const t = {
    gray: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    amber: 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100',
  }[tone]
  return <div className={`rounded-xl border p-3 text-sm leading-relaxed ${t}`}>{children}</div>
}

/** Таблица с кнопкой «CSV». Колонки, начинающиеся с «_», не показываются. */
export function Table({ rows, file = 'tablica.csv', max = 60, onRow }) {
  const [all, setAll] = useState(false)
  if (!rows?.length) return <p className="text-sm text-gray-500">Нет данных.</p>
  const cols = Object.keys(rows[0]).filter((c) => !c.startsWith('_'))
  const shown = all ? rows : rows.slice(0, max)
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} onClick={onRow ? () => onRow(r, i) : undefined} className={`border-t border-gray-100 dark:border-gray-800 ${onRow ? 'cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/30' : ''}`}>
                {cols.map((c) => (
                  <td key={c} className={`px-2 py-1 align-top ${c === 'слово' ? 'font-semibold text-teal-800 dark:text-teal-200 whitespace-nowrap' : ''} ${c === 'слева' ? 'text-right' : ''}`}>
                    {String(r[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 items-center text-sm">
        <button type="button" onClick={() => downloadText(file, toCsv(rows), 'text/csv;charset=utf-8')} className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold">
          ⬇ CSV для Excel
        </button>
        {rows.length > max && (
          <button type="button" onClick={() => setAll(!all)} className="underline text-teal-700 dark:text-teal-300">
            {all ? 'Показать меньше' : `Показать все ${rows.length}`}
          </button>
        )}
      </div>
    </div>
  )
}

/** Горизонтальные столбики: [{label, value}] */
export function Bars({ data, color = 'bg-teal-500', fmt = (v) => v }) {
  const max = Math.max(1e-9, ...data.map((d) => Math.abs(d.value)))
  return (
    <div className="space-y-1">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-sm">
          <span className="w-36 sm:w-48 shrink-0 truncate text-right text-gray-700 dark:text-gray-300" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded h-4 overflow-hidden">
            <div className={`${d.color || color} h-4 rounded`} style={{ width: `${(Math.abs(d.value) / max) * 100}%` }} />
          </div>
          <span className="w-14 shrink-0 tabular-nums text-gray-700 dark:text-gray-300">{fmt(d.value)}</span>
        </div>
      ))}
    </div>
  )
}

/** Выбор: один текст или все вместе */
export function TextSelect({ texts, value, onChange, allowAll = true, label = 'Текст' }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {allowAll && <option value="__all">все мои тексты вместе</option>}
        {texts.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function pickUnits(texts, id) {
  if (id === '__all' || !id) return texts
  const t = texts.find((x) => x.id === id)
  return t ? [t] : texts.slice(0, 1)
}
