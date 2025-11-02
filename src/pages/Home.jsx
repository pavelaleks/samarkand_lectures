import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CourseCard from '../components/CourseCard'
import coursesData from '../data/courses.json'

export default function Home() {
  const courses = coursesData.courses
  const [isInstructorOpen, setIsInstructorOpen] = useState(false)

  if (!courses || courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ошибка загрузки курсов
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Не удалось загрузить данные курсов
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* About Instructor Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card max-w-4xl mx-auto mb-12"
      >
        <button
          onClick={() => setIsInstructorOpen(!isInstructorOpen)}
          className="w-full flex items-center justify-between gap-4 py-2 touch-manipulation"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            О преподавателе
          </h2>
          <svg
            className={`w-6 h-6 flex-shrink-0 transform transition-transform duration-200 ${
              isInstructorOpen ? 'rotate-180' : ''
            } text-gray-500 dark:text-gray-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <AnimatePresence>
          {isInstructorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
                    <strong>Павел Викторович Алексеев</strong> — доктор филологических наук, профессор. 
                    Специализируется на имагологии, русском ориентализме, сравнительных литературных исследованиях 
                    и литературе путешествий.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start items-center">
                    <a
                      href="https://palekseev.ru/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Персональный сайт
                    </a>
                    <a
                      href="https://gasu.academia.edu/PavelAlekseev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      Публикации на Academia.edu
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {courses.map((course, index) => (
          <CourseCard key={course.slug} course={course} index={index} />
        ))}
      </div>
    </div>
  )
}
