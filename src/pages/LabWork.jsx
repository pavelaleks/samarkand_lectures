import { Link, useParams } from 'react-router-dom'
import demos from '../data/demos.json'
import LabShell from '../components/LabShell'
import { renderLabTool } from '../lab/tools'

export default function LabWork() {
  const { workSlug } = useParams()
  const work = demos.works.find((w) => w.slug === workSlug)

  if (!work) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Сцена не найдена</h1>
        <Link to="/courses/digital-humanities/demo" className="text-teal-700 dark:text-teal-400 hover:underline">
          Вернуться к демо-стенду
        </Link>
      </div>
    )
  }

  return <LabShell work={work}>{renderLabTool(work.tool)}</LabShell>
}
