import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CoursePage from './pages/CoursePage'

function App() {
  try {
    // В dev режиме BASE_URL может быть '/', в production '/samarkand_lectures/'
    const baseUrl = import.meta.env.BASE_URL === '/' ? '/samarkand_lectures/' : (import.meta.env.BASE_URL || '/samarkand_lectures/')
    
    // Восстанавливаем путь из sessionStorage (если были редирект через 404.html)
    useEffect(() => {
      const savedPath = sessionStorage.getItem('redirectPath')
      if (savedPath) {
        sessionStorage.removeItem('redirectPath')
        // Используем window.location вместо reload для плавного перехода
        const fullPath = baseUrl.slice(0, -1) + savedPath
        if (window.location.pathname !== fullPath && window.location.pathname.includes('/index.html')) {
          window.history.replaceState(null, '', fullPath)
          // Триггерим событие popstate для React Router
          window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
        }
      }
    }, [baseUrl])
    
    return (
      <ThemeProvider>
        <BrowserRouter basename={baseUrl}>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/courses/:slug" element={<CoursePage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    )
  } catch (error) {
    console.error('App error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-4">
            Ошибка приложения
          </h1>
          <p className="text-red-800 dark:text-red-200 mb-4">
            {error.message}
          </p>
          <pre className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-4 rounded overflow-auto">
            {error.stack}
          </pre>
        </div>
      </div>
    )
  }
}

export default App
