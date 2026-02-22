"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getQuestContent, getQuests } from "@/lib/api"
import { Question, Quest, QuestSettings } from "@/types/quest"  // Импортируем QuestSettings

type Answer = string | string[] | null

export default function PlayQuestPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [quest, setQuest] = useState<Quest | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") // "practice" или null
  const isPracticeMode = mode === "practice"  

  const [settings, setSettings] = useState<QuestSettings>({
    shuffle_questions: false,
    show_correct_answers: true,
    attempts_allowed: 1,
    time_limit_minutes: undefined
  })
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<{
    score: number
    total: number
    correctAnswers: Record<string, boolean>
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    // Таймер если есть лимит времени
    if (settings.time_limit_minutes && !submitted) {
      const totalSeconds = settings.time_limit_minutes * 60
      setTimeLeft(totalSeconds)
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            handleSubmit() // Автоматическая сдача при истечении времени
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [settings.time_limit_minutes, submitted])

  async function loadData() {
    try {
      // Загружаем метаданные квеста
      const quests = await getQuests("all")
      const found = quests.find(q => q.id === id)
      setQuest(found || null)

      // Загружаем вопросы
      const content = await getQuestContent(id)  // без admin=true для пользователя
      console.log("Полученные вопросы (пользователь):", content.questions)
    
      // Перемешиваем вопросы если нужно
      let loadedQuestions = content.questions || []
      if (content.settings?.shuffle_questions) {
        loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5)
      }
      
      setQuestions(loadedQuestions)
      
      setSettings({
        shuffle_questions: content.settings?.shuffle_questions ?? false,
        show_correct_answers: content.settings?.show_correct_answers ?? true,
        attempts_allowed: content.settings?.attempts_allowed ?? 1,
        time_limit_minutes: content.settings?.time_limit_minutes
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId: string, answer: Answer) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  function handleSingleChoice(questionId: string, optionIndex: number) {
    handleAnswer(questionId, optionIndex.toString())
  }

  function handleMultipleChoice(questionId: string, optionIndex: number, checked: boolean) {
    const current = (answers[questionId] as string[]) || []
    let newAnswer: string[]
    
    if (checked) {
      newAnswer = [...current, optionIndex.toString()]
    } else {
      newAnswer = current.filter(i => i !== optionIndex.toString())
    }
    
    handleAnswer(questionId, newAnswer)
  }

  function handleTextAnswer(questionId: string, text: string) {
    handleAnswer(questionId, text)
  }

  function calculateResults() {
    let correctCount = 0
    const correctMap: Record<string, boolean> = {}
    
    questions.forEach(q => {
      const userAnswer = answers[q.id]
      let isCorrect = false
      
      if (q.type === "single_choice") {
        // ✅ ИСПРАВЛЕНО: сравниваем как строки, а не как числа
        isCorrect = String(userAnswer) === String(q.correct_answer)
        
      } else if (q.type === "multiple_choice") {
        const correct = (q.correct_answer as string[]).map(String) // все в строки
        const user = (userAnswer as string[] || []).map(String)    // все в строки
        isCorrect = 
          correct.length === user.length && 
          correct.every(c => user.includes(c))
          
      } else if (q.type === "text") {
        isCorrect = String(userAnswer || "").toLowerCase().trim() === 
                    String(q.correct_answer || "").toLowerCase().trim()
      }
      
      if (isCorrect) {
        correctCount += q.points
      }
      correctMap[q.id] = isCorrect
    })
    
    setResults({
      score: correctCount,
      total: questions.reduce((sum, q) => sum + q.points, 0),
      correctAnswers: correctMap
    })
  }

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    calculateResults()
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function isQuestionAnswered(questionId: string): boolean {
    const answer = answers[questionId]
    if (answer === null || answer === undefined) return false
    if (Array.isArray(answer)) return answer.length > 0
    return answer !== ""
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Загрузка...</div>
  }

  if (!quest) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Квест не найден</p>
        <Link href="/quests" style={{ color: "#0070f3" }}>← К списку квестов</Link>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>В этом квесте пока нет вопросов</p>
        <Link href={`/quests/${id}`} style={{ color: "#0070f3" }}>← Назад к квесту</Link>
      </div>
    )
  }

  // Страница результатов
  if (submitted && results) {
    const percentage = Math.round((results.score / results.total) * 100)
    
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        <h1>{quest.title} - Результаты</h1>
        
        <div style={{ 
          background: "#f0f9ff", 
          padding: 20, 
          borderRadius: 8,
          textAlign: "center",
          marginBottom: 30
        }}>
          <div style={{ fontSize: 48, fontWeight: "bold", color: percentage >= 70 ? "green" : "#666" }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 24 }}>
            {results.score} из {results.total} баллов
          </div>
        </div>

        {settings.show_correct_answers && (
          <div>
            <h2>Разбор вопросов</h2>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ 
                border: "1px solid #ddd", 
                padding: 15, 
                marginBottom: 10, 
                borderRadius: 8,
                background: results.correctAnswers[q.id] ? "#e8f5e9" : "#ffebee"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Вопрос {idx + 1}</strong>
                  <span style={{ color: results.correctAnswers[q.id] ? "green" : "red" }}>
                    {results.correctAnswers[q.id] ? "✓ Правильно" : "✗ Неправильно"} 
                    ({q.points} балл{q.points > 1 ? 'а' : ''})
                  </span>
                </div>
                <p style={{ margin: "10px 0" }}>{q.text}</p>
                
                {q.type === "single_choice" && q.options && (
                  <div>
                    <div style={{ fontWeight: "bold", marginTop: 10 }}>Ваш ответ:</div>
                    <div>{q.options[parseInt(answers[q.id] as string || "0")]?.text || "Не отвечен"}</div>
                    <div style={{ fontWeight: "bold", marginTop: 5 }}>Правильный ответ:</div>
                    <div>{q.options[parseInt(q.correct_answer as string)]?.text}</div>
                  </div>
                )}
                
                {q.explanation && (
                  <div style={{ 
                    marginTop: 10, 
                    padding: 10, 
                    background: "#fff3e0", 
                    borderRadius: 4,
                    fontSize: 14
                  }}>
                    <strong>Пояснение:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
          <Link 
            href={`/quests/${id}`}
            style={{
              padding: "12px 24px",
              background: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: 6
            }}
          >
            ← На страницу квеста
          </Link>
          <Link 
            href="/quests"
            style={{
              padding: "12px 24px",
              background: "#666",
              color: "white",
              textDecoration: "none",
              borderRadius: 6
            }}
          >
            Ко всем квестам
          </Link>
        </div>
      </div>
    )
  }

  // Текущий вопрос
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).filter(id => isQuestionAnswered(id)).length

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      {/* Шапка */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Link href={`/quests/${id}`} style={{ color: "#0070f3" }}>← Назад к квесту</Link>
        {timeLeft !== null && (
          <div style={{ 
            padding: "8px 16px", 
            background: timeLeft < 60 ? "#ffebee" : "#f0f9ff",
            borderRadius: 4,
            fontWeight: "bold"
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <h1>{quest.title}</h1>

      {/* Прогресс */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span>Вопрос {currentIndex + 1} из {questions.length}</span>
          <span>Отвечено: {answeredCount}/{questions.length}</span>
        </div>
        <div style={{ 
          width: "100%", 
          height: 8, 
          background: "#eee", 
          borderRadius: 4,
          overflow: "hidden"
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: "100%", 
            background: "#0070f3",
            transition: "width 0.3s"
          }} />
        </div>
      </div>

      {/* Вопрос */}
      <div style={{ 
        border: "1px solid #ddd", 
        padding: 20, 
        borderRadius: 8,
        marginBottom: 20
      }}>
        <h3 style={{ marginTop: 0 }}>{currentQuestion.text}</h3>
        
        {/* Один правильный ответ */}
        {currentQuestion.type === "single_choice" && currentQuestion.options && (
          <div>
            {currentQuestion.options.map((opt, optIdx) => (
              <div key={opt.id} style={{ marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="radio"
                    name={`q_${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === optIdx.toString()}
                    onChange={() => handleSingleChoice(currentQuestion.id, optIdx)}
                  />
                  {opt.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Несколько правильных ответов */}
        {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
          <div>
            {currentQuestion.options.map((opt, optIdx) => (
              <div key={opt.id} style={{ marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={(answers[currentQuestion.id] as string[] || []).includes(optIdx.toString())}
                    onChange={(e) => handleMultipleChoice(currentQuestion.id, optIdx, e.target.checked)}
                  />
                  {opt.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Текстовый ответ */}
        {currentQuestion.type === "text" && (
          <div>
            <textarea
              value={(answers[currentQuestion.id] as string) || ""}
              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
              placeholder="Введите ваш ответ..."
              rows={4}
              style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </div>
        )}
      </div>

      {/* Навигация */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            padding: "10px 20px",
            background: currentIndex === 0 ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: currentIndex === 0 ? "not-allowed" : "pointer"
          }}
        >
          ← Назад
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
            style={{
              padding: "10px 30px",
              background: answeredCount < questions.length ? "#ccc" : "green",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: answeredCount < questions.length ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            Завершить квест
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            style={{
              padding: "10px 30px",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            Далее →
          </button>
        )}
      </div>

      {/* Индикатор отвеченных вопросов */}
      {currentIndex < questions.length - 1 && answeredCount < questions.length && (
        <div style={{ 
          marginTop: 20, 
          padding: 10, 
          background: "#fff3cd", 
          borderRadius: 4,
          fontSize: 14,
          textAlign: "center"
        }}>
            Осталось ответить на {questions.length - answeredCount} вопросов
        </div>
      )}
    </div>
  )
}