import { useMemo, useState } from 'react'
import { downloadText } from '../textUtils'
import * as M from './methods'
import { addText } from './myTexts'
import { Bars, Field, Note, Table, TextSelect, inputCls, pickUnits } from './ui'

const join = (units) => units.map((u) => u.text).join('\n\n')
const useSel = (texts, def = '__all') => {
  const [id, setId] = useState(def)
  const valid = id === '__all' || texts.some((t) => t.id === id) ? id : texts[0]?.id
  return [valid, setId]
}

/* ---------------- Частоты ---------------- */
function FreqPanel({ texts }) {
  const [id, setId] = useSel(texts)
  const [n, setN] = useState(30)
  const [stop, setStop] = useState(true)
  const [extra, setExtra] = useState('')
  const rows = useMemo(() => {
    const ex = new Set(M.parseTerms(extra))
    const toks = M.tokens(join(pickUnits(texts, id))).filter((w) => !(stop && (M.STOP.has(w) || w.length < 2)) && !ex.has(w))
    const total = toks.length
    return M.top(M.count(toks), n).map(([w, c], i) => ({ ранг: i + 1, слово: w, частота: c, 'на 1000': +((c * 1000) / Math.max(1, total)).toFixed(2) }))
  }, [texts, id, n, stop, extra])
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} />
        <Field label={`Сколько слов: ${n}`}>
          <input type="range" min={10} max={150} value={n} onChange={(e) => setN(+e.target.value)} className="w-full mt-3" />
        </Field>
        <Field label="Убрать ещё слова" hint="через запятую">
          <input value={extra} onChange={(e) => setExtra(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <label className="text-sm flex items-center gap-2">
        <input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> убрать служебные слова (и, в, не, что…)
      </label>
      <Bars data={rows.slice(0, 25).map((r) => ({ label: r.слово, value: r.частота }))} />
      <Table rows={rows} file="chastoty.csv" />
    </div>
  )
}

/* ---------------- Контексты ---------------- */
function KwicPanel({ texts }) {
  const [q, setQ] = useState('')
  const [w, setW] = useState(60)
  const rows = useMemo(() => M.kwic(texts, q, w), [texts, q, w])
  const byText = useMemo(() => M.top(M.count(rows.map((r) => r.текст)), 50).map(([label, value]) => ({ label, value })), [rows])
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Field label="Слова через запятую" hint="Звёздочка — любое окончание: вспомин* найдёт «вспоминал», «вспоминая»…">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="память, помн*, вспомин*" className={inputCls} />
          </Field>
        </div>
        <Field label={`Ширина контекста: ${w} знаков`}>
          <input type="range" min={20} max={200} value={w} onChange={(e) => setW(+e.target.value)} className="w-full mt-3" />
        </Field>
      </div>
      {q.trim() && (
        <>
          <p className="text-sm font-semibold">Найдено вхождений: {rows.length}</p>
          {texts.length > 1 && byText.length > 0 && <Bars data={byText} />}
          <Table rows={rows} file="konteksty.csv" max={80} />
        </>
      )}
    </div>
  )
}

