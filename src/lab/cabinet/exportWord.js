import { buildDocx } from './docxLite'
import { STYLES, linkOf } from './format'

/**
 * Список литературы в Word: разделы (главы/темы) → нумерованные описания по выбранному стандарту,
 * DOI и URL — кликабельные ссылки. По желанию — аннотации и заметки «зачем для главы».
 */
export function bibliographyDocx(items, profile = {}, opts = {}) {
  const { style = 'gost', withAbstracts = false, withNotes = true, groups = [] } = opts
  const fmt = STYLES[style]?.fn || STYLES.gost.fn
  const d = new Date().toLocaleDateString('ru-RU')
  const blocks = [
    { kind: 'title', runs: [{ text: 'Список литературы' }] },
    {
      kind: 'p',
      runs: [
        { text: 'Тема: ', bold: true },
        { text: profile.topic || '—' },
      ],
    },
  ]
  const meta = [
    profile.name && `Магистрант: ${profile.name}`,
    profile.supervisor && `Научный руководитель: ${profile.supervisor}`,
    `Сформировано: ${d} · стандарт: ${STYLES[style]?.name || style}`,
  ].filter(Boolean)
  blocks.push({ kind: 'note', runs: [{ text: meta.join(' · ') }] })
  blocks.push({
    kind: 'note',
    runs: [
      {
        text:
          'Описания собраны автоматически из открытых каталогов (OpenAlex, Crossref, DOAJ, Google Books и др.). Перед сдачей сверьте каждое описание с самим источником.',
      },
    ],
  })

  // Порядок разделов: как в профиле, затем остальные; внутри — по алфавиту (русские, затем латиница)
  const order = [...groups, ...new Set(items.map((i) => i.group || 'Без раздела'))].filter((g, i, a) => a.indexOf(g) === i)
  const sortKey = (r) => {
    const s = (r.authors?.[0] || r.title || '').trim()
    const fam = s.split(' ').slice(-1)[0] || s
    return (/[а-яё]/i.test(fam) ? '0' : '1') + fam.toLowerCase()
  }
  let numId = 1
  for (const g of order) {
    const list = items.filter((i) => (i.group || 'Без раздела') === g).sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'ru'))
    if (!list.length) continue
    if (order.length > 1) blocks.push({ kind: 'h1', runs: [{ text: g }] })
    for (const r of list) {
      const text = fmt(r)
      const runs = []
      // делаем DOI и URL кликабельными внутри описания
      const link = linkOf(r)
      const doiTxt = r.doi ? `DOI ${r.doi}` : ''
      const urlMatch = text.match(/https?:\/\/\S+?(?=[\s)]|$)/)
      if (doiTxt && text.includes(doiTxt)) {
        const [a, b] = text.split(doiTxt)
        runs.push({ text: a + 'DOI ' }, { text: r.doi, link: `https://doi.org/${r.doi}` }, { text: b })
      } else if (urlMatch) {
        const [a, b] = [text.slice(0, urlMatch.index), text.slice(urlMatch.index + urlMatch[0].length)]
        runs.push({ text: a }, { text: urlMatch[0], link: urlMatch[0] }, { text: b })
      } else if (link) {
        runs.push({ text: text + ' ' }, { text: link, link })
      } else runs.push({ text })
      if (r.oaUrl && r.oaUrl !== link) runs.push({ text: ' Полный текст: ', italic: true }, { text: r.oaUrl, link: r.oaUrl })
      blocks.push({ kind: 'item', numId, runs })
      if (withNotes && r.note) blocks.push({ kind: 'note', runs: [{ text: 'Зачем: ', bold: true }, { text: r.note }] })
      if (withAbstracts && r.abstract) blocks.push({ kind: 'note', runs: [{ text: r.abstract.slice(0, 900) + (r.abstract.length > 900 ? '…' : '') }] })
    }
    numId += 1
  }
  return buildDocx(blocks, { title: `Список литературы — ${profile.topic || ''}` })
}
