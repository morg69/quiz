"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Quest } from "@/types/quest"
import { getQuests } from "@/lib/api"
import { isQuestActive } from "@/lib/quests"
import { formatDateTime } from "@/lib/date"

export default function QuestsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const questId = searchParams.get("id")

  const [quests, setQuests] = useState<Quest[]>([])
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuests()
  }, [])

  useEffect(() => {
    if (!questId) {
      setSelectedQuest(null)
      return
    }

    if (quests.length > 0) {
      const quest = quests.find(q => q.id === questId) // Сравниваем как строки
      setSelectedQuest(quest || null)
    }
  }, [questId, quests])

  async function loadQuests() {
    try {
      const data = await getQuests("all")
      setQuests(data)
    } catch (error) {
      console.error("Ошибка загрузки:", error)
    } finally {
      setLoading(false)
    }
  }

  // Квест не найден
  if (questId && !loading && !selectedQuest) {
    return (
      <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
        <p>Квест не найден</p>
        <button
          onClick={() => router.push("/quests")}
          style={{
            marginTop: 20,
            background: "none",
            border: "none",
            color: "#0070f3",
            cursor: "pointer",
            fontSize: 16,
            padding: 0,
          }}
        >
          ← Вернуться к списку
        </button>
      </div>
    )
  }

  // Детальная страница
  if (selectedQuest) {
    return (
      <QuestDetail
        quest={selectedQuest}
        onBack={() => router.push("/quests")}
      />
    )
  }

  // Список
  return <QuestList quests={quests} loading={loading} />
}

/* 
   СПИСОК КВЕСТОВ
*/

function QuestList({ quests, loading }: { quests: Quest[], loading: boolean }) {
  const activeQuests = quests.filter(isQuestActive)
  const pastQuests = quests.filter(q => !isQuestActive(q))

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Квесты</h1>

      {loading ? (
        <p>Загрузка квестов...</p>
      ) : (
        <>
          <h2>Активные квесты ({activeQuests.length})</h2>
          {activeQuests.length === 0 ? (
            <p>Нет активных квестов</p>
          ) : (
            <div style={{ marginBottom: 30, display: "flex", flexDirection: "column", gap: 15 }}>
              {activeQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} active />
              ))}
            </div>
          )}

          <h2>Прошедшие квесты ({pastQuests.length})</h2>
          {pastQuests.length === 0 ? (
            <p>Нет прошедших квестов</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {pastQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} active={false} />
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 30 }}>
        <Link href="/" style={{ color: "#0070f3" }}>← На главную</Link>
      </div>
    </div>
  )
}

/* 
   КАРТОЧКА КВЕСТА
*/

function QuestCard({ quest, active }: { quest: Quest, active: boolean }) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/quests?id=${quest.id}`)}
      style={{
        border: "1px solid #ddd",
        padding: 15,
        borderRadius: 8,
        background: active ? "#f0f9ff" : "#f9f9f9",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#0070f3" }}>
        {quest.title}
      </h3>

      <p style={{ margin: "0 0 10px 0", color: "#666" }}>
        {quest.description.length > 100
          ? `${quest.description.slice(0, 100)}...`
          : quest.description}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span style={{ fontWeight: "bold", color: active ? "green" : "gray" }}>
          {active ? "Активен" : "Завершён"}
        </span>
        <span style={{ color: "#555" }}>
            {formatDateTime(quest.active_from)} — {formatDateTime(quest.active_to)}
        </span>
      </div>
    </div>
  )
}

/* 
   ДЕТАЛИ КВЕСТА
*/

function QuestDetail({ quest, onBack }: { quest: Quest, onBack: () => void }) {
  const router = useRouter()
  const active = isQuestActive(quest)

  function handlePlay() {
    if (active) {
      router.push(`/quests/${quest.id}/play`) // В зачёт
    } else {
      router.push(`/quests/${quest.id}/play?mode=practice`) // Ознакомительный режим
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#0070f3",
          cursor: "pointer",
          fontSize: 16,
          padding: 0,
          marginBottom: 20
        }}
      >
        ← Назад к списку
      </button>

      <h1>{quest.title}</h1>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>{quest.description}</p>

      <div style={{
        backgroundColor: active ? "#e8f5e9" : "#f5f5f5",
        padding: 15,
        borderRadius: 8,
        margin: "20px 0"
      }}>
        <strong>Период активности:</strong><br />
        {formatDateTime(quest.active_from)} — {formatDateTime(quest.active_to)}
      </div>

      <p style={{ fontSize: 18 }}>
        Статус:{" "}
        <strong style={{ color: active ? "green" : "gray" }}>
          {active ? "Активен (в зачёт)" : "Неактивен (ознакомление)"}
        </strong>
      </p>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={handlePlay}  // ← Добавляем обработчик
          style={{
            padding: "12px 24px",
            background: active ? "green" : "#666",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            cursor: "pointer"
          }}
        >
          {active ? "Пройти квест в зачёт" : "Пройти в ознакомительном режиме"}
        </button>
      </div>
    </div>
  )
}