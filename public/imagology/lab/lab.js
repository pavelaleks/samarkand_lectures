// Лаборатория имагологии — общая библиотека стендов.
// Загрузка текстов (Викитека, файл, вставка), нормализация, разбор на предложения,
// поиск этнонимов, признаков, мотивов и мест по общим словарям из data/*.json.

export const SITE = '/samarkand_lectures/'
export const LANG_NAMES = { ru: 'русский', en: 'английский', fr: 'французский', de: 'немецкий' }
const SIDE_LABEL = { 'россия': 'Россия', 'запад': 'Запад', 'восток': 'Восток' }

// ───────────────────────── утилиты ─────────────────────────
export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue
    if (k === 'class') el.className = v
    else if (k === 'html') el.innerHTML = v
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v)
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return el
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export function sideBadge(side) {
  const cls = side === 'запад' ? 'west' : side === 'россия' ? 'rus' : 'east'
  return `<span class="badge ${cls}">${esc(SIDE_LABEL[side] || side || '')}</span>`
}

export function download(name, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const a = h('a', { href: URL.createObjectURL(blob), download: name })
  document.body.append(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500)
}

export function toCSV(rows) {
  return '﻿' + rows.map((r) => r.map((v) => {
    const s = String(v ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
}

export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
  },
}

const memo = new Map()
const session = {
  get(key) { try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null } },
  set(key, v) { try { sessionStorage.setItem(key, JSON.stringify(v)) } catch { /* переполнение — не страшно */ } },
}

export async function loadData(name) {
  if (memo.has(name)) return memo.get(name)
  const p = fetch(new URL(`data/${name}.json`, import.meta.url)).then((r) => {
    if (!r.ok) throw new Error(`Не загрузился data/${name}.json`)
    return r.json()
  })
  memo.set(name, p)
  return p
}

export function params() { return new URLSearchParams(location.search) }

// ───────────────────────── нормализация и токены ─────────────────────────
const CHARMAP = { 'ё': 'е', 'ѣ': 'е', 'і': 'и', 'ї': 'и', 'ѵ': 'и', 'ѳ': 'ф' }
export function norm(s) {
  let t = String(s).toLowerCase().replace(/[ёѣіїѵѳ]/g, (c) => CHARMAP[c])
  t = t.normalize('NFD').replace(/[̀-̅̇-ͯ]/g, '').normalize('NFC')
  if (t.length > 1 && t.endsWith('ъ')) t = t.slice(0, -1)
  return t
}

const WORD_RE = /[\p{L}][\p{L}\p{M}'’-]*/gu
export function tokens(sentence) {
  const out = []
  for (const m of sentence.matchAll(WORD_RE)) {
    const raw = m[0].replace(/[-'’]+$/, '')
    out.push({ raw, n: norm(raw.replace(/’/g, "'")), i: m.index, cap: /^\p{Lu}/u.test(raw) })
  }
  return out
}

export function detectLang(text) {
  const sample = text.slice(0, 60000)
  const cyr = (sample.match(/[Ѐ-ӿ]/g) || []).length
  const lat = (sample.match(/[a-zA-ZÀ-ſ]/g) || []).length
  if (cyr > lat) return 'ru'
  const words = sample.toLowerCase().match(/\p{L}+/gu) || []
  const score = { en: 0, fr: 0, de: 0 }
  const S = {
    en: ['the', 'and', 'of', 'to', 'which', 'with', 'was', 'his'],
    fr: ['le', 'la', 'les', 'et', 'des', 'une', 'que', 'est', 'dans'],
    de: ['der', 'die', 'und', 'das', 'nicht', 'ein', 'ist', 'mit', 'sich'],
  }
  const sets = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, new Set(v)]))
  for (const w of words) for (const k of Object.keys(sets)) if (sets[k].has(w)) score[k]++
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0][0]
}

export function splitSentences(text) {
  const clean = text.replace(/\r/g, '').replace(/[ \t ]+/g, ' ')
  const parts = clean.split(/(?<=[.!?…»"])\s+(?=[\p{Lu}«"„—–-])|\n\s*\n+/u)
  const out = []
  for (let p of parts) {
    p = p.trim()
    if (!p) continue
    if (p.length > 700) {
      // стихи и длинные периоды: режем по строкам
      for (const line of p.split(/\n+/)) {
        const l = line.trim()
        if (l) out.push(l)
      }
    } else out.push(p.replace(/\s*\n\s*/g, ' / '))
  }
  return out
}

