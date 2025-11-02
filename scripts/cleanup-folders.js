import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

async function cleanupFolders() {
  const courses = ['alternative', 'imagology', 'modern-literature']
  const validNames = ['лекции', 'презентации', 'материалы']
  
  for (const course of courses) {
    const coursePath = path.join(ROOT, 'src', 'data', course)
    
    try {
      const dirs = await fs.readdir(coursePath, { withFileTypes: true })
      
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const dirName = dir.name
          
          // Проверяем, не является ли это правильной папкой
          if (!validNames.includes(dirName)) {
            // Проверяем, начинается ли имя с символа неправильной кодировки
            // Неправильные папки обычно содержат символы типа Р», Рµ и т.д.
            if (dirName.startsWith('Р') || dirName.includes('Р»') || dirName.includes('Рµ')) {
              const fullPath = path.join(coursePath, dirName)
              console.log(`Удаление: ${fullPath}`)
              try {
                await fs.rm(fullPath, { recursive: true, force: true })
                console.log(`✓ Удалено: ${dirName}`)
              } catch (error) {
                console.error(`Ошибка при удалении ${dirName}:`, error.message)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Ошибка в ${course}:`, error.message)
    }
  }
  
  console.log('Готово!')
}

cleanupFolders().catch(console.error)

