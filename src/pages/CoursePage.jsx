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
    
    // Прокручиваем к началу страницы при загрузке/переходе
    // Используем небольшой таймаут, чтобы React Router успел обновить DOM
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 0)
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
    teal: 'from-teal-500 to-cyan-700',
  }
  const bgGradient = colorClasses[course.color] || colorClasses.blue

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-12"
        style={{ paddingTop: '120px', marginTop: '-120px' }}
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

        {slug === 'digital-humanities' && (
          <Link
            to="/courses/digital-humanities/demo"
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/30 hover:shadow-xl transition-all group mb-2"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100 mb-1">
                Инструменты курса
              </h2>
              <p className="text-sm sm:text-base text-teal-900/80 dark:text-teal-100/80 leading-relaxed">
                Учебные инструменты и корпус текстов к занятиям.
              </p>
            </div>
            <span className="text-teal-700 dark:text-teal-300 font-semibold inline-flex items-center gap-1">
              Открыть
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        )}

        {slug === 'digital-humanities' && (
          <Link
            to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/30 hover:shadow-xl transition-all group mb-2"
          >
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-100 mb-1">
                Корпус: Бунин · «Тёмные аллеи»
              </h2>
              <p className="text-sm sm:text-base text-amber-950/80 dark:text-amber-100/80 leading-relaxed">
                Все 37 рассказов цикла — с оглавлением по частям.
              </p>
            </div>
            <span className="text-amber-800 dark:text-amber-200 font-semibold">Читать →</span>
          </Link>
        )}
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

