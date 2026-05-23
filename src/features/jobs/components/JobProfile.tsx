"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { XCircle, ShieldAlert, BarChart3, CheckCircle2 } from "lucide-react"
import type { JobProfile as JobProfileType } from "@/features/jobs/types"

interface Props {
  profile: JobProfileType
}

const SCORE_LABELS = ["1", "2", "3", "4", "5"] as const
type ScoreKey = (typeof SCORE_LABELS)[number]

const SCORE_META: Record<
  ScoreKey,
  { color: string; bg: string; stripe: string; label: string }
> = {
  "1": {
    color: "text-[var(--ds-accent-red)]",
    bg: "bg-[var(--ds-accent-red)]/5",
    stripe: "var(--ds-accent-red)",
    label: "Insuficiente",
  },
  "2": {
    color: "text-[var(--ds-accent-amber)]",
    bg: "bg-[var(--ds-accent-amber)]/5",
    stripe: "var(--ds-accent-amber)",
    label: "Básico",
  },
  "3": {
    color: "text-[var(--ds-gray-500)]",
    bg: "bg-[var(--ds-background-300)]",
    stripe: "var(--ds-gray-500)",
    label: "Aceptable",
  },
  "4": {
    color: "text-[var(--ds-accent-blue)]",
    bg: "bg-[var(--ds-accent-blue)]/5",
    stripe: "var(--ds-accent-blue)",
    label: "Bueno",
  },
  "5": {
    color: "text-[var(--ds-accent-green)]",
    bg: "bg-[var(--ds-accent-green)]/5",
    stripe: "var(--ds-accent-green)",
    label: "Excelente",
  },
}

const SKILL_DOT_COLORS = [
  "var(--ds-accent-blue)",
  "var(--ds-accent-green)",
  "var(--ds-accent-amber)",
  "var(--ds-accent-red)",
] as const

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween" as const, duration: 0.38, ease: "easeOut" as const },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween" as const, duration: 0.28, ease: "easeOut" as const },
  },
}

function ExpandableRubric({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [])

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          className={`text-[11px] leading-relaxed text-[var(--ds-gray-600)]${!expanded ? " line-clamp-3" : ""}`}
        >
          {text}
        </div>
        {!expanded && overflows && (
          <div className="pointer-events-none absolute bottom-0 left-0 h-6 w-full bg-gradient-to-t from-black/10 to-transparent" />
        )}
      </div>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[10px] font-medium text-[var(--ds-accent-blue)] hover:opacity-70 transition-opacity"
        >
          {expanded ? "Ver menos ↑" : "Ver más ↓"}
        </button>
      )}
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--ds-border)]" />
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
        {children}
      </span>
      <div className="h-px flex-1 bg-[var(--ds-border)]" />
    </div>
  )
}

