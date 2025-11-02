import { motion } from 'framer-motion'
import materialsData from '../data/materials.json'

export default function Materials() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Материалы / Materials
        </h1>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materialsData.materials.map((material, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {material.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {material.category}
            </p>
            {material.url && material.url !== '#' ? (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Открыть →
              </a>
            ) : (
              <span className="text-gray-500">Скоро</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

