/**
 * Минимальный генератор .docx без внешних библиотек.
 * .docx — это ZIP с XML-файлами; здесь ZIP собирается без сжатия (метод STORE) + CRC32.
 * Поддерживает: заголовки, абзацы, нумерованные пункты, жирный/курсив, гиперссылки.
 *
 * Блок документа:
 *   { kind: 'title' | 'h1' | 'h2' | 'p' | 'item' | 'note', runs: [{ text, bold, italic, link, color, size }] }
 */

// ---------------------------------------------------------------- ZIP (STORE)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function zipStore(files) {
  // files: [{ name, data: Uint8Array }]
  const enc = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0
  const d = new Date()
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  for (const f of files) {
    const name = enc.encode(f.name)
    const data = f.data
    const crc = crc32(data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // UTF-8 имена
    local.setUint16(8, 0, true) // STORE
    local.setUint16(10, dosTime, true)
    local.setUint16(12, dosDate, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, name.length, true)
    local.setUint16(28, 0, true)
    chunks.push(new Uint8Array(local.buffer), name, data)
    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true)
    cen.setUint16(4, 20, true)
    cen.setUint16(6, 20, true)
    cen.setUint16(8, 0x0800, true)
    cen.setUint16(10, 0, true)
    cen.setUint16(12, dosTime, true)
    cen.setUint16(14, dosDate, true)
    cen.setUint32(16, crc, true)
    cen.setUint32(20, data.length, true)
    cen.setUint32(24, data.length, true)
    cen.setUint16(28, name.length, true)
    cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), name)
    offset += 30 + name.length + data.length
  }
  const cenSize = central.reduce((s, c) => s + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, cenSize, true)
  end.setUint32(16, offset, true)
  const all = [...chunks, ...central, new Uint8Array(end.buffer)]
  const total = all.reduce((s, c) => s + c.length, 0)
  const out = new Uint8Array(total)
  let p = 0
  for (const c of all) {
    out.set(c, p)
    p += c.length
  }
  return out
}

// ---------------------------------------------------------------- DOCX
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // управляющие символы недопустимы в XML
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

const STYLE = {
  title: { size: 32, bold: true, spacingAfter: 120, align: 'center' },
  h1: { size: 28, bold: true, spacingBefore: 280, spacingAfter: 120, color: '0F554F' },
  h2: { size: 24, bold: true, spacingBefore: 200, spacingAfter: 80 },
  p: { size: 24, spacingAfter: 120 },
  item: { size: 24, spacingAfter: 100, numbered: true },
  note: { size: 20, spacingAfter: 140, italic: true, color: '555555', indent: 709 },
}

export function buildDocx(blocks, { title = 'Документ' } = {}) {
  const rels = []
  const relId = (url) => {
    const id = `rIdL${rels.length + 1}`
    rels.push({ id, url })
    return id
  }
  const runXml = (r, base) => {
    const bold = r.bold ?? base.bold
    const italic = r.italic ?? base.italic
    const color = r.link ? '0563C1' : r.color || base.color
    const size = r.size || base.size
    const rPr = [
      '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>',
      bold ? '<w:b/>' : '',
      italic ? '<w:i/>' : '',
      color ? `<w:color w:val="${color}"/>` : '',
      r.link ? '<w:u w:val="single"/>' : '',
      `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
    ].join('')
    const t = `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`
    return r.link ? `<w:hyperlink r:id="${relId(r.link)}" w:history="1">${t}</w:hyperlink>` : t
  }
  const body = blocks
    .map((b) => {
      const st = STYLE[b.kind] || STYLE.p
      const pPr = [
        st.numbered ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="' + (b.numId || 1) + '"/></w:numPr>' : '',
        `<w:spacing w:before="${st.spacingBefore || 0}" w:after="${st.spacingAfter || 0}" w:line="276" w:lineRule="auto"/>`,
        st.indent ? `<w:ind w:left="${st.indent}"/>` : '',
        `<w:jc w:val="${st.align || 'left'}"/>`,
        b.kind === 'h1' || b.kind === 'h2' ? '<w:keepNext/>' : '',
      ].join('')
      return `<w:p><w:pPr>${pPr}</w:pPr>${(b.runs || []).map((r) => runXml(r, st)).join('')}</w:p>`
    })
    .join('')

  // нумерация: каждый раздел начинается с 1 — отдельный numId на раздел
  const numIds = [...new Set(blocks.filter((b) => b.kind === 'item').map((b) => b.numId || 1))]
  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/>
<w:pPr><w:ind w:left="567" w:hanging="567"/></w:pPr>
<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:lvl></w:abstractNum>
${numIds
  .map(
    (n) =>
      `<w:num w:numId="${n}"><w:abstractNumId w:val="0"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`
  )
  .join('')}
</w:numbering>`

  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
${rels
  .map(
    (r) =>
      `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(r.url)}" TargetMode="External"/>`
  )
  .join('\n')}
</Relationships>`

  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${esc(title)}</dc:title><dc:creator>Кабинет магистранта · СамГУ</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`

  const enc = new TextEncoder()
  const bytes = zipStore([
    { name: '[Content_Types].xml', data: enc.encode(types) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'docProps/core.xml', data: enc.encode(core) },
    { name: 'word/document.xml', data: enc.encode(doc) },
    { name: 'word/numbering.xml', data: enc.encode(numbering) },
    { name: 'word/_rels/document.xml.rels', data: enc.encode(docRels) },
  ])
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}
