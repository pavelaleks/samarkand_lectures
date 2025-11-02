export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2024 Самаркандский государственный университет им. Шарофа Шафирова</p>
          <a
            href="https://github.com/pavelaleks/samarkand_lectures"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 sm:mt-0 hover:text-blue-600 dark:hover:text-blue-400"
          >
            GitHub Repository
          </a>
        </div>
      </div>
    </footer>
  )
}

