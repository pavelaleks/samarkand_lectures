import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CourseCard from '../components/CourseCard'
import coursesData from '../data/courses.json'
import lecturesIndex from '../data/lectures.json'

const TOPICS = ['имагология', 'русский ориентализм', 'сравнительное литературоведение', 'литература путешествий', 'digital humanities']

const TOOLS = [
  {
    to: '/courses/digital-humanities/cabinet',
    title: 'Кабинет магистранта',
    text: 'Литература по теме диссертации из научных баз → список по ГОСТу в Word',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5s3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25" />
    ),
    accent: 'bg-amber-500',
  },
  {
    to: '/courses/digital-humanities/navigator',
    title: 'Какой метод нужен теме?',
    text: 'Навигатор: тип темы → цифровой метод → абзац для главы и слайд защиты',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.45-2.72A1 1 0 013 16.38V5.62a1 1 0 011.45-.9L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.28A1 1 0 0021 18.38V7.62a1 1 0 00-.55-.9L15 4m0 13V4m0 0L9 7" />,
    accent: 'bg-teal-600',
  },
  {
    to: '/courses/digital-humanities/demo/colab-bunin',
    title: '14 практикумов в Colab',
    text: 'Бесплатно, без установки: сначала на Бунине, потом на тексте своей диссертации',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    accent: 'bg-sky-600',
  },
  {
    to: '/courses/digital-humanities/demo/colab-bunin?pair=14',
    title: 'Streamlit: своё приложение',
    text: 'Собрать свой кабинет с нуля: свои тексты, цитаты в Word, литература, тренажёр',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H4zM8 20h8M12 16v4M8 12l2-2 2 2 4-4" />,
    accent: 'bg-fuchsia-600',
  },
  {
    to: '/courses/digital-humanities/passport',
    title: 'Методологический паспорт',
    text: 'Шаблон Word: корпус, методы, цитаты, ограничения — основа раздела «Методология»',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.59a1 1 0 01.7.29l5.42 5.42a1 1 0 01.29.7V19a2 2 0 01-2 2z" />,
    accent: 'bg-violet-600',
  },
]

function Instructor({ className = '' }) {
  return (
    <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${className} flex-col justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-teal-600 to-sky-700 text-white flex items-center justify-center text-xl sm:text-2xl font-bold">
              ПА
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Преподаватель</p>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug">Павел Викторович Алексеев</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">доктор филологических наук, профессор</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <a href="https://palekseev.ru/" target="_blank" rel="noopener noreferrer" className="text-teal-700 dark:text-teal-300 hover:underline">
              Персональный сайт ↗
            </a>
            <a href="https://gasu.academia.edu/PavelAlekseev" target="_blank" rel="noopener noreferrer" className="text-teal-700 dark:text-teal-300 hover:underline">
              Публикации на Academia.edu ↗
            </a>
          </div>
        </motion.aside>
  )
}

export default function Home() {
  const courses = coursesData.courses.filter((c) => c.visible !== false)
  const lectureCount = (slug) => lecturesIndex.lectures.filter((l) => l.courseSlug === slug).length

  if (!courses.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ошибка загрузки курсов</h2>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-10">
      {/* Вступление + преподаватель */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch mb-8 sm:mb-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 flex flex-col justify-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-2">
            СамГУ · магистратура · литературоведение
          </p>
          <h1 className="text-[1.6rem] leading-tight sm:text-4xl lg:text-[2.85rem] font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Лекции, практикумы и цифровые инструменты для филологов
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
            Полные тексты лекций и презентации, интерактивные стенды, практикумы в Google Colab и кабинет для работы над
            диссертацией.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
            <a
              href="#courses"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm sm:text-base hover:opacity-90"
            >
              Курсы ↓
            </a>
            <Link
              to="/courses/digital-humanities/cabinet"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm sm:text-base"
            >
              Кабинет магистранта →
            </Link>
          </div>
        </motion.div>

        <Instructor className="hidden lg:flex lg:col-span-5" />
      </section>

      {/* Курсы */}
      <section id="courses" className="scroll-mt-20 mb-10 sm:mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Курсы</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{courses.length} курса</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {courses.map((course, index) => (
            <CourseCard key={course.slug} course={course} index={index} lectures={lectureCount(course.slug)} />
          ))}
        </div>
      </section>

      <Instructor className="flex lg:hidden mb-10" />

      {/* Инструменты для магистрантов */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Для работы над диссертацией</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group flex sm:flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all"
            >
              <span className={`w-10 h-10 shrink-0 rounded-xl ${t.accent} text-white flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                  {t.icon}
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300">{t.title}</span>
                <span className="block mt-1 text-sm text-gray-600 dark:text-gray-400 leading-snug">{t.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
