export interface AdminLoginRequest {
  email: string
  password: string
}

export interface RecruiterUser {
  id: string
  email: string
  nombre: string
  rol: string
  tenant_id: string
}

export interface AdminLoginResponse {
  access_token: string
  token_type: "bearer"
  expires_in: number
  user: RecruiterUser
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
  adminToken: "nova_admin_token",
  candidateToken: "nova_candidate_token",
  candidateId: "nova_candidate_id",
  candidateJobId: "nova_candidate_job_id",
  candidateUsername: "nova_candidate_username",
} as const
