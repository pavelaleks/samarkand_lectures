import { useState } from 'react'
import { Link } from 'react-router-dom'
import MyTextsBar from './MyTextsBar'
import { useMyTexts } from './myTexts'
import { PANELS, PANEL_GROUPS } from './panels'

export const MY_LAB_PATH = '/courses/digital-humanities/my-lab'

function Empty() {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400 py-6 text-center">
      Добавьте хотя бы один текст в «Мои тексты» выше — и метод сразу заработает на нём.
    </p>
  )
}

/** Блок «На моих текстах» под стендом: тот же метод — на своих файлах. */
export function OwnTextsSection({ panelIds }) {
  const texts = useMyTexts()
  const [active, setActive] = useState(panelIds[0])
  const P = PANELS[active]
  return (
    <section id="my-texts" className="mt-8 rounded-2xl border-2 border-teal-500 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm scroll-mt-24">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">Сами · на своём тексте</p>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">🧪 Попробуйте этот метод на своих текстах</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        Загрузите главы своей магистерской или произведения своего автора — расчёт идёт прямо в браузере, ничего не нужно устанавливать. Те же
        тексты будут доступны на всех стендах и в{' '}
        <Link to={MY_LAB_PATH} className="underline font-semibold text-teal-700 dark:text-teal-300">
          лаборатории «Мои тексты»
        </Link>
        , где собраны все методы курса.
      </p>
      <MyTextsBar compact />
      {panelIds.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {panelIds.map((id) => (
            <button key={id} type="button" onClick={() => setActive(id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${active === id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200'}`}>
              {PANELS[id].title}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{P.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{P.what}</p>
        {texts.length ? <P.Comp texts={texts} /> : <Empty />}
      </div>
    </section>
  )
}

/** Полная лаборатория: все методы над общей библиотекой текстов. */
export function MyLabWorkbench({ initial = 'freq', onChange }) {
  const texts = useMyTexts()
  const [active, setActive] = useState(PANELS[initial] ? initial : 'freq')
  const P = PANELS[active]
  const pick = (id) => {
    setActive(id)
    onChange?.(id)
  }
  return (
    <div className="space-y-5">
      <MyTextsBar />
      <div className="grid lg:grid-cols-[15rem_1fr] gap-5">
        <nav aria-label="Методы" className="lg:sticky lg:top-24 self-start">
          <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 -mx-1 px-1">
            {PANEL_GROUPS.map((g) => (
              <div key={g.label} className="shrink-0">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{g.label}</p>
                <div className="flex lg:flex-col gap-1">
                  {g.ids.map((id) => (
                    <button key={id} type="button" onClick={() => pick(id)} className={`text-left whitespace-nowrap lg:whitespace-normal px-3 py-1.5 rounded-xl text-sm ${active === id ? 'bg-teal-600 text-white font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                      {PANELS[id].title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <section className="min-w-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{P.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{P.what}</p>
          {texts.length ? <P.Comp key={active} texts={texts} /> : <Empty />}
        </section>
      </div>
    </div>
  )
}
