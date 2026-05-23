"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  Square,
  CheckCircle2,
  XCircle,
  LogOut,
  Trophy,
} from "lucide-react"

import { hasCandidateToken, logoutCandidate } from "@/lib/api"

const SESSION_STORAGE_KEY = "nova_session_id"
import { Button } from "@/components/ui/button"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import dynamic from "next/dynamic"
const Orb = dynamic(
  () => import("@/components/ui/orb").then((m) => ({ default: m.Orb })),
  { ssr: false }
)
import { Response } from "@/components/ui/response"
import {
  createSession,
  sendMessage,
  getSession,
  interruptSession,
} from "@/features/interviews/services/interviewsApi"
import type {
  SessionMessage,
  NextQuestion,
  EvaluationResult,
} from "@/features/interviews/types"

type PageStatus =
  | "init"
  | "ready"
  | "sending"
  | "busy"
  | "completed"
  | "error"
  | "ineligible"
  | "expired"

const ORB_COLORS: [string, string] = ["#4f93f8", "#2563eb"]

// ─── Shared layout wrapper ───────────────────────────────────────────────────

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ds-background-100)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  )
}

// ─── Loading ─────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <CenteredScreen>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="size-16">
          <Orb colors={ORB_COLORS} agentState="thinking" className="size-16" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ds-gray-700)]">Iniciando entrevista</p>
          <p className="mt-1 text-xs text-[var(--ds-gray-500)]">Preparando tu sesión...</p>
        </div>
      </div>
    </CenteredScreen>
  )
}

// ─── Error ───────────────────────────────────────────────────────────────────

function ErrorScreen({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry?: () => void
}) {
  return (
    <CenteredScreen>
      <div className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--ds-accent-red)]/10">
          <XCircle className="size-6 text-[var(--ds-accent-red)]" />
        </div>
        <h2 className="text-base font-semibold text-[var(--ds-gray-1000)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--ds-gray-600)]">{message}</p>
        {onRetry !== undefined && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-6 rounded-full">
            Intentar de nuevo
          </Button>
        )}
      </div>
    </CenteredScreen>
  )
}

// ─── Result ──────────────────────────────────────────────────────────────────

