import { adminFetch, publicFetch } from "@/lib/api"
import { getCached } from "@/lib/cache"
import type {
  JobOffer,
  JobProfile,
  JobRanking,
  JobListResponse,
  JobListItem,
  CreateJobRequest,
  JobApplyInfo,
} from "@/features/jobs/types"
import { MAX_CANDIDATES_PER_JOB } from "@/features/jobs/types"
import type {
  JobAuditResponse,
  CloseJobResponse,
  JobMetricsResponse,
  JobNotificationsResponse,
  EmailHealthResponse,
  SendInvitationsResponse,
} from "@/features/interviews/types"

async function throwOnError(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const detail = body["detail"]
    if (typeof detail === "string") {
      throw new Error(detail)
    }
    if (typeof detail === "object" && detail !== null) {
      const d = detail as Record<string, unknown>
      if (typeof d["message"] === "string") {
        throw new Error(d["message"])
      }
      if (typeof d["error"] === "string") {
        throw new Error(d["error"])
      }
    }
    if (res.status === 405) {
      throw new Error("El servidor no permite crear vacantes todavía.")
    }
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

async function jobsFromActiveOffer(): Promise<JobListResponse> {
  const jobId = process.env.NEXT_PUBLIC_JOB_ID
  if (!jobId) {
    throw new Error("Error 404")
  }
  const res = await adminFetch(`/jobs/${jobId}/offer`)
  await throwOnError(res)
  const offer = await res.json() as JobOffer
  return {
    jobs: [
      {
        job_id: offer.job_id,
        title: offer.title,
        niche: "",
        status: "active",
        tenant_id: "",
        candidate_count: 0,
        max_candidates: MAX_CANDIDATES_PER_JOB,
      },
    ],
    total: 1,
  }
}

export async function getJobApplyInfo(jobId: string): Promise<JobApplyInfo> {
  const res = await publicFetch(`/candidates/${jobId}/apply-info`)
  await throwOnError(res)
  return res.json() as Promise<JobApplyInfo>
}

export function getJobs(force = false): Promise<JobListResponse> {
  return getCached(
    `jobs:list`,
    async () => {
      const res = await adminFetch("/jobs")
      if (res.ok) {
        const data = await res.json() as JobListResponse
        return {
          ...data,
          jobs: data.jobs.map((job) => ({
            ...job,
            candidate_count: job.candidate_count ?? 0,
            max_candidates: job.max_candidates ?? MAX_CANDIDATES_PER_JOB,
          })),
        }
      }
      if (res.status === 404) {
        return jobsFromActiveOffer()
      }
      await throwOnError(res)
      throw new Error(`Error ${res.status}`)
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

export async function sendInvitations(jobId: string): Promise<SendInvitationsResponse> {
  const res = await adminFetch(`/notifications/${jobId}/invitations`, { method: "POST" })
  await throwOnError(res)
  return res.json() as Promise<SendInvitationsResponse>
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
