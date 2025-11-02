import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LectureCard from '../components/LectureCard'
import coursesData from '../data/courses.json'
import lecturesIndex from '../data/lectures.json'
import { useLanguage } from '../contexts/LanguageContext'

export default function CoursePage() {
  const { slug } = useParams()
  const { t } = useLanguage()
  const [lectures, setLectures] = useState([])
  const course = coursesData.courses.find(c => c.slug === slug)
  
  useEffect(() => {
    // Загружаем лекции из индекса для текущего курса
    const courseLectures = lecturesIndex.lectures
      .filter(l => l.courseSlug === slug)
      .sort((a, b) => a.lectureNumber.localeCompare(b.lectureNumber, undefined, { numeric: true }))
    
    setLectures(courseLectures)
  }, [slug])

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">Курс не найден</h2>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Вернуться на главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          to="/"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Назад
        </Link>
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {course.title}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {course.description}
        </p>
        <p className="text-gray-600 dark:text-gray-400 italic mb-6">
          {course.descriptionEn}
        </p>
        <Link
          to={`/tests?course=${slug}`}
          className="btn-primary inline-block"
        >
          {t('takeTest')}
        </Link>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Лекции ({lectures.length > 0 ? lectures.length : course.lectures.length})
        </h2>
        {lectures.length > 0 ? (
          lectures.map((lecture, index) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              courseSlug={slug}
              index={index}
            />
          ))
        ) : (
          // Fallback к статическим данным, если индекс пуст
          course.lectures.map((lecture, index) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              courseSlug={slug}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  )
}

