import { STORAGE_KEYS } from "@/features/auth/types"

const BASE =
  process.env.NEXT_PUBLIC_BACKEND ?? "http://localhost:8000/api/v1"

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEYS.adminApiKey)
  window.location.href = "/login/admin"
}

export function logoutCandidate(): void {
  localStorage.removeItem(STORAGE_KEYS.candidateToken)
  localStorage.removeItem(STORAGE_KEYS.candidateId)
  localStorage.removeItem(STORAGE_KEYS.candidateJobId)
  window.location.href = "/login/candidate"
}

export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = localStorage.getItem(STORAGE_KEYS.adminApiKey) ?? ""
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...options.headers,
    },
  })
  if (res.status === 401 || res.status === 403) {
    logoutAdmin()
  }
  return res
}

export async function candidateFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem(STORAGE_KEYS.candidateToken) ?? ""
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (res.status === 401 || res.status === 403) {
    logoutCandidate()
  }
  return res
}

export async function publicFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE}${path}`, options)
}

export function hasAdminKey(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.adminApiKey)
}

export function hasCandidateToken(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.candidateToken)
}
