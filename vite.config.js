import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Плагин для обслуживания статических файлов из src/data
    {
      name: 'static-files',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Проверяем, запрашивается ли файл из src/data
          // Учитываем base path
          const basePath = '/samarkand_lectures'
          let urlPath = req.url
          
          // Убираем base path если есть
          if (urlPath.startsWith(basePath)) {
            urlPath = urlPath.substring(basePath.length)
          }
          
          if (urlPath && urlPath.startsWith('/src/data/')) {
            // Преобразуем URL путь в файловый путь
            const relativePath = urlPath.substring(1) // убираем ведущий /
            const filePath = resolve(__dirname, relativePath)
            
            // Проверяем существование файла
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              // Определяем MIME тип
              let contentType = 'application/octet-stream'
              if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8'
              if (filePath.endsWith('.pdf')) contentType = 'application/pdf'
              if (filePath.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              if (filePath.endsWith('.doc')) contentType = 'application/msword'
              if (filePath.endsWith('.md')) contentType = 'text/markdown'
              
              // Читаем и отдаём файл
              const fileBuffer = fs.readFileSync(filePath)
              res.setHeader('Content-Type', contentType)
              res.setHeader('Content-Length', fileBuffer.length)
              res.end(fileBuffer)
              return
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
  server: {
    fs: {
      // Разрешаем доступ к файлам лекций
      allow: ['..']
    }
  }
})

