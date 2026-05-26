"use client"

import { useState, useCallback, useEffect, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  FlagTriangleRight,
  Mail,
  Wifi,
  WifiOff,
} from "lucide-react"
import { getJobAudit, closeJob, getJobMetrics, getJobNotifications, getEmailHealth } from "@/features/jobs/services/jobsApi"
import { getAdminSession } from "@/features/interviews/services/interviewsApi"
import type {
  JobAuditResponse,
  JobAuditCandidate,
  AdminSessionDetail,
  JobMetricsCandidate,
  JobNotificationsResponse,
  EmailHealthResponse,
  EmailDeliveryStatus,
  EmailNotificationType,
} from "@/features/interviews/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: "green" | "amber" | "gray" | "red" }
> = {
  completed: { label: "Completada", color: "green" },
  active:    { label: "En curso",   color: "amber" },
  pending:   { label: "Pendiente",  color: "gray"  },
  abandoned: { label: "Abandonada", color: "red"   },
  expired:   { label: "Expirada",   color: "red"   },
}

const NOTIFICATION_LABELS: Record<string, string> = {
  interview_invitation: "Invitación",
  winner:    "Ganador",
  rejection: "Rechazo",
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

function daysRemaining(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "gray" as const }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.color === "green" && "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]",
        cfg.color === "amber" && "bg-[var(--ds-accent-amber)]/10 text-[var(--ds-accent-amber)]",
        cfg.color === "gray"  && "bg-[var(--ds-background-300)] text-[var(--ds-gray-500)]",
        cfg.color === "red"   && "bg-[var(--ds-accent-red)]/10 text-[var(--ds-accent-red)]",
      )}
    >
      {cfg.color === "amber" && (
        <span className="size-1.5 animate-pulse rounded-full bg-[var(--ds-accent-amber)]" />
      )}
      {cfg.label}
    </span>
  )
}

function NotificationPills({ notifications }: { notifications: string[] }) {
  if (notifications.length === 0) return <span className="text-xs text-[var(--ds-gray-500)]">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {notifications.map((n) => (
        <span
          key={n}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            n === "winner"    && "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]",
            n === "rejection" && "bg-[var(--ds-accent-red)]/10 text-[var(--ds-accent-red)]",
            n === "interview_invitation" && "bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]",
          )}
        >
          {NOTIFICATION_LABELS[n] ?? n}
        </span>
      ))}
    </div>
  )
}

// ─── progress cell ───────────────────────────────────────────────────────────

const TOTAL_DIMENSIONS = 8

