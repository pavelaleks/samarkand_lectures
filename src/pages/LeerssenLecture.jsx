import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './leerssenLecture.css'
import {
  axes,
  conceptById,
  concepts,
  meta,
  spectation,
  toc,
  visualCases,
  volkertafelRows,
} from '../data/imagology/leerssenLecture.js'

const asset = (file) => `${import.meta.env.BASE_URL}imagology/lecture-3/${file}`

function Jump({ to, children }) {
  return (
    <a
      className="et-jump"
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault()
        if (window.location.hash !== `#${to}`) {
          window.history.pushState(null, '', `#${to}`)
          window.dispatchEvent(new HashChangeEvent('hashchange'))
        }
        document.getElementById(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
    >
      {children}
    </a>
  )
}

function Disclosure({ id, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`et-disc ${open ? 'is-open' : ''}`} id={id}>
      <button type="button" className="et-disc-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="et-disc-mark" aria-hidden>{open ? '−' : '+'}</span>
        <span>{title}</span>
      </button>
      {open && <div className="et-disc-body">{children}</div>}
    </div>
  )
}

function ConceptCard({ c, forceOpen }) {
  const [open, setOpen] = useState(Boolean(forceOpen))
  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  return (
    <article className={`et-concept ${open ? 'is-open' : ''}`} id={`concept-${c.id}`}>
      <button type="button" className="et-concept-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="et-concept-term">{c.term}</span>
        <span className="et-concept-meta">{c.author}</span>
        <span className="et-concept-toggle">{open ? '−' : '+'}</span>
      </button>
      <p className="et-concept-sum">{c.summary}</p>
      {open && (
        <div className="et-concept-more">
          <ul>
            {c.more.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {c.seeAlso?.length > 0 && (
            <p className="et-see">
              {c.seeAlso.map((sid, i) => (
                <span key={sid}>
                  {i > 0 && ' · '}
                  <Jump to={`concept-${sid}`}>{conceptById[sid]?.term || sid}</Jump>
                </span>
              ))}
            </p>
          )}
          <a className="et-ext" href={c.nodegoat} target="_blank" rel="noopener noreferrer">
            Ethnotypology ↗
          </a>
        </div>
      )}
    </article>
  )
}

export default function LeerssenLecture() {
  const [light, setLight] = useState(null)
  const [hashConcept, setHashConcept] = useState(null)

  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace(/^#/, '')
      if (h.startsWith('concept-')) {
        setHashConcept(h.replace('concept-', ''))
        setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  useEffect(() => {
    if (!light) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLight(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [light])

  return (
    <div className="et">
      <header className="et-top">
        <Link className="et-back" to="/courses/imagology">← Имагология</Link>
        <a className="et-ext-top" href={meta.sourceUrl} target="_blank" rel="noopener noreferrer">
          imagologica.eu/ethnotypology ↗
        </a>
      </header>

      <main className="et-main">
        <section className="et-hero" id="intro">
          <p className="et-kicker">{meta.course} · лекция 3</p>
          <h1>{meta.title}</h1>
          <p className="et-sub">{meta.subtitle}</p>

          <nav className="et-toc" aria-label="Содержание">
            {toc.map((item) => (
              <Jump key={item.id} to={item.id}>{item.label}</Jump>
            ))}
          </nav>

          <figure className="et-portrait">
            <img src={asset('leerssen.jpg')} alt="Joep Leerssen" />
            <figcaption>Joep Leerssen. Ethnotypology; Imagology (2007).</figcaption>
          </figure>
        </section>

        <section className="et-section" id="volkertafel">
          <h2>Völkertafel</h2>
          <p className="et-prose">
            Штирийская таблица народов: одна сетка признаков, десять колонок «наций».
            Форма <Jump to="concept-image">образа</Jump> и{' '}
            <Jump to="concept-stereotype">стереотипа</Jump>, не этнография.
          </p>

          <figure className="et-fig et-fig-wide">
            <button
              type="button"
              className="et-fig-btn"
              onClick={() => setLight({ file: 'volkertafel.jpg', title: 'Völkertafel' })}
            >
              <img src={asset('volkertafel.jpg')} alt="Völkertafel" />
            </button>
            <figcaption>Völkertafel, ок. 1720–1730. Wikimedia Commons.</figcaption>
          </figure>

          <Disclosure id="volkertafel-rows" title="Черты по колонкам">
            <div className="et-table-wrap">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Нация</th>
                    <th>Черты</th>
                    <th>Контекст</th>
                  </tr>
                </thead>
                <tbody>
                  {volkertafelRows.map((row) => (
                    <tr key={row.nation}>
                      <td>{row.nation}</td>
                      <td>{row.traits.join(' · ')}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Disclosure>
        </section>

        <section className="et-section" id="spectation">
          <h2>{spectation.title}</h2>
          <p className="et-prose">{spectation.lead}</p>
          <div className="et-spect-grid">
            {spectation.nodes.map((n) => (
              <Disclosure key={n.id} id={`spect-${n.id}`} title={n.label}>
                <p>{n.text}</p>
              </Disclosure>
            ))}
          </div>
          <p className="et-prose">
            Auto- / hetero-image → <Jump to="concept-image">Image</Jump>,{' '}
            <Jump to="concept-stereotype">Stereotype</Jump>.
            Meta-image: «как мы думаем, что нас видят».
          </p>
        </section>

        <section className="et-section" id="concepts">
          <h2>Словарь</h2>
          <div className="et-concepts">
            {concepts.map((c) => (
              <ConceptCard key={c.id} c={c} forceOpen={hashConcept === c.id} />
            ))}
          </div>
        </section>

        <section className="et-section" id="axes">
          <h2>Оси сравнения</h2>
          <div className="et-axes">
            {axes.map((ax) => (
              <Disclosure key={ax.id} id={`axis-${ax.id}`} title={ax.title}>
                <ul>
                  {ax.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <p className="et-see">
                  <Jump to={`concept-${ax.conceptId}`}>{conceptById[ax.conceptId]?.term}</Jump>
                </p>
              </Disclosure>
            ))}
          </div>
        </section>

        <section className="et-section" id="nation">
          <h2>Нация, характер, тип</h2>
          <p className="et-prose">
            <Jump to="concept-nation">Нация / ethnie</Jump> — объект политической и культурной речи;{' '}
            <Jump to="concept-character">характер</Jump> — репутация, выданная за сущность;{' '}
            <Jump to="concept-type">тип</Jump> — идеализация, при которой индивид растворяется в «типичном» представителе.
          </p>
          <Disclosure id="nation-deep" title="Nation, ethnie, people">
            <p>
              Сдвиг от gens / natio (происхождение) к модерной политической нации.
              Имагология смотрит, как нации воображаются через стереотипы и клише;
              национализм подключает эти образы к политике.
            </p>
            <p className="et-see">
              <Jump to="concept-nationalism">Nationalism</Jump>
              {' · '}
              <Jump to="concept-identity">Identity / alterity</Jump>
              {' · '}
              <Jump to="concept-representation">Representation</Jump>
            </p>
          </Disclosure>
        </section>

        <section className="et-section" id="visual">
          <h2>Визуальные стереотипы</h2>
          <div className="et-visuals">
            {visualCases.map((v) => (
              <article key={v.id} className="et-case" id={`case-${v.id}`}>
                <button
                  type="button"
                  className="et-case-img"
                  onClick={() => setLight({ file: v.file, title: v.title })}
                >
                  <img src={asset(v.file)} alt={v.title} />
                </button>
                <div className="et-case-body">
                  <h3>{v.title}</h3>
                  <p className="et-circa">{v.circa}</p>
                  <p>{v.caption}</p>
                  <Disclosure id={`read-${v.id}`} title="Разбор">
                    <p>{v.reading}</p>
                  </Disclosure>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="et-section" id="sources">
          <h2>Источники</h2>
          <ul className="et-sources">
            <li>
              <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer">
                Ethnotypology
              </a>
              {' '}(Imagologica / Nodegoat, CC BY-NC-ND)
            </li>
            <li>{meta.article2016}</li>
            <li>
              Beller, M.; Leerssen, J. (eds.). <em>Imagology</em>. Amsterdam: Rodopi, 2007.
            </li>
            <li>Изображения: Wikimedia Commons.</li>
          </ul>
        </section>
      </main>

      {light && (
        <div className="et-lightbox" role="dialog" aria-modal="true" onClick={() => setLight(null)}>
          <button type="button" className="et-lightbox-close" aria-label="Закрыть">×</button>
          <img
            src={asset(light.file)}
            alt={light.title}
            onClick={(e) => e.stopPropagation()}
          />
          <p>{light.title}</p>
        </div>
      )}
    </div>
  )
}
