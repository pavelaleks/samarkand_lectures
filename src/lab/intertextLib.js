import { DEEPSEEK_KEY_STORAGE } from './litSearchLib'
import { SAMPLES } from './samples'

export { DEEPSEEK_KEY_STORAGE }

export const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'
export const DEEPSEEK_MODEL = 'deepseek-chat'

/** Учебные пресеты: фрагменты, где интертекст уже «зашит» в текст. */
export const INTERTEXT_PRESETS = [
  {
    id: 'holodnaya-fet',
    title: '«Холодная осень» · цитата Фета',
    author: 'И. А. Бунин',
    work: 'Холодная осень',
    focus:
      'Как работает цитата Фета в прощальной сцене: дословность, обрыв памяти, функция «деревенской осенней прелести» и войны.',
    fragment: excerpt(SAMPLES.buninHolodnaya, 2200),
  },
  {
    id: 'temnye-title',
    title: '«Тёмные аллеи» · зачин',
    author: 'И. А. Бунин',
    work: 'Тёмные аллеи',
    focus:
      'Заглавие и атмосфера зачина: возможные связи с Огарёвым («Обыкновенная повесть»), дорожным топосом и «николаевским» портретом. Отделите явное от гипотезы.',
    fragment: excerpt(SAMPLES.buninTemnyeAllei, 1600),
  },
  {
    id: 'natali-open',
    title: '«Натали» · начало',
    author: 'И. А. Бунин',
    work: 'Натали',
    focus:
      'Мотивы первого лета, «чистоты», дворянского романа и возможной переклички с тургеневским / сентиментальным кодом. Не выдумывайте цитат из других текстов.',
    fragment: excerpt(SAMPLES.buninNatali, 1800),
  },
]

function excerpt(text, max) {
  if (!text) return ''
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

const SYSTEM_PROMPT = `Ты филолог-аналитик, специалист по интертекстуальности (Бахтин, Кристева, Женетт, Риффатерр — как рабочие ориентиры, без лекционного пересказа теорий).

Задача: по данному ФРАГМЕНТУ провести аккуратный интертекстуальный анализ.

Правила качества:
1) Опирайся прежде всего на то, что ЕСТЬ во фрагменте: дословные цитаты внутри фрагмента, именованные авторы/тексты, устойчивые формулы, библейские/античные/фольклорные маркеры, жанровые клише, заглавия.
2) Различай уровни уверенности:
   - высокая: во фрагменте прямо назван источник / дана узнаваемая дословная цитата;
   - средняя: устойчивая аллюзия или реминисценция с текстовой опорой, но источник не назван;
   - низкая: типологический параллелизм / «похоже на…» без жёсткой привязки.
3) Запрещено выдумывать цитаты из других произведений и «улучшать» цитаты фрагмента. Если не уверен в источнике — так и скажи, предложи, что проверить вручную.
4) Не подменяй интертекстуальный разбор общим пересказом сюжета или биографией автора.
5) Отвечай по-русски, ясно и плотно. Тон — семинарский, без канцелярита и без восторгов.

Верни ТОЛЬКО JSON объекта со схемой:
{
  "summary": "2–4 предложения: главный интертекстуальный жест фрагмента и его художественная функция",
  "signals": [
    {
      "type": "цитата|аллюзия|реминисценция|парафраз|заглавие|жанровый_код|архетип|библеизм|другое",
      "label": "короткое имя связи (напр. «Фет, Какая холодная осень…»)",
      "evidence": "дословная цитата или маркер ИЗ ФРАГМЕНТА",
      "probable_source": "предполагаемый источник или null",
      "confidence": "высокая|средняя|низкая",
      "function": "зачем это в данном месте: ирония, память, легитимация чувства, пафос, снижение и т.п.",
      "note": "оговорка / альтернатива / что проверить"
    }
  ],
  "relations": "1 короткий абзац: как связи между собой складываются в сеть (а не список случайных совпадений)",
  "non_findings": "что выглядит соблазнительным, но во фрагменте НЕ подтверждается",
  "checklist": ["3–6 конкретных шагов ручной проверки (Ctrl+F, сверка издания, словарь крылатых слов и т.д.)"],
  "limits": "1–2 предложения о границах LLM-анализа интертекста"
}

Если явных интертекстов нет — честно верни пустой/короткий signals и сильный non_findings, а не натягивай.`

/**
 * Умный запрос: system задаёт дисциплину разбора; user несёт метаданные + фокус + фрагмент.
 */
export function buildUserMessage({ fragment, author, work, focus, extra }) {
  const parts = [
    'Проведи интертекстуальный анализ фрагмента.',
    author ? `Автор (если известен): ${author}` : null,
    work ? `Произведение (если известно): ${work}` : null,
    focus ? `Исследовательский фокус / вопрос: ${focus}` : null,
    extra ? `Доп. контекст от пользователя: ${extra}` : null,
    '',
    'ФРАГМЕНТ:',
    '"""',
    fragment.trim(),
    '"""',
  ]
  return parts.filter((x) => x != null).join('\n')
}

export async function analyzeIntertextWithDeepSeek(
  { fragment, author, work, focus, extra },
  apiKey,
  { signal } = {}
) {
  const res = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: 0.25,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage({ fragment, author, work, focus, extra }) },
      ],
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = await res.json()
      detail = errBody?.error?.message || JSON.stringify(errBody).slice(0, 200)
    } catch {
      /* ignore */
    }
    throw new Error(formatHttpError(res.status, detail))
  }

  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(String(raw).replace(/^```json\s*|\s*```$/g, ''))
  return normalizeAnalysis(parsed, {
    model: data?.model || DEEPSEEK_MODEL,
    usage: data?.usage || null,
  })
}

