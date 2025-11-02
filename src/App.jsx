import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CoursePage from './pages/CoursePage'
import LecturePage from './pages/LecturePage'
import Materials from './pages/Materials'
import Tests from './pages/Tests'
import Contacts from './pages/Contacts'
import Admin from './pages/Admin'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/courses/:slug" element={<CoursePage />} />
                <Route path="/courses/:slug/lecture/:id" element={<LecturePage />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

