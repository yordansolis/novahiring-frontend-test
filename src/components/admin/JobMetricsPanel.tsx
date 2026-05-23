"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react"
import type { CandidateListItem } from "@/features/candidates/types"
import { getCandidates } from "@/features/candidates/services/candidatesApi"
import { Button } from "@/components/ui/button"

interface Props {
  jobId: string
  open: boolean
}

function BarRow({
  label,
  value,
  total,
  colorBar,
  colorDot,
}: {
  label: string
  value: number
  total: number
  colorBar: string
  colorDot: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 shrink-0 rounded-full ${colorDot}`} />
          <span className="text-xs text-[var(--ds-gray-600)]">{label}</span>
        </div>
        <span className="text-xs font-medium tabular-nums text-[var(--ds-gray-700)]">
          {value}
          <span className="ml-1 text-[var(--ds-gray-500)]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--ds-background-100)]">
        <motion.div
          className={`h-full rounded-full ${colorBar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "tween" as const, duration: 0.5, ease: "easeOut" as const }}
        />
      </div>
    </div>
  )
}

export function JobMetricsPanel({ jobId, open }: Props) {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCandidates(jobId)
      setCandidates(data)
      setLastUpdated(new Date())
    } catch {
      // silent — panel failures don't block the main view
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const total = candidates.length
  const analyzed = candidates.filter((c) => c.resultado !== null).length
  const aptos = candidates.filter(
    (c) => c.resultado === "APTO" && c.passed_ko !== false
  ).length
  const descartados = candidates.filter(
    (c) => c.resultado === "DESCARTADO" || c.passed_ko === false
  ).length
  const pending = candidates.filter(
    (c) => c.resultado === null && c.passed_ko !== false
  ).length
  const conversionPct = total > 0 ? Math.round((aptos / total) * 100) : 0

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="metrics-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 264, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "tween" as const, duration: 0.2, ease: "easeOut" as const }}
          className="shrink-0 overflow-hidden border-l border-[var(--ds-border)]"
        >
          <div className="flex h-full w-[264px] flex-col bg-[var(--ds-background-200)]">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-3.5 text-[var(--ds-accent-blue)]" />
                <span className="text-xs font-semibold text-[var(--ds-gray-700)]">
                  Métricas
                </span>
              </div>
              <Button
                onClick={() => void load()}
                disabled={loading}
                variant="ghost"
                size="icon-sm"
                className="size-6 text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
              >
                <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {/* Total hero */}
              <div className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-300)] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-blue)]/10">
                    <Users className="size-4 text-[var(--ds-accent-blue)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--ds-gray-500)]">Total candidatos</p>
                    <p className="text-2xl font-semibold tabular-nums text-[var(--ds-gray-1000)]">
                      {loading ? (
                        <span className="text-base text-[var(--ds-gray-500)]">—</span>
                      ) : (
                        total
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pipeline bars */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                  Pipeline
                </p>
                <div className="space-y-3.5">
                  <BarRow
                    label="Revisados"
                    value={analyzed}
                    total={total}
                    colorBar="bg-[var(--ds-accent-blue)]"
                    colorDot="bg-[var(--ds-accent-blue)]"
                  />
                  <BarRow
                    label="Recomendados"
                    value={aptos}
                    total={total}
                    colorBar="bg-[var(--ds-accent-green)]"
                    colorDot="bg-[var(--ds-accent-green)]"
                  />
                  <BarRow
                    label="Descartados"
                    value={descartados}
                    total={total}
                    colorBar="bg-[var(--ds-accent-red)]"
                    colorDot="bg-[var(--ds-accent-red)]"
                  />
                  <BarRow
                    label="Pendientes"
                    value={pending}
                    total={total}
                    colorBar="bg-[var(--ds-accent-amber)]"
                    colorDot="bg-[var(--ds-accent-amber)]"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--ds-border)]" />

              {/* Conversion rate */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                  Conversión
                </p>
                <div className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-300)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--ds-gray-600)]">
                      Tasa de aprobación
                    </span>
                    <span className="text-xl font-semibold tabular-nums text-[var(--ds-accent-green)]">
                      {loading ? "—" : `${conversionPct}%`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ds-background-100)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--ds-accent-green)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${conversionPct}%` }}
                      transition={{
                        type: "tween" as const,
                        duration: 0.7,
                        ease: "easeOut" as const,
                        delay: 0.15,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--ds-border)]" />

              {/* Quick stats */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                  Resumen
                </p>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--ds-background-300)]/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-[var(--ds-accent-green)]" />
                      <span className="text-xs text-[var(--ds-gray-600)]">Recomendados</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[var(--ds-accent-green)]">
                      {aptos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--ds-background-300)]/80">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-3.5 shrink-0 text-[var(--ds-accent-red)]" />
                      <span className="text-xs text-[var(--ds-gray-600)]">Descartados</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[var(--ds-accent-red)]">
                      {descartados}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--ds-background-300)]/80">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-3.5 shrink-0 text-[var(--ds-accent-amber)]" />
                      <span className="text-xs text-[var(--ds-gray-600)]">Pendientes</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[var(--ds-accent-amber)]">
                      {pending}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Last updated */}
            {lastUpdated !== null && (
              <div className="border-t border-[var(--ds-border)] px-4 py-2">
                <p className="text-[10px] text-[var(--ds-gray-500)]">
                  Actualizado{" "}
                  {lastUpdated.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
