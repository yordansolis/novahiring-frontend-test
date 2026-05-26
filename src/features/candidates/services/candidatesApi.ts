import { adminFetch } from "@/lib/api"
import { getCached } from "@/lib/cache"
import type { CandidateListItem, CvAuditItem, EvaluateResponse } from "@/features/candidates/types"

async function throwOnError(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const msg = typeof body["error"] === "string"
      ? body["error"]
      : typeof body["detail"] === "string"
        ? body["detail"]
        : `Error ${res.status}`
    throw new Error(msg)
  }
}

export function getCandidates(jobId: string, force = false): Promise<CandidateListItem[]> {
  return getCached(
    `candidates:${jobId}`,
    async () => {
      const res = await adminFetch(`/candidates/${jobId}`)
      await throwOnError(res)
      return res.json() as Promise<CandidateListItem[]>
    },
    { force }
  )
}

export function getCvAudit(jobId: string, force = false): Promise<CvAuditItem[]> {
  return getCached(
    `cvaudit:${jobId}`,
    async () => {
      const res = await adminFetch(`/candidates/${jobId}/cvs`)
      await throwOnError(res)
      return res.json() as Promise<CvAuditItem[]>
    },
    { ttl: 60_000, force }
  )
}

// Not cached — mutation
export async function triggerEvaluation(jobId: string): Promise<EvaluateResponse> {
  const res = await adminFetch(`/candidates/${jobId}/evaluate`, { method: "POST" })
  await throwOnError(res)
  return res.json() as Promise<EvaluateResponse>
}
