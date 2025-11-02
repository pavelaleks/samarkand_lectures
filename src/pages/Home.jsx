import { motion } from 'framer-motion'
import CourseCard from '../components/CourseCard'
import coursesData from '../data/courses.json'

export default function Home() {
  const courses = coursesData.courses

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
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 sm:mb-16"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
          Курсы профессора Павла Алексеева
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Самаркандский государственный университет им. Шарофа Шафирова
        </p>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-500 mt-2 sm:mt-4 italic">
          Три курса, три исследовательские траектории
        </p>
      </motion.div>

      {/* Intro Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card max-w-3xl mx-auto mb-12 text-center"
      >
        <p className="text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          Профессор русской литературы, специализирующийся на имагологии, ориентализме и сравнительных исследованиях.
        </p>
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
