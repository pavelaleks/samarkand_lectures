import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
    >
      {lang === 'ru' ? 'EN' : 'RU'}
    </button>
  )
}

