import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LectureCard({ lecture, courseSlug, index }) {
  const [isOpen, setIsOpen] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [loadingHtml, setLoadingHtml] = useState(false)

  // Загружаем HTML контент когда карточка открывается
  useEffect(() => {
    if (isOpen && lecture.htmlFile && !htmlContent) {
      setLoadingHtml(true)
      // Путь к HTML файлу с учетом base URL
      const baseUrl = import.meta.env.BASE_URL || '/samarkand_lectures/'
      const htmlPath = `${baseUrl}${lecture.htmlFile}`
      console.log('Загрузка HTML:', htmlPath)
      fetch(htmlPath)
        .then(res => {
          if (!res.ok) throw new Error('HTML файл не найден')
          return res.text()
        })
        .then(html => {
          // Извлекаем только содержимое body, если это полный HTML документ
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
          if (bodyMatch) {
            setHtmlContent(bodyMatch[1])
          } else {
            setHtmlContent(html)
          }
        })
        .catch(err => {
          console.error('Ошибка загрузки HTML:', err)
          setHtmlContent('<p class="text-red-500">Ошибка загрузки лекции</p>')
        })
        .finally(() => setLoadingHtml(false))
    }
  }, [isOpen, lecture.htmlFile, htmlContent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="card hover:shadow-2xl transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center gap-4 py-3 touch-manipulation"
        style={{ minHeight: '56px' }}
      >
        <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight flex-1">
          {lecture.number && `${lecture.number}. `}
          {lecture.title}
        </span>
        <svg
          className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } text-gray-500 dark:text-gray-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* PDF Presentation */}
              {lecture.presentationPdf && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Презентация (PDF)
                  </h3>
                  <a
                    href={`${import.meta.env.BASE_URL || '/samarkand_lectures/'}${lecture.presentationPdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-800/30 rounded-xl hover:shadow-lg transition-all duration-200 group"
                    style={{ minHeight: '64px' }}
                  >
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="flex-1 text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      Открыть презентацию PDF
                    </span>
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* HTML Lecture Content */}
              {lecture.htmlFile && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Лекция
                  </h3>
                  <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {loadingHtml ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : htmlContent ? (
                      <div 
                        className="lecture-html-content p-6 sm:p-8 prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none
                          prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed
                          prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl
                          prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:mb-4 sm:prose-h2:mb-5
                          prose-ul:list-disc prose-ul:ml-4 sm:prose-ul:ml-6
                          prose-ol:list-decimal prose-ol:ml-4 sm:prose-ol:ml-6
                          prose-li:my-2 prose-li:text-gray-800 dark:prose-li:text-gray-200
                          prose-a:text-blue-600 dark:prose-a:text-blue-400
                          prose-img:rounded-lg prose-img:shadow-lg prose-img:max-w-full
                          prose-table:w-full prose-table:border-collapse
                          prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:p-2
                          prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:p-2"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    ) : (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Нажмите для загрузки лекции
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gamma Presentation (если нет HTML) */}
              {!lecture.htmlFile && lecture.gammaUrl && (() => {
                // Преобразуем URL в правильный формат для открытия
                let presentationUrl = lecture.gammaUrl
                
                // Если это embed URL, преобразуем в обычный
                if (lecture.gammaUrl.includes('/embed/')) {
                  const embedId = lecture.gammaUrl.split('/embed/')[1]?.split('?')[0]
                  if (embedId) {
                    presentationUrl = `https://gamma.app/docs/-${embedId}`
                  }
                }
                // Если это уже /docs/- формат, используем как есть
                
                return (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Презентация
                    </h3>
                    <a
                      href={presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 group cursor-pointer"
                      style={{ height: '450px' }}
                    >
                      <div className="h-full w-full flex flex-col items-center justify-center relative p-8">
                        {/* Фон с градиентом */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* Содержимое */}
                        <div className="relative z-10 text-center">
                          {/* Иконка презентации */}
                          <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                            <svg 
                              className="w-28 h-28 mx-auto text-blue-600 dark:text-blue-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                              />
                            </svg>
                          </div>
                          
                          {/* Текст */}
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Интерактивная презентация
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Нажмите для просмотра презентации
                          </p>
                          
                          {/* Кнопка */}
                          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                            <span>Открыть презентацию</span>
                            <svg 
                              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )
              })()}

              {/* PDF Materials */}
              {lecture.materials && lecture.materials.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Дополнительные материалы
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Статьи, книги и другие материалы для изучения
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lecture.materials.map((material, idx) => (
                      <a
                        key={idx}
                        href={`${import.meta.env.BASE_URL || '/samarkand_lectures/'}${material.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl hover:shadow-lg transition-all duration-200 group border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600"
                        style={{ minHeight: '72px' }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
                            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {material.displayName || material.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF документ</p>
                        </div>
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state - только если нет вообще никаких материалов */}
              {!lecture.presentationPdf && !lecture.htmlFile && !lecture.gammaUrl && (!lecture.materials || lecture.materials.length === 0) && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                    Материалы для этой лекции пока не добавлены
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

