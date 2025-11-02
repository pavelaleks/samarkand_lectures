const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || localStorage.getItem('deepseek_api_key')
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

/**
 * Генерирует аннотацию для лекции с помощью DeepSeek API
 */
export async function generateAnnotation(lectureContent, lectureTitle) {
  const apiKey = DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY не настроен в переменных окружения или localStorage')
  }

  const prompt = `Профессионально проанализируй следующий текст лекции и создай структурированную аннотацию.

Заголовок лекции: ${lectureTitle}

Текст лекции:
${lectureContent}

Требования к аннотации:
1. **Краткая аннотация** (short): 1-2 предложения, описывающие основную тему и цель лекции
2. **Развернутая аннотация** (detailed): 2-3 абзаца, раскрывающие содержание, ключевые концепции и их значение
3. **Ключевые моменты** (keyPoints): 3-5 важных тезисов или концепций из лекции
4. **Ключевые слова** (keywords): 5-7 терминов, тегов для поиска и категоризации

Верни результат ТОЛЬКО в формате JSON:
{
  "short": "краткая аннотация",
  "detailed": "развернутая аннотация",
  "keyPoints": ["пункт 1", "пункт 2", "пункт 3"],
  "keywords": ["термин1", "термин2", "термин3"]
}`

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Ты — академический ассистент, специализирующийся на создании профессиональных аннотаций для лекций по литературоведению. Отвечай ТОЛЬКО валидным JSON без дополнительных комментариев."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Парсим JSON из ответа (может быть обернут в markdown code blocks)
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
    }
    
    const annotation = JSON.parse(jsonContent)
    
    return {
      ...annotation,
      generatedAt: new Date().toISOString(),
      generatedBy: "deepseek-api"
    }
  } catch (error) {
    console.error('Ошибка при генерации аннотации:', error)
    throw error
  }
}

/**
 * Пакетная обработка нескольких лекций
 */
export async function batchGenerateAnnotations(lectures) {
  const results = []
  
  for (const lecture of lectures) {
    try {
      console.log(`Обрабатываю лекцию: ${lecture.title}`)
      const annotation = await generateAnnotation(lecture.content, lecture.title)
      results.push({
        lectureId: lecture.id,
        success: true,
        annotation
      })
      
      // Задержка между запросами, чтобы не превысить лимиты API
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      results.push({
        lectureId: lecture.id,
        success: false,
        error: error.message
      })
    }
  }
  
  return results
}

