/**
 * Библиографическое описание: ГОСТ Р 7.0.100–2018 (упрощённо, для электронных ресурсов) и APA 7.
 * Плюс BibTeX / RIS (для Zotero, Mendeley) и CSV (Excel).
 * Описание собирается из метаданных API — его ОБЯЗАТЕЛЬНО сверяют с самим источником.
 */

const DASH = '–'

function parseName(full) {
  const s = String(full || '').trim().replace(/\s+/g, ' ')
  if (!s) return null
  if (s.includes(',')) {
    const [family, given] = s.split(',').map((x) => x.trim())
    return { family, given: given || '' }
  }
  const parts = s.split(' ')
  if (parts.length === 1) return { family: parts[0], given: '' }
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') }
}

const initials = (given) =>
  given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((g) => (g.includes('-') ? g.split('-').map((x) => x[0] + '.').join('-') : g[0] + '.'))
    .join(' ')

/** «Бунин, И. А.» */
export function nameInverted(full) {
  const n = parseName(full)
  if (!n) return ''
  const i = initials(n.given)
  return i ? `${n.family}, ${i}` : n.family
}

/** «И. А. Бунин» */
export function nameDirect(full) {
  const n = parseName(full)
  if (!n) return ''
  const i = initials(n.given)
  return i ? `${i} ${n.family}` : n.family
}

const isCyr = (s) => /[а-яё]/i.test(s || '')
const today = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function linkOf(r) {
  return r.doi ? `https://doi.org/${r.doi}` : r.url || r.oaUrl || ''
}

/** ГОСТ Р 7.0.100–2018, электронный ресурс удалённого доступа (упрощённо). */
export function gost(r, { accessDate = today() } = {}) {
  const ru = isCyr(r.title) || isCyr(r.venue)
  const T = {
    vol: ru ? 'Т.' : 'Vol.',
    no: ru ? '№' : 'No.',
    p: ru ? 'С.' : 'P.',
    pages: ru ? 'с.' : 'p.',
    etal: ru ? '[и др.]' : '[et al.]',
    text: ru ? 'Текст : электронный' : 'Text : electronic',
    print: ru ? 'Текст : непосредственный' : 'Text : unmediated',
  }
  const authors = r.authors || []
  const head = authors.length && authors.length <= 3 ? nameInverted(authors[0]) + ' ' : ''
  let resp = ''
  if (authors.length) {
    const shown = authors.slice(0, 3).map(nameDirect).join(', ')
    resp = ` / ${shown}${authors.length > 3 ? ' ' + T.etal : ''}`
  }
  let first = `${head}${r.title}${resp}`
  const parts = []
  if (r.type === 'book') {
    const pub = [r.publisher, r.year].filter(Boolean).join(', ')
    if (pub) parts.push(pub)
    if (r.pages && /^\d+$/.test(r.pages)) parts.push(`${r.pages} ${T.pages}`)
    if (r.isbn) parts.push(`ISBN ${r.isbn}`)
    parts.push(T.print)
  } else {
    first += `. ${DASH} ${T.text}`
    if (r.venue) first += ` // ${r.venue}`
    if (r.year) parts.push(String(r.year))
    const vi = [r.volume && `${T.vol} ${r.volume}`, r.issue && `${T.no} ${r.issue}`].filter(Boolean).join(', ')
    if (vi) parts.push(vi)
    if (r.pages) parts.push(`${T.p} ${r.pages}`)
  }
  parts.unshift(first)
  if (r.doi) parts.push(`DOI ${r.doi}`)
  const link = r.doi ? '' : linkOf(r)
  if (link) parts.push(`URL: ${link} (${ru ? 'дата обращения' : 'accessed'}: ${accessDate})`)
  return parts.join(`. ${DASH} `).replace(/\.\./g, '.') + '.'
}

/** APA 7 (упрощённо). */
export function apa(r) {
  const a = r.authors || []
  const names = a.slice(0, 20).map((n) => nameInverted(n))
  let au = ''
  if (names.length === 1) au = names[0]
  else if (names.length === 2) au = `${names[0]}, & ${names[1]}`
  else if (names.length > 2) au = `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`
  const year = r.year ? `(${r.year})` : '(n.d.)'
  let s = `${au ? au + ' ' : ''}${year}. ${r.title}.`
  if (r.type === 'book') {
    if (r.publisher) s += ` ${r.publisher}.`
  } else if (r.venue) {
    s += ` ${r.venue}`
    if (r.volume) s += `, ${r.volume}`
    if (r.issue) s += `(${r.issue})`
    if (r.pages) s += `, ${r.pages}`
    s += '.'
  }
  const link = linkOf(r)
  if (link) s += ` ${link}`
  return s
}

