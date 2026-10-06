import { Link, useParams } from 'react-router-dom'
import labs from '../data/labs.json'
import LabShell from '../components/LabShell'
import { renderLabTool } from '../lab/tools'

export default function LabWork() {
  const { workSlug } = useParams()
  const work = labs.works.find((w) => w.slug === workSlug)

  if (!work) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Работа не найдена</h1>
        <Link to="/courses/digital-humanities/lab" className="text-teal-700 dark:text-teal-400 hover:underline">
          Вернуться в Лабораторию
        </Link>
      </div>
    )
  }

  return <LabShell work={work}>{renderLabTool(work.tool)}</LabShell>
}
