import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Quiz({ test }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])

  if (!test || !test.questions) return null

  const question = test.questions[currentQuestion]
  const isLastQuestion = currentQuestion === test.questions.length - 1

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex)
    const isCorrect = answerIndex === question.correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }
    setAnswers([...answers, { question: currentQuestion, answer: answerIndex, correct: isCorrect }])
    setShowResult(true)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      return
    }
    setCurrentQuestion(currentQuestion + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
  }

  if (isLastQuestion && showResult) {
    const percentage = Math.round((score / test.questions.length) * 100)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center"
      >
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Результаты теста
        </h2>
        <div className="text-6xl font-bold mb-4 text-blue-600 dark:text-blue-400">
          {score} / {test.questions.length}
        </div>
        <div className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
          {percentage}%
        </div>
        <button onClick={resetQuiz} className="btn-primary">
          Пройти заново
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Вопрос {currentQuestion + 1} из {test.questions.length}</span>
          <span>Правильных ответов: {score}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {question.text}
      </h3>

      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === question.correctAnswer
          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all "
          
          if (showResult) {
            if (isCorrect) {
              buttonClass += "bg-green-100 dark:bg-green-900/30 border-green-500"
            } else if (isSelected && !isCorrect) {
              buttonClass += "bg-red-100 dark:bg-red-900/30 border-red-500"
            } else {
              buttonClass += "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            }
          } else {
            buttonClass += isSelected
              ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400"
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && handleAnswer(index)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900 dark:text-white">{option}</span>
                {showResult && isCorrect && (
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Объяснение:</strong> {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && (
        <button
          onClick={handleNext}
          className="btn-primary w-full"
        >
          {isLastQuestion ? 'Завершить тест' : 'Следующий вопрос →'}
        </button>
      )}
    </motion.div>
  )
}

