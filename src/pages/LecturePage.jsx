import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import coursesData from '../data/courses.json'

export default function LecturePage() {
  const { slug, id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const course = coursesData.courses.find(c => c.slug === slug)
  const lecture = course?.lectures.find(l => l.id === id)

  useEffect(() => {
    const loadLecture = async () => {
      try {
        const response = await fetch(`/src/data/${slug}/${id}.md`)
        if (!response.ok) {
          throw new Error('Лекция не найдена')
        }
        const text = await response.text()
        setContent(text)
      } catch (error) {
        console.error('Error loading lecture:', error)
        setContent('# Ошибка загрузки\n\nЛекция не найдена.')
      } finally {
        setLoading(false)
      }
    }

    if (slug && id) {
      loadLecture()
    }
  }, [slug, id])

  if (!lecture) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">Лекция не найдена</h2>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Вернуться на главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to={`/courses/${slug}`}
        className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Назад к курсу
      </Link>

      <article className="card prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">
          {lecture.title}
        </h1>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </article>
    </div>
  )
}

