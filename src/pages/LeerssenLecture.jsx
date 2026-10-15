import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './leerssenLecture.css'
import {
  adjustments,
  assumptions,
  axes,
  boards,
  cases,
  eras,
  groups,
  nations,
  notes,
  people,
  quiz,
  source,
  statements,
  terms,
  triggers,
} from '../data/imagology/leerssenLecture.js'

const src = (file) => `${import.meta.env.BASE_URL}imagology/lecture-3/${file}`

function Fig({ file, caption, reading, tall, onOpen }) {
  if (!file) return null
  return (
    <figure className={`lr-fig ${tall ? 'tall' : ''}`}>
      <button type="button" className="lr-figbtn" onClick={() => onOpen({ file, caption })}>
        <img src={src(file)} alt={caption} />
      </button>
      {(caption || reading) && (
        <figcaption>
          {caption && <b>{caption}</b>}
          {reading && <span>{reading}</span>}
        </figcaption>
      )}
    </figure>
  )
}

function Notes({ id, open }) {
  if (!open) return null
  return (
    <div className="lr-notes">
      <b>Заметки лектору. </b>
      {notes[id]}
    </div>
  )
}

export default function LeerssenLecture() {
  const [board, setBoard] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const [full, setFull] = useState(false)
  const [light, setLight] = useState(null)
  const id = boards[board].id

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') setBoard((n) => Math.min(boards.length - 1, n + 1))
      if (e.key === 'ArrowLeft') setBoard((n) => Math.max(0, n - 1))
      if (e.key === 'Escape') setLight(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [board])

  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggleFull = () => {
    const node = document.getElementById('leerssen-root')
    if (!document.fullscreenElement) {
      node?.requestFullscreen?.().then(() => setFull(true)).catch(() => setFull(false))
    } else {
      document.exitFullscreen?.().then(() => setFull(false))
    }
  }

  return (
    <div className={`lr ${full ? 'is-full' : ''}`} id="leerssen-root">
      <div className="lr-top">
        <Link className="lr-back" to="/courses/imagology">← К курсу «Имагология»</Link>
        <div className="lr-actions">
          <button type="button" className={showNotes ? 'on' : ''} onClick={() => setShowNotes((v) => !v)}>
            {showNotes ? 'Скрыть заметки' : 'Заметки лектору'}
          </button>
          <button type="button" onClick={toggleFull}>{full ? 'Обычный экран' : 'На весь экран'}</button>
        </div>
      </div>

      <nav className="lr-nav" aria-label="Разделы лекции">
        {boards.map((b, i) => (
          <button key={b.id} type="button" className={i === board ? 'on' : ''} onClick={() => setBoard(i)}>
            {i + 1}. {b.label}
          </button>
        ))}
      </nav>

      <Notes id={id} open={showNotes} />

      <div className="lr-board">
        {id === 'thesis' && <Thesis onOpen={setLight} />}
        {id === 'border' && <Border />}
        {id === 'history' && <History />}
        {id === 'lexicon' && <Lexicon />}
        {id === 'eight' && <Eight onOpen={setLight} />}
        {id === 'imageme' && <Imageme onOpen={setLight} />}
        {id === 'axes' && <Axes onOpen={setLight} />}
        {id === 'method' && <Method onOpen={setLight} />}
        {id === 'later' && <Later />}
        {id === 'triangle' && <Triangle onOpen={setLight} />}
        {id === 'now' && <Now onOpen={setLight} />}
        {id === 'check' && <Check />}
      </div>

      <div className="lr-bar">
        <button type="button" className="lr-next" onClick={() => setBoard((n) => Math.max(0, n - 1))} disabled={board === 0}>
          ← Назад
        </button>
        <span className="lr-count">{board + 1} / {boards.length} · стрелки ← →</span>
        <button type="button" className="lr-next" onClick={() => setBoard((n) => Math.min(boards.length - 1, n + 1))} disabled={board === boards.length - 1}>
          Дальше →
        </button>
      </div>

      {light && (
        <div className="lr-light" onClick={() => setLight(null)} role="presentation">
          <img src={src(light.file)} alt="" />
          <p>{light.caption}. Нажмите, чтобы закрыть.</p>
        </div>
      )}
    </div>
  )
}

