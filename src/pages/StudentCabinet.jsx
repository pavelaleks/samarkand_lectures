import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SOURCES,
  clearApiLog,
  fetchByDOI,
  gutendexAuthor,
  onApiLog,
  booleanQuery,
  conceptsFrom,
  flatQuery,
  oaShortId,
  openAlexKeywords,
  openAlexSnowball,
  relatedWords,
  searchCrossref,
  translateRuEn,
  openAlexCount,
  queryVariants,
  openAlexGroup,
  searchOpenAlex,
  pythonFor,
  searchAll,
  wikidataAuthor,
  wikidataSearch,
  wikipediaSummary,
} from '../lab/cabinet/apis'
import { STYLES, download, gost, linkOf, toBibTeX, toCSV, toRIS } from '../lab/cabinet/format'
import { bibliographyDocx } from '../lab/cabinet/exportWord'
import { EMPTY_PROFILE, EXAMPLE_PROFILE, usePersistent } from '../lab/cabinet/store'
import { reformulateLocal } from '../lab/litSearchLib'

const TABS = [
  { id: 'profile', label: 'Моя тема', icon: '①' },
  { id: 'search', label: 'Поиск литературы', icon: '②' },
  { id: 'list', label: 'Мой список', icon: '③' },
  { id: 'author', label: 'Автор', icon: '✦' },
  { id: 'metrics', label: 'Наукометрия темы', icon: '▤' },
  { id: 'more', label: 'Где ещё искать', icon: '↗' },
  { id: 'api', label: 'API-журнал', icon: '{ }' },
  { id: 'data', label: 'Мои данные', icon: '💾' },
]

const splitKw = (s) =>
  String(s || '')
    .split(/[;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)

// ---------------------------------------------------------------- мелкие компоненты
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500'

function Btn({ children, onClick, kind = 'primary', disabled, title, type = 'button' }) {
  const cls = {
    primary: 'bg-teal-700 hover:bg-teal-600 text-white',
    amber: 'bg-amber-600 hover:bg-amber-500 text-white',
    ghost: 'border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:border-teal-400',
    danger: 'border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30',
  }[kind]
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  )
}

function Bars({ data, max = 12, valueLabel = 'работ', onPick, extUrl, active }) {
  const rows = data.slice(0, max)
  const top = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.key} className={`flex items-center gap-2 text-sm rounded-lg ${active === r.key ? 'bg-teal-50 dark:bg-teal-950/40' : ''}`}>
          <span className="w-40 sm:w-56 shrink-0 truncate text-gray-800 dark:text-gray-200" title={r.name}>
            {onPick ? (
              <button type="button" onClick={() => onPick(r)} className="text-left hover:underline text-teal-800 dark:text-teal-200 truncate max-w-full">
                {r.name}
              </button>
            ) : (
              r.name
            )}
          </span>
          <span className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <span className="block h-full bg-teal-600 dark:bg-teal-400" style={{ width: `${(100 * r.count) / top}%` }} />
          </span>
          <span className="w-10 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.count}</span>
          {extUrl && (
            <a href={extUrl(r)} target="_blank" rel="noreferrer" title="Профиль в OpenAlex (все работы, не только по теме)" className="w-5 text-gray-400 hover:text-teal-600">
              ↗
            </a>
          )}
        </div>
      ))}
      {!rows.length && <p className="text-sm text-gray-500">Нет данных.</p>}
      {!!rows.length && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Число — {valueLabel} по вашему запросу.{onPick ? ' Нажмите на название — покажу эти работы.' : ''}
          {extUrl ? ' ↗ — профиль в OpenAlex (все работы).' : ''}
        </p>
      )}
    </div>
  )
}

