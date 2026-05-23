export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  api_key: string
  token_type: "api-key"
}

export interface CandidateLoginRequest {
  username: string
  password: string
}

export interface CandidateLoginResponse {
  token: string
  token_type: "bearer"
  candidate_id: string
  job_id: string
}

export interface CvUploadFields {
  job_id: string
  nombre: string
  email: string
  cv_file: File
}

export interface CvUploadResponse {
  candidate_id: string
  status: "received"
  passed_ko: boolean
}

export interface AuthError {
  status: number
  error?: string
  detail?: string
}

export const STORAGE_KEYS = {
  adminApiKey: "nova_admin_api_key",
  candidateToken: "nova_candidate_token",
  candidateId: "nova_candidate_id",
  candidateJobId: "nova_candidate_job_id",
} as const
