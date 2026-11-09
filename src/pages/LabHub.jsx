import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import demos from '../data/demos.json'
import { STAND_TO_METHOD, methodById } from '../data/dhMethods'
import { STAND_PANELS } from '../lab/mine/panels'

const stands = demos.works
  .filter((w) => w.slug !== 'colab-bunin')
  .sort((a, b) => Number(a.lecture) - Number(b.lecture))

function SmallCard({ to, kicker, title, text }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">{kicker}</p>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 leading-snug">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
    </Link>
  )
}

export default function LabHub() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/courses/digital-humanities"
        className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:underline mb-6 font-medium"
      >
        ← К курсу
      </Link>

      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-2">
          Шаг 2 из 3 · Попробовать
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Инструменты курса
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          <strong>Стенды</strong> показывают метод на рассказах Бунина, а под каждым стендом — блок{' '}
          <strong>«На своём тексте»</strong>: загрузите свои главы или произведения своего автора и повторите метод сами.{' '}
          <strong>Лаборатория «Мои тексты»</strong> собирает все методы на одной странице. <strong>Пары в Colab</strong> — тот
          же метод на настоящем коде.
        </p>
      </motion.header>

      <Link
        to="/courses/digital-humanities/my-lab"
        className="group mb-5 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-teal-500 bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 hover:shadow-xl transition-all"
      >
        <span className="text-4xl" aria-hidden="true">🧪</span>
        <span className="flex-1">
          <span className="block text-xs font-bold uppercase tracking-wide text-teal-100">Сами · на своих текстах · в браузере</span>
          <span className="block text-2xl font-bold">Лаборатория «Мои тексты»</span>
          <span className="block text-teal-50 leading-relaxed">
            Загрузите свои .txt или .docx один раз — и запускайте 14 методов курса: частоты, контексты, смысловые поля, ключевые слова, Ципф,
            стилометрия, имена, сеть персонажей, дуга тональности, темы, промпт и проверку цитат ИИ. Таблицы — в CSV.
          </span>
        </span>
        <span className="font-semibold shrink-0 group-hover:underline">Открыть →</span>
      </Link>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
        <Link
          to="/courses/digital-humanities/demo/colab-bunin"
          className="group block rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/10 p-6 hover:shadow-xl transition-all"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-2">
            Практика · Google Colab · бесплатно
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">14 пар в Colab</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Код спрятан — вы меняете только поля формы. Демо на Бунине работает «из коробки», затем — «Мои файлы»
            (.txt или .docx вашей магистерской).
          </p>
          <p className="mt-4 font-semibold text-amber-900 dark:text-amber-100 group-hover:underline">Открыть список пар →</p>
        </Link>
        <Link
          to="/courses/digital-humanities/demo/colab-bunin?pair=14"
          className="group block rounded-2xl border-2 border-fuchsia-400 dark:border-fuchsia-600 bg-gradient-to-br from-fuchsia-50 to-violet-50 dark:from-fuchsia-950/30 dark:to-violet-950/10 p-6 hover:shadow-xl transition-all"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-200 mb-2">Новое · пары 13–14 · Streamlit</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Своё веб-приложение для диссертации</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Пара 14 — собрать свой кабинет с нуля за 8 шагов (свои тексты, цитаты в Word, API, тренажёр). Пара 13 —
            готовая панель диссертации. Всё в Colab, ссылка открывается и на телефоне.
          </p>
          <p className="mt-4 font-semibold text-fuchsia-900 dark:text-fuchsia-100 group-hover:underline">Открыть пару 14 →</p>
        </Link>
        <Link
          to="/courses/digital-humanities/navigator"
          className="group block rounded-2xl border-2 border-teal-400 dark:border-teal-600 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/10 p-6 hover:shadow-xl transition-all"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200 mb-2">
            Шаг 3 · Применить к диссертации
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Какой метод нужен моей теме?</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Навигатор: тип темы → методы → пара Colab → образец абзаца для главы и слайда для защиты.
          </p>
          <p className="mt-4 font-semibold text-teal-900 dark:text-teal-100 group-hover:underline">Открыть навигатор →</p>
        </Link>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Стенды к лекциям</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-5">По порядку лекций. Каждый стенд — один вопрос и один метод.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stands.map((work, i) => {
            const m = methodById(STAND_TO_METHOD[work.slug])
            return (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  to={`/courses/digital-humanities/demo/${work.slug}`}
                  className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all"
                >
                  <span className="self-start text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100 mb-2">
                    Лекция {work.lecture}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2">
                    {work.title.replace(/^Лекция \d+ · /, '')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{work.question}</p>
                  {m && (
                    <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Метод: {m.title}</p>
                  )}
                  {STAND_PANELS[work.slug] && (
                    <p className="mt-2 self-start text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100">
                      🧪 + на своём тексте
                    </p>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Корпуса и карты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SmallCard
            to="/courses/digital-humanities/demo/corpus/bunin-temnye-allei"
            kicker="Корпус"
            title="Бунин · «Тёмные аллеи»"
            text="Все 37 рассказов: оглавление, поиск, листание. Эти же тексты подключаются в Colab."
          />
          <SmallCard
            to="/courses/digital-humanities/demo/corpus/chekhov-rasskazy"
            kicker="Корпус"
            title="Чехов · рассказы"
            text="14 рассказов — фон для сравнения и стилиометрии."
          />
          <SmallCard
            to="/courses/digital-humanities/demo/wikidata-bunin"
            kicker="Карта"
            title="Геопоэтика «Тёмных аллей»"
            text="Живая карта топосов с цитатами; запрос SPARQL → CSV."
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ресурсы для диссертации</h2>
        <Link
          to="/courses/digital-humanities/cabinet"
          className="group mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-950/20 p-5 sm:p-6 hover:shadow-xl transition-all"
        >
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-1">Открытые API · ресурс на весь срок магистратуры</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Кабинет магистранта</h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              Поиск литературы по теме диссертации в OpenAlex, Crossref, DOAJ, Google Books и др. → список по главам → Word по ГОСТу со
              ссылками, Zotero. Справка об авторе (Wikidata), наукометрия темы, журнал API-запросов с кодом для Colab.
            </p>
          </div>
          <span className="font-semibold text-amber-900 dark:text-amber-100 group-hover:underline shrink-0">Открыть кабинет →</span>
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SmallCard
            to="/courses/digital-humanities/demo/lit-search"
            kicker="Обзор литературы"
            title="Поиск статей по теме"
            text="Тема → запросы → OpenAlex, Crossref, Semantic Scholar → CSV."
          />
          <SmallCard
            to="/courses/digital-humanities/demo/intertext"
            kicker="Close reading + ИИ"
            title="Интертекстуальный анализ"
            text="Цитаты, аллюзии, уверенность и чек-лист проверки (нужен ключ DeepSeek; бесплатная замена — пара 12)."
          />
          <SmallCard
            to="/courses/digital-humanities/passport"
            kicker="Итог семестра"
            title="Методологический паспорт"
            text="Шаблон .docx: корпус, методы, цитаты, ограничения, протокол ИИ, слайд защиты."
          />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Каталог API (Gutendex, Gallica, Wikidata…) — во вкладке «Другие API»{' '}
          <Link to="/courses/digital-humanities/demo/pipeline" className="underline">
            стенда лекции 11
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