function Thesis({ onOpen }) {
  return (
    <section>
      <p className="lr-kicker">Лекция 3 · вместо презентации</p>
      <h2 className="lr-display">Нация, этничность и стереотип</h2>
      <p className="lede">
        Мир мы раскладываем по национальным характерам. {source.author} предлагает не измерять эти характеры, а разбирать их как речь.
      </p>
      <div className="lr-hero">
        <div>
          <p className="sub">
            Статья {source.authorEn}, «{source.title}» ({source.place}). Имагология здесь — изучение этнотипов: стереотипных приписываний национального нрава. Сердце метода прежнее: разобрать эссенциалистский разговор о нации и этничности. Пять поправок 2016 года его не отменяют.
          </p>
        </div>
        <Fig
          tall
          file="leerssen.jpg"
          caption="Юп Лейрсен. Фотография передана в общественное достояние, Wikimedia Commons"
          reading="Устно — Лейрсен. В программе курса имя иногда написано «Лирссен»."
          onOpen={onOpen}
        />
      </div>
      <div className="lr-grid" style={{ marginTop: 16 }}>
        <article className="lr-card lapis">
          <h3>Не социология</h3>
          <p>Предмет — дискурсивная логика и поэтические условности, а не «как устроено общество».</p>
        </article>
        <article className="lr-card coral">
          <h3>Не справка</h3>
          <p>Этнотип объясняет поступок характером. Описание климата и конституции к нему не относится.</p>
        </article>
        <article className="lr-card teal">
          <h3>Не опровержение фактом</h3>
          <p>Клише «даже не ложно». Его сила — в узнаваемости, не в статистике.</p>
        </article>
      </div>
      <div className="lr-split" style={{ marginTop: 16 }}>
        <Fig
          file="hogarth.jpg"
          caption="Уильям Хогарт. «О ростбиф старой Англии» («Ворота Кале»), 1748"
          reading="Два этнотипа в одном кадре: сытая Англия и голодная Франция. Сходство соседей вычтено."
          onOpen={onOpen}
        />
        <article className="lr-card">
          <h3>Как пользоваться доской</h3>
          <p>Двенадцать экранов. Стрелки переключают их, как слайды. Картину можно увеличить. Словарь не читается подряд: он открывается по слову.</p>
          <p>Вчера были школы. Сегодня рабочий аппарат статьи: граница этнотипа, восемь оснований, имагема, три хода анализа, ирония, метаобраз, фрейм и пересечение с гендером и классом.</p>
          <p className="lr-src">
            Текст: <a href={source.hal} target="_blank" rel="noreferrer">{source.hal}</a>. Справочник: {source.handbook}. Картины — общественное достояние.
          </p>
        </article>
      </div>
    </section>
  )
}

