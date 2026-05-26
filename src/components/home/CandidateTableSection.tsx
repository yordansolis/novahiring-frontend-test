"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

type RecommendationLevel = "top" | "strong"

interface SeedCandidate {
  rank: number
  name: string
  compatibility: string
  level: RecommendationLevel
  label: string
  highlight: string
}

const CANDIDATES: SeedCandidate[] = [
  {
    rank: 1,
    name: "Sofía Delgado",
    compatibility: "97%",
    level: "top",
    label: "Recomendada",
    highlight:
      "Experiencia directa en proyectos de salud digital con despliegue en producción. Cumplimiento normativo completo y dominio de todas las integraciones requeridas.",
  },
  {
    rank: 2,
    name: "Carlos Rivas",
    compatibility: "95%",
    level: "top",
    label: "Recomendado",
    highlight:
      "Fundó y lanzó una plataforma SaaS para clínicas actualmente en producción. Excelente capacidad para tomar decisiones técnicas estratégicas.",
  },
  {
    rank: 3,
    name: "Elena Martínez",
    compatibility: "92%",
    level: "strong",
    label: "Considerar",
    highlight:
      "Historial sobresaliente de disponibilidad y fiabilidad. Certificación oficial en protección de datos — única en el proceso.",
  },
]

const LEVEL_STYLE: Record<RecommendationLevel, string> = {
  top: "bg-green-500/10 text-green-400 border border-green-500/20",
  strong: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
}

export function CandidateTableSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section className="py-28 px-6 lg:px-12 bg-[var(--ds-background-200)]">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="mb-12">
          <motion.span
            className="inline-block font-mono text-[11px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ type: "tween", duration: 0.5, delay: 0 }}
          >
            Resultado de la selección
          </motion.span>
          <motion.h2
            className="text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ds-gray-1000)]"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ type: "tween", duration: 0.5, delay: 0.08 }}
          >
            Ve quién es tu mejor candidato — y por qué.
          </motion.h2>
        </div>

        {/* Table */}
        <motion.div
          className="rounded-xl border border-[var(--ds-border)] overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ type: "tween", duration: 0.5, delay: 0.14 }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]">
                <th className="text-left px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ds-gray-500)] w-12">
                  #
                </th>
                <th className="text-left px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ds-gray-500)]">
                  Candidato
                </th>
                <th className="text-center px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ds-gray-500)]">
                  Compatibilidad
                </th>
                <th className="text-center px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ds-gray-500)]">
                  Resultado
                </th>
                <th className="text-left px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--ds-gray-500)] hidden lg:table-cell">
                  Por qué destacó
                </th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((candidate, i) => (
                <motion.tr
                  key={candidate.rank}
                  initial={{ opacity: 0, y: 8 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{
                    type: "tween",
                    duration: 0.4,
                    delay: 0.25 + i * 0.08,
                  }}
                  className="border-b border-[var(--ds-border)] last:border-0 hover:bg-[var(--ds-background-300)] transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-mono text-xs text-[var(--ds-gray-500)]">
                    {candidate.rank}
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--ds-gray-1000)]">
                    {candidate.name}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-[var(--ds-gray-1000)]">
                    {candidate.compatibility}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${LEVEL_STYLE[candidate.level]}`}
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-current" />
                      {candidate.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--ds-gray-600)] hidden lg:table-cell">
                    {candidate.highlight}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
