import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import lecturesIndex from '../data/lectures.json'

export default function LecturePage() {
  const { slug, id } = useParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [htmlContent, setHtmlContent] = useState('')

  // Находим лекцию в индексе
  const lecture = lecturesIndex.lectures.find(
    l => l.courseSlug === slug && l.id === id
  )

  // Функция для форматирования текста с сохранением структуры
  const formatTextContent = (text) => {
    if (!text) return ''
    
    const lines = text.split('\n')
    const formatted = []
    let inParagraph = false
    let currentParagraph = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Определяем тип строки
      const isHeading = /^[#]+\s/.test(line) || 
                       /^[А-ЯЁ][А-Яа-яё\s:]{10,}/.test(line) && line.length < 100
      const isEmpty = line === ''
      const isListItem = /^[•\-\*\d+\.]\s/.test(line) || /^[\u2022\u25E6\u25AA]/.test(line)
      const isNumberedItem = /^\d+[\.\)]\s/.test(line)
      
      if (isHeading) {
        // Закрываем предыдущий параграф
        if (currentParagraph.length > 0) {
          formatted.push({ type: 'p', content: currentParagraph.join(' ') })
          currentParagraph = []
        }
        // Добавляем заголовок
        formatted.push({ type: 'h2', content: line.replace(/^[#]+\s*/, '') })
        inParagraph = false
      } else if (isListItem || isNumberedItem) {
        // Закрываем предыдущий параграф
        if (currentParagraph.length > 0) {
          formatted.push({ type: 'p', content: currentParagraph.join(' ') })
          currentParagraph = []
        }
        // Добавляем элемент списка
        formatted.push({ 
          type: 'li', 
          content: line.replace(/^[•\-\*\d+\.\)]\s*/, '').replace(/^[\u2022\u25E6\u25AA]\s*/, '')
        })
        inParagraph = false
      } else if (isEmpty) {
        // Пустая строка - закрываем параграф
        if (currentParagraph.length > 0) {
          formatted.push({ type: 'p', content: currentParagraph.join(' ') })
          currentParagraph = []
        }
        inParagraph = false
      } else {
        // Обычный текст - добавляем в параграф
        currentParagraph.push(line)
        inParagraph = true
      }
    }
    
    // Закрываем последний параграф
    if (currentParagraph.length > 0) {
      formatted.push({ type: 'p', content: currentParagraph.join(' ') })
    }
    
    return formatted
  }

  useEffect(() => {
    const loadLecture = async () => {
      if (!lecture) {
        setError('Лекция не найдена в индексе')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        let filePath = lecture.contentFile
        if (!filePath.startsWith('/src/')) {
          filePath = '/' + filePath
        }

        if (lecture.contentType === 'html' || lecture.contentFile.endsWith('.html')) {
          // Загружаем HTML файл напрямую
          const response = await fetch(filePath)
          if (!response.ok) {
            throw new Error(`Не удалось загрузить файл: ${response.status}`)
          }
          let html = await response.text()
          
          // Если это полный HTML документ, извлекаем только body
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
          if (bodyMatch) {
            html = bodyMatch[1]
          }
          
          // Удаляем doctype, html, head теги если есть
          html = html.replace(/<!DOCTYPE[^>]*>/gi, '')
                     .replace(/<html[^>]*>/gi, '')
                     .replace(/<\/html>/gi, '')
                     .replace(/<head[^>]*>[\s\S]*<\/head>/gi, '')
          
          setHtmlContent(html.trim())
          setContent('') // Используем HTML вместо текста
        } else if (lecture.contentType === 'docx' || lecture.contentFile.endsWith('.docx')) {
          // Загружаем и конвертируем .docx в HTML для лучшего форматирования
          const mammoth = await import('mammoth')
          const response = await fetch(filePath)
          if (!response.ok) {
            throw new Error(`Не удалось загрузить файл: ${response.status}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          
          // Пробуем получить HTML
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
          if (htmlResult.value) {
            setHtmlContent(htmlResult.value)
            setContent('') // Используем HTML вместо текста
          } else {
            // Fallback на текст
            const textResult = await mammoth.extractRawText({ arrayBuffer })
            setContent(textResult.value)
            setHtmlContent('')
          }
        } else {
          // Для .md файлов читаем как текст
          const response = await fetch(filePath)
          if (!response.ok) {
            throw new Error(`Не удалось загрузить файл: ${response.status}`)
          }
          const text = await response.text()
          setContent(text)
          setHtmlContent('')
        }
      } catch (error) {
        console.error('Error loading lecture:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (slug && id && lecture) {
      loadLecture()
    } else if (!lecture) {
      setLoading(false)
      setError('Лекция не найдена')
    }
  }, [slug, id, lecture])

  if (!lecture) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Лекция не найдена</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">ID: {id}, Курс: {slug}</p>
        <Link 
          to={`/courses/${slug}`} 
          className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block text-base sm:text-lg"
        >
          ← Вернуться к курсу
        </Link>
      </div>
    )
  }

  const formattedContent = htmlContent ? null : formatTextContent(content)

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 lg:py-12">
      <Link
        to={`/courses/${slug}`}
        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 sm:mb-6 text-sm sm:text-base transition-colors"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Назад к курсу</span>
      </Link>

      <article className="card prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed
                          prose-p:mb-4 sm:prose-p:mb-5
                          prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl
                          prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:mb-4 sm:prose-h2:mb-5
                          prose-ul:list-disc prose-ul:ml-4 sm:prose-ul:ml-6
                          prose-ol:list-decimal prose-ol:ml-4 sm:prose-ol:ml-6
                          prose-li:my-2 prose-li:text-gray-800 dark:prose-li:text-gray-200">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white leading-tight">
          {lecture.title}
        </h1>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base">Загрузка лекции...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm sm:text-base">{error}</p>
            <pre className="text-xs sm:text-sm text-left bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded overflow-x-auto">
              {content || 'Ошибка загрузки'}
            </pre>
          </div>
        ) : htmlContent ? (
          // Рендерим HTML контент
          <div 
            className="lecture-content prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed
                        prose-p:mb-4 sm:prose-p:mb-5
                        prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl
                        prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:mb-4 sm:prose-h2:mb-5
                        prose-ul:list-disc prose-ul:ml-4 sm:prose-ul:ml-6
                        prose-ol:list-decimal prose-ol:ml-4 sm:prose-ol:ml-6
                        prose-li:my-2 prose-li:text-gray-800 dark:prose-li:text-gray-200
                        prose-a:text-blue-600 dark:prose-a:text-blue-400
                        prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              lineHeight: '1.75',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}
          />
        ) : lecture.contentType !== 'docx' && content.includes('#') ? (
          // Рендерим Markdown
          <div className="lecture-content">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-6 sm:mt-8 mb-4 sm:mb-5 text-gray-900 dark:text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-6 sm:mt-8 mb-4 sm:mb-5 text-gray-900 dark:text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-5 sm:mt-6 mb-3 sm:mb-4 text-gray-900 dark:text-white" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg leading-relaxed text-gray-800 dark:text-gray-200" style={{ lineHeight: '1.75' }} {...props} />,
                ul: ({node, ...props}) => <ul className="ml-4 sm:ml-6 mb-4 sm:mb-5 list-disc space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="ml-4 sm:ml-6 mb-4 sm:mb-5 list-decimal space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-sm sm:text-base text-gray-800 dark:text-gray-200" style={{ lineHeight: '1.6' }} {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 sm:pl-6 my-4 sm:my-5 italic text-gray-700 dark:text-gray-300" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded my-4 sm:my-5 text-xs sm:text-sm font-mono overflow-x-auto" {...props} />
                  ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : formattedContent && formattedContent.length > 0 ? (
          // Рендерим отформатированный текстовый контент
          <div className="lecture-content text-gray-900 dark:text-gray-100">
            {formattedContent.map((item, i) => {
              if (item.type === 'h2') {
                return (
                  <h2 
                    key={i} 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold mt-6 sm:mt-8 mb-4 sm:mb-5 text-gray-900 dark:text-white"
                  >
                    {item.content}
                  </h2>
                )
              } else if (item.type === 'li') {
                return (
                  <li 
                    key={i} 
                    className="ml-4 sm:ml-6 mb-2 text-sm sm:text-base text-gray-800 dark:text-gray-200 list-disc"
                  >
                    {item.content}
                  </li>
                )
              } else {
                return (
                  <p 
                    key={i} 
                    className="mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
                    style={{ lineHeight: '1.75' }}
                  >
                    {item.content}
                  </p>
                )
              }
            })}
          </div>
        ) : (
          // Fallback на простой текст
          <div className="lecture-content text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-relaxed">
            {content.split('\n').map((line, i) => (
              <p 
                key={i} 
                className={`mb-2 sm:mb-3 ${line.trim() === '' ? 'h-2 sm:h-3' : ''}`}
                style={{ lineHeight: '1.75' }}
              >
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        )}

        {(lecture.presentation || (lecture.materials && lecture.materials.length > 0)) && (
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              Дополнительные материалы
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {lecture.presentation && (
                <a
                  href={`/${lecture.presentation.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 sm:gap-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline 
                             px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-green-50 dark:bg-green-900/20 
                             transition-colors text-sm sm:text-base touch-manipulation"
                  style={{ minHeight: '44px' }} // Минимальный размер для touch
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span>Презентация (PDF)</span>
                </a>
              )}
              {lecture.materials && lecture.materials.length > 0 && (
                <div>
                  <p className="text-sm sm:text-base font-medium mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">
                    Материалы:
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {lecture.materials.map((material, idx) => (
                      <a
                        key={idx}
                        href={`/${material.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 
                                   hover:underline px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-purple-50 dark:bg-purple-900/20
                                   transition-colors text-sm sm:text-base touch-manipulation"
                        style={{ minHeight: '44px' }} // Минимальный размер для touch
                      >
                        <span className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span>{material.displayName || material.fileName}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
