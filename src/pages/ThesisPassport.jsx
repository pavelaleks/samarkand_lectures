import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { colabUrl } from '../data/dhMethods'

const base = import.meta.env.BASE_URL || '/'
const DOCX = `${base}demo-downloads/passport/Metodologicheskij_pasport_dissertacii.docx`

const SECTIONS = [
  {
    n: 1,
    title: 'Вопрос и гипотеза',
    when: 'до любых подсчётов',
    pair: null,
    body: 'Исследовательский вопрос, тип темы по навигатору, гипотеза и что будет считаться её подтверждением.',
    example: 'Гипотеза: в рассказах-воспоминаниях («Холодная осень») поле «память» выражено сильнее, чем в рассказах «настоящего времени». Подтверждение — частота выше в 2+ раза и подтверждена контекстами.',
  },
  {
    n: 2,
    title: 'Материал: паспорт корпуса',
    when: 'пара 3',
    pair: 3,
    body: 'Таблица единиц анализа: объём, источник файла, печатное издание для сверки, зачем включено, что исключено. Правила очистки.',
    example: '«Холодная осень» · 1094 слова · bunin-lit.ru · Бунин И.А. Собр. соч.: в 9 т. Т. 7. М., 1966 · рассказ-воспоминание · удалено заглавие.',
  },
  {
    n: 3,
    title: 'Два метода: процедура → результат → цитата → ограничение',
    when: 'пары 1–2, 4–10',
    pair: 1,
    body: 'Для каждого метода — параметры (чтобы повторить), число или таблица, график, цитата-доказательство, цитата, которая ломает или уточняет результат, ограничение и вердикт по гипотезе.',
    example: 'Поле «память» (помнить, вспомнить, вспоминать, память, воспоминание, забыть, прошлое, давно; pymorphy3) → частота на 1000 слов → цитата «Буду жив, вечно буду помнить этот вечер…» → ограничение: всего несколько вхождений, мотив выражен и без ключевых слов.',
  },
  {
    n: 4,
    title: 'Историография',
    when: 'пара 11',
    pair: 11,
    body: '5 работ, найденных через OpenAlex (и eLibrary / КиберЛенинку), — зачем каждая для главы; 3 отвергнутые с причиной.',
    example: null,
  },
  {
    n: 5,
    title: 'Использование ИИ (протокол)',
    when: 'пара 12',
    pair: 12,
    body: 'Модель и дата, задача, промпт, итог автоматической проверки цитат, что перешло в работу и после какой проверки.',
    example: 'DeepSeek (бесплатный веб-чат) · гипотезы по фрагменту «Чистого понедельника» · проверка: 1 цитата найдена дословно, 2 не найдены → отброшены.',
  },
  {
    n: 6,
    title: 'Формулировки для диссертации и защиты',
    when: 'конец семестра',
    pair: null,
    body: 'Абзац для раздела «Методология», положение на защиту (если есть цифровая часть), что будет на слайде, ответ на вопрос «Зачем здесь компьютер?».',
    example: 'Для проверки гипотезы применены частотный анализ смысловых полей и метод ключевых слов (Google Colab, Python, pymorphy3; параметры — прил. 1). Количественные результаты рассматриваются как гипотезы и проверены анализом контекстов.',
  },
]

export default function ThesisPassport() {
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/courses/digital-humanities/navigator"
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
      >
        ← К навигатору методов
      </Link>

      <header className="mb-10">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-2">
          Сквозной итог семестра
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          Методологический паспорт диссертации
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Документ на 2–4 страницы, который вы заполняете весь семестр: после каждой пары в Colab — одна строка или один
          раздел. К концу курса у вас готовы раздел «Материал и методы», приложения с параметрами и слайд для защиты.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={DOCX}
            download
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-semibold"
          >
            ⬇ Скачать шаблон (.docx)
          </a>
          <a
            href={colabUrl(3)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-amber-500 text-amber-800 dark:text-amber-200 font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            ▶ Начать с пары 3: паспорт корпуса
          </a>
        </div>
      </header>

      <ol className="space-y-4 mb-12">
        {SECTIONS.map((s) => (
          <li
            key={s.n}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 flex gap-4"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-lg flex items-center justify-center">
              {s.n}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{s.title}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                  {s.when}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{s.body}</p>
              {s.example && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-teal-400 pl-3 leading-relaxed">
                  Образец (Бунин): {s.example}
                </p>
              )}
              {s.pair && (
                <a
                  href={colabUrl(s.pair)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Открыть пару {s.pair} в Colab →
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl bg-slate-900 text-slate-100 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Чек-лист перед сдачей главы</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm sm:text-base">
          {[
            'У каждого числа есть цитата',
            'Параметры записаны так, что другой человек повторит подсчёт',
            'Названы ограничения каждого метода',
            'Цитаты сверены с печатным изданием',
            'Использование ИИ описано в протоколе',
            'Выводы — «показывает», «согласуется», а не «доказывает»',
          ].map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-teal-300">☐</span>
              {x}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
