"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Zap, RefreshCw } from "lucide-react"
import type { CandidateListItem } from "@/features/candidates/types"
import {
  getCandidates,
  triggerEvaluation,
} from "@/features/candidates/services/candidatesApi"
import { CandidateTable } from "@/features/candidates/components/CandidateTable"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: { job_id: string }
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] p-4">
      <p className="text-xs font-medium text-[var(--ds-gray-500)]">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums ${accent ?? "text-[var(--ds-gray-1000)]"}`}
      >
        {value}
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)]">
        <div className="border-b border-[var(--ds-border)] px-5 py-3">
          <div className="flex gap-6">
            {["w-24", "w-36", "w-16", "w-20", "w-28"].map((w, i) => (
              <Skeleton key={i} className={`h-3 ${w}`} />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-5 border-b border-[var(--ds-border)] px-5 py-4 last:border-0"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </>
  )
}

export default function CandidatesPage({ params }: Props) {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evalMsg, setEvalMsg] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCandidates(params.job_id, force)
      setCandidates(data)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar candidatos"
      )
    } finally {
      setLoading(false)
    }
  }, [params.job_id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleEvaluate() {
    setEvaluating(true)
    setEvalMsg(null)
    try {
      const res = await triggerEvaluation(params.job_id)
      setEvalMsg(
        `Análisis iniciado para ${res.queued_candidates} candidato${res.queued_candidates !== 1 ? "s" : ""}.`
      )
      setTimeout(() => void load(true), 4000)
    } catch (e) {
      setEvalMsg(
        e instanceof Error ? e.message : "Error al iniciar el análisis"
      )
    } finally {
      setEvaluating(false)
    }
  }

  const total = candidates.length
  const analizados = candidates.filter((c) => c.resultado !== null).length
  const aptos = candidates.filter(
    (c) => c.resultado === "APTO" && c.passed_ko !== false
  ).length
  const descartados = candidates.filter(
    (c) => c.resultado === "DESCARTADO" || c.passed_ko === false
  ).length
  const pending = candidates.filter(
    (c) => c.resultado === null && c.passed_ko !== false
  ).length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]">
            <Users className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ds-gray-1000)]">
              Candidatos
            </h1>
            <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
              {loading
                ? "Cargando..."
                : `${total} candidato${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {evalMsg && (
            <p className="text-xs text-[var(--ds-gray-600)]">{evalMsg}</p>
          )}
          {/* Re-evaluar button — only shown when all candidates already analyzed */}
          {!loading && pending === 0 && total > 0 && (
            <Button
              onClick={() => void handleEvaluate()}
              disabled={evaluating}
              variant="outline"
              size="sm"
            >
              <Zap />
              {evaluating ? "Analizando..." : "Re-analizar"}
            </Button>
          )}
          <Button
            onClick={() => void load(true)}
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-4 text-sm text-[var(--ds-accent-red)]">
          {error}
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* AI analysis callout — shown when candidates need evaluation */}
          <AnimatePresence>
            {pending > 0 && (
              <motion.div
                key="callout"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "tween", duration: 0.28, ease: "easeOut" as const }}
                className="mb-6 rounded-xl border border-[var(--ds-accent-amber)]/30 bg-[var(--ds-accent-amber)]/5 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-amber)]/15">
                      <Zap className="size-4 text-[var(--ds-accent-amber)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ds-gray-1000)]">
                        {pending} candidato{pending !== 1 ? "s" : ""} sin analizar
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ds-gray-600)]">
                        Analiza los perfiles para ver el ranking y generar el informe final.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleEvaluate()}
                    disabled={evaluating || loading}
                    className="btn-glow shrink-0 rounded-full border-0"
                    size="sm"
                  >
                    <Zap />
                    {evaluating ? "Analizando..." : "Analizar con IA"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={total} />
            <StatCard label="CVs revisados" value={analizados} />
            <StatCard
              label="Recomendados"
              value={aptos}
              accent="text-[var(--ds-accent-green)]"
            />
            <StatCard
              label="Descartados"
              value={descartados}
              accent="text-[var(--ds-accent-red)]"
            />
          </div>
          <CandidateTable candidates={candidates} />
        </>
      )}
    </div>
  )
}
