import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('main.jsx loaded')

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<h1 style="padding: 20px; color: red;">Ошибка: элемент root не найден!</h1>'
} else {
  console.log('Root element found, rendering App...')
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    console.log('App rendered successfully')
  } catch (error) {
    console.error('Error rendering App:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">Ошибка загрузки приложения</h1>
        <p style="color: #991b1b; margin-bottom: 10px;">${error.message}</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; overflow-x: auto;">
${error.stack}
        </pre>
      </div>
    `
  }
}
