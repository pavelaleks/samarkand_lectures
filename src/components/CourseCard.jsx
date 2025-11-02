import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const colorClasses = {
  green: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
  blue: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
  yellow: 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
}

export default function CourseCard({ course, index }) {
  const bgGradient = colorClasses[course.color] || colorClasses.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-hover"
    >
      <Link to={`/courses/${course.slug}`} className="block h-full">
        <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${bgGradient} mb-6`}></div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          {course.title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-sm sm:text-base">
          {course.description}
        </p>
        <p className="text-gray-500 dark:text-gray-400 italic mb-6 text-xs sm:text-sm">
          {course.descriptionEn}
        </p>
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group">
            <span>Открыть курс</span>
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

