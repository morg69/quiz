"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Quest } from "@/types/quest"
import { getQuests, deleteQuest } from "@/lib/api"
import { formatDateTime } from "@/lib/date"
import { isQuestActive } from "@/lib/quests"

export default function AdminPage() {
  const router = useRouter()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadQuests()
  }, [])

  async function loadQuests() {
    try {
      const data = await getQuests("all")
      setQuests(data)
    } catch (error) {
      console.error("Ошибка загрузки:", error)
      alert("Ошибка загрузки квестов")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить этот квест?")) return

    setDeletingId(id)
    try {
      await deleteQuest(id)
      // Обновляем список
      setQuests(quests.filter(q => q.id !== id))
      alert("Квест удалён")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Ошибка удаления")
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(id: string) {
    router.push(`/admin/edit/${id}`)
  }

  function handleCreate() {
    router.push("/admin/create")
  }

  if (loading) {
    return (
      <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
        <p>Загрузка квестов...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1>Админ панель</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/quests")}
            style={{
              padding: "8px 16px",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            К пользовательской части
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: "8px 16px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            + Создать квест
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#0070f3" }}>← На главную</Link>
      </div>

      {quests.length === 0 ? (
        <p>Нет созданных квестов</p>
      ) : (
        <div style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Название</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Статус</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Период</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Создан</th>
                <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {quests.map(quest => (
                <tr key={quest.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px 16px" }}>{quest.id}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <strong>{quest.title}</strong>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      {quest.description.length > 50 
                        ? `${quest.description.slice(0, 50)}...`
                        : quest.description}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: isQuestActive(quest) ? "#e8f5e9" : "#f5f5f5",
                      color: isQuestActive(quest) ? "green" : "#666",
                      fontSize: 14,
                      fontWeight: "bold"
                    }}>
                      {isQuestActive(quest) ? "Активен" : "Завершён"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    <div>{formatDateTime(quest.active_from)}</div>
                    <div>до</div>
                    <div>{formatDateTime(quest.active_to)}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>
                    {quest.created_at ? formatDateTime(quest.created_at) : "-"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(quest.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#0070f3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 14
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(quest.id)}
                        disabled={deletingId === quest.id}
                        style={{
                          padding: "6px 12px",
                          background: deletingId === quest.id ? "#999" : "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: deletingId === quest.id ? "not-allowed" : "pointer",
                          fontSize: 14
                        }}
                      >
                        {deletingId === quest.id ? "Удаление..." : "Удалить"}
                      </button>
                      <button
                        onClick={() => router.push(`/admin/quests/${quest.id}/content`)}
                        style={{
                          padding: "6px 12px",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 14
                        }}
                      >
                        Вопросы
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}