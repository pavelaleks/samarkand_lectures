/** Чтение своих файлов в браузере: .txt (UTF-8 или Windows-1251) и .docx (без библиотек). */

function decodeTxt(buf) {
  const bytes = new Uint8Array(buf)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('windows-1251').decode(bytes)
  }
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Браузер не умеет распаковывать .docx — обновите его или сохраните файл как .txt')
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Достаёт файл из ZIP-архива по имени (docx — это ZIP). */
async function unzipEntry(buf, wanted) {
  const v = new DataView(buf)
  let eocd = -1
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Файл не похож на .docx')
  const count = v.getUint16(eocd + 10, true)
  let p = v.getUint32(eocd + 16, true)
  const dec = new TextDecoder()
  for (let k = 0; k < count; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break
    const method = v.getUint16(p + 10, true)
    const csize = v.getUint32(p + 20, true)
    const nlen = v.getUint16(p + 28, true)
    const elen = v.getUint16(p + 30, true)
    const clen = v.getUint16(p + 32, true)
    const off = v.getUint32(p + 42, true)
    const name = dec.decode(new Uint8Array(buf, p + 46, nlen))
    if (name === wanted) {
      const ln = v.getUint16(off + 26, true)
      const le = v.getUint16(off + 28, true)
      const data = new Uint8Array(buf, off + 30 + ln + le, csize)
      return method === 0 ? data : inflateRaw(data)
    }
    p += 46 + nlen + elen + clen
  }
  throw new Error('В .docx не найден текст документа')
}

function docxXmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function readTextFile(file) {
  const buf = await file.arrayBuffer()
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) {
    const xml = new TextDecoder().decode(await unzipEntry(buf, 'word/document.xml'))
    return docxXmlToText(xml)
  }
  if (name.endsWith('.doc') || name.endsWith('.pdf') || name.endsWith('.rtf')) {
    throw new Error('Этот формат не читается в браузере. Откройте файл в Word и сохраните как .docx или .txt')
  }
  return decodeTxt(buf)
}
