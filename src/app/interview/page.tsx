"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Image from "next/image"
import {
  Send,
  Loader2,
  Square,
  XCircle,
  LogOut,
  Menu,
  X,
  Clock,
  MessageSquare,
  ArrowLeft,
  Bot,
} from "lucide-react"

import { hasCandidateToken, logoutCandidate } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import {
  createSession,
  sendMessage,
  getSession,
  interruptSession,
  listSessions,
} from "@/features/interviews/services/interviewsApi"
import type {
  SessionMessage,
  NextQuestion,
  SessionListItem,
  GetSessionResponse,
} from "@/features/interviews/types"

const SESSION_STORAGE_KEY = "nova_session_id"

function playChime() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    let done = 0
    ;[523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      const t = now + i * 0.09
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.start(t)
      osc.stop(t + 0.45)
      osc.onended = () => { if (++done === 2) void ctx.close() }
    })
  } catch { /* audio not supported */ }
}

function TypingDots() {
  const dots = [0, 1, 2] as const
  return (
    <span className="flex items-center gap-1" aria-label="Procesando respuesta">
      {dots.map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-[var(--ds-gray-500)]"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut" as const,
            type: "tween" as const,
          }}
        />
      ))}
    </span>
  )
}

function BotAvatar({
  state = null,
  className = "size-8",
}: {
  state?: null | "thinking"
  className?: string
}) {
  return (
    <Avatar className={cn("rounded-xl after:rounded-xl", className)}>
      <AvatarFallback className="rounded-xl bg-[var(--ds-background-300)]">
        <Bot className="size-[55%] text-[var(--ds-accent-blue)]" strokeWidth={1.75} />
      </AvatarFallback>
      {state === null ? (
        <AvatarBadge className="bg-[var(--ds-accent-green)]" />
      ) : (
        <AvatarBadge className="animate-pulse bg-[var(--ds-accent-amber)]" />
      )}
    </Avatar>
  )
}

type PageStatus =
  | "init"
  | "ready"
  | "sending"
  | "typing"
  | "busy"
  | "completed"
  | "error"
  | "ineligible"
  | "expired"

const STATUS_CONFIG: Record<
  SessionListItem["status"],
  { label: string; color: string }
