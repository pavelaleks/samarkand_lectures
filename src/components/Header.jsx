import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex-1 group">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Курсы профессора Павла Алексеева
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Самаркандский государственный университет им. Шарофа Шафирова
            </p>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

