import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import mammoth from 'mammoth'
import { config } from 'dotenv'

// Загружаем переменные окружения
config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

async function generateAnnotation(lectureContent, lectureTitle) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('VITE_DEEPSEEK_API_KEY не найден в .env файле')
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
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
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

async function readDocx(filePath) {
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error(`Ошибка при чтении ${filePath}:`, error.message)
    throw error
  }
}

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ Ошибка: VITE_DEEPSEEK_API_KEY не найден в .env файле')
    console.log('💡 Убедитесь, что файл .env содержит: VITE_DEEPSEEK_API_KEY=ваш-ключ')
    process.exit(1)
  }

  console.log('📖 Загрузка индекса лекций...')
  const lecturesData = JSON.parse(
    await fs.readFile(path.join(ROOT, 'src', 'data', 'lectures.json'), 'utf-8')
  )

  const lecturesWithoutAnnotations = lecturesData.lectures.filter(
    l => !l.annotation && l.metadata.hasContent
  )

  if (lecturesWithoutAnnotations.length === 0) {
    console.log('✅ Все лекции уже имеют аннотации!')
    return
  }

  console.log(`\n📝 Найдено ${lecturesWithoutAnnotations.length} лекций без аннотаций`)
  console.log('🚀 Начинаю генерацию аннотаций...\n')

  let success = 0
  let failed = 0

  for (const lecture of lecturesWithoutAnnotations) {
    try {
      console.log(`\n📄 Обработка: ${lecture.title}`)
      console.log(`   Файл: ${lecture.contentFile}`)
      
      const filePath = path.join(ROOT, lecture.contentFile)
      
      // Проверяем наличие файла
      try {
        await fs.access(filePath)
      } catch {
        console.log(`   ⚠️  Файл не найден, пропускаю`)
        failed++
        continue
      }

      // Извлекаем текст
      let content = ''
      if (lecture.contentType === 'docx' || lecture.contentFile.endsWith('.docx')) {
        console.log('   📖 Извлечение текста из .docx...')
        content = await readDocx(filePath)
      } else if (lecture.contentFile.endsWith('.md')) {
        content = await fs.readFile(filePath, 'utf-8')
      } else {
        console.log(`   ⚠️  Неподдерживаемый формат файла`)
        failed++
        continue
      }

      if (!content || content.trim().length < 50) {
        console.log(`   ⚠️  Файл слишком короткий или пустой`)
        failed++
        continue
      }

      console.log(`   📝 Текст извлечен (${content.length} символов)`)
      console.log('   🤖 Генерация аннотации через DeepSeek API...')

      // Генерируем аннотацию
      const annotation = await generateAnnotation(content, lecture.title)
      
      // Обновляем лекцию
      const lectureIndex = lecturesData.lectures.findIndex(l => l.id === lecture.id)
      if (lectureIndex !== -1) {
        lecturesData.lectures[lectureIndex].annotation = annotation
        lecturesData.lectures[lectureIndex].metadata.hasAnnotation = true
        lecturesData.lectures[lectureIndex].metadata.updatedAt = new Date().toISOString()
      }

      console.log(`   ✅ Аннотация создана!`)
      console.log(`   📌 Краткая: ${annotation.short.substring(0, 80)}...`)
      success++

      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`   ❌ Ошибка: ${error.message}`)
      failed++
    }
  }

  // Сохраняем обновленный индекс
  console.log('\n💾 Сохранение результатов...')
  await fs.writeFile(
    path.join(ROOT, 'src', 'data', 'lectures.json'),
    JSON.stringify(lecturesData, null, 2),
    'utf-8'
  )

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Успешно обработано: ${success}`)
  console.log(`❌ Ошибок: ${failed}`)
  console.log(`📊 Всего лекций с аннотациями: ${lecturesData.lectures.filter(l => l.annotation).length}`)
  console.log('='.repeat(50))
}

main().catch(console.error)

