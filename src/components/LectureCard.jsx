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
        className="w-full text-left flex justify-between items-center"
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          {index + 1}. {lecture.title}
        </span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              {lecture.annotation && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium mb-1 text-blue-900 dark:text-blue-100">Аннотация:</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{lecture.annotation.short}</p>
                </div>
              )}
              <Link
                to={`/courses/${courseSlug}/lecture/${lecture.id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-2"
              >
                Читать лекцию →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

