import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CoursePage from './pages/CoursePage'
import LabHub from './pages/LabHub'
import LabWork from './pages/LabWork'
import BuninReader from './pages/BuninReader'
import ChekhovReader from './pages/ChekhovReader'
import LeerssenLecture from './pages/LeerssenLecture'
import WikidataBunin from './pages/WikidataBunin'
import LitSearch from './pages/LitSearch'

function LabWorkRedirect() {
  const { workSlug } = useParams()
  return <Navigate to={`/courses/digital-humanities/demo/${workSlug}`} replace />
}

/** After GitHub Pages 404.html → /?redirect=/path, restore the deep link. */
function SpaPathRestore() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('redirect')
    const fromSession = sessionStorage.getItem('redirectPath')
    const savedPath = fromQuery || fromSession
    if (!savedPath) return
    sessionStorage.removeItem('redirectPath')
    navigate(savedPath, { replace: true })
  }, [navigate])
  return null
}

function App() {
  try {
    // Vite BASE_URL ends with `/`; React Router basename must NOT.
    const baseUrl = (import.meta.env.BASE_URL || '/samarkand_lectures/').replace(/\/$/, '') || '/'
    
    return (
      <ThemeProvider>
        <BrowserRouter basename={baseUrl}>
          <SpaPathRestore />
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/courses/digital-humanities/demo" element={<LabHub />} />
                <Route
                  path="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
                  element={<BuninReader />}
                />
                <Route
                  path="/courses/digital-humanities/demo/corpus/bunin-temnye-allei/:storySlug"
                  element={<BuninReader />}
                />
                <Route
                  path="/courses/digital-humanities/demo/corpus/chekhov-rasskazy"
                  element={<ChekhovReader />}
                />
                <Route
                  path="/courses/digital-humanities/demo/corpus/chekhov-rasskazy/:storySlug"
                  element={<ChekhovReader />}
                />
                <Route path="/courses/digital-humanities/demo/wikidata-bunin" element={<WikidataBunin />} />
                <Route path="/courses/digital-humanities/demo/lit-search" element={<LitSearch />} />
                <Route path="/courses/digital-humanities/resources/lit-search" element={<LitSearch />} />
                <Route path="/courses/digital-humanities/demo/:workSlug" element={<LabWork />} />
                <Route path="/courses/digital-humanities/lab" element={<Navigate to="/courses/digital-humanities/demo" replace />} />
                <Route path="/courses/digital-humanities/lab/:workSlug" element={<LabWorkRedirect />} />
                <Route path="/courses/imagology/demo/lecture-3" element={<LeerssenLecture />} />
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
