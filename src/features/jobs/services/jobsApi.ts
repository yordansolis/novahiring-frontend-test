import { adminFetch } from "@/lib/api"
import { getCached } from "@/lib/cache"
import type {
  JobOffer,
  JobProfile,
  JobRanking,
  JobListResponse,
  JobListItem,
  CreateJobRequest,
} from "@/features/jobs/types"
import type {
  JobAuditResponse,
  CloseJobResponse,
  JobMetricsResponse,
  JobNotificationsResponse,
  EmailHealthResponse,
} from "@/features/interviews/types"

async function throwOnError(res: Response): Promise<void> {
  if (!res.ok) {
    throw new Error(`Error ${res.status}`)
  }
}

export function getJobOffer(jobId: string, force = false): Promise<JobOffer> {
  return getCached(
    `offer:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/offer`)
      await throwOnError(res)
      return res.json() as Promise<JobOffer>
    },
    { ttl: 300_000, force }
  )
}

export function getJobProfile(jobId: string, force = false): Promise<JobProfile> {
  return getCached(
    `profile:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/profile`)
      await throwOnError(res)
      return res.json() as Promise<JobProfile>
    },
    { ttl: 300_000, force }
  )
}

export function getJobRanking(jobId: string, force = false): Promise<JobRanking> {
  return getCached(
    `ranking:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/ranking`)
      await throwOnError(res)
      return res.json() as Promise<JobRanking>
    },
    { ttl: 60_000, force }
  )
}

export function getJobReport(jobId: string, force = false): Promise<string> {
  return getCached(
    `report:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/report`)
      await throwOnError(res)
      return res.text()
    },
    { ttl: 300_000, force }
  )
}

export function getJobs(force = false): Promise<JobListResponse> {
  return getCached(
    `jobs:list`,
    async () => {
      const res = await adminFetch("/jobs")
      await throwOnError(res)
      return res.json() as Promise<JobListResponse>
    },
    { ttl: 60_000, force }
  )
}

export async function createJob(data: CreateJobRequest): Promise<JobListItem> {
  const res = await adminFetch("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  await throwOnError(res)
  return res.json() as Promise<JobListItem>
}

export function getJobAudit(jobId: string, force = false): Promise<JobAuditResponse> {
  return getCached(
    `audit:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/audit`)
      await throwOnError(res)
      return res.json() as Promise<JobAuditResponse>
    },
    { force }
  )
}

export function getJobMetrics(jobId: string, force = false): Promise<JobMetricsResponse> {
  return getCached(
    `metrics:${jobId}`,
    async () => {
      const res = await adminFetch(`/jobs/${jobId}/metrics`)
      await throwOnError(res)
      return res.json() as Promise<JobMetricsResponse>
    },
    { ttl: 30_000, force }
  )
}

// Not cached — real-time polling data
export async function getJobNotifications(jobId: string): Promise<JobNotificationsResponse> {
  const res = await adminFetch(`/notifications/${jobId}`)
  await throwOnError(res)
  return res.json() as Promise<JobNotificationsResponse>
}

// Not cached — real-time SMTP health
export async function getEmailHealth(): Promise<EmailHealthResponse> {
  const res = await adminFetch("/notifications/health/email")
  await throwOnError(res)
  return res.json() as Promise<EmailHealthResponse>
}

export async function closeJob(jobId: string): Promise<CloseJobResponse> {
  const res = await adminFetch(`/jobs/${jobId}/close`, { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const detail =
      typeof body["detail"] === "object" && body["detail"] !== null
        ? (body["detail"] as Record<string, unknown>)
        : body
    throw { status: res.status, error: detail["error"] ?? `Error ${res.status}` }
  }
  return res.json() as Promise<CloseJobResponse>
}
