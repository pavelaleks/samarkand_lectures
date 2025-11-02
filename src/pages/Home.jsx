import { motion } from 'framer-motion'
import CourseCard from '../components/CourseCard'
import coursesData from '../data/courses.json'
import { useLanguage } from '../contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const colors = ['green', 'blue', 'yellow']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {t('header')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </motion.div>

      <div className="mb-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Павел Алексеев — профессор русской литературы, специализирующийся на имагологии, 
            ориентализме и сравнительных исследованиях. Его курсы исследуют границы литературного 
            канона, образы культурного «Другого» и динамику современного литературного процесса.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed italic">
            Pavel Alekseev is a Professor of Russian Literature specializing in imagology, 
            Orientalism, and comparative studies. His courses explore the boundaries of literary 
            canon, images of cultural "Otherness," and the dynamics of contemporary literary process.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {coursesData.courses.map((course, index) => (
          <CourseCard
            key={course.slug}
            course={course}
            color={colors[index]}
          />
        ))}
      </div>
    </div>
  )
}