function YearChart({ data, onPick }) {
  const rows = [...data].filter((d) => +d.key >= 1950 && +d.key <= new Date().getFullYear()).sort((a, b) => +a.key - +b.key)
  if (!rows.length) return <p className="text-sm text-gray-500">Нет данных по годам.</p>
  const top = Math.max(...rows.map((r) => r.count))
  const W = 720
  const H = 180
  const PAD = 18
  const bw = (W - 2 * PAD) / rows.length
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full min-w-[480px]" role="img" aria-label="Публикации по годам">
        {rows.map((r, i) => {
          const h = (H * r.count) / top
          return (
            <g key={r.key}>
              <rect
                x={PAD + i * bw + 1}
                y={H - h}
                width={Math.max(bw - 2, 1)}
                height={h}
                className={`fill-teal-600 dark:fill-teal-400 ${onPick ? 'cursor-pointer hover:fill-amber-500' : ''}`}
                onClick={onPick ? () => onPick(r) : undefined}
              >
                <title>
                  {r.key}: {r.count}
                </title>
              </rect>
              {(i % Math.ceil(rows.length / 12) === 0 || i === rows.length - 1) && (
                <text x={PAD + i * bw + bw / 2} y={H + 16} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="11">
                  {r.key}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="text-xs text-gray-500 dark:text-gray-400">Максимум: {top} работ в год. Наведите на столбец, чтобы увидеть число{onPick ? ', нажмите — покажу работы этого года' : ''}.</p>
    </div>
  )
}

function Copy({ text, label = 'Копировать' }) {
  const [ok, setOk] = useState(false)
  return (
    <Btn
      kind="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        } catch {
          /* нет доступа к буферу */
        }
      }}
    >
      {ok ? '✓ Скопировано' : label}
    </Btn>
  )
}

function ItemMeta({ r }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-300">
      {(r.authors || []).slice(0, 4).join(', ')}
      {r.authors?.length > 4 ? ' и др.' : ''}
      {r.year ? ` · ${r.year}` : ''}
      {r.venue ? ` · ${r.venue}` : r.publisher ? ` · ${r.publisher}` : ''}
    </p>
  )
}

function Badges({ r }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
        {r.type === 'book' ? 'книга' : r.type === 'chapter' ? 'глава' : r.type === 'thesis' ? 'диссертация' : 'статья'}
      </span>
      {(r.sources || [r.source]).map((s) => (
        <span key={s} className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100">
          {s}
        </span>
      ))}
      {r.oaUrl && (
        <a
          href={r.oaUrl}
          target="_blank"
          rel="noreferrer"
          className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 hover:underline"
        >
          открытый доступ ↗
        </a>
      )}
      {r.cited != null && r.cited > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          цитирований: {r.cited}
        </span>
      )}
      {r.lang && (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{r.lang}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- подсказка при пустой выдаче
function ZeroHelp({ q, total, precise, profile, onRun }) {
  const [counts, setCounts] = useState({})
  const variants = useMemo(() => queryVariants(q), [q])
  useEffect(() => {
    let alive = true
    setCounts({})
    const o = { apiKey: profile.openAlexKey, fromYear: profile.fromYear, toYear: profile.toYear }
    const jobs = [
      ...(precise ? [['__full', q, false]] : []),
      ...variants.map((v) => [v, v, precise]),
    ]
    jobs.forEach(([key, query, prec]) =>
      openAlexCount(query, { ...o, precise: prec })
        .then((n) => alive && setCounts((c) => ({ ...c, [key]: n })))
        .catch(() => alive && setCounts((c) => ({ ...c, [key]: null })))
    )
    return () => {
      alive = false
    }
  }, [q, precise, variants, profile.openAlexKey, profile.fromYear, profile.toYear])
  const n = (k) => (k in counts ? (counts[k] == null ? '—' : counts[k].toLocaleString('ru-RU')) : '…')
  const ranked = [...variants].sort((a, b) => (counts[b] ?? -1) - (counts[a] ?? -1))
  return (
    <Card className="space-y-3 border-2 border-amber-300 dark:border-amber-700">
      <p className="font-semibold text-gray-900 dark:text-white">
        {total === 0 ? `По запросу «${q}» OpenAlex ничего не нашёл.` : `По запросу «${q}» найдено всего ${total}.`} Так бывает с узкими
        темами: слова должны встретиться все сразу.
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Попробуйте вариант пошире — рядом указано, сколько работ он даст{profile.fromYear || profile.toYear ? ` (с учётом годов ${profile.fromYear || '…'}–${profile.toYear || '…'})` : ''}:
      </p>
      <div className="flex flex-wrap gap-2">
        {precise && (
          <button
            type="button"
            onClick={() => onRun(q, false)}
            className="px-3 py-1.5 rounded-full text-sm border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 hover:bg-amber-100"
          >
            «{q}» и в полных текстах · <strong>{n('__full')}</strong>
          </button>
        )}
        {ranked.map((v) => (
          <button
            key={v}
            type="button"
            disabled={counts[v] === 0}
            onClick={() => onRun(v, precise)}
            className="px-3 py-1.5 rounded-full text-sm border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100 hover:bg-teal-50 dark:hover:bg-teal-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {v} · <strong>{n(v)}</strong>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Советы: ключевое понятие + имя автора («Bunin Orientalism»); англоязычные термины науки (Orientalism, gender, imagology);
        уберите годы во вкладке «Моя тема». Лучше всего — «Конструктор запроса» во вкладке «Поиск литературы»: он подберёт синонимы
        для каждого понятия вашей темы. Русскоязычные работы ищите также в КиберЛенинке — вкладка «Где ещё искать».
      </p>
    </Card>
  )
}

// ---------------------------------------------------------------- 1. Профиль
function ProfileTab({ profile, setProfile, go }) {
  const p = profile
  const set = (k) => (e) => setProfile({ ...p, [k]: e.target.value })
  const suggest = () => {
    const r = reformulateLocal(`${p.topic} ${p.author}`)
    const en = r.queries.filter((q) => /[a-z]/i.test(q)).slice(0, 4)
    setProfile({ ...p, kwEn: [...new Set([...splitKw(p.kwEn), ...en])].join('; ') })
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Тема диссертации</h2>
          <Btn kind="ghost" onClick={() => setProfile({ ...EXAMPLE_PROFILE, openAlexKey: p.openAlexKey })}>
            Заполнить примером (Бунин)
          </Btn>
        </div>
        <Field label="Тема (как в приказе)">
          <textarea className={inputCls} rows={2} value={p.topic} onChange={set('topic')} placeholder="Например: Мотив дороги в прозе И. А. Бунина" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Автор, которого вы изучаете">
            <input className={inputCls} value={p.author} onChange={set('author')} placeholder="Иван Бунин" />
          </Field>
          <Field label="То же латиницей" hint="Для англоязычных каталогов: Ivan Bunin">
            <input className={inputCls} value={p.authorLatin} onChange={set('authorLatin')} placeholder="Ivan Bunin" />
          </Field>
        </div>
        <Field label="Поисковые запросы по-русски" hint="Через точку с запятой. Каждый станет кнопкой на вкладке «Поиск».">
          <textarea className={inputCls} rows={2} value={p.kwRu} onChange={set('kwRu')} placeholder="Бунин дорога; мотив пути Бунин" />
        </Field>
        <Field
          label="Поисковые запросы по-английски"
          hint="Большая часть мировых каталогов — на английском. Кавычки — точная фраза: &quot;Dark Avenues&quot;."
        >
          <textarea className={inputCls} rows={2} value={p.kwEn} onChange={set('kwEn')} placeholder="Bunin road motif; Ivan Bunin journey" />
        </Field>
        <Btn kind="ghost" onClick={suggest}>
          Подсказать английские запросы по теме
        </Btn>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Годы публикаций: с">
            <input className={inputCls} inputMode="numeric" value={p.fromYear} onChange={set('fromYear')} placeholder="2000" />
          </Field>
          <Field label="по">
            <input className={inputCls} inputMode="numeric" value={p.toYear} onChange={set('toYear')} placeholder="2026" />
          </Field>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Для титула списка</h2>
          <Field label="Магистрант">
            <input className={inputCls} value={p.name} onChange={set('name')} placeholder="Фамилия И. О." />
          </Field>
          <Field label="Научный руководитель">
            <input className={inputCls} value={p.supervisor} onChange={set('supervisor')} />
          </Field>
          <Field label="Разделы списка (главы, темы)" hint="По одному в строке. Найденные работы вы раскладываете по этим разделам.">
            <textarea
              className={inputCls}
              rows={5}
              value={(p.groups || []).join('\n')}
              onChange={(e) => setProfile({ ...p, groups: e.target.value.split('\n').map((x) => x.trimStart()).filter((x, i, a) => x || i === a.length - 1) })}
            />
          </Field>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ключ OpenAlex (необязательно)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Без ключа дневной лимит маленький, а вся группа в одной сети делит его на всех. Бесплатный ключ:{' '}
            <a className="underline" href="https://openalex.org/settings/api" target="_blank" rel="noreferrer">
              openalex.org/settings/api
            </a>
            .
          </p>
          <input className={inputCls} value={p.openAlexKey} onChange={set('openAlexKey')} placeholder="вставьте ключ" autoComplete="off" />
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Где хранится кабинет</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Кабинет хранится в этом браузере. Чтобы не потерять список и открыть его на другом компьютере, сохраняйте
            копию в файл или переносите список в Zotero.
          </p>
          <Btn kind="ghost" onClick={() => go('data')}>
            💾 Мои данные: копия и перенос
          </Btn>
        </Card>
        <Btn kind="amber" onClick={() => go('search')}>
          Дальше: искать литературу →
        </Btn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- конструктор запроса
const RU_STOP = new Set(
  'и в во на с со к по о об от из за для при через а но или как что это тот эта эти творчество творчестве творчества произведении произведениях произведения особенности особенность роль функция функции специфика аспект аспекты анализ исследование материале материал примере пример проблема проблемы вопрос'.split(
    ' '
  )
)
const ruQueryFrom = (topic) =>
  String(topic || '')
    .replace(/[«»"“”.,;:()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !RU_STOP.has(w.toLowerCase()))
    .join(' ')

function TermChip({ term, count, onRemove, onAdd, selected }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border ${
        selected
          ? 'bg-teal-700 text-white border-teal-700'
          : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600'
      }`}
    >
      {onAdd ? (
        <button type="button" onClick={onAdd} className="hover:underline" title="Добавить как синоним (ИЛИ)">
          + {term}
        </button>
      ) : (
        term
      )}
      {count !== undefined && (
        <span className={`text-xs tabular-nums ${selected ? 'text-teal-100' : 'text-gray-500'}`} title="Сколько работ OpenAlex найдёт с этим словом (вместе с автором)">
          {count === null ? '…' : count.toLocaleString('ru-RU')}
        </span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 opacity-70 hover:opacity-100" aria-label={`убрать ${term}`}>
          ×
        </button>
      )}
    </span>
  )
}

function ConceptCard({ c, author, profile, onChange, onRemove }) {
  const [sugg, setSugg] = useState(null)
  const [counts, setCounts] = useState({})
  const [own, setOwn] = useState('')
  const countFor = (term) => {
    if (counts[term] !== undefined) return
    setCounts((x) => ({ ...x, [term]: null }))
    const q = author && !c.isAuthor ? `${author} AND ${/\s/.test(term) ? `"${term}"` : term}` : term
    openAlexCount(q, { apiKey: profile.openAlexKey, precise: true })
      .then((n) => setCounts((x) => ({ ...x, [term]: n })))
      .catch(() => setCounts((x) => ({ ...x, [term]: undefined })))
  }
  useEffect(() => {
    c.terms.forEach(countFor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.terms.join('|')])
  const loadSugg = async () => {
    setSugg([])
    try {
      const w = await relatedWords(c.main || c.terms[0], 12)
      const fresh = w.filter((x) => !c.terms.includes(x))
      setSugg(fresh)
      fresh.forEach(countFor)
    } catch {
      setSugg([])
    }
  }
  const addTerm = (t) => {
    const v = t.trim()
    if (v && !c.terms.includes(v)) onChange({ ...c, terms: [...c.terms, v] })
  }
  const off = c.off
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${off ? 'border-dashed border-gray-300 dark:border-gray-600 opacity-60' : 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40'}`}>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{c.isAuthor ? 'автор' : 'понятие'}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{c.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1" title="Если снять — понятие не участвует в поиске">
            <input type="checkbox" checked={!off} onChange={(e) => onChange({ ...c, off: !e.target.checked })} /> учитывать
          </label>
          <button type="button" onClick={onRemove} className="text-rose-600 hover:underline">
            удалить
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.terms.map((t) => (
          <TermChip
            key={t}
            term={t}
            selected
            count={counts[t]}
            onRemove={c.terms.length > 1 ? () => onChange({ ...c, terms: c.terms.filter((x) => x !== t) }) : undefined}
          />
        ))}
      </div>
      {sugg && sugg.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 self-center">близкие слова:</span>
          {[...sugg]
            .sort((a, b) => (counts[b] ?? -1) - (counts[a] ?? -1))
            .map((t) => (
              <TermChip key={t} term={t} count={counts[t]} onAdd={() => addTerm(t)} />
            ))}
        </div>
      )}
      {sugg && !sugg.length && <p className="text-xs text-gray-500">Подсказок нет — впишите свой вариант.</p>}
      <div className="flex flex-wrap gap-2 items-center">
        {!c.isAuthor && !sugg && (
          <button type="button" onClick={loadSugg} className="text-sm text-teal-700 dark:text-teal-300 underline">
            подобрать синонимы
          </button>
        )}
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            addTerm(own)
            setOwn('')
          }}
        >
          <input className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm w-44" value={own} onChange={(e) => setOwn(e.target.value)} placeholder={c.isAuthor ? 'вариант имени' : 'свой синоним'} />
          <button type="submit" className="text-sm px-2 rounded-lg border border-gray-300 dark:border-gray-600">
            +
          </button>
        </form>
      </div>
    </div>
  )
}

function QueryBuilder({ profile, busy, onSearch, st, setSt }) {
  const ru = st.ru || profile.topic || ''
  const [msg, setMsg] = useState('')
  const [ladder, setLadder] = useState(null)
  const active = (st.concepts || []).filter((c) => !c.off && c.terms.length)
  const bool = booleanQuery(active)
  const author = (st.concepts || []).find((c) => c.isAuthor && !c.off)?.terms?.[0] || ''

  const analyze = async () => {
    setMsg('Перевожу тему…')
    setLadder(null)
    let en = st.en
    try {
      en = await translateRuEn(ru)
      setMsg('')
    } catch (e) {
      setMsg(e.message)
    }
    const concepts = conceptsFrom(en || '', profile.authorLatin)
    setSt({ ru, en: en || '', concepts })
  }
  const rebuild = () => setSt({ ...st, concepts: conceptsFrom(st.en, profile.authorLatin) })
  const setConcept = (i, c) => setSt({ ...st, concepts: st.concepts.map((x, j) => (j === i ? c : x)) })

  // «Лестница»: сколько найдёт весь запрос и запрос без каждого из понятий
  const checkLadder = async () => {
    const o = { apiKey: profile.openAlexKey, precise: true }
    const rows = [{ label: 'все понятия вместе', q: bool }]
    active.forEach((c) => {
      if (active.length > 1) rows.push({ label: `без «${c.label}»`, q: booleanQuery(active.filter((x) => x !== c)), drop: c.id })
    })
    setLadder(rows.map((r) => ({ ...r, n: null })))
    const ns = await Promise.all(rows.map((r) => openAlexCount(r.q, o).catch(() => null)))
    setLadder(rows.map((r, i) => ({ ...r, n: ns[i] })))
  }
  useEffect(() => {
    setLadder(null)
  }, [bool])

  return (
    <Card className="space-y-4 border-2 border-teal-300 dark:border-teal-700">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Конструктор запроса — для любой темы</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Научные базы почти не понимают русские формулировки тем. Конструктор переводит тему, делит её на понятия, к
          каждому подбирает синонимы и показывает, сколько работ даёт каждое слово. Из этого собирается точный запрос:
          (синоним ИЛИ синоним) И (синоним ИЛИ синоним).
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Field label="1. Тема по-русски">
          <textarea className={inputCls} rows={2} value={ru} onChange={(e) => setSt({ ...st, ru: e.target.value })} placeholder="Например: Образ сада в лирике Анны Ахматовой" />
        </Field>
        <Field label="2. По-английски (можно поправить)" hint={profile.authorLatin ? `Автор: ${profile.authorLatin} (из «Моя тема»)` : 'Совет: впишите автора латиницей во вкладке «Моя тема» — он станет отдельным понятием.'}>
          <textarea className={inputCls} rows={2} value={st.en} onChange={(e) => setSt({ ...st, en: e.target.value })} placeholder="The image of the garden in Anna Akhmatova's lyrics" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={analyze} disabled={!ru.trim()}>
          Перевести и разобрать на понятия
        </Btn>
        {st.en && (
          <Btn kind="ghost" onClick={rebuild}>
            Разобрать заново из английского
          </Btn>
        )}
        {msg && <span className="text-sm text-gray-500 self-center">{msg}</span>}
      </div>

      {st.concepts?.length > 0 && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              3. Понятия. Внутри понятия слова соединяются через ИЛИ, понятия между собой — через И. Число рядом со словом —
              сколько работ найдётся{author ? ` вместе с «${author}»` : ''}.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {st.concepts.map((c, i) => (
                <ConceptCard
                  key={c.id + i}
                  c={c}
                  author={author}
                  profile={profile}
                  onChange={(nc) => setConcept(i, nc)}
                  onRemove={() => setSt({ ...st, concepts: st.concepts.filter((_, j) => j !== i) })}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-sm text-teal-700 dark:text-teal-300 underline"
              onClick={() => {
                const w = window.prompt('Новое понятие (по-английски):')
                if (w?.trim()) setSt({ ...st, concepts: [...st.concepts, { id: w.trim().toLowerCase(), label: w.trim(), terms: [w.trim()], main: w.trim() }] })
              }}
            >
              + добавить понятие
            </button>
          </div>
          <div className="rounded-xl bg-slate-900 text-slate-100 p-3 text-sm font-mono break-words">{bool || '—'}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn kind="amber" disabled={busy || !bool} onClick={() => onSearch(bool, flatQuery(active), ruQueryFrom(ru))}>
              {busy ? 'Ищу…' : '4. Найти литературу'}
            </Btn>
            <Btn kind="ghost" disabled={!bool} onClick={checkLadder}>
              Проверить: что сужает поиск?
            </Btn>
          </div>
          {ladder && (
            <ul className="text-sm space-y-1">
              {ladder.map((r) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span className="w-48 text-gray-700 dark:text-gray-300">{r.label}</span>
                  <span className="tabular-nums font-semibold">{r.n == null ? '…' : r.n.toLocaleString('ru-RU')}</span>
                  {r.drop && r.n > 0 && (
                    <button
                      type="button"
                      className="text-teal-700 dark:text-teal-300 underline"
                      onClick={() => setSt({ ...st, concepts: st.concepts.map((c) => (c.id === r.drop ? { ...c, off: true } : c)) })}
                    >
                      не учитывать это понятие
                    </button>
                  )}
                </li>
              ))}
              <li className="text-xs text-gray-500">
                Если «все понятия вместе» дают 0, а без какого-то понятия — десятки работ, значит, в науке это понятие называют
                иначе: подберите для него синонимы или отключите его.
              </li>
            </ul>
          )}
        </>
      )}
    </Card>
  )
}

function SciKeywords({ query, profile, onUse }) {
  const [kw, setKw] = useState(null)
  useEffect(() => {
    let alive = true
    setKw(null)
    openAlexKeywords(query, { apiKey: profile.openAlexKey, precise: false })
      .then((k) => alive && setKw(k))
      .catch(() => alive && setKw([]))
    return () => {
      alive = false
    }
  }, [query, profile.openAlexKey])
  if (!kw || !kw.length) return null
  return (
    <Card className="space-y-2">
      <p className="font-semibold text-gray-900 dark:text-white">Как эту тему называют в научной литературе</p>
      <p className="text-xs text-gray-500">
        Ключевые слова, которыми OpenAlex размечает найденные работы. Нажмите — слово добавится к поиску как новое понятие.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {kw.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => onUse(k.name)}
            className="px-2.5 py-1 rounded-full text-sm border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            {k.name} <span className="text-xs text-gray-500">{k.count}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- 2. Поиск
function SearchTab({ profile, list, addItem, go }) {
  const chips = [...splitKw(profile.kwRu), ...splitKw(profile.kwEn)]
  const [q, setQ] = useState(chips[0] || profile.topic || '')
  const [src, setSrc] = usePersistent('dh_cab_sources', SOURCES.filter((s) => s.on).map((s) => s.id))
  const [lang, setLang] = useState('')
  const [oaOnly, setOaOnly] = useState(false)
  const [precise, setPrecise] = usePersistent('dh_cab_precise', true)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [sort, setSort] = useState('rel')
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState({})
  const [group, setGroup] = useState(profile.groups?.[0] || 'Без раздела')
  const inList = useMemo(() => new Set(list.map((i) => i.key)), [list])
  const [st, setSt] = usePersistent('dh_cab_builder', { ru: '', en: '', concepts: [] })
  const [asked, setAsked] = useState('')
  const [drill, setDrill] = useState(null)

  const run = async (query = q, prec = precise, extra = {}) => {
    if (!query.trim()) return
    setQ(query)
    setAsked(query.trim())
    setBusy(true)
    setRes(null)
    setDrill(null)
    const o = {
      fromYear: profile.fromYear,
      toYear: profile.toYear,
      lang,
      oaOnly,
      precise: prec,
      apiKey: profile.openAlexKey,
      limit: 25,
      flat: extra.flat,
    }
    try {
      const r = await searchAll(query.trim(), src, o)
      // Русскоязычная литература: тот же смысл, но русскими словами — в Crossref (там много журналов из России и СНГ)
      if (extra.ru && src.includes('crossref')) {
        try {
          const rr = await searchCrossref(extra.ru, { ...o, limit: 20 })
          const keys = new Set(r.items.map((i) => i.key))
          const add = rr.items.filter((i) => !keys.has(i.key)).map((i) => ({ ...i, sources: ['Crossref (рус.)'] }))
          r.items.push(...add)
          r.status.crossref_ru = { ok: true, n: rr.items.length, total: rr.total }
        } catch (e) {
          r.status.crossref_ru = { ok: false, error: e.message }
        }
      }
      setRes(r)
    } finally {
      setBusy(false)
    }
  }

  const snow = async (r, mode) => {
    const label = { cites: 'Кто цитирует', refs: 'На что ссылается', related: 'Похожие работы' }[mode] + `: «${r.title.slice(0, 90)}»`
    const kicker = 'Снежный ком: литература вокруг одной работы'
    setDrill({ key: mode + r.oaId, label, kicker, busy: true })
    setTimeout(() => document.getElementById('snow')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    try {
      const x = await openAlexSnowball(r.oaId, mode, { apiKey: profile.openAlexKey })
      setDrill({ key: mode + r.oaId, label, kicker, items: x.items, total: x.total })
    } catch (e) {
      setDrill({ key: mode + r.oaId, label, kicker, error: e.message })
    }
  }

  const addConcept = (name) => {
    const n = name.trim()
    setSt((x) => ({ ...x, concepts: [...(x.concepts || []), { id: n.toLowerCase(), label: n, terms: [n], main: n }] }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const shown = useMemo(() => {
    if (!res) return []
    let a = res.items
    if (oaOnly) a = a.filter((r) => r.oaUrl)
    if (filter.trim()) {
      const f = filter.toLowerCase()
      a = a.filter((r) => `${r.title} ${(r.authors || []).join(' ')} ${r.venue}`.toLowerCase().includes(f))
    }
    if (sort === 'year') a = [...a].sort((x, y) => (y.year || 0) - (x.year || 0))
    if (sort === 'cited') a = [...a].sort((x, y) => (y.cited || 0) - (x.cited || 0))
    if (sort === 'multi') a = [...a].sort((x, y) => (y.sources?.length || 1) - (x.sources?.length || 1))
    return a
  }, [res, sort, filter, oaOnly])

  return (
    <div className="space-y-5">
      <QueryBuilder profile={profile} busy={busy} st={st} setSt={setSt} onSearch={(bool, flat, ru) => run(bool, precise, { flat, ru })} />
      <Card className="space-y-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Или введите запрос сами</p>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            run()
          }}
        >
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Запрос: Bunin memory, «Тёмные аллеи» поэтика…" />
          <Btn type="submit" disabled={busy || !src.length}>
            {busy ? 'Ищу…' : 'Найти'}
          </Btn>
        </form>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500 self-center">Ваши запросы:</span>
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => run(c)}
                className="px-3 py-1 rounded-full text-sm border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100 hover:bg-teal-50 dark:hover:bg-teal-950/40"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {!chips.length && (
          <p className="text-sm text-gray-500">
            Совет: заполните запросы во вкладке{' '}
            <button type="button" className="underline" onClick={() => go('profile')}>
              «Моя тема»
            </button>{' '}
            — они появятся здесь кнопками.
          </p>
        )}
        <details className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200">
            Источники и фильтры ({src.length} из {SOURCES.length} источников)
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {SOURCES.map((s) => (
              <label key={s.id} className="flex gap-2 items-start text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={src.includes(s.id)}
                  onChange={(e) => setSrc(e.target.checked ? [...src, s.id] : src.filter((x) => x !== s.id))}
                />
                <span>
                  <span className="font-semibold text-gray-900 dark:text-white">{s.name}</span>
                  <span className="text-gray-500 dark:text-gray-400"> — {s.what}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              Язык (OpenAlex, Google Books):
              <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="">любой</option>
                <option value="ru">русский</option>
                <option value="en">английский</option>
                <option value="uz">узбекский</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={oaOnly} onChange={(e) => setOaOnly(e.target.checked)} />
              только с открытым полным текстом
            </label>
            <label className="flex items-center gap-2" title="Без галочки OpenAlex ищет и в полных текстах — больше случайных работ">
              <input type="checkbox" checked={precise} onChange={(e) => setPrecise(e.target.checked)} />
              OpenAlex: искать только в названии и аннотации
            </label>
            <span className="text-gray-500">
              Годы: {profile.fromYear || '…'}–{profile.toYear || '…'} (меняются в «Моя тема»)
            </span>
          </div>
        </details>
      </Card>

      {res && (
        <div className="flex flex-wrap gap-2 text-xs">
          {[...SOURCES.filter((s) => src.includes(s.id)), ...(res.status.crossref_ru ? [{ id: 'crossref_ru', name: 'Crossref по-русски' }] : [])].map((s) => {
            const st = res.status[s.id]
            return (
              <span
                key={s.id}
                className={`px-2.5 py-1 rounded-full ${
                  st?.ok ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
                }`}
                title={st?.error}
              >
                {s.name}: {st?.ok ? `${st.n}${st.total != null ? ` из ${st.total.toLocaleString('ru-RU')}` : ''}` : st?.error || 'ошибка'}
              </span>
            )
          })}
        </div>
      )}

      <div id="snow" className="scroll-mt-4">
        {drill && <DrillList drill={drill} profile={profile} list={list} addItem={addItem} onClose={() => setDrill(null)} />}
      </div>
      {res && res.items.length > 0 && asked && <SciKeywords query={asked} profile={profile} onUse={addConcept} />}
      {res && (
        <Card className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <p className="font-semibold text-gray-900 dark:text-white">
              Найдено после слияния дублей: {shown.length}
            </p>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <input className={`${inputCls} md:w-52`} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="фильтр по найденному" />
              <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rel">по релевантности</option>
                <option value="year">сначала новые</option>
                <option value="cited">по цитированиям</option>
                <option value="multi">найдено в нескольких базах</option>
              </select>
              <label className="flex items-center gap-1">
                в раздел:
                <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 max-w-[11rem]" value={group} onChange={(e) => setGroup(e.target.value)}>
                  {(profile.groups?.length ? profile.groups : ['Без раздела']).filter(Boolean).map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {shown.map((r) => (
              <li key={r.key} className="py-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <a href={linkOf(r)} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 dark:text-white hover:text-teal-700 dark:hover:text-teal-300 leading-snug">
                    {r.title}
                  </a>
                  <ItemMeta r={r} />
                  <Badges r={r} />
                  {r.abstract && (
                    <button type="button" className="mt-2 text-xs text-teal-700 dark:text-teal-300 underline" onClick={() => setOpen({ ...open, [r.key]: !open[r.key] })}>
                      {open[r.key] ? 'скрыть аннотацию' : 'аннотация'}
                    </button>
                  )}
                  {open[r.key] && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.abstract}</p>}
                  {r.oaId && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {r.cited > 0 && (
                        <button type="button" className="text-indigo-700 dark:text-indigo-300 underline" onClick={() => snow(r, 'cites')}>
                          ↳ кто цитирует ({r.cited})
                        </button>
                      )}
                      <button type="button" className="text-indigo-700 dark:text-indigo-300 underline" onClick={() => snow(r, 'refs')}>
                        ↳ её список литературы
                      </button>
                      <button type="button" className="text-indigo-700 dark:text-indigo-300 underline" onClick={() => snow(r, 'related')}>
                        ↳ похожие работы
                      </button>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {inList.has(r.key) ? (
                    <span className="inline-block px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">✓ в списке</span>
                  ) : (
                    <Btn kind="amber" onClick={() => addItem(r, group)}>
                      + В мой список
                    </Btn>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!shown.length && <p className="text-sm text-gray-500">Ничего не найдено. Попробуйте запрос по-английски или уберите фильтры.</p>}
        </Card>
      )}
      {res && res.items.length < 5 && /\b(AND|OR)\b/.test(asked) && (
        <Card className="text-sm text-gray-700 dark:text-gray-300 border-2 border-amber-300 dark:border-amber-700">
          Найдено мало. В конструкторе выше нажмите <strong>«Проверить: что сужает поиск?»</strong> — увидите, какое понятие
          «обнуляет» выдачу, и подберите для него синонимы или отключите его.
        </Card>
      )}
      {res && res.items.length < 5 && src.includes('openalex') && !/\b(AND|OR)\b/.test(asked) && (
        <ZeroHelp
          q={q}
          total={res.status.openalex?.total ?? 0}
          precise={precise}
          profile={profile}
          onRun={(v, prec) => {
            setPrecise(prec)
            run(v, prec)
          }}
        />
      )}

      {!res && !busy && (
        <Card className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">Как искать</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Начните с английских запросов: мировые каталоги в основном англоязычные. Русские статьи с DOI находит Crossref.</li>
            <li>2–4 слова лучше длинной фразы. Имя автора + ключевое понятие: «Bunin memory».</li>
            <li>Отметка «найдено в нескольких базах» помогает быстро увидеть основные работы.</li>
            <li>Российские журналы без DOI ищите дополнительно в КиберЛенинке и eLibrary — вкладка «Где ещё искать».</li>
          </ul>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- 3. Мой список
function ListTab({ profile, list, setList, addItem }) {
  const [style, setStyle] = usePersistent('dh_cab_style', 'gost')
  const [withAbs, setWithAbs] = useState(false)
  const [withNotes, setWithNotes] = useState(true)
  const [doi, setDoi] = useState('')
  const [doiMsg, setDoiMsg] = useState('')
  const groups = (profile.groups || []).filter(Boolean)
  const allGroups = [...new Set([...groups, ...list.map((i) => i.group || 'Без раздела')])]
  const fmt = STYLES[style]?.fn || gost
  const upd = (key, patch) => setList(list.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  const fileBase = `spisok_literatury_${new Date().toISOString().slice(0, 10)}`

  const addDoi = async () => {
    setDoiMsg('Ищу в Crossref…')
    try {
      const r = await fetchByDOI(doi)
      addItem(r, groups[0] || 'Без раздела')
      setDoiMsg(`Добавлено: ${r.title}`)
      setDoi('')
    } catch (e) {
      setDoiMsg(e.message)
    }
  }

  if (!list.length)
    return (
      <Card className="text-center py-10 space-y-3">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Список пока пуст</p>
        <p className="text-gray-600 dark:text-gray-300">Найдите работы во вкладке «Поиск литературы» или добавьте по DOI:</p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <input className={inputCls} value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.2307/2501622 или https://doi.org/…" />
          <Btn onClick={addDoi}>Добавить</Btn>
        </div>
        {doiMsg && <p className="text-sm text-gray-500">{doiMsg}</p>}
      </Card>
    )

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 font-semibold">
              Стандарт:
              <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5" value={style} onChange={(e) => setStyle(e.target.value)}>
                {Object.entries(STYLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} /> заметки
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={withAbs} onChange={(e) => setWithAbs(e.target.checked)} /> аннотации
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              kind="amber"
              onClick={() =>
                download(`${fileBase}.docx`, bibliographyDocx(list, profile, { style, withAbstracts: withAbs, withNotes, groups }))
              }
            >
              ⬇ Word (.docx)
            </Btn>
            <Btn kind="ghost" onClick={() => download(`${fileBase}.ris`, toRIS(list), 'application/x-research-info-systems')} title="Импорт в Zotero, Mendeley, EndNote">
              RIS (Zotero)
            </Btn>
            <Btn kind="ghost" onClick={() => download(`${fileBase}.bib`, toBibTeX(list), 'application/x-bibtex')}>
              BibTeX
            </Btn>
            <Btn kind="ghost" onClick={() => download(`${fileBase}.csv`, toCSV(list), 'text/csv;charset=utf-8')}>
              CSV (Excel)
            </Btn>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Описание собирается из данных каталогов автоматически. Перед сдачей сверьте каждое с самим источником: города
          издательств, ФИО полностью, страницы каталоги часто не знают.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className={inputCls} value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="Добавить по DOI: 10.…" />
          <Btn kind="ghost" onClick={addDoi}>
            + по DOI
          </Btn>
        </div>
        {doiMsg && <p className="text-sm text-gray-500">{doiMsg}</p>}
      </Card>

      {allGroups.map((g) => {
        const items = list.filter((i) => (i.group || 'Без раздела') === g)
        if (!items.length) return null
        return (
          <section key={g}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {g} <span className="text-gray-400 font-normal">· {items.length}</span>
            </h3>
            <ol className="space-y-3">
              {items.map((r, idx) => (
                <li key={r.key}>
                  <Card className="space-y-2">
                    <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                      <span className="font-semibold mr-1">{idx + 1}.</span>
                      {fmt(r)}
                    </p>
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                      <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" value={r.group || 'Без раздела'} onChange={(e) => upd(r.key, { group: e.target.value })}>
                        {[...new Set([...groups, r.group || 'Без раздела'])].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                      <input className={`${inputCls} text-sm`} value={r.note || ''} onChange={(e) => upd(r.key, { note: e.target.value })} placeholder="Зачем для работы: что взять, для какой главы" />
                      <div className="flex gap-2 shrink-0">
                        <a href={linkOf(r)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 hover:border-teal-400">
                          открыть ↗
                        </a>
                        <Copy text={fmt(r)} label="копир." />
                        <Btn kind="danger" onClick={() => setList(list.filter((i) => i.key !== r.key))}>
                          ✕
                        </Btn>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
      <div className="flex justify-end">
        <Btn kind="danger" onClick={() => window.confirm('Очистить весь список?') && setList([])}>
          Очистить список
        </Btn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- 4. Автор
function AuthorTab({ profile }) {
  const [name, setName] = useState(profile.author || '')
  const [cands, setCands] = useState(null)
  const [data, setData] = useState(null)
  const [wiki, setWiki] = useState(null)
  const [years, setYears] = useState(null)
  const [gut, setGut] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const find = async () => {
    setErr('')
    setData(null)
    setBusy(true)
    try {
      setCands(await wikidataSearch(name))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const pick = async (c) => {
    setErr('')
    setBusy(true)
    setCands(null)
    setWiki(null)
    setYears(null)
    setGut(null)
    try {
      const d = await wikidataAuthor(c.qid)
      setData({ ...d, qid: c.qid, label: c.label, description: c.description })
      wikipediaSummary(d.wikiUrl).then(setWiki).catch(() => {})
      const latin = profile.authorLatin || c.label
      openAlexGroup(`"${latin}"`, 'publication_year', { apiKey: profile.openAlexKey, precise: true })
        .then((r) => setYears(r))
        .catch(() => {})
      gutendexAuthor(latin.split(' ').slice(-1)[0])
        .then(setGut)
        .catch(() => setGut([]))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            find()
          }}
        >
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Бунин, Алишер Навои, Анна Ахматова…" />
          <Btn type="submit" disabled={busy || !name.trim()}>
            {busy ? '…' : 'Найти в Wikidata'}
          </Btn>
        </form>
        {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
        {cands && (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {cands.map((c) => (
              <li key={c.qid}>
                <button type="button" onClick={() => pick(c)} className="w-full text-left py-2 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg px-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{c.label}</span>{' '}
                  <span className="text-sm text-gray-500">— {c.description || 'без описания'} · {c.qid}</span>
                </button>
              </li>
            ))}
            {!cands.length && <li className="py-2 text-sm text-gray-500">Не найдено. Попробуйте полное имя или латиницу.</li>}
          </ul>
        )}
      </Card>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-1 space-y-3">
            {wiki?.thumb && <img src={wiki.thumb} alt="" className="w-28 rounded-xl" />}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.label}</h2>
            <p className="text-sm text-gray-500">{data.description}</p>
            <dl className="space-y-2 text-sm">
              {Object.entries(data.facts).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">{k}</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{v.slice(0, 6).join('; ')}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2 text-sm">
              <a className="underline text-teal-700 dark:text-teal-300" href={`https://www.wikidata.org/wiki/${data.qid}`} target="_blank" rel="noreferrer">
                Wikidata {data.qid}
              </a>
              {wiki?.url && (
                <a className="underline text-teal-700 dark:text-teal-300" href={wiki.url} target="_blank" rel="noreferrer">
                  Википедия
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500">Wikidata и Википедия — справочники для ориентира. В диссертации ссылайтесь на научные издания.</p>
          </Card>
          <div className="lg:col-span-2 space-y-5">
            {wiki?.extract && (
              <Card>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Кратко (Википедия)</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{wiki.extract}</p>
              </Card>
            )}
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Интерес исследователей по годам</h3>
              <p className="text-xs text-gray-500 mb-3">OpenAlex: работы, где автор назван в названии или аннотации: «{profile.authorLatin || data.label}». Всего: {years?.total?.toLocaleString('ru-RU') ?? '…'}</p>
              {years ? <YearChart data={years.groups} /> : <p className="text-sm text-gray-500">Загружаю…</p>}
            </Card>
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Произведения в Wikidata ({data.works.length})</h3>
              <ul className="text-sm columns-1 sm:columns-2 gap-6 space-y-1">
                {data.works.slice(0, 120).map((w) => (
                  <li key={w.url} className="break-inside-avoid">
                    <a href={w.url} target="_blank" rel="noreferrer" className="hover:underline text-gray-800 dark:text-gray-200">
                      {w.year ? <span className="tabular-nums text-gray-500 mr-1">{w.year}</span> : null}
                      {w.title}
                    </a>
                  </li>
                ))}
                {!data.works.length && <li className="text-gray-500">В Wikidata список произведений не заполнен.</li>}
              </ul>
            </Card>
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Тексты в Project Gutenberg (Gutendex)</h3>
              {!gut && <p className="text-sm text-gray-500">Загружаю…</p>}
              {gut && !gut.length && <p className="text-sm text-gray-500">Не найдено. Русские тексты ищите в ФЭБ, Lib.ru, Викитеке — вкладка «Где ещё искать».</p>}
              {gut && !!gut.length && (
                <ul className="text-sm space-y-1">
                  {gut.slice(0, 15).map((b) => (
                    <li key={b.url}>
                      <a className="hover:underline text-gray-800 dark:text-gray-200" href={b.url} target="_blank" rel="noreferrer">
                        {b.title}
                      </a>{' '}
                      <span className="text-gray-500">({b.langs})</span>
                      {b.txt && (
                        <a className="ml-2 underline text-teal-700 dark:text-teal-300" href={b.txt} target="_blank" rel="noreferrer">
                          .txt
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- 5. Наукометрия
function DrillList({ drill, profile, list, addItem, onClose }) {
  const inList = new Set(list.map((i) => i.key))
  const group = (profile.groups || []).filter(Boolean)[0] || 'Без раздела'
  return (
    <Card className="space-y-3 border-2 border-teal-400 dark:border-teal-600">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{drill.kicker || 'Работы по вашему запросу'}</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{drill.label}</h3>
          {drill.total != null && <p className="text-sm text-gray-500">Найдено: {drill.total}. Показаны первые {drill.items?.length || 0}, по числу цитирований.</p>}
        </div>
        <Btn kind="ghost" onClick={onClose}>
          ✕ Закрыть
        </Btn>
      </div>
      {drill.busy && <p className="text-sm text-gray-500">Загружаю…</p>}
      {drill.error && <p className="text-sm text-rose-600">{drill.error}</p>}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {(drill.items || []).map((r) => (
          <li key={r.key} className="py-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <a href={linkOf(r)} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 dark:text-white hover:text-teal-700 dark:hover:text-teal-300">
                {r.title}
              </a>
              <ItemMeta r={r} />
              <Badges r={r} />
            </div>
            <div className="shrink-0">
              {inList.has(r.key) ? (
                <span className="inline-block px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">✓ в списке</span>
              ) : (
                <Btn kind="amber" onClick={() => addItem(r, group)}>
                  + В мой список
                </Btn>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MetricsTab({ profile, list, addItem }) {
  const first = splitKw(profile.kwEn)[0] || splitKw(profile.kwRu)[0] || ''
  const [q, setQ] = useState(first)
  const [precise, setPrecise] = usePersistent('dh_cab_precise', true)
  const [busy, setBusy] = useState(false)
  const [r, setR] = useState(null)
  const [err, setErr] = useState('')
  const [drill, setDrill] = useState(null)
  const [asked, setAsked] = useState({ q: '', precise: true })
  const opts = () => ({ apiKey: profile.openAlexKey, precise: asked.precise, fromYear: profile.fromYear, toYear: profile.toYear })

  const run = async (query = q, prec = precise) => {
    const qq = String(query).trim()
    if (!qq) return
    setQ(qq)
    setPrecise(prec)
    setBusy(true)
    setErr('')
    setR(null)
    setDrill(null)
    const o = { apiKey: profile.openAlexKey, precise: prec, fromYear: profile.fromYear, toYear: profile.toYear }
    setAsked({ q: qq, precise: prec })
    try {
      const [years, sources, authors, langs, topics] = await Promise.all([
        openAlexGroup(qq, 'publication_year', o),
        openAlexGroup(qq, 'primary_location.source.id', o),
        openAlexGroup(qq, 'authorships.author.id', o),
        openAlexGroup(qq, 'language', o),
        openAlexGroup(qq, 'primary_topic.id', o),
      ])
      setR({ years, sources, authors, langs, topics })
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  /** Нажали на журнал / исследователя / тему / язык / год → работы по ТОМУ ЖЕ запросу с этим фильтром */
  const pick = async (field, g, label) => {
    const value = field === 'publication_year' || field === 'language' ? g.key : oaShortId(g.key)
    const key = `${field}:${value}`
    setDrill({ key, label, busy: true })
    setTimeout(() => document.getElementById('drill')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    try {
      const res = await searchOpenAlex(asked.q, { ...opts(), extraFilter: key, limit: 25, sort: 'cited_by_count:desc' })
      setDrill({ key, label, items: res.items, total: res.total })
    } catch (e) {
      setDrill({ key, label, error: e.message })
    }
  }

  const LANG = { en: 'английский', ru: 'русский', de: 'немецкий', fr: 'французский', es: 'испанский', uz: 'узбекский', it: 'итальянский', pl: 'польский', uk: 'украинский' }
  const ext = (g) => g.key
  return (
    <div className="space-y-5">
      <Card className="space-y-2">
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            run()
          }}
        >
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bunin memory" />
          <Btn type="submit" disabled={busy}>
            {busy ? 'Считаю…' : 'Посчитать'}
          </Btn>
        </form>
        <label className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
          <input type="checkbox" className="mt-1" checked={precise} onChange={(e) => setPrecise(e.target.checked)} />
          <span>
            <strong>Только в названии и аннотации</strong> (рекомендуется). Без этой галочки OpenAlex ищет слова и в полных
            текстах — тогда в статистику попадают случайные работы, где слова лишь упомянуты.
          </span>
        </label>
        <p className="text-xs text-gray-500">
          Пять агрегирующих запросов к OpenAlex (параметр <code>group_by</code>): сколько работ по годам, какие журналы,
          исследователи, языки и научные темы — <strong>только среди работ по вашему запросу</strong>. Годы:{' '}
          {profile.fromYear || '…'}–{profile.toYear || '…'} (из «Моя тема»).
        </p>
        {err && <p className="text-sm text-rose-600">{err}</p>}
      </Card>
      {r && (r.years.total ?? 0) < 5 && (
        <ZeroHelp q={asked.q} total={r.years.total ?? 0} precise={asked.precise} profile={profile} onRun={(v, prec) => run(v, prec)} />
      )}
      {r && (r.years.total ?? 0) > 0 && (
        <>
          <Card>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Публикации по годам</h3>
            <p className="text-xs text-gray-500 mb-3">Всего работ по запросу «{asked.q}»: {r.years.total?.toLocaleString('ru-RU')}</p>
            <YearChart data={r.years.groups} onPick={(g) => pick('publication_year', g, `«${asked.q}» · ${g.key} год`)} />
          </Card>
          <div id="drill" className="scroll-mt-4">
            {drill && <DrillList drill={drill} profile={profile} list={list} addItem={addItem} onClose={() => setDrill(null)} />}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Журналы и издания</h3>
              <Bars
                data={r.sources.groups.filter((g) => g.key && g.key !== 'unknown')}
                onPick={(g) => pick('primary_location.source.id', g, `«${asked.q}» в издании «${g.name}»`)}
                extUrl={ext}
              />
            </Card>
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Исследователи</h3>
              <Bars
                data={r.authors.groups.filter((g) => g.key && g.key !== 'unknown')}
                onPick={(g) => pick('authorships.author.id', g, `«${asked.q}»: работы автора ${g.name}`)}
                extUrl={ext}
              />
            </Card>
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Языки</h3>
              <Bars
                data={r.langs.groups.map((g) => ({ ...g, name: LANG[g.key] || g.name }))}
                onPick={(g) => pick('language', g, `«${asked.q}» · язык: ${LANG[g.key] || g.name}`)}
              />
            </Card>
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Научные темы (классификация OpenAlex)</h3>
              <Bars
                data={r.topics.groups.filter((g) => g.key && g.key !== 'unknown')}
                onPick={(g) => pick('primary_topic.id', g, `«${asked.q}» · тема OpenAlex: ${g.name}`)}
                extUrl={ext}
              />
            </Card>
          </div>
          <p className="text-xs text-gray-500">
            Ограничение: OpenAlex плохо покрывает русскоязычные журналы без DOI. Для картины российской науки сравните с
            eLibrary.
          </p>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- 6. Где ещё искать
function MoreTab({ profile }) {
  const [q, setQ] = useState(splitKw(profile.kwRu)[0] || profile.topic || '')
  const author = profile.author || ''
  const e = encodeURIComponent
  const groups = [
    {
      title: 'Научные статьи на русском',
      links: [
        ['КиберЛенинка', `https://cyberleninka.ru/search?q=${e(q)}`, 'Открытые статьи российских журналов, полный текст'],
        ['eLibrary (РИНЦ)', 'https://www.elibrary.ru/querybox.asp', 'Крупнейшая база российских статей; вставьте запрос в форму'],
        ['Google Scholar', `https://scholar.google.com/scholar?q=${e(q)}`, 'Всё подряд: статьи, книги, диссертации'],
        ['disserCat', `https://www.dissercat.com/search?q=${e(q)}`, 'Авторефераты и тексты диссертаций'],
      ],
    },
    {
      title: 'Библиотеки и книги',
      links: [
        ['НЭБ', `https://rusneb.ru/search/?q=${e(q)}`, 'Национальная электронная библиотека'],
        ['РГБ', `https://search.rsl.ru/ru/search#q=${e(q)}`, 'Каталог Российской государственной библиотеки'],
        ['Национальная библиотека Узбекистана', 'https://www.natlib.uz/', 'Каталог и электронные ресурсы'],
        ['Google Книги', `https://www.google.com/search?tbm=bks&q=${e(q)}`, 'Поиск внутри книг'],
        ['Internet Archive', `https://archive.org/search?query=${e(q)}`, 'Сканы старых изданий'],
      ],
    },
    {
      title: 'Тексты автора',
      links: [
        ['ФЭБ', 'https://feb-web.ru/', 'Фундаментальная электронная библиотека «Русская литература и фольклор»'],
        ['Викитека', `https://ru.wikisource.org/w/index.php?search=${e(author || q)}`, 'Тексты в общественном достоянии'],
        ['Lib.ru', 'http://az.lib.ru/', 'Классика (az.lib.ru)'],
        ['НКРЯ', 'https://ruscorpora.ru/', 'Национальный корпус русского языка — употребления слов и контексты'],
      ],
    },
    {
      title: 'Мировые каталоги и инструменты',
      links: [
        ['OpenAlex', `https://openalex.org/works?search=${e(q)}`, 'Веб-интерфейс к тому же каталогу, что использует кабинет'],
        ['CORE', `https://core.ac.uk/search?q=${e(q)}`, 'Полные тексты из репозиториев университетов'],
        ['BASE', `https://www.base-search.net/Search/Results?lookfor=${e(q)}`, 'Академическая поисковая система (Билефельд)'],
        ['Connected Papers', 'https://www.connectedpapers.com/', 'Граф связанных статей по одной ключевой работе'],
        [
          'Google Books Ngram',
          `https://books.google.com/ngrams/graph?content=${e(author || q)}&year_start=1800&year_end=2019&corpus=ru-2019&smoothing=3`,
          'Частота имени или слова в книгах по годам (русский корпус)',
        ],
        ['Zotero', 'https://www.zotero.org/', 'Бесплатный менеджер библиографии — импортируйте файл RIS из «Моего списка»'],
      ],
    },
  ]
  return (
    <div className="space-y-5">
      <Card className="space-y-2">
        <Field label="Запрос для ссылок" hint="У этих сервисов нет открытого API для браузера, поэтому кабинет готовит ссылки с вашим запросом.">
          <input className={inputCls} value={q} onChange={(ev) => setQ(ev.target.value)} />
        </Field>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map((g) => (
          <Card key={g.title}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">{g.title}</h3>
            <ul className="space-y-2">
              {g.links.map(([name, href, what]) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 dark:text-teal-300 hover:underline">
                    {name} ↗
                  </a>
                  <span className="text-sm text-gray-600 dark:text-gray-400"> — {what}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- 7. API-журнал
const API_TABLE = [
  ['OpenAlex', 'api.openalex.org', 'Поиск работ, агрегаты по годам/журналам/авторам', 'бесплатный ключ желателен', 'https://docs.openalex.org/'],
  ['Crossref', 'api.crossref.org', 'Метаданные по DOI, поиск работ', 'нет', 'https://api.crossref.org/swagger-ui/index.html'],
  ['Semantic Scholar', 'api.semanticscholar.org', 'Поиск статей, аннотации, цитирования', 'нет (ключ — для больших объёмов)', 'https://api.semanticscholar.org/api-docs/'],
  ['DOAJ', 'doaj.org/api', 'Статьи журналов открытого доступа', 'нет', 'https://doaj.org/api/docs'],
  ['Google Books', 'googleapis.com/books', 'Книги, издатели, ISBN', 'нет', 'https://developers.google.com/books/docs/v1/using'],
  ['Open Library', 'openlibrary.org', 'Каталог книг и изданий', 'нет', 'https://openlibrary.org/developers/api'],
  ['Wikidata', 'wikidata.org, query.wikidata.org', 'Факты об авторе, произведения (SPARQL)', 'нет', 'https://www.wikidata.org/wiki/Wikidata:Data_access'],
  ['Wikipedia REST', 'ru.wikipedia.org/api/rest_v1', 'Краткая справка и портрет', 'нет', 'https://ru.wikipedia.org/api/rest_v1/'],
  ['Gutendex', 'gutendex.com', 'Тексты Project Gutenberg', 'нет', 'https://gutendex.com/'],
  ['MyMemory', 'api.mymemory.translated.net', 'Перевод темы на английский в конструкторе запроса', 'нет (≈5000 символов в день)', 'https://mymemory.translated.net/doc/spec.php'],
  ['Datamuse', 'api.datamuse.com', 'Близкие по смыслу слова — кандидаты в синонимы', 'нет', 'https://www.datamuse.com/api/'],
]

function ApiTab() {
  const [log, setLog] = useState([])
  const [open, setOpen] = useState(null)
  useEffect(() => onApiLog(setLog), [])
  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Что здесь происходит</h2>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Каждая кнопка кабинета — это запрос к <strong>API</strong>: программному интерфейсу научной базы. Браузер
          отправляет адрес с параметрами (что искать, сколько, с какого года), база отвечает данными в формате{' '}
          <strong>JSON</strong>, а кабинет превращает их в таблицу и библиографическое описание. Ниже — журнал ваших
          запросов. Любой из них можно повторить в Google Colab: скопируйте код на Python.
        </p>
        <div className="flex gap-2">
          <Btn kind="ghost" onClick={clearApiLog}>
            Очистить журнал
          </Btn>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Журнал запросов этой сессии ({log.length})</h3>
        {!log.length && <p className="text-sm text-gray-500">Пока пусто. Выполните поиск — запросы появятся здесь.</p>}
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {log.map((e) => (
            <li key={e.id} className="py-2">
              <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="w-full text-left flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    e.status === 200 ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' : 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100'
                  }`}
                >
                  {e.status}
                </span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{e.service}</span>
                <span className="text-xs text-gray-500">{e.ms} мс</span>
                <code className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">{e.url}</code>
              </button>
              {open === e.id && (
                <div className="mt-3 space-y-3">
                  {e.error && <p className="text-sm text-rose-600">{e.error}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Copy text={e.url} label="Копировать адрес" />
                    <Copy text={pythonFor(e.url)} label="Код для Colab" />
                    <a href={e.url} target="_blank" rel="noreferrer" className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600">
                      Открыть ответ в новой вкладке ↗
                    </a>
                  </div>
                  <pre className="text-xs bg-slate-950 text-slate-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{pythonFor(e.url)}</pre>
                  {e.sample && (
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold">Начало ответа (JSON)</summary>
                      <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 rounded-xl p-3 overflow-x-auto max-h-80">{e.sample}</pre>
                    </details>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Подключённые API</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-3">Сервис</th>
                <th className="py-2 pr-3">Адрес</th>
                <th className="py-2 pr-3">Что даёт</th>
                <th className="py-2 pr-3">Ключ</th>
              </tr>
            </thead>
            <tbody>
              {API_TABLE.map(([n, host, what, key, doc]) => (
                <tr key={n} className="border-b border-gray-100 dark:border-gray-700/60 align-top">
                  <td className="py-2 pr-3 font-semibold">
                    <a href={doc} target="_blank" rel="noreferrer" className="hover:underline text-teal-700 dark:text-teal-300">
                      {n}
                    </a>
                  </td>
                  <td className="py-2 pr-3">
                    <code className="text-xs">{host}</code>
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{what}</td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Те же API в коде: пары 11 и 12 в Google Colab. Сайт статический, поэтому ключи хранятся только в вашем браузере.
        </p>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- 8. Мои данные (хранение)
/** Объединение двух кабинетов: профиль — более заполненный, списки — без повторов. */
function mergeCabinets(a, b) {
  const filled = (p) => Object.values(p || {}).filter((v) => (Array.isArray(v) ? v.length : v)).length
  const profile = filled(a?.profile) >= filled(b?.profile) ? a?.profile : b?.profile
  const map = new Map()
  for (const i of [...(a?.list || []), ...(b?.list || [])]) {
    const prev = map.get(i.key)
    map.set(i.key, prev ? { ...i, ...prev, note: prev.note || i.note } : i)
  }
  return { profile, list: [...map.values()] }
}

function StorageBadge({ lastExport, go }) {
  return (
    <button
      type="button"
      onClick={() => go('data')}
      className="text-xs px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
      title="Где хранится кабинет"
    >
      💾 в этом браузере · копия: {lastExport ? new Date(lastExport).toLocaleDateString('ru-RU') : 'нет'}
    </button>
  )
}

function DataTab({ profile, setProfile, list, setList, lastExport, setLastExport, go }) {
  const exportCabinet = () => {
    download(`kabinet_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ profile: { ...profile, openAlexKey: '' }, list }, null, 2), 'application/json')
    setLastExport(Date.now())
  }
  const importCabinet = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((t) => {
      try {
        const d = JSON.parse(t)
        const merge = list.length ? window.confirm('Объединить с текущим кабинетом? (Отмена — заменить полностью)') : false
        const m = merge ? mergeCabinets({ profile, list }, d) : d
        if (m.profile) setProfile({ ...EMPTY_PROFILE, ...m.profile, openAlexKey: profile.openAlexKey })
        if (Array.isArray(m.list)) setList(m.list)
      } catch {
        alert('Это не файл кабинета.')
      }
    })
    e.target.value = ''
  }
  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Где хранится мой кабинет</h2>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Тема, запросы и список литературы хранятся <strong>в этом браузере на этом компьютере</strong>. На сервер ничего не
          отправляется, регистрация не нужна. При закрытии сайта ничего не пропадает.
        </p>
        <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
          <li>Данные пропадут, если очистить историю браузера, работать в режиме инкогнито или на общем компьютере в аудитории.</li>
          <li>На другом компьютере или телефоне кабинет будет пустым — перенесите его файлом.</li>
          <li>
            Сейчас здесь: <strong>{list.length}</strong> работ. Последняя копия в файл:{' '}
            <strong>{lastExport ? new Date(lastExport).toLocaleString('ru-RU') : 'ещё не делали'}</strong>.
          </li>
        </ul>
      </Card>

      <Card className="space-y-3 border-2 border-teal-400 dark:border-teal-600">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">1. Копия кабинета в файл</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Один небольшой файл со всем кабинетом. Загрузите его на другом компьютере — и всё восстановится. При загрузке можно
          объединить с тем, что уже есть.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={exportCabinet}>⬇ Сохранить копию кабинета</Btn>
          <label className="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 cursor-pointer hover:border-teal-400 text-gray-800 dark:text-gray-100">
            ⬆ Загрузить из файла
            <input type="file" accept="application/json,.json" className="hidden" onChange={importCabinet} />
          </label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Чтобы файл был доступен везде</strong>, положите его туда, где вы и так храните учебные файлы: Google Диск,
          Яндекс Диск, письмо самому себе или «Избранное» в Telegram. Удобно делать копию в конце каждого занятия.
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">2. Список литературы в Zotero (для долгой работы над диссертацией)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Zotero — бесплатная программа, которой пользуются научные работники. Она хранит библиографию в вашем личном аккаунте,
          синхронизирует её между устройствами и вставляет ссылки и список литературы прямо в Word.
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>
            Установите Zotero и создайте бесплатный аккаунт:{' '}
            <a className="underline" href="https://www.zotero.org/download/" target="_blank" rel="noreferrer">
              zotero.org/download
            </a>
            .
          </li>
          <li>
            Во вкладке «Мой список» нажмите <strong>RIS (Zotero)</strong> — скачается файл.
          </li>
          <li>В Zotero: Файл → Импортировать… → выберите этот файл.</li>
          <li>В Word используйте стиль оформления «Russian GOST R 7.0.5-2008» (выбирается в настройках Zotero).</li>
        </ol>
        <Btn kind="ghost" onClick={() => go('list')}>
          Перейти к «Моему списку» →
        </Btn>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Ключ OpenAlex в копию не попадает — его при необходимости вставьте заново во вкладке «Моя тема».
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- страница
export default function StudentCabinet() {
  const [profile, setProfile] = usePersistent('dh_cab_profile', EMPTY_PROFILE)
  const [list, setList] = usePersistent('dh_cab_list', [])
  const [tab, setTab] = useState(() => (window.location.hash || '').replace('#', '') || 'profile')
  const [toast, setToast] = useState('')
  const [lastExport, setLastExport] = usePersistent('dh_cab_last_export', 0)
  const pFull = { ...EMPTY_PROFILE, ...profile }
  const needCopy = list.length >= 3 && (!lastExport || Date.now() - lastExport > 3 * 24 * 3600 * 1000)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])
  const go = (t) => {
    setTab(t)
    try {
      window.history.replaceState(null, '', `#${t}`)
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const addItem = (r, group) => {
    setList((l) => (l.some((i) => i.key === r.key) ? l : [...l, { ...r, group, note: '' }]))
    setToast(`Добавлено в «${group}»`)
    setTimeout(() => setToast(''), 1600)
  }
  const p = pFull

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link to="/courses/digital-humanities" className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium">
        ← К курсу
      </Link>
      <header className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-2">Ресурс для диссертации · открытые API</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">Кабинет магистранта</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Тема → поиск литературы сразу в шести научных базах → свой список по главам → Word по ГОСТу со ссылками. Плюс
          справка об авторе и наукометрия темы. Всё через открытые API — журнал запросов показывает, как это устроено.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {p.topic && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ваша тема: <span className="font-semibold text-gray-900 dark:text-gray-100">{p.topic}</span>
            </p>
          )}
          <StorageBadge lastExport={lastExport} go={go} />
        </div>
      </header>
      {needCopy && tab !== 'data' && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <span>
            В списке уже {list.length} работ, а они хранятся только в этом браузере. Сохраните копию кабинета в файл.
          </span>
          <button type="button" className="font-semibold underline" onClick={() => go('data')}>
            Мои данные →
          </button>
        </div>
      )}

      <nav className="mb-6" aria-label="Разделы кабинета">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                tab === t.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:border-teal-400'
              }`}
            >
              <span className="mr-1 opacity-70">{t.icon}</span>
              {t.label}
              {t.id === 'list' && list.length > 0 && (
                <span className={`ml-1.5 px-1.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'}`}>
                  {list.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'profile' && <ProfileTab profile={p} setProfile={setProfile} go={go} />}
      {tab === 'search' && <SearchTab profile={p} list={list} addItem={addItem} go={go} />}
      {tab === 'list' && <ListTab profile={p} list={list} setList={setList} addItem={addItem} />}
      {tab === 'author' && <AuthorTab profile={p} />}
      {tab === 'metrics' && <MetricsTab profile={p} list={list} addItem={addItem} />}
      {tab === 'more' && <MoreTab profile={p} />}
      {tab === 'api' && <ApiTab />}
      {tab === 'data' && (
        <DataTab
          profile={p}
          setProfile={setProfile}
          list={list}
          setList={setList}
          lastExport={lastExport}
          setLastExport={setLastExport}
          go={go}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg" role="status">
          {toast} ·{' '}
          <button type="button" className="underline" onClick={() => go('list')}>
            открыть список
          </button>
        </div>
      )}
    </div>
  )
}
