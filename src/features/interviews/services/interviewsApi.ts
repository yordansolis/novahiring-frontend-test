import { candidateFetch } from "@/lib/api"
import type {
  CreateSessionResponse,
  SendMessageResponse,
  GetSessionResponse,
} from "../types"

async function handleOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    throw {
      status: res.status,
      ...(typeof body["error"] === "string" ? { error: body["error"] } : {}),
      ...(typeof body["session_id"] === "string" ? { session_id: body["session_id"] } : {}),
    }
  }
  return res.json() as Promise<T>
}

export async function createSession(): Promise<CreateSessionResponse> {
  const res = await candidateFetch("/interviews/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  })
  if (res.status === 409) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    // FastAPI wraps error details under "detail": { error, session_id }
    const detail =
      typeof body["detail"] === "object" && body["detail"] !== null
        ? (body["detail"] as Record<string, unknown>)
        : body
    const sessionId =
      typeof detail["session_id"] === "string" ? detail["session_id"] : undefined
    throw {
      status: 409,
      error:
        typeof detail["error"] === "string" ? detail["error"] : "session_already_exists",
      ...(sessionId !== undefined ? { session_id: sessionId } : {}),
    }
  }
  return handleOk<CreateSessionResponse>(res)
}

export async function sendMessage(
  sessionId: string,
  content: string
): Promise<SendMessageResponse> {
  const res = await candidateFetch(`/interviews/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
  return handleOk<SendMessageResponse>(res)
}

export async function getSession(sessionId: string): Promise<GetSessionResponse> {
  const res = await candidateFetch(`/interviews/sessions/${sessionId}`)
  return handleOk<GetSessionResponse>(res)
}

export async function interruptSession(sessionId: string): Promise<void> {
  await candidateFetch(`/interviews/sessions/${sessionId}/interrupt`, { method: "POST" })
}
