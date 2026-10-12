import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const BASE = `${import.meta.env.BASE_URL || '/'}demo-corpora/bunin-temnye-allei`
const PART_LABELS = {
  1: 'Часть 1',
  2: 'Часть 2',
  3: 'Часть 3',
}

function formatBody(raw) {
  const t = (raw || '').replace(/\r\n/g, '\n').trim()
  if (!t) return []
  // Keep paragraph breaks; collapse soft line-wrap spaces inside paragraphs
  return t
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

export default function BuninReader() {
  const { storySlug } = useParams()
  const navigate = useNavigate()
  const [manifest, setManifest] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')
  const [fontSize, setFontSize] = useState(112)
  const [tocOpen, setTocOpen] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`manifest HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setManifest(Array.isArray(data) ? data : []))
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  const current = useMemo(() => {
    if (!manifest.length) return null
    if (storySlug) return manifest.find((s) => s.slug === storySlug) || null
    return manifest[0]
  }, [manifest, storySlug])

  const idx = current ? manifest.findIndex((s) => s.slug === current.slug) : -1
  const prev = idx > 0 ? manifest[idx - 1] : null
  const next = idx >= 0 && idx < manifest.length - 1 ? manifest[idx + 1] : null

  useEffect(() => {
    if (!current) return
    if (!storySlug && manifest[0]) {
      navigate(`/courses/digital-humanities/demo/corpus/bunin-temnye-allei/${manifest[0].slug}`, {
        replace: true,
      })
      return
    }
    setLoading(true)
    setErr('')
    fetch(`${BASE}/txt/${current.slug}.txt`)
      .then((r) => {
        if (!r.ok) throw new Error(`текст HTTP ${r.status}`)
        return r.text()
      })
      .then((t) => setText(t))
      .catch((e) => {
        setText('')
        setErr(String(e.message || e))
      })
      .finally(() => setLoading(false))
  }, [current, storySlug, manifest, navigate])

  const paragraphs = useMemo(() => formatBody(text), [text])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return manifest
    return manifest.filter((s) => s.title.toLowerCase().includes(q))
  }, [manifest, query])

  const byPart = useMemo(() => {
    const map = { 1: [], 2: [], 3: [] }
    for (const s of filtered) {
      const p = s.part || 0
      if (map[p]) map[p].push(s)
    }
    return map
  }, [filtered])

  const go = (slug) => navigate(`/courses/digital-humanities/demo/corpus/bunin-temnye-allei/${slug}`)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-sm">
        <Link
          to="/courses/digital-humanities/demo"
          className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline font-medium"
        >
          ← К инструментам
        </Link>
        <Link
          to="/courses/digital-humanities/demo/close-distant"
          className="text-gray-600 dark:text-gray-400 hover:underline"
        >
          Сцена close / distant
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          И. А. Бунин · цикл «Тёмные аллеи»
        </h1>
        <p className="text-base text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Все {manifest.length || 37} рассказов: слева оглавление, справа текст. Источник:{' '}
          <a
            className="underline text-teal-700 dark:text-teal-400"
            href="https://bunin-lit.ru/bunin/rasskaz/temnye-allei/index.htm"
            target="_blank"
            rel="noreferrer"
          >
            bunin-lit.ru
          </a>
          .
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm lg:hidden"
          onClick={() => setTocOpen((v) => !v)}
        >
          {tocOpen ? 'Скрыть оглавление' : 'Оглавление'}
        </button>
        <div className="flex items-center gap-2 ml-auto text-sm">
          <span className="text-gray-500">Кегль</span>
          <button
            type="button"
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
            onClick={() => setFontSize((s) => Math.max(90, s - 8))}
          >
            A−
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
            onClick={() => setFontSize((s) => Math.min(150, s + 8))}
          >
            A+
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
        <aside
          className={`${
            tocOpen ? 'block' : 'hidden'
          } lg:block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto`}
        >
          <label className="block text-xs font-semibold text-gray-500 mb-2">Поиск по названию</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Натали, Холодная осень…"
            className="w-full mb-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
          {[1, 2, 3].map((part) => (
            <div key={part} className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300 mb-2">
                {PART_LABELS[part]}
              </h2>
              <ul className="space-y-0.5">
                {byPart[part].map((s) => {
                  const active = current?.slug === s.slug
                  return (
                    <li key={s.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          go(s.slug)
                          if (window.innerWidth < 1024) setTocOpen(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm leading-snug transition ${
                          active
                            ? 'bg-teal-600 text-white'
                            : 'hover:bg-teal-50 dark:hover:bg-teal-950/40 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {s.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-700 px-5 sm:px-8 py-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {current ? `${PART_LABELS[current.part] || ''} · ${idx + 1} из ${manifest.length}` : '…'}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {current?.title || 'Загрузка…'}
              </h2>
            </div>
            {current && (
              <div className="flex flex-wrap gap-2 text-sm">
                <a
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
                  href={`${BASE}/txt/${current.slug}.txt`}
                  download
                >
                  .txt
                </a>
                <a
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
                  href={`${BASE}/md/${current.slug}.md`}
                  download
                >
                  .md
                </a>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-8 py-3 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && go(prev.slug)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40"
            >
              ← {prev ? prev.title : 'Нет'}
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && go(next.slug)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 ml-auto"
            >
              {next ? next.title : 'Нет'} →
            </button>
          </div>

          <div
            className="px-5 sm:px-10 py-8 sm:py-10 text-gray-900 dark:text-gray-100 leading-[1.75]"
            style={{ fontSize: `${fontSize}%` }}
          >
            {loading && <p className="text-gray-500">Загрузка текста…</p>}
            {err && !loading && <p className="text-rose-600">{err}</p>}
            {!loading &&
              !err &&
              paragraphs.map((p, i) => (
                <p key={i} className="mb-5 max-w-prose mx-auto first:mt-0" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {p}
                </p>
              ))}
          </div>

          <div className="px-5 sm:px-8 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && go(prev.slug)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40"
            >
              ← Предыдущий
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && go(next.slug)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 ml-auto"
            >
              Следующий →
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
