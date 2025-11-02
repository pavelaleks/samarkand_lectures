import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import testsData from '../data/tests.json'
import coursesData from '../data/courses.json'
import Quiz from '../components/Quiz'

export default function Tests() {
  const [searchParams] = useSearchParams()
  const courseSlug = searchParams.get('course')
  const [selectedTest, setSelectedTest] = useState(null)

  const filteredTests = courseSlug
    ? testsData.tests.filter(test => test.courseSlug === courseSlug)
    : testsData.tests

  useEffect(() => {
    if (courseSlug && filteredTests.length > 0) {
      const test = filteredTests[0]
      if (test) setSelectedTest(test.id)
    }
  }, [courseSlug])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          Тесты / Tests
        </h1>
        {courseSlug && (
          <p className="text-gray-600 dark:text-gray-400">
            Курс: {coursesData.courses.find(c => c.slug === courseSlug)?.title}
          </p>
        )}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {filteredTests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card cursor-pointer hover:shadow-xl transition-all ${
              selectedTest === test.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTest(test.id)}
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {test.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {test.description}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2 text-xs">
              {test.questions.length} вопросов
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Quiz test={testsData.tests.find(t => t.id === selectedTest)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

