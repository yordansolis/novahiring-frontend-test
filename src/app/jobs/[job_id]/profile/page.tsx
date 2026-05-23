"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Briefcase, ShieldAlert, BarChart3 } from "lucide-react"
import type { JobProfile as JobProfileType } from "@/features/jobs/types"
import { getJobProfile } from "@/features/jobs/services/jobsApi"
import { JobProfile } from "@/features/jobs/components/JobProfile"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: { job_id: string }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-3 h-3 w-40" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-36" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage({ params }: Props) {
  const [profile, setProfile] = useState<JobProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJobProfile(params.job_id)
      setProfile(data)
    } catch {
      setError("Error al cargar el perfil del puesto.")
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
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]">
            <Briefcase className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ds-gray-1000)]">
              Criterios de selección
            </h1>
            <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
              Habilidades, requisitos obligatorios y criterios de evaluación
            </p>
          </div>
        </div>

        {/* Stat chips — appear once data is loaded */}
        {profile && !loading && (
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--ds-accent-red)]/20 bg-[var(--ds-accent-red)]/5 px-3 py-2">
              <ShieldAlert size={13} className="shrink-0 text-[var(--ds-accent-red)]" />
              <div>
                <p className="text-[10px] text-[var(--ds-gray-500)]">Requisitos obligatorios</p>
                <p className="text-sm font-semibold leading-none text-[var(--ds-gray-1000)]">
                  {profile.ko_criteria.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--ds-accent-blue)]/20 bg-[var(--ds-accent-blue)]/5 px-3 py-2">
              <BarChart3 size={13} className="shrink-0 text-[var(--ds-accent-blue)]" />
              <div>
                <p className="text-[10px] text-[var(--ds-gray-500)]">Áreas evaluadas</p>
                <p className="text-sm font-semibold leading-none text-[var(--ds-gray-1000)]">
                  {profile.scorecard.length}
                </p>
              </div>
            </div>


            {profile.required_skills.length > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--ds-accent-green)]/20 bg-[var(--ds-accent-green)]/5 px-3 py-2">
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--ds-accent-green)]" />
                <div>
                  <p className="text-[10px] text-[var(--ds-gray-500)]">Habilidades</p>
                  <p className="text-sm font-semibold leading-none text-[var(--ds-gray-1000)]">
                    {profile.required_skills.length}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-4 text-sm text-[var(--ds-accent-red)]">
          {error}
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : profile ? (
        <JobProfile profile={profile} />
      ) : null}
    </div>
  )
}
