import { motion } from 'framer-motion'

export default function Contacts() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Контакты / Contacts
        </h1>
      </motion.div>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Профессор Павел Алексеев
        </h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div>
            <strong className="text-gray-900 dark:text-white">Email:</strong>{' '}
            <a
              href="mailto:pavel.alekseev@example.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              pavel.alekseev@example.com
            </a>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Telegram:</strong>{' '}
            <a
              href="https://t.me/professor_alekseev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              @professor_alekseev
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Форма обратной связи / Contact Form
        </h2>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSe..."
          width="100%"
          height="600"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          className="rounded-lg"
          title="Contact Form"
        >
          Загрузка...
        </iframe>
      </div>
    </div>
  )
}

