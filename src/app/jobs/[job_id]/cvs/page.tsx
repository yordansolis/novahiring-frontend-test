"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { ScrollText, RefreshCw } from "lucide-react"
import { getCvAudit } from "@/features/candidates/services/candidatesApi"
import type { CvAuditItem } from "@/features/candidates/types"
import { CvAuditList } from "@/features/candidates/components/CvAuditList"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: { job_id: string }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] px-5 py-4"
        >
          <Skeleton className="size-6 shrink-0 rounded" />
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-5 w-16 shrink-0 rounded-full sm:block" />
          <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export default function CvsPage({ params }: Props) {
  const [cvs, setCvs] = useState<CvAuditItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCvAudit(params.job_id, force)
      setCvs(data)
    } catch {
      setError("Error al cargar los CVs. Comprueba tu conexión e inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [params.job_id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween" as const, duration: 0.35, ease: "easeOut" as const }}
        className="mb-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]">
              <ScrollText className="size-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ds-gray-1000)]">
                Auditoría de CVs
              </h1>
              <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
                Todos los candidatos ordenados por fecha de postulación
                <span className="mx-2 text-[var(--ds-gray-400)]">·</span>
                <span className="font-mono text-xs text-[var(--ds-gray-500)]">
                  {params.job_id}
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => void load(true)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando…" : "Actualizar"}
          </Button>
        </div>

        <div className="mt-5 h-px bg-gradient-to-r from-[var(--ds-accent-blue)]/20 via-[var(--ds-border)] to-transparent" />
      </motion.div>

      {/* Content */}
      {error ? (
        <div className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-5 text-sm text-[var(--ds-accent-red)]">
          {error}
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : cvs !== null ? (
        <CvAuditList candidates={cvs} />
      ) : null}
    </div>
  )
}
