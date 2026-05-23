"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react"
import type { CvAuditItem } from "@/features/candidates/types"
import { cn } from "@/lib/utils"

interface Props {
  candidates: CvAuditItem[]
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.28, ease: "easeOut" as const } },
}

function StatusBadge({ resultado, passedKo }: { resultado: CvAuditItem["resultado"]; passedKo: boolean }) {
  if (resultado === "APTO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ds-accent-green)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ds-accent-green)]">
        <CheckCircle2 className="size-3" />
        Apto
      </span>
    )
  }
  if (resultado === "DESCARTADO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ds-accent-red)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ds-accent-red)]">
        <XCircle className="size-3" />
        Descartado
      </span>
    )
  }
  if (!passedKo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ds-accent-amber)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ds-accent-amber)]">
        <AlertTriangle className="size-3" />
        KO fallido
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ds-background-300)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ds-gray-500)]">
      Sin evaluar
    </span>
  )
}

function CvCard({ item }: { item: CvAuditItem }) {
  const [expanded, setExpanded] = useState(false)
  const isApto = item.resultado === "APTO"
  const isDescartado = item.resultado === "DESCARTADO"

  return (
    <motion.div variants={cardVariants}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] transition-colors",
        )}
      >
        {/* Left accent bar */}
        {isApto && (
          <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ds-accent-green)]" />
        )}
        {isDescartado && (
          <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ds-accent-red)]" />
        )}

        {/* Card header — clickable */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left"
          aria-expanded={expanded}
        >
          {/* Rank */}
          <span className="w-6 shrink-0 text-center font-mono text-sm font-semibold text-[var(--ds-gray-500)]">
            {item.rank}
          </span>

          {/* Avatar placeholder */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ds-background-300)]">
            <User className="size-3.5 text-[var(--ds-gray-600)]" />
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--ds-gray-1000)]">
              {item.nombre}
            </p>
            {item.email !== null && (
              <p className="mt-0.5 truncate text-xs text-[var(--ds-gray-500)]">
                {item.email}
              </p>
            )}
          </div>

          {/* KO chip */}
          {item.first_failing_ko !== null && (
            <span className="hidden shrink-0 rounded-md border border-[var(--ds-accent-red)]/20 bg-[var(--ds-accent-red)]/8 px-2 py-0.5 font-mono text-[10px] text-[var(--ds-accent-red)] sm:inline">
              {item.first_failing_ko}
            </span>
          )}

          {/* Score */}
          {item.weighted_score !== null && (
            <span className={cn(
              "hidden shrink-0 font-mono text-sm font-semibold sm:inline",
              isApto ? "text-[var(--ds-accent-green)]" : "text-[var(--ds-gray-500)]"
            )}>
              {item.weighted_score}
            </span>
          )}

          {/* Status */}
          <div className="shrink-0">
            <StatusBadge resultado={item.resultado} passedKo={item.passed_ko} />
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--ds-gray-500)] transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>

        {/* CV text panel */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="cv"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "tween" as const, duration: 0.25, ease: "easeOut" as const }}
              className="overflow-hidden"
            >
              <div className="border-t border-[var(--ds-border)] bg-[var(--ds-background-300)]/50 px-5 pb-6 pt-5">
                {/* Mobile KO + score row */}
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:hidden">
                  {item.first_failing_ko !== null && (
                    <span className="rounded-md border border-[var(--ds-accent-red)]/20 bg-[var(--ds-accent-red)]/8 px-2 py-0.5 font-mono text-[10px] text-[var(--ds-accent-red)]">
                      {item.first_failing_ko}
                    </span>
                  )}
                  {item.weighted_score !== null && (
                    <span className={cn(
                      "font-mono text-sm font-semibold",
                      isApto ? "text-[var(--ds-accent-green)]" : "text-[var(--ds-gray-500)]"
                    )}>
                      {item.weighted_score}
                    </span>
                  )}
                </div>

                <pre
                  className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[var(--ds-gray-700)]"
                  style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                >
                  {item.cv_text}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function CvAuditList({ candidates }: Props) {
  const [filter, setFilter] = useState<"all" | "apto" | "descartado">("all")

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] p-16 text-center">
        <p className="text-sm text-[var(--ds-gray-600)]">No hay CVs registrados para esta convocatoria.</p>
      </div>
    )
  }

  const filtered = candidates.filter((c) => {
    if (filter === "apto") return c.resultado === "APTO"
    if (filter === "descartado") return c.resultado === "DESCARTADO"
    return true
  })

  const aptoCount = candidates.filter((c) => c.resultado === "APTO").length
  const descartadoCount = candidates.filter((c) => c.resultado === "DESCARTADO").length

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: `Todos (${candidates.length})` },
            { key: "apto", label: `Aptos (${aptoCount})` },
            { key: "descartado", label: `Descartados (${descartadoCount})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs font-medium transition-colors",
              filter === key
                ? "border-white/[0.14] bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)]"
                : "border-white/[0.07] bg-transparent text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)]/60 hover:text-[var(--ds-gray-700)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <motion.div
        key={filter}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {filtered.map((item) => (
          <CvCard key={item.candidate_id} item={item} />
        ))}
      </motion.div>
    </div>
  )
}