export const STYLES = { gost: { name: 'ГОСТ Р 7.0.100–2018', fn: gost }, apa: { name: 'APA 7', fn: apa } }

// ---------------------------------------------------------------- BibTeX, RIS, CSV
const bibKey = (r, i) => {
  const fam = (parseName((r.authors || [])[0])?.family || 'anon').toLowerCase().replace(/[^a-zа-яё]/gi, '')
  return `${fam}${r.year || ''}_${i + 1}`
}
const bibEsc = (s) => String(s || '').replace(/[{}]/g, '')

export function toBibTeX(items) {
  return items
    .map((r, i) => {
      const t = r.type === 'book' ? 'book' : r.type === 'chapter' ? 'incollection' : 'article'
      const f = {
        title: r.title,
        author: (r.authors || []).map((a) => nameInverted(a).replace(/\s+/g, ' ')).join(' and '),
        year: r.year,
        journal: t === 'article' ? r.venue : '',
        booktitle: t === 'incollection' ? r.venue : '',
        publisher: r.publisher,
        volume: r.volume,
        number: r.issue,
        pages: (r.pages || '').replace('–', '--'),
        doi: r.doi,
        isbn: r.isbn,
        url: r.doi ? '' : linkOf(r),
        note: r.note,
      }
      const body = Object.entries(f)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k} = {${bibEsc(v)}}`)
        .join(',\n')
      return `@${t}{${bibKey(r, i)},\n${body}\n}`
    })
    .join('\n\n')
}

export function toRIS(items) {
  return items
    .map((r) => {
      const ty = r.type === 'book' ? 'BOOK' : r.type === 'chapter' ? 'CHAP' : 'JOUR'
      const L = [`TY  - ${ty}`, `TI  - ${r.title}`]
      for (const a of r.authors || []) L.push(`AU  - ${nameInverted(a)}`)
      if (r.year) L.push(`PY  - ${r.year}`)
      if (r.venue) L.push(`${ty === 'JOUR' ? 'JO' : 'T2'}  - ${r.venue}`)
      if (r.volume) L.push(`VL  - ${r.volume}`)
      if (r.issue) L.push(`IS  - ${r.issue}`)
      if (r.pages) {
        const [sp, ep] = r.pages.split('–')
        L.push(`SP  - ${sp}`)
        if (ep) L.push(`EP  - ${ep}`)
      }
      if (r.publisher) L.push(`PB  - ${r.publisher}`)
      if (r.doi) L.push(`DO  - ${r.doi}`)
      if (r.isbn) L.push(`SN  - ${r.isbn}`)
      const link = linkOf(r)
      if (link) L.push(`UR  - ${link}`)
      if (r.abstract) L.push(`AB  - ${r.abstract.slice(0, 1000)}`)
      if (r.note) L.push(`N1  - ${r.note}`)
      L.push('ER  - ')
      return L.join('\r\n')
    })
    .join('\r\n\r\n')
}

export function toCSV(items) {
  const cols = [
    ['раздел', (r) => r.group],
    ['авторы', (r) => (r.authors || []).join('; ')],
    ['год', (r) => r.year],
    ['название', (r) => r.title],
    ['издание', (r) => r.venue || r.publisher],
    ['тип', (r) => r.type],
    ['DOI', (r) => r.doi],
    ['ссылка', (r) => linkOf(r)],
    ['открытый доступ', (r) => r.oaUrl],
    ['цитирований', (r) => r.cited],
    ['источник', (r) => (r.sources || [r.source]).join(', ')],
    ['заметка', (r) => r.note],
    ['ГОСТ', (r) => gost(r)],
  ]
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return '﻿' + [cols.map((c) => esc(c[0])).join(';'), ...items.map((r) => cols.map((c) => esc(c[1](r))).join(';'))].join('\r\n')
}

export function download(name, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 500)
}
