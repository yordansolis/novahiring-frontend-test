"use client"

import { useEffect, useState, useCallback } from "react"
import { BarChart3, RefreshCw } from "lucide-react"
import type { CandidateListItem } from "@/features/candidates/types"
import type { JobRanking, JobProfile } from "@/features/jobs/types"
import { getCandidates } from "@/features/candidates/services/candidatesApi"
import { getJobRanking, getJobProfile } from "@/features/jobs/services/jobsApi"
import { RankingList } from "@/features/jobs/components/RankingList"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: { job_id: string }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[5, 3].map((rows, si) => (
        <div key={si}>
          <Skeleton className="mb-3 h-3 w-28" />
          <div className="overflow-hidden rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)]">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-5 border-b border-[var(--ds-border)] px-5 py-4 last:border-0"
              >
                <Skeleton className="size-6 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-1.5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RankingPage({ params }: Props) {
  const [ranking, setRanking] = useState<JobRanking | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<JobProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rankData, candidateData, profileData] = await Promise.all([
        getJobRanking(params.job_id),
        getCandidates(params.job_id).catch((): CandidateListItem[] => []),
        getJobProfile(params.job_id).catch((): JobProfile | null => null),
      ])
      setRanking(rankData)
      setProfile(profileData)
      const nameMap: Record<string, string> = {}
      for (const c of candidateData) {
        nameMap[c.candidate_id] = c.nombre
      }
      setNames(nameMap)
    } catch {
      setError("Error al cargar los resultados.")
    } finally {
      setLoading(false)
    }
  }, [params.job_id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ds-gray-1000)]">
              Mejores candidatos
            </h1>
            <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
              Los candidatos con mayor compatibilidad aparecen primero
            </p>
          </div>
        </div>
        <Button
          onClick={() => void load()}
          disabled={loading}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-4 text-sm text-[var(--ds-accent-red)]">
          {error}
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : ranking ? (
        <RankingList
          candidates={ranking.candidates}
          names={names}
          {...(profile !== null ? { scorecardLength: profile.scorecard.length } : {})}
        />
      ) : null}
    </div>
  )
}
