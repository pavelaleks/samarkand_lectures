import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function removeAnnotations() {
  const lecturesData = JSON.parse(
    await fs.readFile(path.join(ROOT, 'src', 'data', 'lectures.json'), 'utf-8')
  )
  
  let cleaned = 0
  for (const lecture of lecturesData.lectures) {
    if (lecture.annotation) {
      lecture.annotation = null
      lecture.metadata.hasAnnotation = false
      cleaned++
    }
  }
  
  await fs.writeFile(
    path.join(ROOT, 'src', 'data', 'lectures.json'),
    JSON.stringify(lecturesData, null, 2),
    'utf-8'
  )
  
  console.log(`✅ Удалено аннотаций: ${cleaned}`)
  console.log('Все лекции очищены от AI-аннотаций')
}

removeAnnotations().catch(console.error)

