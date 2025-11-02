import { useState, useEffect } from 'react'
import { generateAnnotation, batchGenerateAnnotations } from '../utils/deepseekApi'
import lecturesIndex from '../data/lectures.json'

export default function Admin() {
  const [lectures, setLectures] = useState([])
  const [processing, setProcessing] = useState(false)
  const [selectedLectures, setSelectedLectures] = useState(new Set())
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    setLectures(lecturesIndex.lectures || [])
    const savedKey = localStorage.getItem('deepseek_api_key')
    if (savedKey) setApiKey(savedKey)
  }, [])

  const handleApiKeySave = () => {
    localStorage.setItem('deepseek_api_key', apiKey)
    alert('API ключ сохранен (в продакшене используйте .env)')
  }

  const handleGenerateAnnotation = async (lecture) => {
    if (!apiKey) {
      alert('Сначала укажите API ключ')
      return
    }

    try {
      setProcessing(true)
      
      const response = await fetch(`/src/data/${lecture.contentFile}`)
      if (!response.ok) throw new Error('Не удалось загрузить лекцию')
      
      const content = await response.text()
      const annotation = await generateAnnotation(content, lecture.title)
      
      lecture.annotation = annotation
      lecture.metadata.hasAnnotation = true
      lecture.metadata.updatedAt = new Date().toISOString()
      
      setLectures([...lectures])
      
      alert('Аннотация успешно создана!')
    } catch (error) {
      console.error(error)
      alert(`Ошибка: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleBatchGenerate = async () => {
    if (!apiKey) {
      alert('Сначала укажите API ключ')
      return
    }

    if (selectedLectures.size === 0) {
      alert('Выберите лекции для обработки')
      return
    }

    const selected = lectures.filter(l => selectedLectures.has(l.id))
    
    try {
      setProcessing(true)
      
      const lecturesWithContent = await Promise.all(
        selected.map(async (lecture) => {
          const response = await fetch(`/src/data/${lecture.contentFile}`)
          const content = await response.text()
          return { ...lecture, content }
        })
      )
      
      const results = await batchGenerateAnnotations(lecturesWithContent)
      
      results.forEach(result => {
        if (result.success) {
          const lecture = lectures.find(l => l.id === result.lectureId)
          if (lecture) {
            lecture.annotation = result.annotation
            lecture.metadata.hasAnnotation = true
          }
        }
      })
      
      setLectures([...lectures])
      
      const successCount = results.filter(r => r.success).length
      alert(`Обработано: ${successCount}/${results.length}`)
    } catch (error) {
      console.error(error)
      alert(`Ошибка: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelection = (lectureId) => {
    const newSelected = new Set(selectedLectures)
    if (newSelected.has(lectureId)) {
      newSelected.delete(lectureId)
    } else {
      newSelected.add(lectureId)
    }
    setSelectedLectures(newSelected)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Административная панель</h1>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Настройка DeepSeek API</h2>
        <div className="flex gap-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Введите API ключ DeepSeek"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700"
          />
          <button onClick={handleApiKeySave} className="btn-primary">
            Сохранить
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          ⚠️ В продакшене используйте переменные окружения (.env файл)
        </p>
      </div>

      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            Лекции ({selectedLectures.size} выбрано)
          </h2>
          <button
            onClick={handleBatchGenerate}
            disabled={processing || selectedLectures.size === 0}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? 'Обработка...' : `Сгенерировать аннотации (${selectedLectures.size})`}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {lectures.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Лекции не найдены. Запустите скрипт обработки: npm run process-lectures
          </p>
        ) : (
          lectures.map((lecture) => (
            <div key={lecture.id} className="card">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedLectures.has(lecture.id)}
                  onChange={() => toggleSelection(lecture.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{lecture.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lecture.courseSlug} / Лекция {lecture.lectureNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lecture.metadata.hasContent 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700'
                      }`}>
                        {lecture.metadata.hasContent ? 'Есть контент' : 'Нет контента'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lecture.metadata.hasAnnotation 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700'
                      }`}>
                        {lecture.metadata.hasAnnotation ? 'Есть аннотация' : 'Нет аннотации'}
                      </span>
                    </div>
                  </div>

                  {lecture.annotation && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Краткая аннотация:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                        {lecture.annotation.short}
                      </p>
                      <p className="text-sm font-medium mb-2">Ключевые моменты:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                        {lecture.annotation.keyPoints?.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleGenerateAnnotation(lecture)}
                      disabled={processing || !lecture.metadata.hasContent}
                      className="btn-primary disabled:opacity-50"
                    >
                      Сгенерировать аннотацию
                    </button>
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

