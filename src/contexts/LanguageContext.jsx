import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  ru: {
    header: "Курсы профессора Павла Алексеева — Самаркандский государственный университет им. Шарофа Шафирова",
    subtitle: "Три курса, три исследовательские траектории",
    openCourse: "Открыть курс",
    takeTest: "Пройти тест",
    materials: "Материалы",
    tests: "Тесты",
    contacts: "Контакты",
    home: "Главная",
  },
  en: {
    header: "Professor Pavel Alekseev's Courses — Samarkand State University named after Sharof Shafirov",
    subtitle: "Three courses, three research trajectories",
    openCourse: "Open Course",
    takeTest: "Take Test",
    materials: "Materials",
    tests: "Tests",
    contacts: "Contacts",
    home: "Home",
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('language') || 'ru'
  })

  useEffect(() => {
    localStorage.setItem('language', lang)
  }, [lang])

  const t = (key) => translations[lang][key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

