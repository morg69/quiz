"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createQuest } from "@/lib/api"

export default function CreateQuestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    description: "",
    active_from: "",
    active_to: "",
  })

  function toISO(v: string) {
    return new Date(v).toISOString()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    await createQuest({
      title: form.title,
      description: form.description,
      active_from: toISO(form.active_from),
      active_to: toISO(form.active_to),
    })

    router.push("/admin")
  }

  return (
    <form onSubmit={submit} style={{ padding: 20 }}>
      <h1>Создание квеста</h1>

      <input name="title" placeholder="Название" onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea name="description" placeholder="Описание" onChange={e => setForm({ ...form, description: e.target.value })} />

      <input type="datetime-local" onChange={e => setForm({ ...form, active_from: e.target.value })} />
      <input type="datetime-local" onChange={e => setForm({ ...form, active_to: e.target.value })} />

      <button type="submit">Создать</button>
    </form>
  )
}
