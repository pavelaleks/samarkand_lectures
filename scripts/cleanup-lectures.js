import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function cleanupLectures() {
  const indexPath = path.join(ROOT, 'src', 'data', 'lectures.json')
  const lecturesData = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
  
  // Удаляем все лекции из modern-literature
  const beforeCount = lecturesData.lectures.length
  lecturesData.lectures = lecturesData.lectures.filter(
    lecture => lecture.courseSlug !== 'modern-literature'
  )
  const afterCount = lecturesData.lectures.length
  const removed = beforeCount - afterCount
  
  console.log(`🗑️  Удалено лекций из modern-literature: ${removed}`)
  
  // Также удаляем все лекции из alternative, чтобы перезаписать их заново
  const beforeAlt = lecturesData.lectures.length
  lecturesData.lectures = lecturesData.lectures.filter(
    lecture => lecture.courseSlug !== 'alternative'
  )
  const afterAlt = lecturesData.lectures.length
  const removedAlt = beforeAlt - afterAlt
  
  console.log(`🗑️  Удалено лекций из alternative (для перезаписи): ${removedAlt}`)
  console.log(`📚 Осталось лекций в индексе: ${afterAlt}`)
  
  // Сохраняем обновленный индекс
  await fs.writeFile(
    indexPath,
    JSON.stringify(lecturesData, null, 2),
    'utf-8'
  )
  
  console.log('✅ Индекс очищен. Теперь запустите: npm run process-lectures')
}

cleanupLectures().catch(console.error)

