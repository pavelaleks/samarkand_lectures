import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function findMarkdownFiles() {
  const courses = ['alternative', 'imagology', 'modern-literature']
  const lectures = []
  
  for (const course of courses) {
    const courseDir = path.join(ROOT, 'src', 'data', course)
    
    try {
      const files = await fs.readdir(courseDir)
      const mdFiles = files.filter(f => f.endsWith('.md'))
      
      for (const file of mdFiles) {
        const filePath = path.join(courseDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const lectureNumber = file.replace('.md', '')
        
        lectures.push({
          courseSlug: course,
          lectureNumber,
          filePath,
          content,
          fileName: file
        })
      }
    } catch (error) {
      console.log(`Директория ${courseDir} не найдена, пропускаю`)
    }
  }
  
  return lectures
}

async function readLecturesIndex() {
  try {
    const indexPath = path.join(ROOT, 'src', 'data', 'lectures.json')
    const content = await fs.readFile(indexPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { lectures: [] }
  }
}

async function updateLecturesIndex(lecturesData) {
  const indexPath = path.join(ROOT, 'src', 'data', 'lectures.json')
  await fs.writeFile(
    indexPath,
    JSON.stringify(lecturesData, null, 2),
    'utf-8'
  )
}

async function main() {
  console.log('🔍 Поиск файлов лекций...')
  const foundLectures = await findMarkdownFiles()
  console.log(`Найдено ${foundLectures.length} лекций`)
  
  console.log('📖 Загрузка индекса...')
  const indexData = await readLecturesIndex()
  const existingLectures = new Map(
    indexData.lectures.map(l => [`${l.courseSlug}-${l.lectureNumber}`, l])
  )
  
  // Добавляем новые или обновляем существующие
  for (const lecture of foundLectures) {
    const key = `${lecture.courseSlug}-${lecture.lectureNumber}`
    
    if (!existingLectures.has(key)) {
      // Извлекаем заголовок из первой строки markdown
      const firstLine = lecture.content.split('\n')[0]
      const title = firstLine.replace(/^#+\s*/, '').trim() || 
                    `Лекция ${lecture.lectureNumber}`
      
      const newLecture = {
        id: key,
        courseSlug: lecture.courseSlug,
        lectureNumber: lecture.lectureNumber,
        title,
        contentFile: `${lecture.courseSlug}/${lecture.fileName}`,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "draft",
          hasContent: true,
          hasAnnotation: false
        },
        annotation: null
      }
      
      existingLectures.set(key, newLecture)
      console.log(`➕ Добавлена новая лекция: ${title}`)
    } else {
      // Обновляем метаданные существующей
      const existing = existingLectures.get(key)
      existing.metadata.updatedAt = new Date().toISOString()
      existing.metadata.hasContent = true
      console.log(`↻ Обновлена лекция: ${existing.title}`)
    }
  }
  
  // Сохраняем обновленный индекс
  indexData.lectures = Array.from(existingLectures.values())
  await updateLecturesIndex(indexData)
  
  console.log(`✅ Индекс обновлен. Всего лекций: ${indexData.lectures.length}`)
  console.log('\n📝 Лекции готовы к обработке через API')
}

main().catch(console.error)

