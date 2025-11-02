import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'

export default function CourseCard({ course, color }) {
  const { t } = useLanguage()
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card border-2 ${colorClasses[color]}`}
    >
      <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
        {course.title}
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {course.description}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
        {course.descriptionEn}
      </p>
      <Link
        to={`/courses/${course.slug}`}
        className="btn-primary inline-block text-center w-full"
      >
        {t('openCourse')}
      </Link>
    </motion.div>
  )
}

