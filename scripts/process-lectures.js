import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function findLectures() {
  const courses = ['alternative', 'imagology', 'modern-literature']
  const lectures = []
  
  for (const course of courses) {
    const lecturesDir = path.join(ROOT, 'src', 'data', course, 'лекции')
    const presentationsDir = path.join(ROOT, 'src', 'data', course, 'презентации')
    const materialsDir = path.join(ROOT, 'src', 'data', course, 'материалы')
    
    try {
      // Ищем файлы лекций (.html, .docx, .doc, .md)
      const files = await fs.readdir(lecturesDir)
      const lectureFiles = files.filter(f => 
        f.endsWith('.html') ||
        f.endsWith('.docx') || 
        f.endsWith('.doc') || 
        f.endsWith('.md')
      )
      
      // Ищем презентации
      let presentations = []
      try {
        const presFiles = await fs.readdir(presentationsDir)
        presentations = presFiles.filter(f => f.endsWith('.pdf'))
      } catch {
        // Папка может не существовать
      }
      
      // Ищем материалы
      let materials = []
      try {
        const matFiles = await fs.readdir(materialsDir)
        materials = matFiles.filter(f => f.endsWith('.pdf'))
      } catch {
        // Папка может не существовать
      }
      
      for (const file of lectureFiles) {
        const lectureNumber = file.replace(/\.(html|docx|doc|md)$/, '')
        const filePath = path.join(lecturesDir, file)
        
        // Определяем тип файла
        let contentType = 'text'
        let content = null
        
        if (file.endsWith('.html')) {
          contentType = 'html'
          try {
            content = await fs.readFile(filePath, 'utf-8')
          } catch {
            content = null
          }
        } else if (file.endsWith('.md')) {
          contentType = 'text'
          try {
            content = await fs.readFile(filePath, 'utf-8')
          } catch {
            content = null
          }
        } else if (file.endsWith('.docx') || file.endsWith('.doc')) {
          // Для .docx/.doc файлов только запоминаем путь, контент извлечём через библиотеку
          contentType = 'docx'
        }
        
        // Ищем соответствующую презентацию (по номеру)
        const presentation = presentations.find(p => 
          p.replace(/\.pdf$/, '') === lectureNumber
        )
        
        // Ищем материалы (могут быть с произвольными названиями)
        const lectureMaterials = materials.filter(m => {
          // Проверяем, начинается ли название файла с номера лекции
          const fileName = m.replace(/\.pdf$/, '')
          return fileName.startsWith(lectureNumber)
        })
        
        lectures.push({
          courseSlug: course,
          lectureNumber,
          filePath,
          fileName: file,
          contentType,
          content,
          presentation: presentation ? {
            fileName: presentation,
            path: path.join(presentationsDir, presentation).replace(ROOT, '').replace(/\\/g, '/')
          } : null,
          materials: lectureMaterials.map(m => ({
            fileName: m,
            displayName: m.replace(/\.pdf$/i, '').replace(/^\d+\s*[-_]\s*/, ''),
            path: path.join(materialsDir, m).replace(ROOT, '').replace(/\\/g, '/')
          }))
        })
      }
    } catch (error) {
      console.log(`Директория ${lecturesDir} не найдена, пропускаю`)
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
  const foundLectures = await findLectures()
  console.log(`Найдено ${foundLectures.length} лекций`)
  
  console.log('📖 Загрузка индекса...')
  const indexData = await readLecturesIndex()
  const existingLectures = new Map(
    indexData.lectures.map(l => [`${l.courseSlug}-${l.lectureNumber}`, l])
  )
  
  // Загружаем заголовки из courses.json
  const coursesData = JSON.parse(
    await fs.readFile(path.join(ROOT, 'src', 'data', 'courses.json'), 'utf-8')
  )
  const titleMap = new Map()
  for (const course of coursesData.courses) {
    for (const lecture of course.lectures || []) {
      titleMap.set(`${course.slug}-${lecture.id}`, lecture.title)
    }
  }
  
  // Добавляем только НОВЫЕ лекции, существующие не трогаем
  let added = 0
  let skipped = 0
  
  for (const lecture of foundLectures) {
    const key = `${lecture.courseSlug}-${lecture.lectureNumber}`
    
    // Если лекция уже существует - пропускаем
    if (existingLectures.has(key)) {
      const existing = existingLectures.get(key)
      // Обновляем только презентации и материалы, если они добавились
      const hasNewPresentation = lecture.presentation && !existing.presentation
      const hasNewMaterials = lecture.materials.length > (existing.materials?.length || 0)
      
      if (hasNewPresentation || hasNewMaterials) {
        if (hasNewPresentation) {
          existing.presentation = lecture.presentation
          existing.metadata.hasPresentation = true
        }
        if (hasNewMaterials) {
          existing.materials = lecture.materials
          existing.metadata.materialsCount = lecture.materials.length
        }
        existing.metadata.updatedAt = new Date().toISOString()
        console.log(`↻ Обновлены материалы для лекции: ${existing.title}`)
      } else {
        skipped++
      }
      continue
    }
    
    // Для новых лекций берём заголовок из courses.json или дефолтный
    const title = titleMap.get(`${lecture.courseSlug}-${lecture.lectureNumber}`) 
      || `Лекция ${lecture.lectureNumber}`
    
    const lectureData = {
      id: `${lecture.courseSlug}-${lecture.lectureNumber}`,
      courseSlug: lecture.courseSlug,
      lectureNumber: lecture.lectureNumber,
      title,
      contentFile: `src/data/${lecture.courseSlug}/лекции/${lecture.fileName}`,
      contentType: lecture.contentType === 'html' ? 'html' : lecture.contentType === 'docx' ? 'docx' : 'text',
      presentation: lecture.presentation || null,
      materials: lecture.materials || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
        hasContent: true,
        hasPresentation: !!lecture.presentation,
        materialsCount: lecture.materials.length
      }
    }
    
    existingLectures.set(key, lectureData)
    console.log(`➕ Добавлена новая лекция: ${title}`)
    added++
  }
  
  // Сохраняем обновленный индекс
  indexData.lectures = Array.from(existingLectures.values())
  await updateLecturesIndex(indexData)
  
  console.log(`\n✅ Индекс обновлен:`)
  console.log(`   ➕ Добавлено новых: ${added}`)
  console.log(`   ⏭️  Пропущено (уже есть): ${skipped}`)
  console.log(`   📚 Всего лекций в индексе: ${indexData.lectures.length}`)
}

main().catch(console.error)

