export interface CandidateListItem {
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean | null
  resultado: "APTO" | "DESCARTADO" | null
  weighted_score: string | null
  login_username: string | null
  login_password: string | null
}

export interface CvAuditItem {
  rank: number
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean
  resultado: "APTO" | "DESCARTADO" | null
  weighted_score: string | null
  first_failing_ko: string | null
  cv_text: string
}

export interface EvaluateResponse {
  job_id: string
  queued_candidates: number
  status: "evaluation_started"
}
