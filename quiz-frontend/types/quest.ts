export interface Quest {
  id: string          
  title: string
  description: string
  active_from: string
  active_to: string
  created_at?: string
  updated_at?: string
}

export type QuestionType = "single_choice" | "multiple_choice" | "text"

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  text: string
  options?: QuestionOption[]
  correct_answer?: string | string[]
  points: number
  explanation?: string
  order: number
}

export interface QuestSettings {
  shuffle_questions: boolean
  show_correct_answers: boolean
  attempts_allowed: number
  time_limit_minutes?: number
}

export interface QuestContent {
  questions: Question[]
  settings: QuestSettings
}