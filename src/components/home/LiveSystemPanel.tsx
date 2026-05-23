"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

type FitLevel = "strong" | "good" | "review"

interface Candidate {
  id: string
  initials: string
  name: string
  fit: number
  level: FitLevel
  label: string
}

interface ActivityEntry {
  id: string
  message: string
}

const CANDIDATES: Candidate[] = [
  { id: "c1", initials: "SD", name: "Sofía Delgado", fit: 97, level: "strong", label: "Recomendada" },
  { id: "c2", initials: "CR", name: "Carlos Rivas", fit: 95, level: "strong", label: "Recomendado" },
  { id: "c3", initials: "EM", name: "Elena Martínez", fit: 92, level: "good", label: "Considerar" },
]

const INITIAL_ACTIVITIES: ActivityEntry[] = [
  { id: "a0", message: "Proceso de selección iniciado" },
  { id: "a1", message: "Sofía completó su entrevista" },
  { id: "a2", message: "Resumen generado — Carlos Rivas" },
]

const ACTIVITY_POOL: string[] = [
  "Entrevista programada — Elena Martínez",
  "Informe de compatibilidad listo",
  "Nuevo candidato añadido",
  "Revisión completada — Sofía Delgado",
  "Proceso de selección actualizado",
  "Recomendación generada",
  "Comparativa de candidatos lista",
  "Evaluación completada — Carlos Rivas",
]

const LEVEL_STYLE: Record<FitLevel, string> = {
  strong: "bg-green-500/10 text-green-400 border border-green-500/20",
  good: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  review: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
}

function FitCounter({ target, delay }: { target: number; delay: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const timeout = window.setTimeout(() => {
      const start = performance.now()
      const duration = 1200
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) {
          frame = requestAnimationFrame(tick)
        }
      }
      frame = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
  }, [target, delay])

  return <span className="tabular-nums">{value}%</span>
}

export function LiveSystemPanel() {
  const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITIES)
  const poolIndexRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = poolIndexRef.current % ACTIVITY_POOL.length
      const msg = ACTIVITY_POOL.at(idx)
      if (!msg) return
      poolIndexRef.current += 1

      const newEntry: ActivityEntry = {
        id: `${Date.now()}-${idx}`,
        message: msg,
      }

      setActivities((prev) => [...prev.slice(-4), newEntry])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]">
        <span className="text-[13px] font-medium text-[var(--ds-gray-1000)]">
          Proceso de Selección
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[var(--ds-gray-600)]">Activo</span>
        </div>
      </div>

      {/* Job context */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-1">
          Puesto
        </p>
        <p className="text-sm font-medium text-[var(--ds-gray-700)]">
          Desarrollador Full Stack — Clínica Digital
        </p>
      </div>

      {/* Candidate cards */}
      <div className="px-4 pb-4">
        <p className="text-[10px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-3 mt-2">
          Candidatos evaluados
        </p>
        <div className="space-y-2">
          {CANDIDATES.map((candidate, i) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "tween", duration: 0.35, delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--ds-background-300)] border border-[var(--ds-border)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--ds-background-100)] border border-[var(--ds-border)] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-[var(--ds-gray-500)]">
                  {candidate.initials}
                </span>
              </div>

              <p className="flex-1 min-w-0 text-xs font-medium text-[var(--ds-gray-1000)] truncate">
                {candidate.name}
              </p>

              <span className="shrink-0 text-xs font-semibold text-[var(--ds-gray-700)]">
                <FitCounter target={candidate.fit} delay={400 + i * 120} />
              </span>

              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${LEVEL_STYLE[candidate.level]}`}
              >
                {candidate.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--ds-border)]" />

      {/* Activity feed */}
      <div className="px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-2">
          Actividad reciente
        </p>
        <div className="space-y-1.5" style={{ minHeight: "60px" }}>
          <AnimatePresence initial={false} mode="popLayout">
            {activities.slice(-3).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "tween", duration: 0.5 }}
                className="flex items-center gap-2 text-xs text-[var(--ds-gray-600)]"
              >
                <CheckCircle2 size={12} className="shrink-0 text-green-400/70" />
                <span className="truncate">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
