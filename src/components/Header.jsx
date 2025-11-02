import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { t } = useLanguage()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {t('header')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </Link>
          <nav className="flex items-center gap-4 ml-4 flex-wrap">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t('home')}
            </Link>
            <Link to="/materials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t('materials')}
            </Link>
            <Link to="/tests" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t('tests')}
            </Link>
            <Link to="/contacts" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {t('contacts')}
            </Link>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