/* ---------------- Смысловые поля ---------------- */
const FIELDS_EXAMPLE = 'любовь: любов*, люб*, нежн*, поцел*, страст*\nпамять: памят*, помн*, вспомин*, вспомн*, забы*, прошл*\nвремя: время, времен*, год*, вечер*, ночь, ночи, осен*, зим*'
function FieldsPanel({ texts }) {
  const [str, setStr] = useState(FIELDS_EXAMPLE)
  const [mode, setMode] = useState('texts')
  const [seg, setSeg] = useState(10)
  const [id, setId] = useSel(texts, texts[0]?.id)
  const fields = useMemo(() => M.parseFields(str), [str])
  const units = useMemo(() => {
    if (mode === 'texts') return texts
    const u = pickUnits(texts, id)[0]
    return u ? M.segments(u.text, seg).map((t, i) => ({ name: `отрезок ${i + 1}`, text: t })) : []
  }, [mode, texts, id, seg])
  const rows = useMemo(() => M.fieldTable(units, fields), [units, fields])
  const forms = useMemo(() => M.fieldForms(units, fields), [units, fields])
  const colors = ['bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-lime-600', 'bg-fuchsia-500']
  return (
    <div className="space-y-4">
      <Field label="Мои смысловые поля — по строке на поле: «название: слово, начало*, …»" hint="Словарь поля — ваша исследовательская гипотеза; проверьте ниже, какие формы реально попали в подсчёт.">
        <textarea value={str} onChange={(e) => setStr(e.target.value)} rows={4} className={`${inputCls} font-mono`} />
      </Field>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-2 text-sm">
          {[
            ['texts', 'сравнить мои тексты'],
            ['segments', 'по ходу одного текста'],
          ].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setMode(v)} className={`px-3 py-1.5 rounded-full border ${mode === v ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 dark:border-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
        {mode === 'segments' && (
          <>
            <div className="w-56">
              <TextSelect texts={texts} value={id} onChange={setId} allowAll={false} />
            </div>
            <Field label={`Отрезков: ${seg}`}>
              <input type="range" min={4} max={30} value={seg} onChange={(e) => setSeg(+e.target.value)} className="mt-3" />
            </Field>
          </>
        )}
      </div>
      {fields.map((f, i) => (
        <div key={f.name}>
          <p className="text-sm font-semibold mb-1">«{f.name}» на 1000 слов</p>
          <Bars data={rows.map((r) => ({ label: r.текст, value: r[`${f.name} /1000`] }))} color={colors[i % colors.length]} />
        </div>
      ))}
      <Table rows={rows} file="polya.csv" />
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Какие формы дали частоту (проверка словаря)</summary>
        <div className="mt-2">
          <Table rows={forms} file="polya_formy.csv" />
        </div>
      </details>
    </div>
  )
}

/* ---------------- Очистка ---------------- */
function CleanPanel({ texts }) {
  const [id, setId] = useSel(texts, texts[0]?.id)
  const [o, setO] = useState({ urls: true, pages: true, hyphens: true, junk: true, spaces: true })
  const src = useMemo(() => pickUnits(texts, id)[0], [texts, id])
  const out = useMemo(() => (src ? M.cleanText(src.text, o) : ''), [src, o])
  const labels = { urls: 'ссылки', pages: 'номера страниц', hyphens: 'переносы «сло-\\nво»', junk: 'мусор сайта (©, «читать далее»…)', spaces: 'лишние пробелы' }
  return (
    <div className="space-y-4">
      <div className="w-full sm:w-72">
        <TextSelect texts={texts} value={id} onChange={setId} allowAll={false} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {Object.keys(labels).map((k) => (
          <label key={k} className="flex items-center gap-1.5">
            <input type="checkbox" checked={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.checked })} /> {labels[k]}
          </label>
        ))}
      </div>
      {src && (
        <>
          <p className="text-sm">
            Было знаков: <b>{src.text.length.toLocaleString('ru')}</b> → стало: <b>{out.length.toLocaleString('ru')}</b>
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <textarea readOnly value={src.text.slice(0, 6000)} rows={12} className={`${inputCls} font-mono`} />
            <textarea readOnly value={out.slice(0, 6000)} rows={12} className={`${inputCls} font-mono border-teal-400`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addText(`${src.name} (очищ.)`, out)} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold">
              Сохранить очищенный в мои тексты
            </button>
            <button type="button" onClick={() => downloadText(`${src.name}_clean.txt`, out)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold">
              ⬇ Скачать .txt
            </button>
          </div>
          <Note>Автоматическая очистка не заменяет просмотр глазами: проверьте начало и конец текста, сноски, заголовки глав.</Note>
        </>
      )}
    </div>
  )
}

/* ---------------- Паспорт корпуса ---------------- */
function PassportPanel({ texts }) {
  const rows = useMemo(() => M.passport(texts), [texts])
  const total = rows.reduce((s, r) => s + r.слов, 0)
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Единиц: <b>{rows.length}</b> · слов всего: <b>{total.toLocaleString('ru')}</b>
      </p>
      <Bars data={rows.map((r) => ({ label: r.текст, value: r.слов }))} fmt={(v) => v.toLocaleString('ru')} />
      <Table rows={rows} file="pasport_korpusa.csv" />
      <Note>
        TTR (разнообразие словаря) падает с ростом длины текста, поэтому тексты разной длины сравнивайте по <b>STTR</b> — среднему TTR по отрезкам в
        1000 слов. Таблицу можно сразу перенести в «Методологический паспорт диссертации».
      </Note>
    </div>
  )
}

/* ---------------- Ципф ---------------- */
function ZipfPanel({ texts }) {
  const [id, setId] = useSel(texts, texts[0]?.id)
  const z = useMemo(() => M.zipf(join(pickUnits(texts, id))), [texts, id])
  const W = 520
  const H = 260
  const pts = z.points
  const maxR = Math.log10(Math.max(2, pts.length))
  const maxF = Math.log10(Math.max(2, pts[0]?.freq || 2))
  const X = (r) => 40 + (Math.log10(r) / maxR) * (W - 60)
  const Y = (f) => H - 30 - (Math.log10(f) / maxF) * (H - 50)
  return (
    <div className="space-y-4">
      <div className="w-full sm:w-72">
        <TextSelect texts={texts} value={id} onChange={setId} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          ['слов', z.total.toLocaleString('ru')],
          ['разных', z.types.toLocaleString('ru')],
          ['гапаксы (1 раз)', `${Math.round(z.hapaxShare * 100)}%`],
          ['наклон log-log', z.slope.toFixed(2)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-gray-50 dark:bg-gray-900 p-2">
            <div className="text-xl font-bold">{v}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{l}</div>
          </div>
        ))}
      </div>
      {pts.length > 3 && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <line x1={X(1)} y1={Y(pts[0].freq)} x2={X(pts.length)} y2={Y(Math.max(1, pts[0].freq / pts.length))} stroke="#f59e0b" strokeDasharray="5 4" />
          {pts.map((p) => (
            <circle key={p.rank} cx={X(p.rank)} cy={Y(p.freq)} r={2.2} fill="#0d9488" opacity={0.75}>
              <title>{`${p.rank}. ${p.word} — ${p.freq}`}</title>
            </circle>
          ))}
          <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor">ранг (лог. шкала)</text>
          <text x={12} y={H / 2} fontSize="11" fill="currentColor" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">частота (лог.)</text>
        </svg>
      )}
      <p className="text-xs text-gray-600 dark:text-gray-400">Пунктир — идеальный Ципф (частота ∝ 1/ранг, наклон −1). Наведите на точку, чтобы увидеть слово.</p>
      <Table rows={z.table} file="zipf.csv" max={30} />
      <Note>Ципф — проверка «нормальности» корпуса и разговор о структуре словаря, а не доказательство тезиса о смысле. Короткие тексты (меньше 2–3 тыс. слов) дают шумный график.</Note>
    </div>
  )
}

/* ---------------- Ключевые слова ---------------- */
function KeywordsPanel({ texts }) {
  const [target, setTarget] = useState(() => new Set(texts[0] ? [texts[0].id] : []))
  const tg = useMemo(() => texts.filter((t) => target.has(t.id)), [texts, target])
  const ref = useMemo(() => texts.filter((t) => !target.has(t.id)), [texts, target])
  const rows = useMemo(() => (tg.length && ref.length ? M.keywords(join(tg), join(ref), 50) : []), [tg, ref])
  return (
    <div className="space-y-4">
      {texts.length < 2 ? (
        <Note tone="amber">Нужно минимум два текста: изучаемый и фон для сравнения. Добавьте ещё тексты (или рассказы Бунина/Чехова как фон).</Note>
      ) : (
        <>
          <p className="text-sm font-semibold">Отметьте изучаемые тексты — остальные станут фоном:</p>
          <div className="flex flex-wrap gap-2">
            {texts.map((t) => (
              <label key={t.id} className={`px-3 py-1 rounded-full border text-sm cursor-pointer ${target.has(t.id) ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 dark:border-gray-600'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={target.has(t.id)}
                  onChange={() => {
                    const n = new Set(target)
                    n.has(t.id) ? n.delete(t.id) : n.add(t.id)
                    setTarget(n)
                  }}
                />
                {t.name}
              </label>
            ))}
          </div>
          <Bars data={rows.slice(0, 20).map((r) => ({ label: r.слово, value: r.G2 }))} color="bg-indigo-500" />
          <Table rows={rows} file="klyuchevye_slova.csv" />
          <Note>
            G² (log-likelihood) показывает, насколько слово чаще в изучаемых текстах, чем в фоне. Больше 10.8 — различие значимо (p &lt; 0.001). Ключевые
            слова зависят от фона: смените фон — изменится и список. Проверяйте каждое слово в «Контекстах».
          </Note>
        </>
      )}
    </div>
  )
}