// ───────────────────────── словари ─────────────────────────
// items: [{id, forms:{ru:{p,x,no}, en:…}}] → функция token.n → id | null
export function compileMatcher(items, lang) {
  const exact = new Map()
  const prefixes = []
  for (const it of items) {
    const f = it.forms[lang]
    if (!f) continue
    for (const x of f.x) exact.set(x, it.id)
    for (const p of f.p) prefixes.push({ p, id: it.id, no: f.no })
  }
  prefixes.sort((a, b) => b.p.length - a.p.length)
  const cache = new Map()
  return (n) => {
    if (cache.has(n)) return cache.get(n)
    let res = exact.get(n) || null
    if (!res) {
      for (const e of prefixes) {
        if (n.startsWith(e.p) && !e.no.some((x) => n.startsWith(x))) { res = e.id; break }
      }
    }
    cache.set(n, res)
    return res
  }
}

export function compilePlaces(places) {
  const exact = new Map()
  const prefixes = []
  for (const pl of places) {
    for (const x of pl.x) exact.set(x, pl.id)
    for (const p of pl.p) prefixes.push({ p, id: pl.id })
  }
  prefixes.sort((a, b) => b.p.length - a.p.length)
  return (n) => {
    const e = exact.get(n)
    if (e) return e
    for (const x of prefixes) if (n.startsWith(x.p)) return x.id
    return null
  }
}

// Полный разбор текста: предложения с найденными народами, признаками, мотивами, местами.
export async function analyze(doc) {
  const lex = await loadData('lexicon')
  const geo = await loadData('places')
  const lang = doc.lang || detectLang(doc.text)
  const mg = compileMatcher(lex.groups, lang)
  const mt = compileMatcher(lex.traits, lang)
  const mm = compileMatcher(lex.motifs, lang)
  const mp = compilePlaces(geo.places)
  const stop = new Set(lex.stop[lang] || [])
  const sents = splitSentences(doc.text)
  let nWords = 0
  const freq = new Map()
  const res = []
  for (const s of sents) {
    const toks = tokens(s)
    nWords += toks.length
    const rec = { s, groups: new Map(), traits: new Map(), motifs: new Map(), places: new Map(), propers: [] }
    toks.forEach((t, k) => {
      if (!stop.has(t.n) && t.n.length > 1) freq.set(t.n, (freq.get(t.n) || 0) + 1)
      const add = (map, id) => { if (!map.has(id)) map.set(id, []); map.get(id).push(t.raw) }
      const g = mg(t.n); if (g) add(rec.groups, g)
      const tr = mt(t.n); if (tr) add(rec.traits, tr)
      const mo = mm(t.n); if (mo) add(rec.motifs, mo)
      if (t.cap && t.n.length > 2) {
        const p = mp(t.n)
        if (p) add(rec.places, p)
        else if (k > 0 && !g && !s.slice(Math.max(0, t.i - 3), t.i).includes('/')) rec.propers.push(t.raw)
      }
    })
    res.push(rec)
  }
  return { doc, lang, sentences: res, nWords, freq, lex, geo }
}

// ───────────────────────── загрузка текстов ─────────────────────────
const WS_STRIP = [
  '.ws-noexport', '.noprint', '#headertemplate', '.headertemplate', '.header_template', 'table.header', '.mw-editsection',
  '.reference', 'sup.reference', '.references', 'ol.references', '.reflist', 'style', 'script', '.navbox', '.metadata',
  '.ws-summary', '#ws-data', '.mw-references-wrap', '.dynlayout-exempt', '.pagenum', '.ws-pagenum', '.mw-empty-elt',
  'table.toccolours', '.licenseContainer', '.licence', '.sisitem', '.interproject', 'span.ws-pagenum', 'div.PDFlink',
]

