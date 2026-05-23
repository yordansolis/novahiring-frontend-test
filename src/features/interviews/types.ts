export interface SessionMessage {
  role: "assistant" | "user"
  content: string
  sequence_number: number
}

export interface DimensionScore {
  dimension_id: string
  score: string
  peso: number
  justificacion: string
  evidencia: string
}

export interface EvaluationResult {
  session_id: string
  evaluation_id: string
  weighted_score: string
  normalized_score: string
  resultado: "APTO" | "DESCARTADO"
  dimension_scores: DimensionScore[]
}

export interface NextQuestion {
  dimension_id: string
  dimension_name: string
  question_text: string
  question_number: number
  total_questions: number
}

export interface CreateSessionResponse {
  session_id: string
  status: "active"
  message: SessionMessage
  next_question: NextQuestion
}

export interface SendMessageResponse {
  message_saved: boolean
  session_status: "active" | "completed" | "abandoned"
  next_question: NextQuestion | null
  evaluation_result: EvaluationResult | null
}

export interface GetSessionResponse {
  session_id: string
  job_id: string
  candidate_id: string
  status: "active" | "completed" | "abandoned" | "expired"
  current_question_index: number
  total_questions: number
  messages: SessionMessage[]
}
