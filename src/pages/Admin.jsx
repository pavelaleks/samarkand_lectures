import { useState, useEffect } from 'react'
import lecturesIndex from '../data/lectures.json'

export default function Admin() {
  const [lectures, setLectures] = useState([])

  useEffect(() => {
    setLectures(lecturesIndex.lectures || [])
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Административная панель</h1>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Инструкция</h2>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            <strong>1. Добавление новых лекций:</strong> Поместите файлы в папки:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">src/data/[курс]/лекции/</code> — файлы лекций (.docx, .md)</li>
            <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">src/data/[курс]/презентации/</code> — презентации (.pdf)</li>
            <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">src/data/[курс]/материалы/</code> — дополнительные материалы (.pdf)</li>
          </ul>
          <p>
            <strong>2. Обновление индекса:</strong> После добавления файлов запустите:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
            npm run process-lectures
          </pre>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ⚠️ Скрипт автоматически добавит только новые лекции, не изменяя существующие.
          </p>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Лекции ({lectures.length})
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Статус всех лекций в системе
        </p>
      </div>

      <div className="space-y-4">
        {lectures.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Лекции не найдены. Запустите скрипт обработки: <code>npm run process-lectures</code>
          </p>
        ) : (
          lectures.map((lecture) => (
            <div key={lecture.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{lecture.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lecture.courseSlug} / Лекция {lecture.lectureNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Файл: {lecture.contentFile}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lecture.metadata.hasContent 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700'
                      }`}>
                        {lecture.metadata.hasContent ? '✓ Контент' : '✗ Нет контента'}
                      </span>
                      {lecture.metadata.hasPresentation && (
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700">
                          ✓ Презентация
                        </span>
                      )}
                      {lecture.metadata.materialsCount > 0 && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">
                          Материалов: {lecture.metadata.materialsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 text-sm">
                    {lecture.presentation && (
                      <a
                        href={`/${lecture.presentation.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
                        📄 Презентация
                      </a>
                    )}
                    {lecture.materials && lecture.materials.length > 0 && (
                      <div className="flex gap-2">
                        {lecture.materials.map((material, idx) => (
                          <a
                            key={idx}
                            href={`/${material.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            📚 {material.displayName || material.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