export function wikiTextFromHtml(html, title, lang) {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  const root = doc.getElementById('root')
  for (const sel of WS_STRIP) root.querySelectorAll(sel).forEach((n) => n.remove())
  // подстраницы и редакции: ссылки внутрь произведения
  const sub = []
  const seen = new Set()
  const base = title.replace(/ /g, '_')
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || ''
    const m = href.match(/^\/wiki\/([^#?]+)/)
    if (!m) continue
    let t
    try { t = decodeURIComponent(m[1]) } catch { continue }
    if (/^(Special|Служебная|Файл|File|Категория|Category|Обсуждение|Talk|Участник|User|Шаблон|Template|Автор|Author|Auteur|Portal|Портал|Wikisource|Викитека|Help|Справка|Index|Индекс|Page|Страница|Livre|Fichier|Catégorie|Kategorie|Datei|Seite|Index|Spezial|Spécial)[:]/i.test(t)) continue
    if (t === base || seen.has(t)) continue
    const txt = a.textContent.trim()
    if (!txt) continue
    const inside = t.startsWith(base + '/')
    const version = /\((ДО|ВТ|СО)\)|\/[ДВ]О$|редакци|версия|издани/i.test(t + ' ' + txt) || /\(.*?\)\/\d{4}/.test(t)
    if (inside || version) { seen.add(t); sub.push({ title: t.replace(/_/g, ' '), label: txt }) }
  }
  root.querySelectorAll('br').forEach((b) => b.replaceWith('\n'))
  const blocks = []
  const walk = (node) => {
    for (const el of node.children) {
      const tag = el.tagName.toLowerCase()
      if (/^(p|h[1-6]|li|dd|dt|blockquote|pre)$/.test(tag) || el.classList.contains('poem') || el.classList.contains('stanza')) {
        const t = el.textContent.replace(/[ \t ]+/g, ' ').replace(/\n /g, '\n').trim()
        if (t) blocks.push(t)
      } else if (/^(div|section|center|span|table|tbody|tr|td|ul|ol|dl|font)$/.test(tag)) {
        walk(el)
      }
    }
  }
  walk(root)
  let text = blocks.join('\n\n')
  if (text.length < 200) text = root.textContent.replace(/[ \t ]+/g, ' ').trim()
  text = text.replace(/\[\d+\]/g, '').replace(/\n{3,}/g, '\n\n')
  return { text, subpages: sub }
}

function wsApi(lang) { return `https://${lang}.wikisource.org/w/api.php` }

export async function wikisourceSearch(lang, query, limit = 8) {
  const url = `${wsApi(lang)}?action=query&list=search&srnamespace=0&srlimit=${limit}&format=json&origin=*&srsearch=${encodeURIComponent(query)}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Викитека не отвечает (${r.status})`)
  const j = await r.json()
  return (j.query?.search || []).map((x) => ({ title: x.title, snippet: x.snippet?.replace(/<[^>]+>/g, '') || '', words: x.wordcount }))
}

export async function wikisourcePage(lang, title) {
  const key = `ws:${lang}:${title}`
  const cached = session.get(key)
  if (cached) return cached
  const url = `${wsApi(lang)}?action=parse&prop=text&redirects=1&disableeditsection=1&format=json&formatversion=2&origin=*&page=${encodeURIComponent(title)}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Викитека не отвечает (${r.status})`)
  const j = await r.json()
  if (j.error) {
    const e = new Error(j.error.code === 'missingtitle' ? 'Страница не найдена' : j.error.info)
    e.code = j.error.code
    throw e
  }
  const real = j.parse.title
  const { text, subpages } = wikiTextFromHtml(j.parse.text, real, lang)
  const out = {
    title: real, lang, text, subpages,
    url: `https://${lang}.wikisource.org/wiki/${encodeURIComponent(real.replace(/ /g, '_'))}`,
    source: 'Викитека',
  }
  if (text.length < 400000) session.set(key, out)
  return out
}

export function stripGutenberg(text) {
  const s = text.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i)
  const e = text.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i)
  let t = text
  if (s >= 0) t = t.slice(t.indexOf('\n', s) + 1)
  if (e >= 0) t = t.slice(0, t.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i))
  return t
}

// ───────────────────────── слот текста (UI) ─────────────────────────
// Слот: пресет | Викитека | файл | вставить. onLoad(doc), где doc = {id, label, author, title, lang, side, text, url}
export class TextSlot {
  constructor(root, { name = 'Текст', side = '', presets = null, onLoad = () => {}, onClear = () => {} } = {}) {
    this.root = root
    this.name = name
    this.side = side
    this.presets = presets
    this.onLoad = onLoad
    this.onClear = onClear
    this.doc = null
    this.render()
  }

