import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function LectureCard({ lecture, courseSlug, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="card hover:shadow-xl transition-shadow"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center gap-3 py-2 sm:py-3 touch-manipulation"
        style={{ minHeight: '48px' }} // Минимальный размер для touch
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight flex-1">
          {index + 1}. {lecture.title}
        </span>
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transform transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-500 dark:text-gray-400`}
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-3">
                <Link
                  to={`/courses/${courseSlug}/lecture/${lecture.id}`}
                  className="inline-flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                             hover:underline px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 
                             transition-colors text-sm sm:text-base touch-manipulation font-medium"
                  style={{ minHeight: '44px' }} // Минимальный размер для touch
                >
                  <span>Читать лекцию</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                {lecture.presentation && (
                  <a
                    href={`/${lecture.presentation.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 
                               hover:underline px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-green-50 dark:bg-green-900/20 
                               transition-colors text-sm sm:text-base touch-manipulation"
                    style={{ minHeight: '44px' }} // Минимальный размер для touch
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span>Презентация</span>
                  </a>
                )}
              </div>
              
              {lecture.materials && lecture.materials.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">Материалы:</p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                    {lecture.materials.map((material, idx) => (
                      <a
                        key={idx}
                        href={`/${material.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm sm:text-base text-purple-600 dark:text-purple-400 
                                   hover:text-purple-700 dark:hover:text-purple-300 hover:underline px-3 sm:px-4 py-2 sm:py-3 
                                   rounded-lg bg-purple-50 dark:bg-purple-900/20 transition-colors touch-manipulation"
                        style={{ minHeight: '44px' }} // Минимальный размер для touch
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="break-words">{material.displayName || material.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

