import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5 sm:py-3">
          <Link to="/" className="flex items-center gap-3 min-w-0 flex-1 group">
            <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-600 to-sky-700 text-white flex items-center justify-center font-bold text-sm sm:text-base">
              ПА
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                <span className="sm:hidden">П. В. Алексеев</span>
                <span className="hidden sm:inline">Курсы проф. П. В. Алексеева</span>
              </span>
              <span className="block text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight truncate">
                <span className="sm:hidden">Курсы · СамГУ</span>
                <span className="hidden sm:inline">Самаркандский государственный университет им. Шарофа Рашидова</span>
              </span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold" aria-label="Основная навигация">
            <Link to="/" className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Курсы
            </Link>
            <Link to="/courses/digital-humanities/navigator" className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Методы
            </Link>
            <Link to="/courses/digital-humanities/cabinet" className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950">
              Кабинет магистранта
            </Link>
          </nav>
          <Link
            to="/courses/digital-humanities/cabinet"
            className="md:hidden shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500 text-gray-950 text-xs font-bold"
            aria-label="Кабинет магистранта"
          >
            Кабинет
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
