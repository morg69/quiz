"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { updateQuest } from "@/lib/api"
import { Quest } from "@/types/quest"
import { getQuests } from "@/lib/api"

const BASE_URL = "http://localhost:8080"

export default function EditQuestPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    active_from: "",
    active_to: ""
  })

  
  useEffect(() => {
    loadQuest()
  }, [])

  function toRFC3339(local?: string) {
    if (!local) return undefined
    return new Date(local).toISOString()
  }


  async function loadQuest() {
    try {
      const quests = await getQuests("all")
      const quest = quests.find(q => q.id === id)

      if (!quest) {
        throw new Error("Квест не найден")
      }

      setForm({
        title: quest.title,
        description: quest.description,
        active_from: quest.active_from.slice(0, 16),
        active_to: quest.active_to.slice(0, 16)
      })
    } catch (error) {
      console.error(error)
      alert("Не удалось загрузить квест")
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      await updateQuest(id, {
        title: form.title,
        description: form.description,
        active_from: toRFC3339(form.active_from),
        active_to: toRFC3339(form.active_to)
      })

      alert("Квест обновлён")
      router.push("/admin")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Ошибка обновления")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p style={{ padding: 20 }}>Загрузка...</p>
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <Link href="/admin" style={{ color: "#0070f3" }}>
        ← Назад
      </Link>

      <h1 style={{ marginTop: 20 }}>Редактирование квеста</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 30 }}
      >
        <div>
          <label>Название</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div>
          <label>Описание</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div>
          <label>Начало</label>
          <input
            type="datetime-local"
            name="active_from"
            value={form.active_from}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div>
          <label>Конец</label>
          <input
            type="datetime-local"
            name="active_to"
            value={form.active_to}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px",
            background: saving ? "#999" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 6
          }}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>
    </div>
    
  )
}
