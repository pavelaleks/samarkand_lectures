import { useEffect, useRef, useState } from 'react'
import { addText, clearTexts, isPersisted, removeText, renameText, useMyTexts } from './myTexts'
import { readTextFile } from './readFile'

const BASE = `${import.meta.env.BASE_URL || '/'}demo-corpora`
const DEMOS = [
  { id: 'bunin-temnye-allei', label: 'Бунин · «Тёмные аллеи»' },
  { id: 'chekhov-rasskazy', label: 'Чехов · рассказы' },
]

function DemoPicker({ onDone }) {
  const [corpus, setCorpus] = useState(DEMOS[0].id)
  const [list, setList] = useState([])
  const [picked, setPicked] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setPicked(new Set())
    fetch(`${BASE}/${corpus}/manifest.json`)
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }, [corpus])
  const load = async () => {
    setBusy(true)
    for (const s of list.filter((x) => picked.has(x.slug))) {
      try {
        const t = await (await fetch(`${BASE}/${corpus}/txt/${s.slug}.txt`)).text()
        addText(s.title, t)
      } catch {
        /* пропускаем */
      }
    }
    setBusy(false)
    onDone()
  }
  return (
    <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap gap-2 mb-2">
        {DEMOS.map((d) => (
          <button key={d.id} type="button" onClick={() => setCorpus(d.id)} className={`px-3 py-1 rounded-full text-sm border ${corpus === d.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 dark:border-gray-600'}`}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="max-h-48 overflow-y-auto grid sm:grid-cols-2 gap-x-4 text-sm">
        {list.map((s) => (
          <label key={s.slug} className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={picked.has(s.slug)}
              onChange={() => {
                const n = new Set(picked)
                n.has(s.slug) ? n.delete(s.slug) : n.add(s.slug)
                setPicked(n)
              }}
            />
            {s.title}
          </label>
        ))}
      </div>
      <button type="button" disabled={!picked.size || busy} onClick={load} className="mt-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50">
        {busy ? 'Загружаю…' : `Добавить выбранные (${picked.size})`}
      </button>
    </div>
  )
}

/** Панель «Мои тексты»: загрузка .txt/.docx, вставка, демо-тексты. Общая для всех стендов. */
export default function MyTextsBar({ compact = false }) {
  const texts = useMyTexts()
  const fileRef = useRef(null)
  const [mode, setMode] = useState(null) // 'paste' | 'demo'
  const [pasteName, setPasteName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(!compact || texts.length === 0)

  const onFiles = async (files) => {
    setErr('')
    for (const f of files) {
      try {
        addText(f.name.replace(/\.[^.]+$/, ''), await readTextFile(f))
      } catch (e) {
        setErr(`${f.name}: ${e.message}`)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }
  const words = texts.reduce((s, t) => s + t.text.split(/\s+/).filter(Boolean).length, 0)

  return (
    <div
      className="rounded-2xl border-2 border-teal-500/50 bg-teal-50/70 dark:bg-teal-950/20 p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onFiles([...e.dataTransfer.files])
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)} className="font-bold text-gray-900 dark:text-white mr-auto text-left">
          📂 Мои тексты: {texts.length ? `${texts.length} · ${words.toLocaleString('ru')} слов` : 'пока пусто'}
          {compact && <span className="ml-2 text-sm font-normal text-teal-700 dark:text-teal-300">{open ? 'свернуть' : 'открыть'}</span>}
        </button>
        <input ref={fileRef} type="file" multiple accept=".txt,.docx,text/plain" className="hidden" onChange={(e) => onFiles([...e.target.files])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold">
          + Файлы .txt / .docx
        </button>
        <button type="button" onClick={() => setMode(mode === 'paste' ? null : 'paste')} className="px-3 py-1.5 rounded-xl border border-teal-500 text-sm font-semibold text-teal-800 dark:text-teal-200">
          + Вставить текст
        </button>
        <button type="button" onClick={() => setMode(mode === 'demo' ? null : 'demo')} className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm">
          + Бунин / Чехов
        </button>
      </div>

      {mode === 'paste' && (
        <div className="mt-3 space-y-2">
          <input value={pasteName} onChange={(e) => setPasteName(e.target.value)} placeholder="Название (например, «Глава 1» или «Холодная осень»)" className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-sm" />
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder="Вставьте сюда текст…" className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-sm font-mono" />
          <button
            type="button"
            disabled={!pasteText.trim()}
            onClick={() => {
              addText(pasteName || `Текст ${texts.length + 1}`, pasteText)
              setPasteText('')
              setPasteName('')
              setMode(null)
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            Добавить в мои тексты
          </button>
        </div>
      )}
      {mode === 'demo' && <DemoPicker onDone={() => setMode(null)} />}
      {err && <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{err}</p>}

      {open && (
        <>
          {texts.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {texts.map((t) => (
                <li key={t.id} className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-3 pr-1 py-0.5 text-sm">
                  <span
                    className="max-w-[14rem] truncate cursor-text"
                    title="Щёлкните, чтобы переименовать"
                    onClick={() => {
                      const n = window.prompt('Новое название', t.name)
                      if (n) renameText(t.id, n)
                    }}
                  >
                    {t.name}
                  </span>
                  <span className="text-xs text-gray-500">{t.text.split(/\s+/).length.toLocaleString('ru')}</span>
                  <button type="button" aria-label={`Удалить ${t.name}`} onClick={() => removeText(t.id)} className="w-6 h-6 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 text-gray-500">
                    ×
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => window.confirm('Удалить все тексты из этого браузера?') && clearTexts()} className="text-xs text-gray-500 underline px-2 py-1">
                  очистить всё
                </button>
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Загрузите главы своей магистерской, рассказы, стихотворения (один файл — одна единица анализа) или перетащите файлы сюда. Чтобы
              сначала попробовать, добавьте пару рассказов Бунина.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Тексты хранятся только в этом браузере и никуда не отправляются; они доступны на всех стендах курса.
            {!isPersisted() && ' ⚠ Тексты слишком большие для памяти браузера — они пропадут после закрытия вкладки.'}
          </p>
        </>
      )}
    </div>
  )
}