function ProgressCell({
  data,
  status,
  loading = false,
}: {
  data: JobMetricsCandidate | undefined
  status: string
  loading?: boolean
}) {
  if (loading && data === undefined) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: TOTAL_DIMENSIONS }, (_, i) => (
          <div key={i} className="h-1.5 w-3 animate-pulse rounded-full bg-[var(--ds-background-300)]" />
        ))}
      </div>
    )
  }
  if (data === undefined) {
    return <span className="text-xs text-[var(--ds-gray-500)]">—</span>
  }

  const answered = data.dimensions_answered

  const dotColor =
    status === "completed"
      ? "bg-[var(--ds-accent-green)]"
      : status === "abandoned" || status === "expired"
        ? "bg-[var(--ds-accent-red)]/60"
        : "bg-[var(--ds-accent-amber)]"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: TOTAL_DIMENSIONS }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-3 rounded-full",
              i < answered ? dotColor : "bg-[var(--ds-background-300)]",
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium tabular-nums text-[var(--ds-gray-700)]">
          {answered}/{TOTAL_DIMENSIONS}
        </span>
        {data.current_dimension !== null && (
          <span className="rounded bg-[var(--ds-accent-amber)]/10 px-1 py-0.5 text-[10px] font-semibold text-[var(--ds-accent-amber)]">
            →{data.current_dimension}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── chat sheet ──────────────────────────────────────────────────────────────

function ChatSheet({
  open,
  onOpenChange,
  candidate,
  session,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  candidate: JobAuditCandidate | null
  session: AdminSessionDetail | null
  loading: boolean
}) {
  const score =
    session?.evaluation_result?.weighted_score ??
    candidate?.interview_score ??
    null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-xl flex-col border-white/[0.14] bg-[var(--ds-background-200)] p-0"
      >
        <SheetHeader className="border-b border-[var(--ds-border)] px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--ds-gray-1000)]">
            {candidate?.is_winner && (
              <Trophy className="size-4 text-[var(--ds-accent-green)]" />
            )}
            {candidate?.nombre ?? "Candidato"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-3 text-xs text-[var(--ds-gray-600)]">
            {candidate && (
              <StatusBadge status={candidate.interview_status} />
            )}
            {candidate?.interview_status === "completed" && score !== null && (
              <span className="font-mono font-semibold text-[var(--ds-gray-700)]">
                {parseFloat(score).toFixed(2)}/5
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col gap-3 pt-2">
              {/* skeleton messages alternating left/right to suggest conversation */}
              {[{ w: "w-48", h: "h-14", right: false }, { w: "w-32", h: "h-10", right: true }, { w: "w-56", h: "h-20", right: false }, { w: "w-40", h: "h-12", right: true }].map((s, i) => (
                <div key={i} className={cn("flex max-w-[80%] flex-col gap-1.5", s.right ? "ml-auto items-end" : "items-start")}>
                  <div className={cn("animate-pulse rounded-2xl bg-[var(--ds-background-300)]", s.w, s.h)} />
                  <div className="h-2 w-10 animate-pulse rounded bg-[var(--ds-background-300)]" />
                </div>
              ))}
            </div>
          )}

          {!loading && session === null && (
            <p className="py-8 text-center text-sm text-[var(--ds-gray-500)]">
              No se pudo cargar la transcripción.
            </p>
          )}

          {!loading && session !== null && (
            <div className="flex flex-col gap-3">
              {session.messages.map((msg, i) => (
                <motion.div
                  key={msg.sequence_number}
                  initial={{
                    opacity: 0,
                    y: 6,
                    x: msg.role === "user" ? 10 : -10,
                    scale: 0.97,
                  }}
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  transition={{
                    type: "tween" as const,
                    duration: 0.26,
                    ease: "easeOut" as const,
                    delay: i * 0.055,
                  }}
                  className={cn(
                    "flex max-w-[85%] flex-col gap-1",
                    msg.role === "user" ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-[var(--ds-background-200)] text-[var(--ds-gray-1000)] ring-1 ring-[var(--ds-border)] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.22)]"
                        : "bg-[var(--ds-background-300)] text-[var(--ds-gray-700)]",
                    )}
                  >
                    {msg.content}
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      type: "tween" as const,
                      duration: 0.2,
                      delay: i * 0.055 + 0.18,
                    }}
                    className="text-[10px] text-[var(--ds-gray-500)]"
                  >
                    {msg.role === "user" ? "Candidato" : "Nova AI"}
                  </motion.span>
                </motion.div>
              ))}

              {session.status === "completed" && session.evaluation_result === null && (
                <>
                  <Separator className="my-2 bg-[var(--ds-border)]" />
                  <p className="py-4 text-center text-xs text-[var(--ds-gray-500)]">
                    Evaluación no disponible para esta sesión.
                  </p>
                </>
              )}

              {session.evaluation_result !== null && (
                <>
                  <Separator className="my-2 bg-[var(--ds-border)]" />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "tween" as const,
                      duration: 0.32,
                      ease: "easeOut" as const,
                      delay: session.messages.length * 0.055 + 0.1,
                    }}
                    className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-300)] p-4"
                  >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
                      Evaluación final
                    </p>
                    {(session.evaluation_result.dimension_scores ?? []).length === 0 ? (
                      <p className="py-2 text-center text-xs text-[var(--ds-gray-500)]">
                        Sin detalles de dimensiones disponibles.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {(session.evaluation_result.dimension_scores ?? []).map((d) => (
                          <div
                            key={d.dimension_id}
                            className="rounded-lg bg-[var(--ds-background-200)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-medium text-[var(--ds-gray-600)]">
                                {d.dimension_id}
                                {d.peso != null && (
                                  <span className="ml-1 text-[10px] text-[var(--ds-gray-500)]">
                                    ×{d.peso}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--ds-gray-1000)]">
                                {d.score ?? "—"}/5
                              </span>
                            </div>
                            {d.justificacion != null && d.justificacion !== "" && (
                              <p className="mt-1 text-[10px] leading-snug text-[var(--ds-gray-500)]">
                                {d.justificacion}
                              </p>
                            )}
                            {d.evidencia != null && d.evidencia !== "" && (
                              <p className="mt-0.5 text-[10px] leading-snug text-[var(--ds-accent-blue)]/70">
                                {d.evidencia}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--ds-border)] pt-3">
                      <span className="text-xs text-[var(--ds-gray-600)]">Score total</span>
                      <span className="font-mono text-sm font-bold text-[var(--ds-accent-green)]">
                        {session.evaluation_result.weighted_score ?? "—"}/5
                      </span>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── candidate row ───────────────────────────────────────────────────────────

const CandidateRow = memo(function CandidateRow({
  candidate,
  index,
  onViewChat,
  muted,
  metricsData,
  metricsLoading,
}: {
  candidate: JobAuditCandidate
  index: number
  onViewChat: (c: JobAuditCandidate) => void
  muted: boolean
  metricsData: JobMetricsCandidate | undefined
  metricsLoading: boolean
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween" as const, duration: 0.2, ease: "easeOut" as const, delay: index * 0.04 }}
      className={cn(
        "border-b border-[var(--ds-border)] transition-colors",
        muted
          ? "opacity-50 hover:opacity-70"
          : "hover:bg-[var(--ds-background-300)]/40",
      )}
    >
      {/* rank / # — winner gets green left border accent */}
      <td
        className="py-3 pl-5 pr-3"
        style={candidate.is_winner ? { borderLeft: "3px solid var(--ds-accent-green)" } : { borderLeft: "3px solid transparent" }}
      >
        <div className="flex items-center gap-1.5">
          {candidate.is_winner ? (
            <Trophy className="size-4 shrink-0 text-[var(--ds-accent-green)]" />
          ) : (
            <span className="text-xs text-[var(--ds-gray-500)]">
              {candidate.rank !== null ? `#${candidate.rank}` : "—"}
            </span>
          )}
        </div>
      </td>

      {/* nombre + email */}
      <td className="py-3 pr-4">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-sm font-medium",
              muted ? "text-[var(--ds-gray-600)]" : "text-[var(--ds-gray-1000)]",
            )}
          >
            {candidate.nombre}
          </span>
          {candidate.email !== null && (
            <span className="text-xs text-[var(--ds-gray-500)]">{candidate.email}</span>
          )}
        </div>
      </td>

      {/* interview status */}
      <td className="py-3 pr-4">
        {muted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ds-accent-red)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-red)]">
            <XCircle className="size-3" />
            Descartado
          </span>
        ) : (
          <StatusBadge status={candidate.interview_status} />
        )}
      </td>

      {/* interview progress */}
      <td className="py-3 pr-4">
        <ProgressCell data={metricsData} status={candidate.interview_status} loading={metricsLoading} />
      </td>

      {/* score — solo visible si completó la entrevista */}
      <td className="py-3 pr-4">
        {candidate.interview_status === "completed" && candidate.interview_score !== null ? (
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              candidate.is_winner
                ? "text-[var(--ds-accent-green)]"
                : "text-[var(--ds-gray-700)]",
            )}
          >
            {parseFloat(candidate.interview_score).toFixed(2)}/5
          </span>
        ) : (
          <span className="text-xs text-[var(--ds-gray-500)]">—</span>
        )}
      </td>

      {/* account activated */}
      <td className="py-3 pr-4 text-center">
        {candidate.account_activated ? (
          <CheckCircle2 className="mx-auto size-4 text-[var(--ds-accent-green)]" />
        ) : (
          <XCircle className="mx-auto size-4 text-[var(--ds-gray-500)]" />
        )}
      </td>

      {/* notifications */}
      <td className="py-3 pr-4">
        <NotificationPills notifications={candidate.notifications_sent} />
      </td>

      {/* actions */}
      <td className="py-3 pr-5">
        {candidate.session_id !== null ? (
          <Button
            onClick={() => onViewChat(candidate)}
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs text-[var(--ds-accent-blue)] hover:bg-[var(--ds-accent-blue)]/10 hover:text-[var(--ds-accent-blue)]"
          >
            <MessageSquare className="size-3.5" />
            Ver chat
          </Button>
        ) : (
          <span className="text-xs text-[var(--ds-gray-500)]">—</span>
        )}
      </td>
    </motion.tr>
  )
})

