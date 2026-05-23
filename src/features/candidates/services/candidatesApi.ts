import { adminFetch } from "@/lib/api"
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

export async function getCandidates(jobId: string): Promise<CandidateListItem[]> {
  const res = await adminFetch(`/candidates/${jobId}`)
  await throwOnError(res)
  return res.json() as Promise<CandidateListItem[]>
}

export async function getCvAudit(jobId: string): Promise<CvAuditItem[]> {
  const res = await adminFetch(`/candidates/${jobId}/cvs`)
  await throwOnError(res)
  return res.json() as Promise<CvAuditItem[]>
}

export async function triggerEvaluation(jobId: string): Promise<EvaluateResponse> {
  const res = await adminFetch(`/candidates/${jobId}/evaluate`, { method: "POST" })
  await throwOnError(res)
  return res.json() as Promise<EvaluateResponse>
}
