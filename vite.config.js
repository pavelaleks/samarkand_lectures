import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'

// Функция для копирования директории
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }
  const entries = readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    // Плагин для копирования статических файлов при сборке
    {
      name: 'copy-static-files',
      closeBundle() {
        const dataDir = resolve(__dirname, 'src', 'data')
        const distDataDir = resolve(__dirname, 'dist', 'src', 'data')
        
        if (fs.existsSync(dataDir)) {
          copyDir(dataDir, distDataDir)
          console.log('✅ Скопированы файлы из src/data в dist/src/data')
        }
        
        // Копируем 404.html для GitHub Pages SPA routing
        const public404 = resolve(__dirname, 'public', '404.html')
        const dist404 = resolve(__dirname, 'dist', '404.html')
        if (fs.existsSync(public404)) {
          copyFileSync(public404, dist404)
          console.log('✅ Скопирован 404.html')
        }
      }
    },
    // Плагин для обслуживания статических файлов в dev режиме
    {
      name: 'static-files',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          let urlPath = req.url || ''
          
          if (urlPath.includes('?')) {
            urlPath = urlPath.split('?')[0]
          }
          
          // Декодируем URL для обработки кириллицы
          try {
            urlPath = decodeURIComponent(urlPath)
          } catch {
            // Если декодирование не удалось, используем как есть
          }
          
          const basePath = '/samarkand_lectures'
          if (urlPath.startsWith(basePath + '/')) {
            urlPath = urlPath.substring(basePath.length)
          } else if (urlPath.startsWith(basePath)) {
            urlPath = urlPath.substring(basePath.length)
          }
          
          // Пропускаем JSON файлы - они должны обрабатываться Vite как модули
          if (urlPath.endsWith('.json') && !urlPath.includes('/src/data/')) {
            next()
            return
          }
          
          if (urlPath && urlPath.includes('src/data/')) {
            let relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath
            const idx = relativePath.indexOf('src/data/')
            if (idx >= 0) {
              relativePath = relativePath.substring(idx)
            }
            
            const filePath = resolve(__dirname, relativePath)
            
            // Логирование для отладки
            if (filePath.includes('.html') || filePath.includes('.pdf')) {
              console.log('📄 Попытка загрузки:', filePath, '| Существует:', fs.existsSync(filePath))
            }
            
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath)
              if (stats.isFile()) {
                // Не обрабатываем JSON - пусть Vite обрабатывает
                if (filePath.endsWith('.json')) {
                  next()
                  return
                }
                
                let contentType = 'application/octet-stream'
                if (filePath.endsWith('.pdf')) contentType = 'application/pdf'
                if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8'
                if (filePath.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                if (filePath.endsWith('.doc')) contentType = 'application/msword'
                if (filePath.endsWith('.md')) contentType = 'text/markdown'
                
                try {
                  const fileBuffer = fs.readFileSync(filePath)
                  res.setHeader('Content-Type', contentType)
                  res.setHeader('Content-Length', fileBuffer.length)
                  res.setHeader('Cache-Control', 'no-cache')
                  res.end(fileBuffer)
                  return
                } catch (err) {
                  console.error('Ошибка чтения файла:', filePath, err.message)
                }
              }
            }
          }
          
          next()
        })
      }
    }
  ],
  base: '/samarkand_lectures/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
})
