import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function updateTitles() {
  const coursesData = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'courses.json'), 'utf-8'))
  const lecturesData = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'lectures.json'), 'utf-8'))
  
  // Находим курс alternative
  const alternativeCourse = coursesData.courses.find(c => c.slug === 'alternative')
  if (!alternativeCourse) {
    console.log('Курс alternative не найден')
    return
  }
  
  // Создаём карту: lectureNumber -> title для курса alternative
  // Учитываем, что ID в courses.json может быть "01", "02", а в лекциях "1", "2"
  const titlesMap = new Map()
  for (const lecture of alternativeCourse.lectures || []) {
    // Нормализуем ID (убираем ведущие нули)
    const normalizedId = parseInt(lecture.id, 10).toString()
    titlesMap.set(normalizedId, lecture.title)
    // Также добавляем с оригинальным ID на случай разных форматов
    titlesMap.set(lecture.id, lecture.title)
  }
  
  // Обновляем заголовки для лекций курса alternative
  let updated = 0
  for (const lecture of lecturesData.lectures) {
    if (lecture.courseSlug === 'alternative') {
      // Пробуем найти заголовок по номеру лекции
      const correctTitle = titlesMap.get(lecture.lectureNumber) || titlesMap.get(lecture.lectureNumber.padStart(2, '0'))
      if (correctTitle && lecture.title !== correctTitle) {
        console.log(`📝 Лекция ${lecture.lectureNumber}: "${lecture.title}" -> "${correctTitle}"`)
        lecture.title = correctTitle
        updated++
      }
    }
  }
  
  await fs.writeFile(
    path.join(ROOT, 'src', 'data', 'lectures.json'),
    JSON.stringify(lecturesData, null, 2),
    'utf-8'
  )
  
  console.log(`\n✅ Обновлено заголовков для курса alternative: ${updated}`)
  console.log(`📚 Всего лекций в индексе: ${lecturesData.lectures.length}`)
}

updateTitles().catch(console.error)