// ─── email monitoring helpers ────────────────────────────────────────────────

const NOTIF_TYPE_CONFIG: Record<EmailNotificationType, { label: string; color: "green" | "red" | "blue" }> = {
  winner:               { label: "Ganador",    color: "green" },
  rejection:            { label: "Rechazo",    color: "red"   },
  interview_invitation: { label: "Invitación", color: "blue"  },
}

function DeliveryBadge({ status }: { status: EmailDeliveryStatus }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ds-accent-green)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--ds-accent-green)]">
        <CheckCircle2 className="size-3.5" />
        Enviado
      </span>
    )
  }
  if (status === "queued") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ds-accent-amber)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--ds-accent-amber)]">
        <Clock className="size-3.5 animate-spin [animation-duration:3s]" />
        Pendiente de envío
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ds-accent-red)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--ds-accent-red)]">
      <XCircle className="size-3.5" />
      Falló el envío
    </span>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `hace ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  return `hace ${h} h`
}

function NotifTypeBadge({ type }: { type: EmailNotificationType }) {
  const cfg = NOTIF_TYPE_CONFIG[type]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        cfg.color === "green" && "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]",
        cfg.color === "red"   && "bg-[var(--ds-accent-red)]/10 text-[var(--ds-accent-red)]",
        cfg.color === "blue"  && "bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]",
      )}
    >
      {type === "winner" && <Trophy className="size-3" />}
      {cfg.label}
    </span>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AuditPage({ params }: { params: { job_id: string } }) {
  const [audit, setAudit] = useState<JobAuditResponse | null>(null)
  const [metricsMap, setMetricsMap] = useState<Map<string, JobMetricsCandidate>>(new Map())
  // audit gates page display; metrics loads in background without blocking
  const [auditLoading, setAuditLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // chat sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<JobAuditCandidate | null>(null)
  const [sessionDetail, setSessionDetail] = useState<AdminSessionDetail | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  // cache loaded sessions — avoids re-fetching when re-opening the same chat
  const sessionCacheRef = useRef<Map<string, AdminSessionDetail>>(new Map())

  // close process
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)

  // descartados section toggle
  const [descartadosOpen, setDescartadosOpen] = useState(false)

  // email monitoring
  const [notifications, setNotifications] = useState<JobNotificationsResponse | null>(null)
  const [emailHealth, setEmailHealth] = useState<EmailHealthResponse | null>(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingExhausted, setPollingExhausted] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (force = false) => {
    setAuditLoading(true)
    setMetricsLoading(true)
    setError(null)

    // only audit fires immediately — it gates page display
    try {
      const auditData = await getJobAudit(params.job_id, force)
      setAudit(auditData)
      setAuditLoading(false)

      if (auditData.status === "closed") {
        // closed: sessions are terminal — metrics & pre-close health check are useless
        setMetricsLoading(false)
      } else {
        // active: fire metrics + email health concurrently AFTER audit renders the page
        void getJobMetrics(params.job_id, force)
          .then((data) => {
            const map = new Map<string, JobMetricsCandidate>()
            for (const c of data.candidates) map.set(c.nombre, c)
            setMetricsMap(map)
          })
          .catch(() => { /* silently fail */ })
          .finally(() => { setMetricsLoading(false) })

        void getEmailHealth()
          .then(setEmailHealth)
          .catch(() => { /* silently fail — banner won't show */ })
      }
    } catch {
      setError("No se pudo cargar la información del proceso.")
      setAuditLoading(false)
      setMetricsLoading(false)
    }
  }, [params.job_id])

  useEffect(() => { void load() }, [load])

  // cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current)
    }
  }, [])

  // polling: GET /notifications/{jobId} every 3s while queued > 0 (max 20 attempts ≈ 60s)
  const startPolling = useCallback((jobId: string) => {
    if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current)
    setIsPolling(true)
    setPollingExhausted(false)
    setNotifError(null)

    const MAX = 20
    let attempts = 0

    async function tick() {
      try {
        const data = await getJobNotifications(jobId)
        setNotifications(data)
        setNotifLoading(false)
        if (data.queued > 0 && attempts < MAX) {
          attempts++
          pollTimerRef.current = setTimeout(() => { void tick() }, 3000)
        } else {
          setIsPolling(false)
          if (data.queued > 0) setPollingExhausted(true)
        }
      } catch {
        setNotifError("No se pudieron cargar las notificaciones.")
        setNotifLoading(false)
        setIsPolling(false)
      }
    }

    void tick()
  }, [])

  useEffect(() => {
    if (audit === null || audit.status !== "closed") return
    // delay 1.5s so the page renders and settles before firing the notifications request
    const t = setTimeout(() => {
      setNotifLoading(true)
      startPolling(params.job_id)
    }, 1500)
    return () => clearTimeout(t)
  }, [audit, startPolling, params.job_id])

  const openChat = useCallback(async (candidate: JobAuditCandidate) => {
    if (candidate.session_id === null) return
    setSelectedCandidate(candidate)
    setSheetOpen(true)

    // return cached session immediately — avoids re-fetching same chat
    const cached = sessionCacheRef.current.get(candidate.session_id)
    if (cached !== undefined) {
      setSessionDetail(cached)
      setSessionLoading(false)
      return
    }

    setSessionDetail(null)
    setSessionLoading(true)
    try {
      const detail = await getAdminSession(candidate.session_id)
      sessionCacheRef.current.set(candidate.session_id, detail)
      setSessionDetail(detail)
    } catch {
      // null kept → error shown in sheet
    } finally {
      setSessionLoading(false)
    }
  }, [sessionCacheRef])

  async function handleClose() {
    setClosing(true)
    setCloseError(null)
    try {
      const result = await closeJob(params.job_id)
      const winnerLabel = result.winner_nombre ?? "Sin ganador seleccionado"
      setCloseSuccess(winnerLabel)
      setConfirmClose(false)
      await load(true)
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 409) {
        setCloseError("El proceso ya fue cerrado anteriormente.")
      } else {
        setCloseError("No se pudo cerrar el proceso. Inténtalo de nuevo.")
      }
      setConfirmClose(false)
    } finally {
      setClosing(false)
    }
  }

  // ── loading ──
  if (auditLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* header card skeleton */}
        <div className="h-28 animate-pulse rounded-xl bg-[var(--ds-background-200)]" />
        {/* table skeleton — header + rows */}
        <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]">
          <div className="h-10 animate-pulse border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]" />
          <div className="divide-y divide-[var(--ds-border)]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--ds-background-300)]" />
                <div className="h-4 w-36 animate-pulse rounded bg-[var(--ds-background-300)]" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--ds-background-300)]" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 8 }, (_, k) => (
                    <div key={k} className="h-1.5 w-3 animate-pulse rounded-full bg-[var(--ds-background-300)]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── error ──
  if (error !== null) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-4 py-3 text-sm text-[var(--ds-accent-red)]">
          <AlertCircle className="size-4 shrink-0" />
          {error}
          <Button
            onClick={() => void load(true)}
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-[var(--ds-accent-red)] hover:bg-[var(--ds-accent-red)]/10"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (audit === null) return null

  const aptos = audit.all_candidates.filter((c) => c.passed_ko)
  const descartados = audit.all_candidates.filter((c) => !c.passed_ko)
  const canClose = audit.status !== "closed"

  const deadlineDays =
    audit.interview_deadline !== null ? daysRemaining(audit.interview_deadline) : null

  return (
    <>
      <div className="flex flex-col gap-6 p-6">

        {/* ── success banner ── */}
        <AnimatePresence>
          {closeSuccess !== null && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
              className="flex items-center gap-3 rounded-xl border border-[var(--ds-accent-green)]/30 bg-[var(--ds-accent-green)]/10 px-4 py-3 text-sm text-[var(--ds-accent-green)]"
            >
              <Trophy className="size-4 shrink-0" />
              <span>
                Proceso cerrado correctamente.{" "}
                <strong>Ganador: {closeSuccess}</strong>
              </span>
              <button
                onClick={() => setCloseSuccess(null)}
                className="ml-auto text-[var(--ds-accent-green)] opacity-60 hover:opacity-100"
                aria-label="Cerrar notificación"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── header card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
          className="relative overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] p-5"
        >
          {/* top accent line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--ds-accent-blue)] via-[var(--ds-accent-blue)]/40 to-transparent" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* left: title + status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-semibold text-[var(--ds-gray-1000)]">
                  {audit.title}
                </h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    audit.status === "active"
                      ? "bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]"
                      : "bg-[var(--ds-background-300)] text-[var(--ds-gray-500)]",
                  )}
                >
                  {audit.status === "active" ? "Activo" : "Cerrado"}
                </span>
              </div>

              {/* stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--ds-gray-700)]">
                  <Users className="size-3.5 text-[var(--ds-gray-500)]" />
                  <strong className="text-[var(--ds-gray-1000)]">{audit.total_apto}</strong> aptos
                </span>
                <span className="flex items-center gap-1.5 text-[var(--ds-gray-700)]">
                  <CheckCircle2 className="size-3.5 text-[var(--ds-accent-green)]" />
                  <strong className="text-[var(--ds-gray-1000)]">{audit.total_completed_interviews}</strong> entrevista{audit.total_completed_interviews !== 1 ? "s" : ""} completada{audit.total_completed_interviews !== 1 ? "s" : ""}
                </span>
                {audit.interview_deadline !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1.5",
                      audit.deadline_passed
                        ? "text-[var(--ds-accent-red)]"
                        : deadlineDays !== null && deadlineDays <= 1
                          ? "text-[var(--ds-accent-amber)]"
                          : "text-[var(--ds-gray-700)]",
                    )}
                  >
                    <Clock className="size-3.5" />
                    Deadline: {formatDeadline(audit.interview_deadline)}
                    {audit.deadline_passed
                      ? " · Expirado"
                      : deadlineDays !== null
                        ? ` · ${deadlineDays > 0 ? `${deadlineDays} días` : "hoy"}`
                        : ""}
                  </span>
                )}
              </div>

              {/* closed_at / winner */}
              {audit.status === "closed" && audit.winner_nombre !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="size-4 text-[var(--ds-accent-green)]" />
                  <span className="text-[var(--ds-gray-700)]">
                    Ganador:{" "}
                    <strong className="text-[var(--ds-accent-green)]">
                      {audit.winner_nombre}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* right: close process button + refresh */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                onClick={() => void load(true)}
                disabled={auditLoading}
                variant="ghost"
                size="icon-sm"
                aria-label="Actualizar"
                className="size-8 text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
              >
                <RefreshCw className={cn("size-4", auditLoading && "animate-spin")} />
              </Button>

              {!confirmClose ? (
                <Button
                  onClick={() => {
                    setCloseError(null)
                    setConfirmClose(true)
                  }}
                  disabled={!canClose || closing}
                  size="sm"
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 rounded-full border-0 px-4 text-xs font-semibold transition-all",
                    canClose
                      ? "bg-[var(--ds-accent-red)] text-white hover:bg-[var(--ds-accent-red)]/80"
                      : "cursor-not-allowed bg-[var(--ds-background-300)] text-[var(--ds-gray-500)]",
                  )}
                >
                  {audit.status === "closed" ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Proceso cerrado
                    </>
                  ) : (
                    <>
                      <FlagTriangleRight className="size-3.5" />
                      Cerrar proceso de selección
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-3 py-1">
                  <span className="text-xs text-[var(--ds-accent-red)]">¿Confirmar?</span>
                  <Button
                    onClick={() => void handleClose()}
                    disabled={closing}
                    size="sm"
                    className="h-6 rounded-full bg-[var(--ds-accent-red)] px-2.5 text-[10px] font-bold text-white hover:bg-[var(--ds-accent-red)]/80"
                  >
                    {closing ? "Cerrando..." : "Sí, cerrar"}
                  </Button>
                  <Button
                    onClick={() => setConfirmClose(false)}
                    disabled={closing}
                    variant="ghost"
                    size="sm"
                    className="h-6 rounded-full px-2 text-[10px] text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)]"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* close error */}
          {closeError !== null && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-3 py-2 text-xs text-[var(--ds-accent-red)]">
              <AlertCircle className="size-3.5 shrink-0" />
              {closeError}
            </div>
          )}

          {/* SMTP health warning — proactive alert before the admin clicks close */}
          {emailHealth !== null && emailHealth.status === "error" && audit.status !== "closed" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--ds-accent-amber)]/30 bg-[var(--ds-accent-amber)]/10 px-3 py-2.5 text-xs text-[var(--ds-accent-amber)]">
              <WifiOff className="mt-0.5 size-3.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">El servidor de email no responde.</span>
                <span className="text-[var(--ds-accent-amber)]/80">
                  Los emails de notificación pueden no enviarse al cerrar el proceso.
                  {emailHealth.error !== null ? ` Error: ${emailHealth.error}` : ""}
                  {" "}Contacta soporte antes de continuar.
                </span>
              </div>
            </div>
          )}

          {/* ready_to_close hint */}
          {audit.ready_to_close && audit.status === "active" && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--ds-background-300)] px-3 py-2 text-xs text-[var(--ds-gray-600)]">
              <CheckCircle2 className="size-3.5 shrink-0 text-[var(--ds-accent-amber)]" />
              El proceso está listo para cerrarse. Puedes seleccionar al ganador cuando lo consideres oportuno.
            </div>
          )}
        </motion.div>

        {/* ── APTO candidates table ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const, delay: 0.08 }}
          className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]"
        >
          <div className="border-b border-[var(--ds-border)] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
              Candidatos aptos — {aptos.length}
            </p>
          </div>

          {aptos.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--ds-gray-500)]">
              Ningún candidato pasó el filtro de CV todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--ds-border)]">
                    {["#", "Candidato", "Estado entrevista", "Progreso", "Puntuación final", "Activo", "Notificaciones", "Acciones"].map(
                      (col) => (
                        <th
                          key={col}
                          className="py-2.5 pl-5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-gray-500)] first:pl-5 last:pr-5"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {aptos.map((c, i) => (
                    <CandidateRow
                      key={c.candidate_id}
                      candidate={c}
                      index={i}
                      onViewChat={openChat}
                      muted={false}
                      metricsData={metricsMap.get(c.nombre)}
                      metricsLoading={metricsLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ── DESCARTADOS collapsible ── */}
        {descartados.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const, delay: 0.14 }}
            className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]"
          >
            <button
              onClick={() => setDescartadosOpen((v) => !v)}
              className="flex w-full items-center justify-between border-b border-[var(--ds-border)] px-5 py-3 text-left hover:bg-[var(--ds-background-300)]/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
                Descartados — {descartados.length}
              </p>
              {descartadosOpen ? (
                <ChevronUp className="size-4 text-[var(--ds-gray-500)]" />
              ) : (
                <ChevronDown className="size-4 text-[var(--ds-gray-500)]" />
              )}
            </button>

            <AnimatePresence>
              {descartadosOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--ds-border)]">
                          {["#", "Candidato", "Estado entrevista", "Progreso", "Puntuación final", "Activo", "Notificaciones", "Acciones"].map(
                            (col) => (
                              <th
                                key={col}
                                className="py-2.5 pl-5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]"
                              >
                                {col}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {descartados.map((c, i) => (
                          <CandidateRow
                            key={c.candidate_id}
                            candidate={c}
                            index={i}
                            onViewChat={openChat}
                            muted
                            metricsData={metricsMap.get(c.nombre)}
                            metricsLoading={metricsLoading}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {/* ── email monitoring section (only when closed) ── */}
        {audit.status === "closed" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const, delay: 0.20 }}
            className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]"
          >
            {/* amber top accent — email/notification theme */}
            <div className="h-[2px] bg-gradient-to-r from-[var(--ds-accent-amber)] via-[var(--ds-accent-amber)]/40 to-transparent" />

            {/* header */}
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[var(--ds-accent-amber)]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
                    Notificaciones de email
                  </p>
                </div>
                {/* SMTP health badge */}
                {emailHealth !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      emailHealth.status === "ok"
                        ? "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]"
                        : "bg-[var(--ds-accent-red)]/10 text-[var(--ds-accent-red)]",
                    )}
                  >
                    {emailHealth.status === "ok"
                      ? <Wifi className="size-3" />
                      : <WifiOff className="size-3" />
                    }
                    SMTP {emailHealth.status === "ok" ? "OK" : "Error"}
                  </span>
                )}
              </div>
              <Button
                onClick={() => { setNotifLoading(true); startPolling(params.job_id) }}
                disabled={notifLoading || isPolling}
                variant="ghost"
                size="icon-sm"
                aria-label="Actualizar notificaciones"
                className="size-8 text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
              >
                <RefreshCw className={cn("size-4", (notifLoading || isPolling) && "animate-spin")} />
              </Button>
            </div>

            {/* loading */}
            {notifLoading && notifications === null && (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ds-accent-blue)] border-t-transparent" />
              </div>
            )}

            {/* error */}
            {notifError !== null && !notifLoading && (
              <div className="m-4 flex items-center gap-2 rounded-lg border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-3 py-2.5 text-xs text-[var(--ds-accent-red)]">
                <AlertCircle className="size-3.5 shrink-0" />
                {notifError}
              </div>
            )}

            {notifications !== null && (
              <>
                {/* stats chips */}
                <div className="grid grid-cols-4 gap-3 border-b border-[var(--ds-border)] px-5 py-4">
                  {(
                    [
                      { label: "Total",    value: notifications.total,  color: "gray"  },
                      { label: "Enviados", value: notifications.sent,   color: "green" },
                      { label: "En cola",  value: notifications.queued, color: "amber" },
                      { label: "Fallidos", value: notifications.failed, color: "red"   },
                    ] as const
                  ).map(({ label, value, color }) => (
                    <div
                      key={label}
                      className={cn(
                        "flex flex-col gap-0.5 rounded-lg px-3 py-2.5",
                        color === "gray"  && "bg-[var(--ds-background-300)]",
                        color === "green" && "bg-[var(--ds-accent-green)]/5",
                        color === "amber" && "bg-[var(--ds-accent-amber)]/5",
                        color === "red"   && "bg-[var(--ds-accent-red)]/5",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xl font-bold tabular-nums",
                          color === "gray"  && "text-[var(--ds-gray-1000)]",
                          color === "green" && "text-[var(--ds-accent-green)]",
                          color === "amber" && "text-[var(--ds-accent-amber)]",
                          color === "red"   && "text-[var(--ds-accent-red)]",
                        )}
                      >
                        {value}
                      </span>
                      <span className="text-[10px] text-[var(--ds-gray-500)]">{label}</span>
                    </div>
                  ))}
                </div>

                {/* worker-down alert — polling agotado con emails aún en cola */}
                {pollingExhausted && notifications.queued > 0 && (
                  <div className="border-b border-[var(--ds-border)] px-5 py-3">
                    <div className="flex items-start gap-3 rounded-lg border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-4 py-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--ds-accent-red)]" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-[var(--ds-accent-red)]">
                          Los emails llevan más de 60 s en cola sin procesarse.
                        </span>
                        <span className="text-[10px] leading-snug text-[var(--ds-accent-red)]/80">
                          El worker de Celery probablemente no está corriendo. Arráncalo con{" "}
                          <code className="rounded bg-[var(--ds-accent-red)]/20 px-1 font-mono">make worker</code>{" "}
                          en el directorio del backend, luego pulsa Reintentar.
                        </span>
                      </div>
                      <Button
                        onClick={() => {
                          setPollingExhausted(false)
                          setNotifLoading(false)
                          startPolling(params.job_id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="ml-auto shrink-0 h-7 rounded-full px-3 text-[10px] font-semibold text-[var(--ds-accent-red)] hover:bg-[var(--ds-accent-red)]/10"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}

                {/* auto-polling indicator — sutil mientras esperamos */}
                {isPolling && notifications.queued > 0 && (
                  <div className="border-b border-[var(--ds-border)] px-5 py-2.5">
                    <span className="inline-flex items-center gap-2 text-[10px] text-[var(--ds-gray-500)]">
                      <span className="size-1.5 animate-pulse rounded-full bg-[var(--ds-accent-amber)]" />
                      Verificando cada 3 s... los emails están siendo procesados en segundo plano.
                    </span>
                  </div>
                )}

                {/* notifications table */}
                {notifications.notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-[var(--ds-gray-500)]">
                    No hay notificaciones registradas para este proceso.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--ds-border)]">
                          {["Candidato", "Email", "Tipo", "Estado de entrega", "En cola desde", "Entregado"].map((col) => (
                            <th
                              key={col}
                              className="py-2.5 pl-5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-gray-500)] last:pr-5"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.notifications.map((notif, i) => (
                          <motion.tr
                            key={notif.notification_id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              type: "tween" as const,
                              duration: 0.2,
                              ease: "easeOut" as const,
                              delay: i * 0.04,
                            }}
                            className={cn(
                              "border-b border-[var(--ds-border)]",
                              notif.delivery_status === "failed"
                                ? "bg-[var(--ds-accent-red)]/[0.03] hover:bg-[var(--ds-accent-red)]/[0.06]"
                                : "hover:bg-[var(--ds-background-300)]/40",
                            )}
                          >
                            {/* nombre */}
                            <td className="py-3.5 pl-5 pr-4">
                              <span className="text-sm font-medium text-[var(--ds-gray-1000)]">
                                {notif.candidate_name}
                              </span>
                            </td>

                            {/* email */}
                            <td className="py-3.5 pr-4">
                              <span className="text-xs text-[var(--ds-gray-600)]">
                                {notif.candidate_email ?? "—"}
                              </span>
                            </td>

                            {/* tipo */}
                            <td className="py-3.5 pr-4">
                              <NotifTypeBadge type={notif.notification_type} />
                            </td>

                            {/* estado — columna principal, expandible en failed */}
                            <td className="py-3.5 pr-4">
                              <div className="flex flex-col gap-2">
                                <DeliveryBadge status={notif.delivery_status} />
                                {notif.delivery_status === "failed" && notif.delivery_error !== null && (
                                  <div className="max-w-[260px] rounded-md bg-[var(--ds-accent-red)]/10 px-2.5 py-2 text-[10px] leading-snug text-[var(--ds-accent-red)]">
                                    <span className="mb-0.5 block font-semibold opacity-70">Error:</span>
                                    {notif.delivery_error}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* en cola desde — tiempo relativo prominente */}
                            <td className="py-3.5 pr-4">
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={cn(
                                    "text-xs font-semibold tabular-nums",
                                    notif.delivery_status === "queued"
                                      ? "text-[var(--ds-accent-amber)]"
                                      : "text-[var(--ds-gray-700)]",
                                  )}
                                >
                                  {timeAgo(notif.sent_at)}
                                </span>
                                <span className="text-[10px] tabular-nums text-[var(--ds-gray-500)]">
                                  {formatDateTime(notif.sent_at)}
                                </span>
                              </div>
                            </td>

                            {/* entregado */}
                            <td className="py-3.5 pr-5">
                              {notif.delivered_at !== null ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-semibold tabular-nums text-[var(--ds-accent-green)]">
                                    {timeAgo(notif.delivered_at)}
                                  </span>
                                  <span className="text-[10px] tabular-nums text-[var(--ds-gray-500)]">
                                    {formatDateTime(notif.delivered_at)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--ds-gray-500)]">—</span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* ── chat transcript sheet ── */}
      <ChatSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        candidate={selectedCandidate}
        session={sessionDetail}
        loading={sessionLoading}
      />
    </>
  )
}
