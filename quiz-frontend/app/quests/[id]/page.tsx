"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Quest } from "@/types/quest"
import { getQuests } from "@/lib/api"
import { isQuestActive } from "@/lib/quests"
import { formatDateTime } from "@/lib/date"

export default function QuestDetailPage() {
  const params = useParams()
  const id = params.id as string // Получаем как строку

  const [quest, setQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError("Идентификатор квеста не указан")
      setLoading(false)
      return
    }

    loadQuest()
  }, [id])

  async function loadQuest() {
    try {
      const quests = await getQuests("all")
      const found = quests.find((q) => q.id === id) // Сравниваем строки

      if (!found) {
        setError("Квест не найден")
        return
      }

      setQuest(found)
    } catch (e) {
      console.error(e)
      setError("Ошибка загрузки квеста")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <p>Загрузка...</p>
        <Link href="/quests">← Назад к списку</Link>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <p>{error}</p>
        <Link href="/quests">← Вернуться к списку</Link>
      </div>
    )
  }

  if (!quest) {
    return (
      <div style={{ padding: 20 }}>
        <p>Квест не найден</p>
        <Link href="/quests">← Вернуться к списку</Link>
      </div>
    )
  }

  const active = isQuestActive(quest)

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <Link href="/quests">← Назад к списку</Link>

      <h1 style={{ marginTop: 20 }}>{quest.title}</h1>

      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        {quest.description}
      </p>

      <div
        style={{
          backgroundColor: active ? "#e8f5e9" : "#f5f5f5",
          padding: 15,
          borderRadius: 8,
          margin: "20px 0",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Период активности:</strong><br />
          {formatDateTime(quest.active_from)} — {formatDateTime(quest.active_to)}
        </p>
      </div>

      <hr />

      <p style={{ fontSize: 18 }}>
        Статус:{" "}
        <strong style={{ color: active ? "green" : "gray" }}>
          {active
            ? "Активен (участие в зачёт)"
            : "Неактивен (ознакомительный режим)"}
        </strong>
      </p>

      <p style={{ color: "#555" }}>
        Доступно для категории пользователей: <strong>Студенты</strong>
      </p>

      <div style={{ marginTop: 30 }}>
        <button
          style={{
            padding: "12px 24px",
            background: active ? "green" : "#666",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {active
            ? "Пройти квест в зачётт"
            : "Пройти в ознакомительном режиме"}
        </button>
      </div>
    </div>
  )
}