  render() {
    const r = this.root
    r.className = 'slot'
    r.innerHTML = ''
    this.head = h('div', { class: 'slot-head' },
      h('span', { class: 'slot-title' }, this.name),
      h('span', { class: 'meta', 'data-role': 'meta' }, 'текст не выбран'))
    const tabs = h('div', { class: 'tabs', role: 'tablist' })
    const panes = h('div')
    const mk = (id, label, pane) => {
      const b = h('button', { type: 'button', role: 'tab', 'data-tab': id }, label)
      b.addEventListener('click', () => this.tab(id))
      tabs.append(b)
      pane.dataset.pane = id
      pane.className = 'pane hidden'
      panes.append(pane)
    }
    if (this.presets) mk('preset', 'Готовый текст', this.presetPane())
    mk('ws', 'Викитека', this.wsPane())
    mk('file', 'Файл .txt', this.filePane())
    mk('paste', 'Вставить', this.pastePane())
    this.statusEl = h('div', { class: 'status', role: 'status', 'aria-live': 'polite' })
    this.subEl = h('div', { class: 'hidden' })
    r.append(this.head, tabs, panes, this.subEl, this.statusEl)
    this.tab(this.presets ? 'preset' : 'ws')
  }

  tab(id) {
    $$('[data-tab]', this.root).forEach((b) => b.classList.toggle('on', b.dataset.tab === id))
    $$('[data-pane]', this.root).forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== id))
  }

  presetPane() {
    const sel = h('select', { 'aria-label': 'Готовый текст' }, h('option', { value: '' }, '— выберите —'))
    const groups = { 'россия': h('optgroup', { label: 'Россия' }), 'запад': h('optgroup', { label: 'Запад' }) }
    for (const [id, t] of Object.entries(this.presets)) {
      const g = groups[t.side] || groups['запад']
      g.append(h('option', { value: id }, `${t.author}. ${t.title} (${t.year})`))
    }
    sel.append(groups['россия'], groups['запад'])
    const btn = h('button', { type: 'button', class: 'primary' }, 'Загрузить')
    btn.addEventListener('click', () => sel.value && this.loadPreset(sel.value))
    this.presetSelect = sel
    return h('div', { class: 'row' }, h('div', { class: 'grow' }, sel), btn)
  }

  wsPane() {
    const lang = h('select', { 'aria-label': 'Язык Викитеки' },
      ...Object.entries(LANG_NAMES).map(([k, v]) => h('option', { value: k }, `${k} · ${v}`)))
    if (this.side === 'запад') lang.value = 'fr'
    const q = h('input', { type: 'search', placeholder: 'автор, название или строка', 'aria-label': 'Поиск в Викитеке' })
    const go = h('button', { type: 'button', class: 'primary' }, 'Найти')
    const list = h('ul', { class: 'results' })
    const run = async () => {
      if (!q.value.trim()) return
      this.status('Ищу в Викитеке…')
      list.innerHTML = ''
      try {
        const res = await wikisourceSearch(lang.value, q.value.trim())
        if (!res.length) { this.status('Ничего не найдено. Попробуйте другое написание или язык.', 'err'); return }
        this.status(`Найдено: ${res.length}. Выберите страницу.`)
        for (const x of res) {
          const b = h('button', { type: 'button' }, h('span', {}, x.title), h('span', { class: 'faint small' }, x.words ? ` · ${x.words} сл.` : ''))
          b.addEventListener('click', () => this.loadWs(lang.value, x.title))
          list.append(h('li', {}, b))
        }
      } catch (e) { this.status(e.message + '. Проверьте подключение к интернету.', 'err') }
    }
    go.addEventListener('click', run)
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') run() })
    return h('div', {}, h('div', { class: 'row' }, lang, h('div', { class: 'grow' }, q), go), list,
      h('p', { class: 'faint small' }, 'Тексты XIX века на Викитеке часто разбиты на главы или даны в нескольких редакциях: тогда стенд предложит выбрать.'))
  }

  filePane() {
    const inp = h('input', { type: 'file', accept: '.txt,.md,.html,.htm,text/plain', 'aria-label': 'Файл с текстом' })
    inp.addEventListener('change', async () => {
      const f = inp.files?.[0]
      if (!f) return
      let text = await f.text()
      if (/\.html?$/i.test(f.name)) text = new DOMParser().parseFromString(text, 'text/html').body.textContent || ''
      text = stripGutenberg(text)
      this.set({ id: 'file:' + f.name, author: '', title: f.name.replace(/\.[^.]+$/, ''), lang: detectLang(text), side: this.side, text, url: '', source: 'файл' })
    })
    return h('div', {}, inp, h('p', { class: 'faint small' },
      'Подойдёт .txt из Project Gutenberg, Gallica, НЭБ, ФЭБ или ваш собственный. Служебные шапки Gutenberg снимаются автоматически.'))
  }

  pastePane() {
    const ta = h('textarea', { placeholder: 'Вставьте фрагмент текста…', 'aria-label': 'Текст' })
    const title = h('input', { type: 'text', placeholder: 'подпись: автор, название', 'aria-label': 'Подпись' })
    const go = h('button', { type: 'button', class: 'primary' }, 'Готово')
    go.addEventListener('click', () => {
      const text = ta.value.trim()
      if (text.length < 20) { this.status('Слишком короткий текст.', 'err'); return }
      this.set({ id: 'paste:' + Date.now(), author: '', title: title.value.trim() || 'Вставленный текст', lang: detectLang(text), side: this.side, text, url: '', source: 'вставка' })
    })
    return h('div', { class: 'stack' }, ta, h('div', { class: 'row' }, h('div', { class: 'grow' }, title), go))
  }

  status(msg, kind = '') {
    this.statusEl.textContent = msg
    this.statusEl.className = 'status' + (kind ? ' ' + kind : '')
  }

  async loadPreset(id) {
    const t = this.presets[id]
    if (!t) return
    if (this.presetSelect) this.presetSelect.value = id
    const src = t.src || {}
    if (src.type === 'gutenberg') {
      this.tab('file')
      this.status(`«${t.title}» лежит в Project Gutenberg, а он не отдаёт текст другим сайтам. Скачайте .txt по ссылке и загрузите файлом.`, 'err')
      this.subEl.className = ''
      this.subEl.innerHTML = `<p class="small"><a href="${esc(t.read || t.gutenberg)}" target="_blank" rel="noopener">Открыть в Project Gutenberg →</a> (Plain Text UTF-8)</p>`
      return
    }
    this.status(`Загружаю «${t.title}» из Викитеки…`)
    const meta = { id, author: t.author, title: t.title, side: t.side, year: t.year }
    try {
      if (src.title) {
        try { await this.loadWs(src.lang, src.title, meta); return } catch (e) { if (e.code !== 'missingtitle') throw e }
      }
      const res = await wikisourceSearch(src.lang, src.query || t.title, 6)
      if (!res.length) throw new Error('В Викитеке не нашлось. Загрузите текст файлом или вставьте фрагмент')
      await this.loadWs(src.lang, res[0].title, meta, res)
    } catch (e) {
      this.status(`${e.message}.`, 'err')
    }
  }

  async loadWs(lang, title, meta = {}, alternatives = null) {
    this.status(`Загружаю «${title}»…`)
    const page = await wikisourcePage(lang, title)
    this.showSubpages(page, meta, alternatives)
    const words = (page.text.match(/\p{L}+/gu) || []).length
    if (words < 120 && page.subpages.length) {
      this.status(`«${page.title}» — оглавление или страница редакций. Выберите главу либо загрузите все главы сразу.`)
      return
    }
    this.set({ id: meta.id || `ws:${lang}:${page.title}`, author: meta.author || '', title: meta.title || page.title, year: meta.year || '',
      lang, side: meta.side || this.side, text: page.text, url: page.url, source: 'Викитека', wsTitle: page.title })
  }

  showSubpages(page, meta, alternatives) {
    const box = this.subEl
    box.innerHTML = ''
    const subs = page.subpages.slice(0, 80)
    if (!subs.length && !(alternatives && alternatives.length > 1)) { box.className = 'hidden'; return }
    box.className = ''
    if (subs.length) {
      const sel = h('select', { 'aria-label': 'Глава или редакция' }, ...subs.map((s, i) => h('option', { value: i }, s.label.length > 70 ? s.label.slice(0, 70) + '…' : s.label)))
      const one = h('button', { type: 'button', class: 'small' }, 'Эта глава')
      const all = h('button', { type: 'button', class: 'small' }, `Все главы (${Math.min(subs.length, 40)})`)
      one.addEventListener('click', () => this.loadWs(page.lang, subs[+sel.value].title, meta).catch((e) => this.status(e.message, 'err')))
      all.addEventListener('click', () => this.loadAll(page, subs.slice(0, 40), meta))
      box.append(h('div', { class: 'row small' }, h('span', { class: 'meta' }, 'Части:'), h('div', { class: 'grow' }, sel), one, all))
    }
    if (alternatives && alternatives.length > 1) {
      const sel = h('select', { 'aria-label': 'Другие страницы' }, ...alternatives.map((a) => h('option', { value: a.title }, a.title)))
      sel.value = page.title
      const b = h('button', { type: 'button', class: 'small' }, 'Открыть')
      b.addEventListener('click', () => this.loadWs(page.lang, sel.value, meta).catch((e) => this.status(e.message, 'err')))
      box.append(h('div', { class: 'row small', style: { marginTop: '.4rem' } }, h('span', { class: 'meta' }, 'Не то?'), h('div', { class: 'grow' }, sel), b))
    }
  }

  async loadAll(page, subs, meta) {
    const parts = []
    for (let i = 0; i < subs.length; i++) {
      this.status(`Главы: ${i + 1} из ${subs.length}…`)
      try { const p = await wikisourcePage(page.lang, subs[i].title); parts.push(p.text) } catch { /* пропускаем */ }
    }
    if (!parts.length) { this.status('Главы не загрузились.', 'err'); return }
    this.set({ id: meta.id || `ws:${page.lang}:${page.title}`, author: meta.author || '', title: meta.title || page.title, year: meta.year || '',
      lang: page.lang, side: meta.side || this.side, text: parts.join('\n\n'), url: page.url, source: 'Викитека', wsTitle: page.title })
  }

  set(doc) {
    if (!doc.lang) doc.lang = detectLang(doc.text)
    this.doc = doc
    const words = (doc.text.match(/\p{L}+/gu) || []).length
    const meta = $('[data-role="meta"]', this.root)
    meta.innerHTML = `${doc.side ? sideBadge(doc.side) + ' ' : ''}${esc(LANG_NAMES[doc.lang] || doc.lang)} · ${words.toLocaleString('ru')} слов`
    this.root.classList.add('loaded')
    this.status(`Загружено: ${doc.author ? doc.author + '. ' : ''}${doc.title}${doc.url ? '' : ''}`, 'ok')
    if (doc.url) this.statusEl.append(' · ', h('a', { href: doc.url, target: '_blank', rel: 'noopener' }, 'источник'))
    this.onLoad(doc)
  }
}