/* ---------------- Стилометрия ---------------- */
function DeltaPanel({ texts }) {
  const [mfw, setMfw] = useState(100)
  const [chunk, setChunk] = useState(0)
  const units = useMemo(() => (chunk ? M.chunkUnits(texts, chunk) : texts), [texts, chunk])
  const res = useMemo(() => (units.length >= 3 ? M.delta(units, mfw) : null), [units, mfw])
  const maxD = res ? Math.max(...res.D.flat()) : 1
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={`Частотных слов (MFW): ${mfw}`} hint="Обычно 100–300; результат должен держаться при разных значениях.">
          <input type="range" min={30} max={500} step={10} value={mfw} onChange={(e) => setMfw(+e.target.value)} className="w-full mt-3" />
        </Field>
        <Field label="Резать длинные тексты на отрезки" hint="Проверка устойчивости: отрезки одного текста должны оказаться рядом.">
          <select value={chunk} onChange={(e) => setChunk(+e.target.value)} className={inputCls}>
            <option value={0}>не резать</option>
            <option value={1000}>по 1000 слов</option>
            <option value={2000}>по 2000 слов</option>
            <option value={5000}>по 5000 слов</option>
          </select>
        </Field>
      </div>
      {!res ? (
        <Note tone="amber">Для Delta нужно минимум 3 текста (лучше 5+ и не короче 2000 слов). Добавьте тексты или включите нарезку на отрезки.</Note>
      ) : (
        <>
          <Table rows={res.nearest} file="delta_blizhajshie.csv" />
          <p className="text-sm font-semibold">Матрица Delta (чем светлее — тем ближе по стилю)</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th />
                  {units.map((u) => (
                    <th key={u.name} className="px-1 font-normal max-w-[5rem] truncate align-bottom" title={u.name}>
                      <div className="w-16 truncate">{u.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map((u, i) => (
                  <tr key={u.name}>
                    <th className="pr-2 text-right font-normal whitespace-nowrap max-w-[10rem] truncate">{u.name}</th>
                    {res.D[i].map((d, k) => (
                      <td key={k} title={d.toFixed(3)} className="w-16 h-7 text-center tabular-nums" style={{ background: i === k ? 'transparent' : `rgba(13,148,136,${0.15 + 0.85 * (1 - d / maxD)})`, color: d / maxD < 0.45 ? 'white' : undefined }}>
                        {i === k ? '·' : d.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">Какие слова считались (первые 60 из {res.words.length})</summary>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{res.words.slice(0, 60).join(', ')}</p>
          </details>
          <Note>
            Delta Берроуза сравнивает тексты по частотам самых частых (в основном служебных) слов: это «отпечаток» привычек автора, а не тематики.
            Близость — повод для гипотезы (авторство, редакции, период), а не доказательство.
          </Note>
        </>
      )}
    </div>
  )
}

/* ---------------- Имена ---------------- */
function NamesPanel({ texts }) {
  const [id, setId] = useSel(texts)
  const [min, setMin] = useState(2)
  const rows = useMemo(() => M.nameCandidates(pickUnits(texts, id), min), [texts, id, min])
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} />
        <Field label={`Не реже: ${min} раз`}>
          <input type="range" min={1} max={10} value={min} onChange={(e) => setMin(+e.target.value)} className="w-full mt-3" />
        </Field>
      </div>
      <Bars data={rows.slice(0, 20).map((r) => ({ label: r.имя, value: r.упоминаний }))} color="bg-amber-500" />
      <Table rows={rows} file="imena_mesta.csv" />
      <Note>
        Это <b>кандидаты</b>: слова с заглавной буквы не в начале предложения, сгруппированные по основе (Соня, Сони, Соню). Сюда попадут и места
        (Москва), и случайные слова — разметьте вручную «персонаж / место / другое». Точный NER (Natasha) — в Colab, пара 8.
      </Note>
    </div>
  )
}

/* ---------------- Сеть персонажей ---------------- */
function NetworkPanel({ texts }) {
  const [id, setId] = useSel(texts)
  const units = useMemo(() => pickUnits(texts, id), [texts, id])
  const cands = useMemo(() => M.nameCandidates(units, 2), [units])
  const [namesStr, setNamesStr] = useState('')
  const [unit, setUnit] = useState('sentence')
  const names = namesStr.trim() ? namesStr.split(',').map((s) => s.trim()).filter(Boolean) : cands.slice(0, 10).map((r) => r.имя)
  const net = useMemo(() => M.cooccurrence(units, names, unit), [units, names.join(','), unit]) // eslint-disable-line react-hooks/exhaustive-deps
  const W = 460
  const R = 170
  const pos = Object.fromEntries(names.map((n, i) => [n, [W / 2 + R * Math.cos((2 * Math.PI * i) / names.length - Math.PI / 2), W / 2 + R * Math.sin((2 * Math.PI * i) / names.length - Math.PI / 2)]]))
  const maxW = Math.max(1, ...net.edges.map((e) => e.w))
  const deg = Object.fromEntries(net.degree.map((d) => [d.персонаж, d['связей (вес)']]))
  const maxDeg = Math.max(1, ...Object.values(deg))
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} />
        <Field label="Связь — если оба в одном…">
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
            <option value="sentence">предложении</option>
            <option value="paragraph">абзаце</option>
          </select>
        </Field>
        <Field label="Персонажи (через запятую)" hint="Пусто — 10 самых частых кандидатов из «Имён»">
          <input value={namesStr} onChange={(e) => setNamesStr(e.target.value)} placeholder={cands.slice(0, 6).map((r) => r.имя).join(', ')} className={inputCls} />
        </Field>
      </div>
      {names.length >= 2 ? (
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-lg mx-auto block">
          {net.edges.map((e) => (
            <line key={e.a + e.b} x1={pos[e.a]?.[0]} y1={pos[e.a]?.[1]} x2={pos[e.b]?.[0]} y2={pos[e.b]?.[1]} stroke="#0d9488" strokeOpacity={0.25 + 0.6 * (e.w / maxW)} strokeWidth={1 + 7 * (e.w / maxW)}>
              <title>{`${e.a} — ${e.b}: ${e.w}`}</title>
            </line>
          ))}
          {names.map((n) => (
            <g key={n}>
              <circle cx={pos[n][0]} cy={pos[n][1]} r={8 + 14 * ((deg[n] || 0) / maxDeg)} fill="#f59e0b" stroke="white" strokeWidth={2} />
              <text x={pos[n][0]} y={pos[n][1] - 22} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
                {n}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <Note tone="amber">Нужно хотя бы два персонажа.</Note>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Table rows={net.degree} file="set_centralnost.csv" />
        <Table rows={net.edges.map((e) => ({ 'персонаж A': e.a, 'персонаж B': e.b, 'вместе (раз)': e.w }))} file="set_svyazi.csv" />
      </div>
      <Note>Толщина линии — сколько раз персонажи названы рядом; размер кружка — сумма связей. Связь «рядом в тексте» ≠ отношения героев: проверяйте контексты.</Note>
    </div>
  )
}

/* ---------------- Дуга тональности ---------------- */
const POS0 = 'счаст*, радост*, рад, рада, любов*, люб*, нежн*, светл*, мил*, весел*, улыб*, смея*, смех*, прекрасн*, чудесн*, восторг*'
const NEG0 = 'смерт*, умер*, умир*, войн*, горе, горя, страш*, страх*, боль, больн*, тоск*, слез*, плак*, холодн*, разлук*, одинок*, печал*, грус*, тяжел*'
function ArcPanel({ texts }) {
  const [id, setId] = useSel(texts, texts[0]?.id)
  const [pos, setPos] = useState(POS0)
  const [neg, setNeg] = useState(NEG0)
  const [n, setN] = useState(10)
  const [open, setOpen] = useState(null)
  const src = useMemo(() => pickUnits(texts, id)[0], [texts, id])
  const rows = useMemo(() => (src ? M.arc(src.text, pos, neg, n) : []), [src, pos, neg, n])
  const max = Math.max(1, ...rows.map((r) => Math.abs(r['баланс /1000'])))
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} allowAll={false} />
        <Field label={`Отрезков: ${n}`}>
          <input type="range" min={4} max={30} value={n} onChange={(e) => setN(+e.target.value)} className="w-full mt-3" />
        </Field>
        <Field label="Положительные слова" hint="Словарь — ваше решение: допишите слова своей темы, уберите лишнее.">
          <textarea value={pos} onChange={(e) => setPos(e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="Отрицательные слова">
          <textarea value={neg} onChange={(e) => setNeg(e.target.value)} rows={3} className={inputCls} />
        </Field>
      </div>
      <div className="flex items-center gap-1 h-48 border-y border-gray-200 dark:border-gray-700 relative">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-300 dark:border-gray-600" />
        {rows.map((r, i) => {
          const v = r['баланс /1000']
          const h = (Math.abs(v) / max) * 46
          return (
            <button key={i} type="button" onClick={() => setOpen(i)} title={`Отрезок ${i + 1}: ${v}`} className="flex-1 h-full relative group">
              <span className={`absolute left-0.5 right-0.5 rounded-sm ${v >= 0 ? 'bg-emerald-500 bottom-1/2' : 'bg-rose-500 top-1/2'} ${open === i ? 'ring-2 ring-gray-900 dark:ring-white' : ''}`} style={{ height: `${h}%` }} />
              <span className="absolute bottom-0 left-0 right-0 text-[10px] text-gray-500">{i + 1}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">Щёлкните по столбику, чтобы прочитать отрезок. Зелёный — перевес положительных слов, красный — отрицательных.</p>
      {open != null && rows[open] && (
        <Note>
          <b>Отрезок {open + 1}</b> · POS: {rows[open]['POS-слова'] || '—'} · NEG: {rows[open]['NEG-слова'] || '—'}
          <span className="block mt-2 max-h-48 overflow-y-auto">{rows[open]._text}</span>
        </Note>
      )}
      <Table rows={rows} file="duga_tonalnosti.csv" />
      <Note>Словарный подсчёт не видит иронию, отрицание («не рад») и контекст. Самые резкие перепады обязательно прочитайте глазами.</Note>
    </div>
  )
}

/* ---------------- Темы ---------------- */
function TopicsPanel({ texts }) {
  const [id, setId] = useSel(texts)
  const [n, setN] = useState(6)
  const [open, setOpen] = useState(null)
  const units = useMemo(() => pickUnits(texts, id), [texts, id])
  const rows = useMemo(() => M.segmentTopics(units, n, 10), [units, n])
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} />
        <Field label={`Отрезков (если текст один или их меньше трёх): ${n}`}>
          <input type="range" min={3} max={20} value={n} onChange={(e) => setN(+e.target.value)} className="w-full mt-3" />
        </Field>
      </div>
      <Table rows={rows} file="temy_otrezkov.csv" onRow={(r, i) => setOpen(i)} />
      {open != null && rows[open] && (
        <Note>
          <b>{rows[open].отрезок}</b> — маркеры: {rows[open]['слова-маркеры']}
          <span className="block mt-2 max-h-48 overflow-y-auto">{rows[open]._text.slice(0, 3000)}</span>
        </Note>
      )}
      <Note>
        Упрощённая замена тематического моделирования: для каждого отрезка (или текста) — слова, которые в нём заметно чаще, чем в остальных. Назовите
        «тему» каждой строки сами и проверьте по тексту (щёлкните по строке). Настоящая LDA — в Colab, пара 10.
      </Note>
    </div>
  )
}

/* ---------------- Промпт ---------------- */
function PromptPanel({ texts }) {
  const [id, setId] = useSel(texts, texts[0]?.id)
  const src = useMemo(() => pickUnits(texts, id)[0], [texts, id])
  const words = useMemo(() => (src ? src.text.split(/\s+/).filter(Boolean) : []), [src])
  const [start, setStart] = useState(0)
  const [len, setLen] = useState(400)
  const [q, setQ] = useState('Какие детали создают главный мотив этого фрагмента?')
  const [copied, setCopied] = useState(false)
  const s = Math.min(start, Math.max(0, words.length - 50))
  const prompt = M.llmPrompt(words.slice(s, s + len).join(' '), q)
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <TextSelect texts={texts} value={id} onChange={setId} allowAll={false} />
        <Field label={`С какого слова: ${s}`}>
          <input type="range" min={0} max={Math.max(0, words.length - 50)} step={10} value={s} onChange={(e) => setStart(+e.target.value)} className="w-full mt-3" />
        </Field>
        <Field label={`Длина фрагмента: ${len} слов`}>
          <input type="range" min={100} max={1500} step={50} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full mt-3" />
        </Field>
      </div>
      <Field label="Ваш исследовательский вопрос">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} />
      </Field>
      <textarea readOnly value={prompt} rows={10} className={`${inputCls} font-mono`} />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch {
            setCopied(false)
          }
        }}
        className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold"
      >
        {copied ? 'Скопировано ✓' : 'Скопировать промпт'}
      </button>
      <Note>
        Вставьте промпт в бесплатный чат (DeepSeek, Qwen, Gemini), а ответ — в «Проверку цитат ИИ»: она покажет, какие цитаты модель взяла из текста,
        а какие придумала.
      </Note>
    </div>
  )
}

/* ---------------- Проверка цитат ---------------- */
function QuotesPanel({ texts }) {
  const [ans, setAns] = useState('')
  const rows = useMemo(() => (ans.trim() ? M.checkQuotes(ans, texts) : []), [ans, texts])
  const bad = rows.filter((r) => !r.итог.startsWith('✅')).length
  return (
    <div className="space-y-4">
      <Field label="Ответ модели ИИ (или любой текст с цитатами в кавычках «…» или “…”)">
        <textarea value={ans} onChange={(e) => setAns(e.target.value)} rows={8} className={inputCls} placeholder="Вставьте сюда ответ чата…" />
      </Field>
      {ans.trim() &&
        (rows.length ? (
          <>
            <p className="text-sm font-semibold">
              Цитат: {rows.length} · проблемных: <span className={bad ? 'text-rose-600' : 'text-emerald-600'}>{bad}</span>
            </p>
            <Table rows={rows} file="proverka_citat.csv" />
          </>
        ) : (
          <Note tone="amber">В ответе не найдено цитат в кавычках. Попросите модель цитировать точно, в кавычках «…».</Note>
        ))}
      <Note>Поиск идёт по всем вашим текстам без учёта регистра, «ё/е» и знаков препинания. «Неточная» — модель пересказала или склеила куски; такие цитаты в диссертацию не берите.</Note>
    </div>
  )
}

export const PANELS = {
  freq: { title: 'Частотный словарь', what: 'самые частые слова текста или всего корпуса', Comp: FreqPanel },
  kwic: { title: 'Контексты (конкорданс)', what: 'где и как стоит слово — главный инструмент доказательства', Comp: KwicPanel },
  fields: { title: 'Смысловые поля', what: 'свои группы слов → частоты на 1000 слов по текстам или по ходу текста', Comp: FieldsPanel },
  clean: { title: 'Очистка текста', what: 'убрать ссылки, номера страниц, переносы и мусор сайта', Comp: CleanPanel },
  passport: { title: 'Паспорт корпуса', what: 'объём, словарь, TTR/STTR, длина предложений по каждому тексту', Comp: PassportPanel },
  zipf: { title: 'Закон Ципфа', what: 'ранг–частота в логарифмах, гапаксы, наклон', Comp: ZipfPanel },
  keywords: { title: 'Ключевые слова (G²)', what: 'что отличает изучаемые тексты от фона', Comp: KeywordsPanel },
  delta: { title: 'Стилометрия: Delta Берроуза', what: 'какие тексты ближе по стилю (частые слова)', Comp: DeltaPanel },
  names: { title: 'Имена и места', what: 'кандидаты в персонажи и топонимы с частотами', Comp: NamesPanel },
  network: { title: 'Сеть персонажей', what: 'кто с кем назван рядом — граф и центральность', Comp: NetworkPanel },
  arc: { title: 'Дуга тональности', what: 'положительная/отрицательная лексика по ходу текста', Comp: ArcPanel },
  topics: { title: 'Темы отрезков', what: 'различительная лексика частей текста (упрощённая LDA)', Comp: TopicsPanel },
  prompt: { title: 'Промпт для бесплатного ИИ', what: 'фрагмент своего текста + вопрос + правила цитирования', Comp: PromptPanel },
  quotes: { title: 'Проверка цитат ИИ', what: 'есть ли цитаты из ответа модели в ваших текстах', Comp: QuotesPanel },
}

export const PANEL_GROUPS = [
  { label: 'Корпус', ids: ['clean', 'passport', 'zipf'] },
  { label: 'Слова и смыслы', ids: ['freq', 'kwic', 'fields', 'keywords'] },
  { label: 'Сюжет и герои', ids: ['arc', 'names', 'network', 'topics'] },
  { label: 'Стиль', ids: ['delta'] },
  { label: 'ИИ', ids: ['prompt', 'quotes'] },
]

/** Какие панели показать под каждым стендом */
export const STAND_PANELS = {
  'close-distant': ['fields', 'kwic', 'freq'],
  cleaning: ['clean'],
  passport: ['passport'],
  zipf: ['zipf'],
  delta: ['delta', 'keywords'],
  ner: ['names'],
  network: ['network'],
  sentiment: ['arc'],
  topics: ['topics'],
  prompt: ['prompt', 'quotes'],
  pipeline: ['prompt', 'quotes'],
  panel: ['fields', 'arc'],
  verify: ['quotes'],
}
