import { publicFetch } from "@/lib/api"
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AuthError,
  CandidateLoginRequest,
  CandidateLoginResponse,
  CvUploadFields,
  CvUploadResponse,
} from "@/features/auth/types"

function authErrorFromBody(status: number, body: Record<string, unknown>): AuthError {
  const detail = body["detail"]
  if (typeof detail === "string") {
    return { status, detail }
  }
  if (typeof detail === "object" && detail !== null) {
    const d = detail as Record<string, unknown>
    return {
      status,
      ...(typeof d["error"] === "string" ? { error: d["error"] } : {}),
      ...(typeof d["message"] === "string" ? { detail: d["message"] } : {}),
    }
  }
  return {
    status,
    ...(typeof body["error"] === "string" ? { error: body["error"] } : {}),
    ...(typeof body["message"] === "string" ? { detail: body["message"] } : {}),
  }
}

async function throwOnError(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    throw authErrorFromBody(res.status, body)
  }
}

export async function loginAdmin(
  req: AdminLoginRequest
): Promise<AdminLoginResponse> {
  const res = await publicFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  await throwOnError(res)
  return res.json() as Promise<AdminLoginResponse>
}

export async function loginCandidate(
  req: CandidateLoginRequest
): Promise<CandidateLoginResponse> {
  const res = await publicFetch("/auth/candidate/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  await throwOnError(res)
  return res.json() as Promise<CandidateLoginResponse>
}

export async function uploadCv(
  fields: CvUploadFields
): Promise<CvUploadResponse> {
  const form = new FormData()
  form.append("job_id", fields.job_id)
  form.append("nombre", fields.nombre)
  form.append("email", fields.email)
  form.append("cv_file", fields.cv_file)

  const res = await publicFetch("/candidates/upload", {
    method: "POST",
    body: form,
  })
  await throwOnError(res)
  return res.json() as Promise<CvUploadResponse>
}
