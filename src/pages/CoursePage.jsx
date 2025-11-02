import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LectureCard from '../components/LectureCard'
import coursesData from '../data/courses.json'
import lecturesIndex from '../data/lectures.json'

export default function CoursePage() {
  const { slug } = useParams()
  const [lectures, setLectures] = useState([])
  const course = coursesData.courses.find(c => c.slug === slug)
  
  useEffect(() => {
    const courseLectures = lecturesIndex.lectures
      .filter(l => l.courseSlug === slug)
      .sort((a, b) => {
        const numA = parseInt(a.number) || 0
        const numB = parseInt(b.number) || 0
        return numA - numB
      })
    
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

  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    yellow: 'from-yellow-500 to-amber-600',
  }
  const bgGradient = colorClasses[course.color] || colorClasses.blue

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8 sm:pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-12"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mb-6 transition-all duration-200 font-medium text-base sm:text-lg group"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Назад к курсам</span>
        </Link>
        
        <div className={`h-3 rounded-2xl bg-gradient-to-r ${bgGradient} mb-6`}></div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
          {course.title}
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {course.description}
        </p>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 italic mb-6">
          {course.descriptionEn}
        </p>
      </motion.div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">
          Содержание курса {lectures.length > 0 && `(${lectures.length})`}
        </h2>
        
        {lectures.length > 0 ? (
          lectures.map((lecture, index) => (
            <LectureCard
              key={lecture.id || `${lecture.courseSlug}-${lecture.number}`}
              lecture={lecture}
              courseSlug={slug}
              index={index}
            />
          ))
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Лекции пока не добавлены. Добавьте файлы в папку <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">src/data/{slug}/лекции/</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