> = {
  active: { label: "Activa", color: "var(--ds-accent-blue)" },
  completed: { label: "Completada", color: "var(--ds-accent-green)" },
  abandoned: { label: "Interrumpida", color: "var(--ds-gray-500)" },
  expired: { label: "Expirada", color: "var(--ds-accent-amber)" },
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${Math.floor(diffHours / 24)}d`
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SessionsSidebar({
  sessions,
  activeSessionId,
  browsingId,
  onSelect,
  onLogout,
  onClose,
}: {
  sessions: SessionListItem[]
  activeSessionId: string | null
  browsingId: string | null
  onSelect: (session: SessionListItem) => void
  onLogout: () => void
  onClose?: () => void
}) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-white/[0.14] bg-[var(--ds-background-200)]">
      {/* Logo header */}
      <div className="flex items-center justify-between border-b border-white/[0.14] px-4 py-[14px]">
        <Image
          src="/logo-withe.png"
          alt="NovaHiring"
          width={2172}
          height={724}
          className="h-7 w-auto dark:hidden"
        />
        <Image
          src="/logo.png"
          alt="NovaHiring"
          width={1768}
          height={340}
          className="hidden h-7 w-auto dark:block"
        />
        {onClose !== undefined && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--ds-gray-500)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)] lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
          Mis entrevistas
        </p>

        {sessions.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <MessageSquare className="mx-auto mb-2 size-5 text-[var(--ds-gray-500)]" />
            <p className="text-xs text-[var(--ds-gray-500)]">Sin sesiones previas</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session, i) => {
              const cfg = STATUS_CONFIG[session.status]
              const isCurrentActive = session.session_id === activeSessionId && browsingId === null
              const isBrowsing = session.session_id === browsingId
              const isHighlighted = isCurrentActive || isBrowsing
              const dimProgress = Math.round(
                ((session.current_question_index + 1) / session.total_questions) * 100
              )
              return (
                <motion.button
                  key={session.session_id}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -6, scale: 0.98 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    type: "tween" as const,
                    duration: 0.22,
                    ease: "easeOut" as const,
                    delay: i * 0.05,
                  }}
                  onClick={() => onSelect(session)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isHighlighted
                      ? "bg-[var(--ds-background-300)]"
                      : "hover:bg-[var(--ds-background-300)]/60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Bot avatar — active: full color + green badge; inactive: muted */}
                    <Avatar
                      size="sm"
                      className={cn(
                        "mt-0.5 shrink-0 rounded-lg after:rounded-lg transition-opacity",
                        session.status !== "active" && "opacity-40",
                      )}
                    >
                      <AvatarFallback className="rounded-lg bg-[var(--ds-background-300)]">
                        <Bot className="size-[55%] text-[var(--ds-accent-blue)]" strokeWidth={1.75} />
                      </AvatarFallback>
                      {session.status === "active" && (
                        <AvatarBadge className="bg-[var(--ds-accent-green)]" />
                      )}
                    </Avatar>

                    {/* Session info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {isCurrentActive && (
                          <span className="ml-auto text-[10px] font-semibold text-[var(--ds-accent-blue)]">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--ds-gray-600)]">
                          {session.current_question_index + 1}/{session.total_questions} dim.
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--ds-gray-500)]">
                          <Clock className="size-3" />
                          {formatRelativeTime(session.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {session.status === "active" && (
                    <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-[var(--ds-background-100)]">
                      <div
                        className="h-full rounded-full bg-[var(--ds-accent-blue)]"
                        style={{ width: `${dimProgress}%` }}
                      />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-white/[0.14] p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--ds-gray-600)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── Shared centered wrapper ──────────────────────────────────────────────────

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ds-background-100)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "tween" as const, duration: 0.32, ease: "easeOut" as const }}
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
        <BotAvatar state="thinking" className="size-16" />
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [pageStatus, setPageStatus] = useState<PageStatus>("init")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [nextQuestion, setNextQuestion] = useState<NextQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [input, setInput] = useState("")
  const [candidateDisplayName] = useState(() => {
    if (typeof window === "undefined") return "candidato/a"
    const raw = localStorage.getItem("nova_candidate_username") ?? ""
    const segment = raw.split(".").at(0) ?? raw
    const cleaned = segment.replace(/\d+$/, "")
    const name = cleaned || "candidato/a"
    return name.charAt(0).toUpperCase() + name.slice(1)
  })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [browsingId, setBrowsingId] = useState<string | null>(null)
  const [browsingData, setBrowsingData] = useState<GetSessionResponse | null>(null)
  const [browsingLoading, setBrowsingLoading] = useState(false)
  const [typingContent, setTypingContent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSeqNumRef = useRef<number | null>(null)
  const initCalledRef = useRef(false)

  const loadSessions = useCallback(async () => {
    try {
      const data = await listSessions()
      setSessions(data.sessions)
    } catch {
      // Non-critical — sidebar stays empty
    }
  }, [])

  const pollSession = useCallback(
    async (sid: string, animateNew = false, prevMsgCount = 0) => {
      try {
        const sess = await getSession(sid)
        setQuestionIndex(sess.current_question_index)

        if (sess.status === "completed") {
          setMessages(sess.messages)
          setPageStatus("completed")
          void loadSessions()
        } else if (sess.status === "abandoned" || sess.status === "expired") {
          setMessages(sess.messages)
          setPageStatus("expired")
        } else {
          const lastMsg = sess.messages.at(-1)
          if (lastMsg?.role === "user") {
            // Backend hasn't written the AI reply yet — retry
            setMessages(sess.messages)
            retryTimerRef.current = setTimeout(
              () => void pollSession(sid, animateNew, prevMsgCount),
              3000
            )
            return
          }

          if (!animateNew) {
            setMessages(sess.messages)
            setPageStatus("ready")
            return
          }

          // All new assistant messages since the user's last message
          const newAssistantMsgs = sess.messages
            .slice(prevMsgCount + 1)
            .filter((m) => m.role === "assistant")

          if (newAssistantMsgs.length === 0) {
            setMessages(sess.messages)
            setPageStatus("ready")
            return
          }

          // Show messages up to (and including) the user's message, then type each new one
          setMessages(sess.messages.slice(0, prevMsgCount + 1))

          const TICK_MS = 35
          const PAUSE_BETWEEN_MS = 320

          function animateMsgs(msgIdx: number) {
            if (msgIdx >= newAssistantMsgs.length) {
              setTypingContent(null)
              typingSeqNumRef.current = null
              setMessages(sess.messages)
              playChime()
              setPageStatus("ready")
              return
            }

            const msg = newAssistantMsgs[msgIdx]!
            const fullContent = msg.content
            const CHARS_PER_TICK = Math.max(1, Math.ceil(fullContent.length / 70))
            let idx = 0

            typingSeqNumRef.current = msg.sequence_number
            setTypingContent("")
            setPageStatus("typing")

            const tick = () => {
              idx = Math.min(idx + CHARS_PER_TICK, fullContent.length)
              setTypingContent(fullContent.slice(0, idx))
              if (idx < fullContent.length) {
                typingTimerRef.current = setTimeout(tick, TICK_MS)
              } else {
                // Message done — commit it, pause, then start the next
                setMessages((prev) => [...prev, msg])
                setTypingContent(null)
                typingSeqNumRef.current = null
                typingTimerRef.current = setTimeout(
                  () => animateMsgs(msgIdx + 1),
                  PAUSE_BETWEEN_MS
                )
              }
            }

            typingTimerRef.current = setTimeout(tick, TICK_MS)
          }

          animateMsgs(0)
        }
      } catch {
        setPageStatus("ready")
      }
    },
    [loadSessions]
  )

  const initSession = useCallback(async () => {
    // 1. Restore from localStorage
    const storedId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedId) {
      setSessionId(storedId)
      await pollSession(storedId)
      void loadSessions()
      return
    }

    // 2. Discover active session via list endpoint
    try {
      const { sessions: list } = await listSessions()
      setSessions(list)
      const active = list.find((s) => s.status === "active")
      if (active) {
        localStorage.setItem(SESSION_STORAGE_KEY, active.session_id)
        setSessionId(active.session_id)
        await pollSession(active.session_id)
        return
      }
    } catch {
      // Proceed to create new session
    }

    // 3. Create new session
    try {
      const resp = await createSession()
      localStorage.setItem(SESSION_STORAGE_KEY, resp.session_id)
      setSessionId(resp.session_id)
      setMessages([resp.message])
      setNextQuestion(resp.next_question)
      setPageStatus("ready")
      void loadSessions()
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string; session_id?: string }
      if (e.status === 401 || e.status === 403) {
        router.replace("/login/candidate")
      } else if (e.status === 409) {
        const sid = e.session_id ?? localStorage.getItem(SESSION_STORAGE_KEY)
        if (sid) {
          setSessionId(sid)
          await pollSession(sid)
          void loadSessions()
        } else {
          setPageStatus("error")
          setErrorMsg(
            "Ya existe una sesión activa pero no se pudo recuperar. Contacta al equipo de selección."
          )
        }
      } else if (e.status === 422) {
        setPageStatus("ineligible")
      } else {
        setPageStatus("error")
        setErrorMsg("No se pudo iniciar la entrevista.")
      }
    }
  }, [pollSession, router, loadSessions])

  useEffect(() => {
    if (!hasCandidateToken()) {
      router.replace("/login/candidate")
      return
    }
    if (initCalledRef.current) return
    initCalledRef.current = true
    void initSession()
  }, [initSession, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  async function handleSend() {
    if (!sessionId || !input.trim() || pageStatus !== "ready") return
    const sid = sessionId
    const content = input.trim()
    const countBeforeUserMsg = messages.length
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
        // pollSession fetches the final messages (incl. last AI response) and sets pageStatus="completed"
        await pollSession(sid)
      } else if (resp.session_status === "abandoned") {
        setPageStatus("expired")
      } else {
        if (resp.next_question) {
          setNextQuestion(resp.next_question)
        }
        // Poll DB to get the actual AI conversational response (not just raw question_text)
        await pollSession(sid, true, countBeforeUserMsg)
      }
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string }
      if (e.status === 409 || e.error === "session_busy") {
        setPageStatus("busy")
        retryTimerRef.current = setTimeout(() => void pollSession(sid, true, countBeforeUserMsg), 3000)
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
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    try {
      await interruptSession(sessionId)
    } catch {
      // ignore
    }
    setPageStatus("expired")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSend()
    }
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    logoutCandidate()
  }

  async function handleSelectSession(session: SessionListItem) {
    setSidebarOpen(false)
    // Clicking the currently viewed active session → back to live chat
    if (session.session_id === sessionId && browsingId === null) return
    if (session.session_id === sessionId) {
      setBrowsingId(null)
      setBrowsingData(null)
      return
    }
    setBrowsingId(session.session_id)
    setBrowsingData(null)
    setBrowsingLoading(true)
    try {
      const data = await getSession(session.session_id)
      setBrowsingData(data)
    } catch {
      setBrowsingId(null)
    } finally {
      setBrowsingLoading(false)
    }
  }

  const dimensionNumber = nextQuestion?.question_number ?? questionIndex + 1
  const dimensionName = nextQuestion?.dimension_name
  const progress = Math.round((dimensionNumber / 8) * 100)
  const isProcessing = pageStatus === "busy" || pageStatus === "sending" || pageStatus === "typing"

  // Typing message merges into the message list with the same sequence_number key
  // so AnimatePresence treats it as an in-place update — no exit/enter flash
  const displayMessages: SessionMessage[] =
    typingContent !== null && typingSeqNumRef.current !== null
      ? [
          ...messages,
          {
            role: "assistant" as const,
            content: typingContent,
            sequence_number: typingSeqNumRef.current,
          },
        ]
      : messages

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

  // ── Browsing view — past session history ──────────────────────────────────

  if (browsingId !== null) {
    const browsingCfg = browsingData ? STATUS_CONFIG[browsingData.status] : null
    const sessionCompleted = browsingData?.status === "completed"

    return (
      <div className="flex h-screen overflow-hidden bg-[var(--ds-background-100)]">
        <div className="hidden lg:flex">
          <SessionsSidebar
            sessions={sessions}
            activeSessionId={sessionId}
            browsingId={browsingId}
            onSelect={(s) => void handleSelectSession(s)}
            onLogout={handleLogout}
          />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "tween" as const, duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
                className="fixed inset-y-0 left-0 z-50 h-full lg:hidden"
              >
                <SessionsSidebar
                  sessions={sessions}
                  activeSessionId={sessionId}
                  browsingId={browsingId}
                  onSelect={(s) => void handleSelectSession(s)}
                  onLogout={handleLogout}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Browsing header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-[var(--ds-border)] bg-[var(--ds-background-100)]/80 px-4 py-3 backdrop-blur-sm lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-[var(--ds-gray-500)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)] lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-4" />
            </button>
            {sessionId !== null && (
              <button
                onClick={() => { setBrowsingId(null); setBrowsingData(null) }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--ds-gray-600)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
              >
                <ArrowLeft className="size-3.5" />
                Sesión activa
              </button>
            )}
            {browsingCfg !== null && (
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full" style={{ background: browsingCfg.color }} />
                <span className="text-xs font-medium" style={{ color: browsingCfg.color }}>
                  {browsingCfg.label}
                </span>
              </div>
            )}
          </header>

          {/* Browsing content */}
          <div className="flex-1 overflow-y-auto">
            {browsingLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[var(--ds-accent-blue)]" />
              </div>
            ) : browsingData === null ? null : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
                className="mx-auto max-w-2xl space-y-3 px-4 py-6 lg:px-6"
              >
                {/* Message history */}
                {browsingData.messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "tween" as const,
                      duration: 0.26,
                      ease: "easeOut" as const,
                      delay: Math.min(i * 0.04, 0.32),
                    }}
                  >
                    <Message from={msg.role}>
                      <MessageContent>
                        <Response>{msg.content}</Response>
                      </MessageContent>
                      {msg.role === "assistant" && (
                        <BotAvatar state={null} className="size-8 shrink-0" />
                      )}
                    </Message>
                  </motion.div>
                ))}

                {/* Completed — farewell as a native chat bubble */}
                {sessionCompleted && (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-[var(--ds-border)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                        Entrevista finalizada
                      </span>
                      <div className="h-px flex-1 bg-[var(--ds-border)]" />
                    </div>
                    <Message from="assistant">
                      <MessageContent>
                        <Response>
                          {`Revisaremos la entrevista y próximamente te estaremos notificando vía email en los próximos **tres días** sobre el estado del proceso.\n\nFeliz resto del día. 🚀`}
                        </Response>
                        <div className="mt-3 border-t border-white/[0.08] pt-3">
                          <span className="text-[11px] text-[var(--ds-gray-500)]">
                            Cordialmente,{" "}
                            <span className="font-medium text-[var(--ds-gray-600)]">Agente NovaHiring</span>
                          </span>
                        </div>
                      </MessageContent>
                      <BotAvatar state={null} className="size-8 shrink-0" />
                    </Message>
                  </>
                )}

                {/* End state for abandoned / expired */}
                {(browsingData.status === "abandoned" || browsingData.status === "expired") && (
                  <div className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] p-5 text-center">
                    <p className="text-sm font-medium text-[var(--ds-gray-700)]">
                      {browsingData.status === "abandoned"
                        ? "La entrevista fue interrumpida"
                        : "La sesión expiró"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
                      Contacta al equipo de selección si necesitas información.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Chat view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ds-background-100)]">

      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex">
        <SessionsSidebar
          sessions={sessions}
          activeSessionId={sessionId}
          browsingId={browsingId}
          onSelect={(s) => void handleSelectSession(s)}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile sidebar — overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "tween" as const, duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
              className="fixed inset-y-0 left-0 z-50 h-full lg:hidden"
            >
              <SessionsSidebar
                sessions={sessions}
                activeSessionId={sessionId}
                browsingId={browsingId}
                onSelect={(s) => void handleSelectSession(s)}
                onLogout={handleLogout}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--ds-border)] bg-[var(--ds-background-100)]/80 px-4 py-3 backdrop-blur-sm lg:px-6">
          {/* Mobile: sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-[var(--ds-gray-500)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)] lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-4" />
          </button>

          {/* Bot avatar + dimension info */}
          <div className="flex flex-1 items-center gap-3">
            <BotAvatar state={isProcessing ? "thinking" : null} className="size-8 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--ds-gray-1000)]">Entrevista IA</p>
              {dimensionName !== undefined && (
                <p className="text-xs text-[var(--ds-gray-500)]">{dimensionName}</p>
              )}
            </div>
          </div>

          {/* Mobile: logo in center-right */}
          <div className="lg:hidden">
            <Image
              src="/logo-withe.png"
              alt="NovaHiring"
              width={2172}
              height={724}
              className="h-5 w-auto dark:hidden"
            />
            <Image
              src="/logo.png"
              alt="NovaHiring"
              width={1768}
              height={340}
              className="hidden h-5 w-auto opacity-70 dark:block"
            />
          </div>
        </header>

        {/* Progress bar */}
        <div className="shrink-0 border-b border-[var(--ds-border)] px-4 py-3 lg:px-6">
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
            <div className="mx-auto max-w-2xl px-4 lg:px-6">
              {displayMessages.length === 0 && !isProcessing ? (
                <ConversationEmptyState
                  className="min-h-[320px]"
                  icon={<BotAvatar state={null} className="size-14" />}
                  title={
                    <span className="text-[var(--ds-gray-700)]">Tu entrevista comienza aquí</span>
                  }
                  description={
                    <span className="text-[var(--ds-gray-500)]">
                      Responde con detalle para obtener la mejor evaluación
                    </span>
                  }
                />
              ) : (
                <AnimatePresence initial={false}>
                  {displayMessages.map((msg, i) => (
                    <motion.div
                      key={msg.sequence_number}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15, type: "tween" as const } }}
                      transition={{
                        type: "tween" as const,
                        duration: 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Message from={msg.role}>
                        <MessageContent>
                          <Response>{msg.content}</Response>
                        </MessageContent>
                        {msg.role === "assistant" && (
                          <BotAvatar
                            state={
                              pageStatus === "typing" && i === displayMessages.length - 1
                                ? "thinking"
                                : null
                            }
                            className="size-8 shrink-0"
                          />
                        )}
                      </Message>
                    </motion.div>
                  ))}

                  {(pageStatus === "sending" || pageStatus === "busy") && (
                    <motion.div
                      key="processing"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15, type: "tween" as const } }}
                      transition={{ type: "tween" as const, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Message from="assistant">
                        <MessageContent>
                          <TypingDots />
                        </MessageContent>
                        <BotAvatar state="thinking" className="size-8 shrink-0" />
                      </Message>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Farewell — shown inline at the bottom of the chat when interview is complete */}
              {pageStatus === "completed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "tween" as const, duration: 0.38, ease: "easeOut" as const }}
                >
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--ds-border)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                      Entrevista finalizada
                    </span>
                    <div className="h-px flex-1 bg-[var(--ds-border)]" />
                  </div>
                  <Message from="assistant">
                    <MessageContent>
                      <Response>
                        {`¡Excelente, ${candidateDisplayName}! Revisaremos la entrevista y próximamente te estaremos notificando vía email en los próximos **tres días** sobre el estado del proceso.\n\nFeliz resto del día. 🚀`}
                      </Response>
                      <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.08] pt-3">
                        <BotAvatar state={null} className="size-5" />
                        <span className="text-[11px] text-[var(--ds-gray-500)]">
                          Cordialmente,{" "}
                          <span className="font-medium text-[var(--ds-gray-600)]">Agente NovaHiring</span>
                        </span>
                      </div>
                    </MessageContent>
                    <BotAvatar state={null} className="size-8 shrink-0" />
                  </Message>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input area — hidden when interview is complete */}
        {pageStatus === "completed" ? null : <div className="shrink-0 border-t border-[var(--ds-border)] px-4 py-4 lg:px-6">
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
        </div>}
      </div>
    </div>
  )
}