// ───────────────────────── статистика ─────────────────────────
// log-likelihood (Dunning) для сравнения частот слова в двух корпусах
export function logLikelihood(a, b, na, nb) {
  const e1 = na * (a + b) / (na + nb)
  const e2 = nb * (a + b) / (na + nb)
  let ll = 0
  if (a > 0) ll += a * Math.log(a / e1)
  if (b > 0) ll += b * Math.log(b / e2)
  return 2 * ll
}

export function highlight(sentence, words, cls = '') {
  if (!words || !words.length) return esc(sentence)
  const uniq = [...new Set(words)].sort((x, y) => y.length - x.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(^|[^\\p{L}])(${uniq.join('|')})(?=[^\\p{L}]|$)`, 'gu')
  return esc(sentence).replace(new RegExp(re.source, 'gu'), (m, pre, w) => `${pre}<mark${cls ? ` class="${cls}"` : ''}>${w}</mark>`)
}

export function topbar(active) {
  const links = [
    ['index.html', 'Лаборатория'],
    ['volkertafel.html', 'Völkertafel'],
    ['parallel.html', 'Параллельный читатель'],
    ['karta.html', 'Карта взгляда'],
    ['galereya.html', 'Галерея образов'],
    ['practicum.html', 'Практические'],
  ]
  const bar = h('header', { class: 'top' },
    h('a', { class: 'brand', href: `${SITE}courses/imagology` }, '← Имагология'),
    h('nav', { 'aria-label': 'Стенды' }, ...links.map(([href, label]) => h('a', { href, 'aria-current': active === href ? 'page' : null }, label))))
  document.body.prepend(bar)
}
