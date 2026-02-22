import { Quest, QuestContent } from "@/types/quest"

const BASE_URL = "http://localhost:8080"

export async function getQuests(filter = "all"): Promise<Quest[]> {
  const res = await fetch(`${BASE_URL}/api/quests?filter=${filter}`)

  if (!res.ok) {
    throw new Error("Ошибка загрузки квестов")
  }

  const data = await res.json()
  return data.quests
}
export async function getQuestContent(
  id: string | number,
  admin?: boolean  // ← добавляем параметр
): Promise<QuestContent> {
  // Добавляем параметр в URL если admin=true
  const url = admin 
    ? `${BASE_URL}/api/quests/${id}/content?admin=true`
    : `${BASE_URL}/api/quests/${id}/content`
  
  const res = await fetch(url)

  if (res.status === 404) {
    return {
      questions: [],
      settings: {
        shuffle_questions: false,
        show_correct_answers: true,
        attempts_allowed: 1
      }
    }
  }

  if (!res.ok) {
    throw new Error("Ошибка загрузки контента квеста")
  }

  return res.json()
}
export async function saveQuestContent(
  id: string | number,
  content: QuestContent
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/quests/${id}/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Ошибка сохранения контента")
  }
}
export async function createQuest(data: {
  title: string
  description: string
  active_from: string
  active_to: string
}) {
  const res = await fetch(`${BASE_URL}/api/quests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Ошибка создания квеста")
  }

  return res.json()
}

export async function updateQuest(
  id: string | number,
  data: Partial<Omit<Quest, "id">>
): Promise<Quest> {
  const res = await fetch(`${BASE_URL}/api/quests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Ошибка обновления квеста")
  }

  return res.json()
}

export async function deleteQuest(id: string | number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/quests/${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Ошибка удаления квеста")
  }
}
