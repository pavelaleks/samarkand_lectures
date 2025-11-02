import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const colorClasses = {
  green: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
  blue: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
  yellow: 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
}

export default function CourseCard({ course, index }) {
  const bgGradient = colorClasses[course.color] || colorClasses.blue
  
  // Абстрактные иконки для каждого курса
  const courseIcons = {
    alternative: (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        <circle cx="30" cy="30" r="15" fill="currentColor" opacity="0.8" />
        <circle cx="70" cy="40" r="12" fill="currentColor" opacity="0.6" />
        <rect x="45" y="55" width="20" height="20" rx="4" fill="currentColor" opacity="0.7" />
        <path d="M20 70 Q50 50 80 70" stroke="currentColor" strokeWidth="3" opacity="0.5" fill="none" />
      </svg>
    ),
    imagology: (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        <polygon points="50,20 75,60 25,60" fill="currentColor" opacity="0.7" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.8" />
        <path d="M30 75 L50 55 L70 75" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
      </svg>
    ),
    'modern-literature': (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        <rect x="25" y="20" width="50" height="60" rx="3" fill="currentColor" opacity="0.7" />
        <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <line x1="35" y1="55" x2="60" y2="55" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <circle cx="40" cy="70" r="5" fill="currentColor" opacity="0.6" />
        <circle cx="55" cy="70" r="5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  }
  
  const iconColorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  }
  const iconColor = iconColorClasses[course.color] || iconColorClasses.blue
  const IconComponent = courseIcons[course.slug] || courseIcons.alternative

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-hover relative"
    >
      <Link to={`/courses/${course.slug}`} className="block h-full">
        {/* Декоративная иконка в правом верхнем углу */}
        <div className={`absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 ${iconColor} opacity-60`}>
          {IconComponent}
        </div>
        
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