function ResultScreen({ result }: { result: EvaluationResult }) {
  const isApto = result.resultado === "APTO"
  const accentVar = isApto ? "var(--ds-accent-green)" : "var(--ds-accent-red)"

  return (
    <div className="min-h-screen bg-[var(--ds-background-100)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween" as const, duration: 0.38, ease: "easeOut" as const }}
        className="mx-auto max-w-xl space-y-4"
      >
        <div className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] p-6 text-center">
          <div
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
            style={{ background: `color-mix(in srgb, ${accentVar} 12%, transparent)` }}
          >
            {isApto ? (
              <Trophy className="size-7" style={{ color: accentVar }} />
            ) : (
              <XCircle className="size-7" style={{ color: accentVar }} />
            )}
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: `color-mix(in srgb, ${accentVar} 12%, transparent)`,
              color: accentVar,
            }}
          >
            {isApto ? "RECOMENDADO" : "NO RECOMENDADO"}
          </span>
          <div className="mt-4">
            <p className="text-3xl font-semibold tabular-nums text-[var(--ds-gray-1000)]">
              {result.weighted_score}
              <span className="ml-1 text-lg font-normal text-[var(--ds-gray-500)]">/ 5</span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--ds-gray-500)]">Puntuación final</p>
          </div>
        </div>

        {result.dimension_scores.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)]">
            <div className="border-b border-[var(--ds-border)] px-5 py-3">
              <p className="text-xs font-medium text-[var(--ds-gray-500)]">
                Desglose por dimensión
              </p>
            </div>
            <div className="divide-y divide-[var(--ds-border)]">
              {result.dimension_scores.map((d) => (
                <div key={d.dimension_id} className="px-5 py-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-[var(--ds-gray-500)]">
                      {d.dimension_id}
                    </span>
                    <span className="tabular-nums text-sm font-semibold text-[var(--ds-gray-1000)]">
                      {d.score}/5
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--ds-gray-600)]">
                    {d.justificacion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] p-5 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-5 text-[var(--ds-accent-green)]" />
          <p className="text-sm font-medium text-[var(--ds-gray-700)]">
            Gracias por completar la entrevista
          </p>
          <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
            El equipo de selección revisará los resultados y te contactará pronto.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function InterviewPage() {
  const router = useRouter()
  const [pageStatus, setPageStatus] = useState<PageStatus>("init")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [nextQuestion, setNextQuestion] = useState<NextQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [input, setInput] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pollSession = useCallback(async (sid: string) => {
    try {
      const sess = await getSession(sid)
      setMessages(sess.messages)
      setQuestionIndex(sess.current_question_index)
      if (sess.status === "completed") {
        setPageStatus("completed")
      } else if (sess.status === "abandoned" || sess.status === "expired") {
        setPageStatus("expired")
      } else {
        const lastMsg = sess.messages.at(-1)
        if (lastMsg?.role === "user") {
          retryTimerRef.current = setTimeout(() => void pollSession(sid), 3000)
        } else {
          setPageStatus("ready")
        }
      }
    } catch {
      setPageStatus("ready")
    }
  }, [])

  const initSession = useCallback(async () => {
    try {
      const resp = await createSession()
      localStorage.setItem(SESSION_STORAGE_KEY, resp.session_id)
      setSessionId(resp.session_id)
      setMessages([
        resp.message,
        {
          role: "assistant" as const,
          content: resp.next_question.question_text,
          sequence_number: resp.message.sequence_number + 1,
        },
      ])
      setNextQuestion(resp.next_question)
      setPageStatus("ready")
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string; session_id?: string }
      if (e.status === 401 || e.status === 403) {
        router.replace("/login/candidate")
      } else if (e.status === 409) {
        const sid = e.session_id ?? localStorage.getItem(SESSION_STORAGE_KEY)
        if (sid) {
          setSessionId(sid)
          await pollSession(sid)
        } else {
          setPageStatus("error")
          setErrorMsg("Ya existe una sesión activa pero no se pudo recuperar. Contacta al equipo de selección.")
        }
      } else if (e.status === 422) {
        setPageStatus("ineligible")
      } else {
        setPageStatus("error")
        setErrorMsg("No se pudo iniciar la entrevista.")
      }
    }
  }, [pollSession, router])

  useEffect(() => {
    if (!hasCandidateToken()) {
      router.replace("/login/candidate")
      return
    }
    void initSession()
  }, [initSession, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  async function handleSend() {
    if (!sessionId || !input.trim() || pageStatus !== "ready") return
    const sid = sessionId
    const content = input.trim()
    setInput("")
    setErrorMsg(null)
    setPageStatus("sending")

    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content, sequence_number: prev.length + 1 },
    ])

    try {
      const resp = await sendMessage(sid, content)
      if (resp.session_status === "completed") {
        if (resp.evaluation_result) setEvaluationResult(resp.evaluation_result)
        setPageStatus("completed")
      } else if (resp.session_status === "abandoned") {
        setPageStatus("expired")
      } else {
        const q = resp.next_question
        if (q) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant" as const, content: q.question_text, sequence_number: prev.length + 1 },
          ])
          setNextQuestion(q)
          setQuestionIndex(q.question_number - 1)
        }
        setPageStatus("ready")
      }
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string }
      if (e.status === 409 || e.error === "session_busy") {
        setPageStatus("busy")
        retryTimerRef.current = setTimeout(() => void pollSession(sid), 3000)
      } else if (e.status === 410) {
        setPageStatus("expired")
      } else {
        setMessages((prev) => prev.slice(0, -1))
        setPageStatus("ready")
        setErrorMsg("Error al enviar. Inténtalo de nuevo.")
      }
    }
  }

  async function handleInterrupt() {
    if (!sessionId) return
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    try {
      await interruptSession(sessionId)
    } catch {
      // ignore — set expired regardless
    }
    setPageStatus("expired")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSend()
    }
  }

  const dimensionNumber = nextQuestion?.question_number ?? (questionIndex + 1)
  const dimensionName = nextQuestion?.dimension_name
  const progress = Math.round((dimensionNumber / 8) * 100)
  const isProcessing = pageStatus === "busy" || pageStatus === "sending"

  // ── Gate screens ──────────────────────────────────────────────────────────

  if (pageStatus === "init") return <LoadingScreen />

  if (pageStatus === "ineligible") {
    return (
      <ErrorScreen
        title="No elegible"
        message="No cumples los requisitos para acceder a la entrevista. Contacta al equipo de selección."
      />
    )
  }

  if (pageStatus === "expired") {
    return (
      <ErrorScreen
        title="Sesión expirada"
        message="Esta sesión ha expirado o fue interrumpida. Contacta al equipo de selección para obtener nuevas credenciales."
      />
    )
  }

  if (pageStatus === "error") {
    return (
      <ErrorScreen
        title="Error de conexión"
        message={errorMsg ?? "Error inesperado. Intenta de nuevo."}
        onRetry={() => {
          setPageStatus("init")
          void initSession()
        }}
      />
    )
  }

  if (pageStatus === "completed") {
    if (evaluationResult) return <ResultScreen result={evaluationResult} />
    return (
      <CenteredScreen>
        <div className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-10 text-[var(--ds-accent-green)]" />
          <h2 className="text-base font-semibold text-[var(--ds-gray-1000)]">
            Entrevista completada
          </h2>
          <p className="mt-2 text-sm text-[var(--ds-gray-600)]">
            Gracias por completar la entrevista. El equipo revisará los resultados y te
            contactará pronto.
          </p>
        </div>
      </CenteredScreen>
    )
  }

  // ── Chat view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-[var(--ds-background-100)]">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--ds-border)] bg-[var(--ds-background-100)]/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0">
            <Orb
              colors={ORB_COLORS}
              agentState={isProcessing ? "thinking" : null}
              className="size-8"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ds-gray-1000)]">Entrevista IA</p>
            {dimensionName !== undefined && (
              <p className="text-xs text-[var(--ds-gray-500)]">{dimensionName}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(SESSION_STORAGE_KEY)
            logoutCandidate()
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--ds-gray-600)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
        >
          <LogOut className="size-3.5" />
          Salir
        </button>
      </header>

      {/* Progress bar */}
      <div className="shrink-0 border-b border-[var(--ds-border)] px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs text-[var(--ds-gray-500)]">
              Dimensión {dimensionNumber} de 8
            </p>
            <p className="text-xs text-[var(--ds-gray-500)]">{progress}%</p>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--ds-background-300)]">
            <motion.div
              className="h-full rounded-full bg-[var(--ds-accent-blue)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "tween" as const, duration: 0.5, ease: "easeOut" as const }}
            />
          </div>
        </div>
      </div>

      {/* Conversation */}
      <Conversation className="min-h-0">
        <ConversationContent>
          <div className="mx-auto max-w-2xl px-6">
            {messages.length === 0 && !isProcessing ? (
              <ConversationEmptyState
                className="min-h-[320px]"
                icon={
                  <div className="size-14">
                    <Orb colors={ORB_COLORS} agentState={null} className="size-14" />
                  </div>
                }
                title={
                  <span className="text-[var(--ds-gray-700)]">
                    Tu entrevista comienza aquí
                  </span>
                }
                description={
                  <span className="text-[var(--ds-gray-500)]">
                    Responde con detalle para obtener la mejor evaluación
                  </span>
                }
              />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.sequence_number ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
                  >
                    <Message from={msg.role}>
                      <MessageContent>
                        <Response>{msg.content}</Response>
                      </MessageContent>
                      {msg.role === "assistant" && (
                        <div className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/[0.14]">
                          <Orb
                            colors={ORB_COLORS}
                            agentState={null}
                            className="h-full w-full"
                          />
                        </div>
                      )}
                    </Message>
                  </motion.div>
                ))}

                {isProcessing && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "tween" as const, duration: 0.22 }}
                  >
                    <Message from="assistant">
                      <MessageContent>
                        <span className="flex items-center gap-2 text-xs text-[var(--ds-gray-600)]">
                          <Loader2 className="size-3.5 animate-spin text-[var(--ds-accent-blue)]" />
                          Procesando tu respuesta...
                        </span>
                      </MessageContent>
                      <div className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/[0.14]">
                        <Orb
                          colors={ORB_COLORS}
                          agentState="thinking"
                          className="h-full w-full"
                        />
                      </div>
                    </Message>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="shrink-0 border-t border-[var(--ds-border)] px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {errorMsg !== null && (
            <p className="mb-2 text-xs text-[var(--ds-accent-red)]">{errorMsg}</p>
          )}
          <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] transition-colors focus-within:border-[var(--ds-accent-blue)]/30">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (errorMsg !== null) setErrorMsg(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder={pageStatus === "ready" ? "Escribe tu respuesta..." : "Procesando..."}
              disabled={pageStatus !== "ready"}
              rows={3}
              className="w-full resize-none bg-transparent px-4 pb-3 pt-3.5 text-sm text-[var(--ds-gray-1000)] placeholder:text-[var(--ds-gray-500)] focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between border-t border-[var(--ds-border)] px-4 py-2.5">
              <span className="text-[10px] text-[var(--ds-gray-500)]">
                {pageStatus === "busy" ? (
                  <button
                    onClick={() => void handleInterrupt()}
                    className="flex items-center gap-1 text-[var(--ds-accent-red)] transition-opacity hover:opacity-80"
                  >
                    <Square className="size-3 fill-current" />
                    Interrumpir sesión
                  </button>
                ) : (
                  "Ctrl+Enter para enviar"
                )}
              </span>
              <Button
                onClick={() => void handleSend()}
                disabled={pageStatus !== "ready" || !input.trim()}
                size="sm"
                className="btn-glow rounded-full border-0"
              >
                {pageStatus === "sending" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
