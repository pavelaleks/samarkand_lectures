import { Link, useSearchParams } from 'react-router-dom'
import { MyLabWorkbench } from '../lab/mine/OwnTexts'

export default function MyLab() {
  const [params, setParams] = useSearchParams()
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link to="/courses/digital-humanities/demo" className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-5 font-medium">
        ‹ К инструментам
      </Link>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">Лаборатория «Мои тексты»</h1>
      <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-3xl">
        Все методы курса — на ваших собственных текстах, прямо в браузере. Загрузите файлы один раз и переключайтесь между методами; таблицы
        скачиваются в CSV для Excel и для «Методологического паспорта». Для лемматизации, точного NER и LDA — те же методы в Colab.
      </p>
      <MyLabWorkbench initial={params.get('m') || 'freq'} onChange={(m) => setParams({ m }, { replace: true })} />
    </div>
  )
}
