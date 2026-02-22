"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getQuestContent, saveQuestContent } from "@/lib/api"
import { Question, QuestionType, QuestSettings } from "@/types/quest"  // Импортируем всё

export default function EditQuestContentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  
  const [settings, setSettings] = useState<QuestSettings>({
    shuffle_questions: false,
    show_correct_answers: true,
    attempts_allowed: 1,
    time_limit_minutes: undefined  // это поле опционально, можно не указывать
  })

  useEffect(() => {
    loadContent()
  }, [id])

  async function loadContent() {
  try {
    // Передаем true для админского доступа
    const data = await getQuestContent(id, true)  // ← добавить true
    console.log("Админка получила:", data)  // Посмотри что приходит

    setQuestions(data.questions || [])
    setSettings(data.settings || {
      shuffle_questions: false,
      show_correct_answers: true,
      attempts_allowed: 1,
      time_limit_minutes: undefined
    })
  } catch (error) {
    console.error("Ошибка загрузки:", error)
  } finally {
    setLoading(false)
  }
}

  // Добавить новый вопрос
  function addQuestion() {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: "single_choice",
      text: "",
      options: [
        { id: Date.now().toString() + "_1", text: "" },
        { id: Date.now().toString() + "_2", text: "" },
        { id: Date.now().toString() + "_3", text: "" },
        { id: Date.now().toString() + "_4", text: "" }
      ],
      correct_answer: "0",
      points: 1,
      explanation: "",
      order: questions.length
    }
    setQuestions([...questions, newQuestion])
  }

  // Обновить вопрос
  function updateQuestion(index: number, field: keyof Question, value: any) {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  // Обновить вариант ответа
  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const updated = [...questions]
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = {
        ...updated[questionIndex].options![optionIndex],
        text: value
      }
    }
    setQuestions(updated)
  }

  // Добавить вариант ответа
  function addOption(questionIndex: number) {
    const updated = [...questions]
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = []
    }
    updated[questionIndex].options!.push({
      id: Date.now().toString(),
      text: ""
    })
    setQuestions(updated)
  }

  // Удалить вариант ответа
  function removeOption(questionIndex: number, optionIndex: number) {
    const updated = [...questions]
    updated[questionIndex].options = updated[questionIndex].options?.filter((_, i) => i !== optionIndex)
    setQuestions(updated)
  }

  // Удалить вопрос
  function deleteQuestion(index: number) {
    if (confirm("Удалить вопрос?")) {
      const updated = questions.filter((_, i) => i !== index)
      // Обновить порядок
      updated.forEach((q, i) => { q.order = i })
      setQuestions(updated)
    }
  }

  // Переместить вопрос вверх
  function moveQuestionUp(index: number) {
    if (index === 0) return
    const updated = [...questions]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    updated.forEach((q, i) => { q.order = i })
    setQuestions(updated)
  }

  // Переместить вопрос вниз
  function moveQuestionDown(index: number) {
    if (index === questions.length - 1) return
    const updated = [...questions]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    updated.forEach((q, i) => { q.order = i })
    setQuestions(updated)
  }

  // Сохранить всё
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Валидация
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        alert(`Вопрос ${i + 1}: введите текст вопроса`)
        setSaving(false)
        return
      }
      if (q.type !== "text" && q.options) {
        const hasEmptyOption = q.options.some(opt => !opt.text.trim())
        if (hasEmptyOption) {
          alert(`Вопрос ${i + 1}: заполните все варианты ответов`)
          setSaving(false)
          return
        }
        if (q.type === "single_choice" && q.correct_answer === undefined) {
          alert(`Вопрос ${i + 1}: выберите правильный ответ`)
          setSaving(false)
          return
        }
        if (q.type === "multiple_choice" && (!Array.isArray(q.correct_answer) || q.correct_answer.length === 0)) {
          alert(`Вопрос ${i + 1}: выберите хотя бы один правильный ответ`)
          setSaving(false)
          return
        }
      }
    }

    try {
      await saveQuestContent(id, {
        questions,
        settings
      })
      alert("Вопросы сохранены!")
      router.push("/admin")
    } catch (error) {
      console.error(error)
      alert("Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ color: "#0070f3" }}>← Назад к списку</Link>
      </div>

      <h1>Редактирование вопросов квеста</h1>

      <form onSubmit={handleSubmit}>
        {/* НАСТРОЙКИ КВЕСТА */}
        <div style={{ 
          border: "1px solid #ddd", 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20,
          background: "#f9f9f9"
        }}>
          <h3 style={{ marginTop: 0 }}>Настройки квеста</h3>
          
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={settings.shuffle_questions}
                onChange={(e) => setSettings({...settings, shuffle_questions: e.target.checked})}
              />
              Перемешивать вопросы
            </label>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={settings.show_correct_answers}
                onChange={(e) => setSettings({...settings, show_correct_answers: e.target.checked})}
              />
              Показывать правильные ответы после прохождения
            </label>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Количество попыток:
            </label>
            <input
              type="number"
              min="1"
              value={settings.attempts_allowed}
              onChange={(e) => setSettings({...settings, attempts_allowed: parseInt(e.target.value)})}
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 5 }}>
              Лимит времени (минут, необязательно):
            </label>
            <input
              type="number"
              min="1"
              value={settings.time_limit_minutes || ""}
              onChange={(e) => setSettings({
                ...settings, 
                time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined
              })}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        {/* ВОПРОСЫ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <h2 style={{ margin: 0 }}>Вопросы ({questions.length})</h2>
          <button
            type="button"
            onClick={addQuestion}
            style={{
              padding: "8px 16px",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            + Добавить вопрос
          </button>
        </div>

        {questions.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic", marginBottom: 20, textAlign: "center", padding: 40 }}>
            Пока нет вопросов. Нажмите "Добавить вопрос" чтобы начать.
          </p>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} style={{ 
              border: "1px solid #ddd", 
              padding: 15, 
              marginBottom: 15, 
              borderRadius: 8,
              background: "#fff"
            }}>
              {/* Заголовок вопроса */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom: "1px solid #eee"
              }}>
                <strong style={{ fontSize: 16 }}>Вопрос {idx + 1}</strong>
                <div style={{ display: "flex", gap: 5 }}>
                  <button 
                    type="button" 
                    onClick={() => moveQuestionUp(idx)}
                    disabled={idx === 0}
                    style={{ 
                      padding: "4px 8px", 
                      background: idx === 0 ? "#ccc" : "#0070f3",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: idx === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    ↑
                  </button>
                  <button 
                    type="button" 
                    onClick={() => moveQuestionDown(idx)}
                    disabled={idx === questions.length - 1}
                    style={{ 
                      padding: "4px 8px", 
                      background: idx === questions.length - 1 ? "#ccc" : "#0070f3",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: idx === questions.length - 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    ↓
                  </button>
                  <button 
                    type="button" 
                    onClick={() => deleteQuestion(idx)}
                    style={{ 
                      padding: "4px 8px", 
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Текст вопроса */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Текст вопроса *</label>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  placeholder="Введите текст вопроса..."
                  required
                />
              </div>

              {/* Тип вопроса и баллы в одной строке */}
              <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Тип вопроса</label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, "type", e.target.value as QuestionType)}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  >
                    <option value="single_choice">Один правильный ответ</option>
                    <option value="multiple_choice">Несколько правильных ответов</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Баллы</label>
                  <input
                    type="number"
                    min="1"
                    value={q.points}
                    onChange={(e) => updateQuestion(idx, "points", parseInt(e.target.value))}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  />
                </div>
              </div>

              {/* Варианты ответов */}
              {(q.type === "single_choice" || q.type === "multiple_choice") && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Варианты ответов</label>
                  
                  {q.options?.map((opt, optIdx) => (
                    <div key={opt.id} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                        placeholder={`Вариант ${optIdx + 1}`}
                        style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      />
                      
                      {q.type === "single_choice" && (
                        <label style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 100 }}>
                          <input
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correct_answer === optIdx.toString()}
                            onChange={() => updateQuestion(idx, "correct_answer", optIdx.toString())}
                          />
                          Правильный
                        </label>
                      )}

                      {q.type === "multiple_choice" && (
                        <label style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 100 }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(optIdx.toString())}
                            onChange={(e) => {
                              let correct = Array.isArray(q.correct_answer) ? [...q.correct_answer] : []
                              if (e.target.checked) {
                                correct.push(optIdx.toString())
                              } else {
                                correct = correct.filter(v => v !== optIdx.toString())
                              }
                              updateQuestion(idx, "correct_answer", correct)
                            }}
                          />
                          Правильный
                        </label>
                      )}

                      {q.options && q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx, optIdx)}
                          style={{
                            padding: "4px 8px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(idx)}
                    style={{
                      marginTop: 5,
                      padding: "4px 8px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    + Добавить вариант
                  </button>
                </div>
              )}

              {/* Пояснение (необязательно) */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
                  Пояснение (необязательно)
                </label>
                <textarea
                  value={q.explanation || ""}
                  onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                  placeholder="Пояснение к ответу..."
                />
              </div>
            </div>
          ))
        )}

        {/* Кнопка сохранения */}
        <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: saving ? "#999" : "green",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 16
            }}
          >
            {saving ? "Сохранение..." : "Сохранить все вопросы"}
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/admin")}
            style={{
              padding: "12px 24px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16
            }}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}