function Border() {
  const [picked, setPicked] = useState({})
  const label = { yes: 'Этнотип', no: 'Не этнотип', edge: 'Пограничное' }
  return (
    <section>
      <p className="lr-kicker">Упражнение для зала</p>
      <h2>Этнотип или нет</h2>
      <p className="sub">Выберите ответ, потом откроется ход Лейрсена. Не всякая фраза о стране годится в имагологию.</p>
      <div className="lr-grid two" style={{ marginTop: 16 }}>
        {statements.map((s) => {
          const got = picked[s.id]
          return (
            <article key={s.id} className="lr-card">
              <p style={{ fontSize: 18, color: 'var(--ink)' }}>{s.text}</p>
              <div className="lr-row">
                <button type="button" className="lr-choice" onClick={() => setPicked({ ...picked, [s.id]: 'yes' })}>Этнотип</button>
                <button type="button" className="lr-choice" onClick={() => setPicked({ ...picked, [s.id]: 'no' })}>Не этнотип</button>
              </div>
              {got && (
                <p className="lr-why">
                  <span className={s.kind === 'yes' ? 'lr-yes' : s.kind === 'no' ? 'lr-no' : 'lr-edge'}>{label[s.kind]}. </span>
                  {got === s.kind || (s.kind === 'edge' && got) ? '' : ''}
                  {s.why}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function History() {
  const [era, setEra] = useState(eras[5].id)
  const current = eras.find((e) => e.id === era)
  return (
    <section>
      <p className="lr-kicker">Коротко, это уже было</p>
      <h2>Откуда взялся отказ от «настоящего характера»</h2>
      <p className="sub">Семь ступеней. На паре достаточно открыть Дизеринка и справочник 2007 года. Остальное — если спросят.</p>
      <div className="lr-row">
        {eras.map((e) => (
          <button key={e.id} type="button" className={`lr-chip ${e.id === era ? 'on' : ''}`} onClick={() => setEra(e.id)}>
            {e.years}
          </button>
        ))}
      </div>
      <article className="lr-card">
        <p className="lr-kicker">{current.years}</p>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <p className="sub">{current.names}</p>
      </article>
    </section>
  )
}

function Lexicon() {
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState('ethnotype')
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return terms.filter((t) => {
      if (group !== 'all' && t.group !== group) return false
      if (!query) return true
      return `${t.term} ${t.def} ${t.example}`.toLowerCase().includes(query)
    })
  }, [group, q])
  return (
    <section>
      <p className="lr-kicker">{terms.length} определений</p>
      <h2>Словарь статьи</h2>
      <p className="sub">Нажмите термин. Определения короткие, пример сразу под ними.</p>
      <div className="lr-row">
        <input className="lr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти: имагема, фрейм, Сталь…" />
      </div>
      <div className="lr-row">
        {groups.map((g) => (
          <button key={g.id} type="button" className={`lr-chip small ${group === g.id ? 'on' : ''}`} onClick={() => setGroup(g.id)}>
            {g.label}
          </button>
        ))}
      </div>
      <div>
        {list.map((t) => (
          <div key={t.id} className="lr-acc">
            <button type="button" className="term" onClick={() => setOpen(open === t.id ? '' : t.id)}>
              {open === t.id ? '– ' : '+ '}{t.term}
            </button>
            {open === t.id && (
              <div className="body">
                <p>{t.def}</p>
                <p className="ex">{t.example}</p>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="sub">Ничего не нашлось. Сбросьте фильтр.</p>}
      </div>
    </section>
  )
}

function Eight({ onOpen }) {
  const [n, setN] = useState(0)
  const a = assumptions[n]
  return (
    <section>
      <p className="lr-kicker">Рабочая база, пункты 1–8</p>
      <h2>Восемь оснований</h2>
      <div className="lr-steps">
        {assumptions.map((item, i) => (
          <button key={item.n} type="button" className={i === n ? 'on' : ''} onClick={() => setN(i)}>{item.n}</button>
        ))}
      </div>
      <div className="lr-two">
        <article className="lr-card">
          <p className="lr-kicker">Основание {a.n}</p>
          <h3>{a.title}</h3>
          <p className="lede" style={{ fontSize: 26 }}>{a.lead}</p>
          <p style={{ marginTop: 10 }}>{a.body}</p>
          <p className="ex sub">{a.example}</p>
        </article>
        <Fig file={a.file} caption={a.caption} reading={a.reading} tall onOpen={onOpen} />
      </div>
    </section>
  )
}

function Imageme({ onOpen }) {
  const [id, setId] = useState('spain')
  const [pole, setPole] = useState(0)
  const nation = nations.find((n) => n.id === id)
  const face = nation.poles[pole]
  return (
    <section>
      <p className="lr-kicker">Образ и контр-образ</p>
      <h2>Одна имагема, две полки</h2>
      <p className="sub">Выберите нацию, потом полюс. Контрпример не убивает клише: он уже предусмотрен.</p>
      <div className="lr-row">
        {nations.map((n) => (
          <button key={n.id} type="button" className={`lr-chip ${n.id === id ? 'on' : ''}`} onClick={() => { setId(n.id); setPole(0) }}>{n.name}</button>
        ))}
      </div>
      <div className="lr-row">
        {nation.poles.map((p, i) => (
          <button key={p.name} type="button" className={`lr-choice ${i === pole ? 'on' : ''}`} onClick={() => setPole(i)}>{p.name}</button>
        ))}
      </div>
      <div className="lr-two">
        <article className="lr-card">
          <h3>{nation.name}: {face.name}</h3>
          <p>{face.text}</p>
        </article>
        <Fig file={face.file} caption={face.caption} tall onOpen={onOpen} />
      </div>
    </section>
  )
}

function Axes({ onOpen }) {
  const [id, setId] = useState(axes[0].id)
  const axis = axes.find((a) => a.id === id)
  return (
    <section>
      <p className="lr-kicker">Схемы старше имён стран</p>
      <h2>Куда кладут темперамент</h2>
      <div className="lr-row">
        {axes.map((a) => (
          <button key={a.id} type="button" className={`lr-chip ${a.id === id ? 'on' : ''}`} onClick={() => setId(a.id)}>{a.name}</button>
        ))}
      </div>
      <article className="lr-card" style={{ marginBottom: 16 }}>
        <h3>{axis.pair}</h3>
        <p>{axis.text}</p>
      </article>
      <div className="lr-split">
        <Fig file={axis.file} caption={axis.cap} onOpen={onOpen} />
        <Fig file={axis.file2} caption="" onOpen={onOpen} />
      </div>
    </section>
  )
}

function Method({ onOpen }) {
  const [id, setId] = useState(cases[0].id)
  const c = cases.find((x) => x.id === id)
  return (
    <section>
      <p className="lr-kicker">Интертекст, контекст, текст</p>
      <h2>Три хода, без одного нельзя</h2>
      <p className="sub">Выберите случай. Три колонки заполняются вместе: так Лейрсен запрещает ограничиваться «находкой типа».</p>
      <div className="lr-row">
        {cases.map((item) => (
          <button key={item.id} type="button" className={`lr-chip ${item.id === id ? 'on' : ''}`} onClick={() => setId(item.id)}>{item.title}</button>
        ))}
      </div>
      <div className="lr-grid" style={{ marginBottom: 16 }}>
        <article className="lr-card lapis"><h3>Интертекст</h3><p>{c.inter}</p></article>
        <article className="lr-card coral"><h3>Контекст</h3><p>{c.ctx}</p></article>
        <article className="lr-card teal"><h3>Текст</h3><p>{c.txt}</p></article>
      </div>
      <div className="lr-split">
        <Fig file={c.file} caption={c.caption} onOpen={onOpen} />
        <Fig file={c.portrait} caption={c.portraitCap} onOpen={onOpen} />
      </div>
    </section>
  )
}

function Later() {
  const [node, setNode] = useState('we-them')
  const [trig, setTrig] = useState(triggers[0].id)
  const t = triggers.find((x) => x.id === trig)
  const meta = {
    'we-them': {
      title: 'Как Мы видим Их',
      text: 'Прямой гетерообраз. Его одного мало, чтобы объяснить жар ссоры. Описание другого может быть резким и всё же оставаться спокойным клише.',
    },
    'they-us': {
      title: 'Как Они видят Нас',
      text: 'Чужой автообраз или их гетерообраз о нас. Это ещё не метаобраз. Здесь можно спорить о текстах другой стороны.',
    },
    meta: {
      title: 'Как Мы думаем, что Они думают о Нас',
      text: 'Вот метаобраз Милласа. Мы приписываем другому недоброжелательность и не замечаем, что подозрение уже наше. Лейрсен проверял это на греко-турецкой паре и на фламандцах с валлонами. В литературе тот же узел даёт иронию: герой живёт внутри чужого ожидания.',
    },
  }
  return (
    <section>
      <p className="lr-kicker">То, чего не было в учебнике 1960-х</p>
      <h2>Ирония, метаобраз, фрейм</h2>
      <div className="lr-grid" style={{ margin: '14px 0' }}>
        <article className="lr-card">
          <h3>Ирония</h3>
          <p>Над клише смеются и тем самым подтверждают, что его узнают. Долгий смех стирает кавычки: шутка снова становится плоским типом. «Алло, алло!» и сценический ирландец Родди Дойла — примеры Лейрсена.</p>
        </article>
        <article className="lr-card">
          <h3>Скрытый фон</h3>
          <p>Этнотип чаще спит, чем говорит. Фанатик с вечно включённой рамкой заметен и потому нетипичен. Корпус, собранный только из громких мест, преувеличивает одержимость эпохи.</p>
        </article>
        <article className="lr-card">
          <h3>«Касабланка»</h3>
          <p>Беженцы играют беженцев. Маски остаются узнаваемыми: француз, немец, американец. Пара Свой / Чужой рассыпается, клише нет.</p>
        </article>
      </div>
      <h3 style={{ margin: '8px 0' }}>Метаобраз: нажмите третий узел</h3>
      <div className="lr-row">
        <button type="button" className={`lr-choice ${node === 'we-them' ? 'on' : ''}`} onClick={() => setNode('we-them')}>Мы → Они</button>
        <button type="button" className={`lr-choice ${node === 'they-us' ? 'on' : ''}`} onClick={() => setNode('they-us')}>Они → Мы</button>
        <button type="button" className={`lr-choice ${node === 'meta' ? 'on' : ''}`} onClick={() => setNode('meta')}>Мы воображаем их взгляд</button>
      </div>
      <article className="lr-card" style={{ marginBottom: 16 }}>
        <h3>{meta[node].title}</h3>
        <p>{meta[node].text}</p>
      </article>
      <h3>Триггер включает одну полку и гасит другую</h3>
      <div className="lr-row">
        {triggers.map((item) => (
          <button key={item.id} type="button" className={`lr-chip ${item.id === trig ? 'on' : ''}`} onClick={() => setTrig(item.id)}>{item.name}</button>
        ))}
      </div>
      <div className="lr-split">
        <article className="lr-card teal"><h3>Включено</h3><p>{t.on}</p></article>
        <article className="lr-card"><h3>Ушло в латентность</h3><p>{t.off}</p><p className="sub">{t.note}</p></article>
      </div>
    </section>
  )
}

function Triangle({ onOpen }) {
  const [id, setId] = useState(people[0].id)
  const p = people.find((x) => x.id === id)
  return (
    <section>
      <p className="lr-kicker">Пажо: атрибут принят за сущность</p>
      <h2>Этнотип, гендер, социотип</h2>
      <p className="sub">Выберите фигуру. Национальность без двух других осей почти ничего не объясняет.</p>
      <div className="lr-row">
        {people.map((item) => (
          <button key={item.id} type="button" className={`lr-chip ${item.id === id ? 'on' : ''}`} onClick={() => setId(item.id)}>{item.name}</button>
        ))}
      </div>
      <div className="lr-two">
        <div className="lr-grid" style={{ gridTemplateColumns: '1fr' }}>
          <article className="lr-card lapis"><h3>Этнотип</h3><p>{p.ethno}</p></article>
          <article className="lr-card coral"><h3>Гендер</h3><p>{p.gender}</p></article>
          <article className="lr-card teal"><h3>Социотип</h3><p>{p.socio}</p></article>
          <article className="lr-card"><p>{p.note}</p></article>
        </div>
        <Fig file={p.file} caption={p.name} tall onOpen={onOpen} />
      </div>
    </section>
  )
}

function Now({ onOpen }) {
  return (
    <section>
      <p className="lr-kicker">Аннотация статьи, пункты a–e</p>
      <h2>Что пришлось поправить и почему метод не устарел</h2>
      <div className="lr-grid" style={{ marginTop: 14 }}>
        {adjustments.map((a) => (
          <article key={a.mark} className="lr-card">
            <p className="lr-kicker">{a.mark}</p>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
          </article>
        ))}
        <article className="lr-card lapis">
          <h3>Зачем это на этой неделе</h3>
          <p>Постнациональное не отменяет национальную рамку: прежняя ступень остаётся внутри следующей. Отказ разбирать этнотип отрезает сегодняшнюю политику идентичности от романов и картин, из которых она взяла свои маски.</p>
        </article>
      </div>
      <div className="lr-split" style={{ marginTop: 16 }}>
        <Fig
          file="vereshchagin.jpg"
          caption="Василий Верещагин. «Апофеоз войны», 1871"
          reading="Черепа и пустыня — моральный приговор, не этнотип «Востока». Хорошая граница метода: картина о чужой земле ещё не есть национальный характер."
          onOpen={onOpen}
        />
        <Fig
          file="meninas.jpg"
          caption="Диего Веласкес. «Менины», 1656"
          reading="Испанский двор смотрит на себя. Автообраз тоже строится взглядом, а не только описанием чужого."
          onOpen={onOpen}
        />
      </div>
      <p className="lr-src">
        Источник лекции: {source.authorEn}, «{source.title}», {source.place}.{' '}
        <a href={source.hal} target="_blank" rel="noreferrer">HAL, открытый доступ</a>.
        Изображения: Wikimedia Commons, общественное достояние. Портрет Лейрсена передан в общественное достояние автором снимка.
      </p>
    </section>
  )
}

function Check() {
  const [answers, setAnswers] = useState({})
  return (
    <section>
      <p className="lr-kicker">Две минуты в конце</p>
      <h2>Проверка зала</h2>
      <p className="sub">Нажмите ответ. Формулировку можно оставить на экране после пары.</p>
      {quiz.map((item, qi) => (
        <article key={item.q} className="lr-card" style={{ marginTop: 12 }}>
          <p className="lr-q">{item.q}</p>
          <div className="lr-grid" style={{ gridTemplateColumns: '1fr' }}>
            {item.options.map((opt, oi) => {
              const chosen = answers[qi]
              const show = chosen !== undefined
              const correct = oi === item.answer
              return (
                <button
                  key={opt}
                  type="button"
                  className={`lr-opt ${show && correct ? 'on' : ''}`}
                  onClick={() => setAnswers({ ...answers, [qi]: oi })}
                >
                  {opt}
                  {show && chosen === oi && !correct ? ' — не это' : ''}
                </button>
              )
            })}
          </div>
          {answers[qi] !== undefined && <p className="lr-why">{item.why}</p>}
        </article>
      ))}
    </section>
  )
}