function formatHttpError(status, detail) {
  const hint =
    status === 401
      ? 'Ключ не принят. Проверьте, что скопирован целиком (sk-…).'
      : status === 402
        ? 'На аккаунте DeepSeek закончился баланс.'
        : status === 429
          ? 'Слишком много запросов — подождите и повторите.'
          : status >= 500
            ? 'Сервер DeepSeek перегружен, повторите позже.'
            : ''
  return `DeepSeek HTTP ${status}${hint ? `: ${hint}` : ''}${detail ? ` (${detail})` : ''}`
}

function normalizeAnalysis(parsed, meta) {
  const signals = Array.isArray(parsed.signals)
    ? parsed.signals.map((s) => ({
        type: s.type || 'другое',
        label: s.label || 'связь',
        evidence: s.evidence || '',
        probable_source: s.probable_source || null,
        confidence: s.confidence || 'низкая',
        function: s.function || '',
        note: s.note || '',
      }))
    : []

  return {
    summary: parsed.summary || '',
    signals,
    relations: parsed.relations || '',
    non_findings: parsed.non_findings || '',
    checklist: Array.isArray(parsed.checklist) ? parsed.checklist.filter(Boolean) : [],
    limits: parsed.limits || '',
    meta,
  }
}

export function analysisToMarkdown(analysis, meta = {}) {
  const lines = [
    '# Интертекстуальный анализ',
    '',
    meta.work || meta.author
      ? `*${[meta.author, meta.work].filter(Boolean).join(' · ')}*`
      : null,
    '',
    '## Краткий вывод',
    analysis.summary || '—',
    '',
    '## Сигналы',
  ].filter((x) => x != null)

  if (!analysis.signals?.length) {
    lines.push('_Явных интертекстуальных сигналов модель не зафиксировала._', '')
  } else {
    analysis.signals.forEach((s, i) => {
      lines.push(
        `### ${i + 1}. ${s.label}`,
        `- **Тип:** ${s.type}`,
        `- **Уверенность:** ${s.confidence}`,
        s.probable_source ? `- **Источник:** ${s.probable_source}` : null,
        s.evidence ? `- **Опора во фрагменте:** «${s.evidence}»` : null,
        s.function ? `- **Функция:** ${s.function}` : null,
        s.note ? `- **Заметка:** ${s.note}` : null,
        ''
      )
    })
  }

  lines.push(
    '## Сеть связей',
    analysis.relations || '—',
    '',
    '## Чего нет (соблазн без опоры)',
    analysis.non_findings || '—',
    '',
    '## Чеклист проверки',
    ...(analysis.checklist?.length ? analysis.checklist.map((c) => `- ${c}`) : ['- —']),
    '',
    '## Границы метода',
    analysis.limits || '—',
    '',
    '---',
    `_Модель: ${analysis.meta?.model || DEEPSEEK_MODEL}. Это гипотезы для проверки, не готовая статья._`
  )

  return lines.filter((x) => x != null).join('\n')
}

export function confidenceClass(level) {
  const v = String(level || '').toLowerCase()
  if (v.startsWith('выс')) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
  if (v.startsWith('сред')) return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
  return 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100'
}
