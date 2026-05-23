import { adminFetch } from "@/lib/api"
import type {
  JobOffer,
  JobProfile,
  JobRanking,
  JobListResponse,
  JobListItem,
  CreateJobRequest,
} from "@/features/jobs/types"

async function throwOnError(res: Response): Promise<void> {
  if (!res.ok) {
    throw new Error(`Error ${res.status}`)
  }
}

export async function getJobOffer(jobId: string): Promise<JobOffer> {
  const res = await adminFetch(`/jobs/${jobId}/offer`)
  await throwOnError(res)
  return res.json() as Promise<JobOffer>
}

export async function getJobProfile(jobId: string): Promise<JobProfile> {
  const res = await adminFetch(`/jobs/${jobId}/profile`)
  await throwOnError(res)
  return res.json() as Promise<JobProfile>
}

export async function getJobRanking(jobId: string): Promise<JobRanking> {
  const res = await adminFetch(`/jobs/${jobId}/ranking`)
  await throwOnError(res)
  return res.json() as Promise<JobRanking>
}

export async function getJobReport(jobId: string): Promise<string> {
  const res = await adminFetch(`/jobs/${jobId}/report`)
  await throwOnError(res)
  return res.text()
}

export async function getJobs(): Promise<JobListResponse> {
  const res = await adminFetch("/jobs")
  await throwOnError(res)
  return res.json() as Promise<JobListResponse>
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