export function JobProfile({ profile }: Props) {
  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Required Skills */}
      {profile.required_skills.length > 0 && (
        <motion.section variants={sectionVariants}>
          <SectionDivider>Habilidades necesarias</SectionDivider>
          <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]">
            {/* Green top accent line */}
            <div className="h-[2px] bg-gradient-to-r from-[var(--ds-accent-green)] via-[var(--ds-accent-green)]/40 to-transparent" />
            <div className="p-5">
              {/* Card header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-green)]/10">
                  <CheckCircle2 size={13} className="text-[var(--ds-accent-green)]" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-[var(--ds-gray-500)]">
                    Habilidades obligatorias
                  </span>
                  <span className="text-sm font-semibold text-[var(--ds-gray-1000)]">
                    {profile.required_skills.length} habilidad{profile.required_skills.length !== 1 ? "es" : ""} requerida{profile.required_skills.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {/* Skill chips */}
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {profile.required_skills.map((skill, i) => {
                  const dotColor =
                    SKILL_DOT_COLORS[i % SKILL_DOT_COLORS.length] ??
                    "var(--ds-accent-blue)"
                  return (
                    <motion.div
                      key={skill}
                      variants={cardVariants}
                      className="group flex items-center gap-2 rounded-lg border border-white/[0.14] bg-[var(--ds-background-300)] px-3 py-2 transition-colors duration-200 hover:bg-[var(--ds-background-300)]/80"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="text-xs font-medium text-[var(--ds-gray-700)] transition-colors duration-200 group-hover:text-[var(--ds-gray-1000)]">
                        {skill}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--ds-gray-500)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}

      {/* KO Criteria */}
      <motion.section variants={sectionVariants}>
        <SectionDivider>Requisitos obligatorios</SectionDivider>
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {profile.ko_criteria.map((ko) => (
            <motion.div
              key={ko.id}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]"
            >
              {/* Left accent bar */}
              <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ds-accent-red)]" />
              {/* Subtle red gradient bleed */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--ds-accent-red)]/[0.04] to-transparent" />

              <div className="relative p-4 pl-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--ds-accent-red)]/10">
                    <XCircle size={13} className="text-[var(--ds-accent-red)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-medium tracking-wider text-[var(--ds-gray-500)]">
                        {ko.id}
                      </span>
                      {ko.is_eliminatory && (
                        <span className="flex items-center gap-1 rounded-full border border-white/[0.14] bg-[var(--ds-accent-red)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-accent-red)]">
                          <ShieldAlert size={9} />
                          Obligatorio
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-snug text-[var(--ds-gray-1000)]">
                      {ko.descripcion}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--ds-gray-600)]">
                      {ko.razon}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Scorecard Rubric */}
      <motion.section variants={sectionVariants}>
        <SectionDivider>Cómo evalúa la IA</SectionDivider>
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {profile.scorecard.map((dim) => {
            const weightPct =
              profile.total_weight > 0
                ? Math.min((dim.peso / profile.total_weight) * 100, 100)
                : 0
            return (
              <motion.div
                key={dim.id}
                variants={cardVariants}
                className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]"
              >
                {/* Blue top accent line */}
                <div className="h-[2px] bg-gradient-to-r from-[var(--ds-accent-blue)] via-[var(--ds-accent-blue)]/40 to-transparent" />

                <div className="p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-blue)]/10">
                        <BarChart3 size={13} className="text-[var(--ds-accent-blue)]" />
                      </div>
                      <div>
                        <span className="block font-mono text-[10px] font-medium tracking-wider text-[var(--ds-gray-500)]">
                          {dim.id}
                        </span>
                        <h3 className="text-sm font-semibold leading-tight text-[var(--ds-gray-1000)]">
                          {dim.nombre}
                        </h3>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/[0.14] bg-[var(--ds-accent-blue)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--ds-accent-blue)]">
                      Peso {dim.peso}
                    </span>
                  </div>

                  {/* Relative weight bar */}
                  <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-[var(--ds-gray-500)]">
                        Importancia
                      </span>
                      <span className="text-[10px] font-medium text-[var(--ds-gray-600)]">
                        {weightPct.toFixed(0)}% del total
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[var(--ds-background-300)]">
                      <div
                        className="h-full rounded-full bg-[var(--ds-accent-blue)] transition-all duration-700"
                        style={{ width: `${weightPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Score rubric grid */}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                    {SCORE_LABELS.map((score: ScoreKey) => {
                      const meta = SCORE_META[score]
                      return (
                        <div
                          key={score}
                          className={`rounded-lg border border-white/[0.14] p-3 ${meta.bg}`}
                        >
                          <div className="mb-1 flex items-center gap-1.5">
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: meta.stripe }}
                            />
                            <span className={`text-xs font-bold leading-none ${meta.color}`}>
                              {score}
                            </span>
                            <span className="text-[10px] text-[var(--ds-gray-500)]">/5</span>
                            <span
                              className={`ml-auto text-[9px] font-semibold uppercase tracking-wide opacity-60 ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <ExpandableRubric text={dim.rubricas[score] ?? ""} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.section>
    </motion.div>
  )
}
