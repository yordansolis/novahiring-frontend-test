"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, RefreshCw, Printer, Cpu } from "lucide-react"
import { getJobReport } from "@/features/jobs/services/jobsApi"
import { JobReport } from "@/features/jobs/components/JobReport"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: { job_id: string }
}

function DocumentSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] shadow-xl shadow-black/30">
      {/* Skeleton header strip */}
      <div className="flex items-center gap-2.5 border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]/70 px-8 py-3">
        <div className="size-3.5 animate-spin rounded-full border-2 border-[var(--ds-accent-blue)] border-t-transparent" />
        <Skeleton className="h-2.5 w-36" />
      </div>

      {/* Skeleton content */}
      <div className="px-14 py-9">
        {/* Section 1 */}
        <div className="mb-5 flex items-start gap-4">
          <Skeleton className="mt-0.5 h-3 w-5 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-px w-full" />
          </div>
        </div>
        <div className="mb-4 space-y-2 pl-9">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
        </div>

        {/* Section 2 */}
        <div className="mb-5 mt-10 flex items-start gap-4">
          <Skeleton className="mt-0.5 h-3 w-5 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-px w-full" />
          </div>
        </div>
        <div className="mb-4 space-y-2 pl-9">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-3/5" />
        </div>

        {/* Section 3 */}
        <div className="mb-5 mt-10 flex items-start gap-4">
          <Skeleton className="mt-0.5 h-3 w-5 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-px w-full" />
          </div>
        </div>
        <div className="space-y-2 pl-9">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export default function ReportPage({ params }: Props) {
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const text = await getJobReport(params.job_id)
      setReport(text)
    } catch {
      setError(
        "Error al generar el informe. Asegúrate de que haya candidatos evaluados."
      )
    } finally {
      setLoading(false)
    }
  }, [params.job_id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="p-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", duration: 0.35 }}
        className="mb-7"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left — title block */}
          <div className="flex items-center gap-4">
            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ds-accent-blue)]/20 bg-gradient-to-br from-[var(--ds-accent-blue)]/20 to-[var(--ds-accent-blue)]/5 text-[var(--ds-accent-blue)]">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ds-gray-1000)]">
                  Informe IA
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-accent-blue)]/20 bg-[var(--ds-accent-blue)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-accent-blue)]">
                  <Cpu className="size-2.5" />
                  IA
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
                Análisis narrativo generado por IA
                <span className="mx-2 text-[var(--ds-gray-400)]">·</span>
                <span className="font-mono text-xs text-[var(--ds-gray-500)]">
                  {params.job_id}
                </span>
              </p>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={() => void load()}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Actualizando…" : "Actualizar informe"}
            </Button>
            <AnimatePresence>
              {report && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  <Button
                    onClick={() => window.print()}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Printer className="size-3.5" />
                    Imprimir
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Accent separator */}
        <div className="mt-5 h-px bg-gradient-to-r from-[var(--ds-accent-blue)]/20 via-[var(--ds-border)] to-transparent" />

        {/* Loading hint */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="mt-4 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1 rounded-full bg-[var(--ds-accent-blue)]/70"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      type: "tween",
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--ds-gray-500)]">
                La IA está analizando los candidatos — 5–15 segundos
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-5 text-sm text-[var(--ds-accent-red)]"
          >
            {error}
          </motion.div>
        ) : loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <DocumentSkeleton />
          </motion.div>
        ) : report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.35 }}
          >
            <JobReport content={report} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
