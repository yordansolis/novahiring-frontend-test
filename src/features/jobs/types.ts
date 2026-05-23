export interface JobOffer {
  job_id: string
  title: string
  offer_text: string
}

export interface KoCriterion {
  id: string
  descripcion: string
  razon: string
  is_eliminatory: boolean
}

export interface ScorecardDimension {
  id: string
  nombre: string
  peso: number
  rubricas: {
    "1": string
    "2": string
    "3": string
    "4": string
    "5": string
  }
}

export interface JobProfile {
  required_skills: string[]
  ko_criteria: KoCriterion[]
  scorecard: ScorecardDimension[]
  total_weight: number
}

export interface RankingCandidate {
  candidate_id: string
  nombre?: string
  resultado: "APTO" | "DESCARTADO"
  passed_ko: boolean
  weighted_score: string | null
}

export interface JobRanking {
  candidates: RankingCandidate[]
}

export interface JobListItem {
  job_id: string
  title: string
  niche: string
  status: string
  tenant_id: string
}

export interface JobListResponse {
  jobs: JobListItem[]
  total: number
}

export interface CreateJobRequest {
  title: string
  niche: string
  tenant_id?: string
  offer_text?: string
}
