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
  evaluation_result: EvaluationResult | null
}

export interface SessionListItem {
  session_id: string
  job_id: string
  status: "active" | "completed" | "abandoned" | "expired"
  current_question_index: number
  total_questions: number
  created_at: string
}

export interface ListSessionsResponse {
  sessions: SessionListItem[]
  total: number
}

export interface JobAuditCandidate {
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean
  interview_status: "pending" | "active" | "completed" | "abandoned" | "expired"
  interview_score: string | null
  rank: number | null
  account_activated: boolean
  invitation_sent: boolean
  notifications_sent: string[]
  is_winner: boolean
  session_id: string | null
}

export interface JobAuditResponse {
  job_id: string
  title: string
  status: "active" | "closed"
  interview_deadline: string | null
  deadline_passed: boolean
  closed_at: string | null
  winner_candidate_id: string | null
  winner_nombre: string | null
  ready_to_close: boolean
  total_apto: number
  total_completed_interviews: number
  all_candidates: JobAuditCandidate[]
}

export interface CloseJobResponse {
  job_id: string
  status: "closed"
  winner_candidate_id: string | null
  winner_nombre: string | null
  winner_score: string | null
  sessions_expired: number
  notifications_sent: number
}

export interface AdminSessionDetail {
  session_id: string
  job_id: string | null
  candidate_id: string | null
  status: string
  current_question_index: number
  total_questions: number
  messages: SessionMessage[]
  evaluation_result: EvaluationResult | null
  context_summary: Record<string, unknown> | null
}

export interface JobMetricsCandidate {
  nombre: string
  interview_status: string
  dimensions_answered: number
  dimensions_locked: string[]
  current_dimension: string | null
  final_score: string | null
}

export interface JobMetricsFunnelStep {
  dimension_id: string
  reached_count: number
  completed_count: number
}

export interface JobMetricsResponse {
  candidates: JobMetricsCandidate[]
  funnel: JobMetricsFunnelStep[]
  completion_rate: string
}

// ─── notifications / email monitoring ───────────────────────────────────────

export type EmailDeliveryStatus = "queued" | "sent" | "failed"
export type EmailNotificationType = "winner" | "rejection" | "interview_invitation"

export interface EmailNotificationItem {
  notification_id: string
  candidate_name: string
  candidate_email: string | null
  notification_type: EmailNotificationType
  delivery_status: EmailDeliveryStatus
  delivery_error: string | null
  sent_at: string
  delivered_at: string | null
}

export interface JobNotificationsResponse {
  job_id: string
  total: number
  sent: number
  queued: number
  failed: number
  notifications: EmailNotificationItem[]
}

export interface EmailHealthResponse {
  status: "ok" | "error"
  host: string
  port: number
  error: string | null
}
