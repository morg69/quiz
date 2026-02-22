import { Quest } from "@/types/quest"

export function isQuestActive(quest: Quest): boolean {
  const now = new Date()
  const from = new Date(quest.active_from)
  const to = new Date(quest.active_to)
  
  return now >= from && now <= to
}
