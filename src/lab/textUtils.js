/** Учебные утилиты токенизации и частот для Лаборатории (браузер). */

export function tokenize(text) {
  if (!text) return []
  const lower = text.toLowerCase()
  return lower.match(/[а-яёa-z]+/gi)?.map((w) => w.toLowerCase()) || []
}

export function countTokens(tokens) {
  const map = new Map()
  for (const t of tokens) {
    map.set(t, (map.get(t) || 0) + 1)
  }
  return map
}

export function topN(counter, n = 20) {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .slice(0, n)
}

export function ttr(tokens) {
  if (!tokens.length) return 0
  return new Set(tokens).size / tokens.length
}

export function windowTtr(tokens, windowSize = 100) {
  if (!tokens.length) return []
  const size = Math.max(20, windowSize)
  const out = []
  for (let i = 0; i < tokens.length; i += size) {
    const slice = tokens.slice(i, i + size)
    if (slice.length < Math.min(20, size / 2)) break
    out.push({
      index: out.length + 1,
      tokens: slice.length,
      ttr: ttr(slice),
      types: new Set(slice).size,
    })
  }
  return out
}

export function splitChapters(text) {
  const raw = text.replace(/\r\n/g, '\n').trim()
  if (!raw) return []
  const byMarker = raw.split(/\n\s*(?=глава\s+\d+|гл\.\s*\d+|#{1,3}\s+)/i)
  if (byMarker.length > 1) {
    return byMarker
      .map((block, i) => {
        const lines = block.trim().split('\n')
        const title = lines[0].slice(0, 60)
        return { id: i + 1, title, text: block.trim() }
      })
      .filter((c) => c.text.length > 0)
  }
  const paras = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (paras.length >= 2) {
    return paras.map((p, i) => ({ id: i + 1, title: `Абзац ${i + 1}`, text: p }))
  }
  return [{ id: 1, title: 'Текст', text: raw }]
}

export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function relativeFreq(counter, total) {
  const out = new Map()
  for (const [w, c] of counter) {
    out.set(w, total ? c / total : 0)
  }
  return out
}
