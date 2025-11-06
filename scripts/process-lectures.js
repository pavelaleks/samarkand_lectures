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
    
    try {
      const files = await fs.readdir(lecturesDir)
      const jsonFiles = files.filter(f => f.endsWith('.json'))
      
      for (const file of jsonFiles) {
        const filePath = path.join(lecturesDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const lectureData = JSON.parse(content)
        const lectureNumber = lectureData.number || file.replace('.json', '')
        
        // Ищем HTML файл для этой лекции
        let htmlFile = null
        const htmlFileName = `${lectureNumber}.html`
        const htmlFilePath = path.join(lecturesDir, htmlFileName)
        try {
          await fs.access(htmlFilePath)
          htmlFile = `src/data/${course}/лекции/${htmlFileName}`.replace(/\\/g, '/')
        } catch {
          // HTML файл не найден, это нормально
        }
        
        // Ищем PDF презентацию для этой лекции
        let presentationPdf = null
        const courseDir = path.join(ROOT, 'src', 'data', course)
        try {
          // Простой подход: ищем во всех папках PDF файлы с нужным номером
          const courseFiles = await fs.readdir(courseDir, { withFileTypes: true })
          const num = lectureNumber.toString()
          const numPadded = num.padStart(2, '0')
          
          // Сначала ищем папку с названием похожим на "презентации"
          let presentationsDirEntry = courseFiles.find(item => 
            item.isDirectory() && (
              item.name === 'презентации' ||
              item.name.toLowerCase().includes('презентац') ||
              item.name.toLowerCase().includes('presentation')
            )
          )
          
          // Если не нашли, ищем любую папку с PDF файлами
          if (!presentationsDirEntry) {
            for (const item of courseFiles) {
              if (item.isDirectory() && item.name !== 'лекции' && item.name !== 'материалы') {
                const dirPath = path.join(courseDir, item.name)
                try {
                  const files = await fs.readdir(dirPath)
                  const hasPdf = files.some(f => f.endsWith('.pdf'))
                  if (hasPdf) {
                    presentationsDirEntry = item
                    break
                  }
                } catch {
                  // Игнорируем
                }
              }
            }
          }
          
          if (presentationsDirEntry) {
            const presentationsDir = path.join(courseDir, presentationsDirEntry.name)
            const presFiles = await fs.readdir(presentationsDir)
            const presFile = presFiles.find(f => {
              if (!f.toLowerCase().endsWith('.pdf')) return false
              const baseName = f.replace(/\.pdf$/i, '').toLowerCase()
              // Проверяем: "1", "01", "1_что-то", начинается с "1_" или "01_"
              return baseName === num || 
                     baseName === numPadded ||
                     baseName.startsWith(`${num}_`) ||
                     baseName.startsWith(`${numPadded}_`) ||
                     f.startsWith(`${num}.`) ||
                     f.startsWith(`${numPadded}.`) ||
                     f.startsWith(`${num}_`) ||
                     f.startsWith(`${numPadded}_`)
            })
            if (presFile) {
              presentationPdf = `src/data/${course}/${presentationsDirEntry.name}/${presFile}`.replace(/\\/g, '/')
              console.log(`  ✓ Найдена презентация: ${presFile} для лекции ${lectureNumber}`)
            }
          }
        } catch (err) {
          console.error(`Ошибка поиска презентации для лекции ${lectureNumber}:`, err.message)
        }
        
        // Ищем PDF материалы для этой лекции
        const materialsDir = path.join(ROOT, 'src', 'data', course, 'материалы')
        let materials = []
        try {
          const matFiles = await fs.readdir(materialsDir)
          // Создаем регулярное выражение для точного совпадения номера лекции
          // Проверяем, что файл начинается с номера лекции, за которым следует разделитель (_, -, или пробел)
          // Важно: после номера НЕ должно быть цифры (чтобы "10_" не совпадало с "1")
          const lectureNum = lectureNumber.toString()
          // Экранируем специальные символы regex в номере лекции
          const escapedNum = lectureNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Регулярка: начало строки + номер + (разделитель без цифры после ИЛИ .pdf в конце)
          // Используем границу слова или проверку: после номера идет разделитель, а не цифра
          // Это гарантирует, что "10_" не совпадет с "1", а "1_test.pdf" совпадет
          const lectureRegex = new RegExp(`^${escapedNum}(?![0-9])([-_\\s]|\\.pdf$)`, 'i')
          
          materials = matFiles
            .filter(m => {
              if (!m.toLowerCase().endsWith('.pdf')) return false
              // Проверяем точное совпадение: номер лекции + разделитель или сразу .pdf
              // И убеждаемся, что после номера не идет еще одна цифра
              return lectureRegex.test(m)
            })
            .map(m => ({
              fileName: m,
              displayName: m.replace(/^\d+[-_\s]+/, '').replace(/\.pdf$/i, ''),
              path: `src/data/${course}/материалы/${m}`.replace(/\\/g, '/')
            }))
        } catch {
          // Папка может не существовать
        }
        
        lectures.push({
          courseSlug: course,
          ...lectureData,
          htmlFile,
          presentationPdf,
          materials
        })
      }
    } catch {
      // Директория может не существовать
    }
  }
  
  return lectures
}

async function updateLecturesIndex(lecturesData) {
  const indexPath = path.join(ROOT, 'src', 'data', 'lectures.json')
  
  // Убеждаемся, что директория существует
  const dataDir = path.dirname(indexPath)
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (err) {
    // Директория уже существует, это нормально
  }
  
  // Записываем файл
  try {
    await fs.writeFile(
      indexPath,
      JSON.stringify(lecturesData, null, 2),
      'utf-8'
    )
    console.log(`📝 Индекс записан: ${indexPath}`)
  } catch (err) {
    console.error('❌ Ошибка записи файла:', err.message)
    console.error('Путь:', indexPath)
    throw err
  }
}

async function main() {
  console.log('🔍 Поиск лекций...')
  const lectures = await findLectures()
  console.log(`Найдено ${lectures.length} лекций`)
  
  const lecturesData = { lectures }
  await updateLecturesIndex(lecturesData)
  
  console.log(`✅ Индекс обновлен. Всего лекций: ${lectures.length}`)
}

main().catch(console.error)

