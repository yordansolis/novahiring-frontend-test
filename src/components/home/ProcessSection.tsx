"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Pencil, Users, MessageSquare, ThumbsUp } from "lucide-react"
import type { FC, SVGProps } from "react"

type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number | string }>

interface Stage {
  step: string
  title: string
  description: string
  Icon: IconComponent
}

const STAGES: Stage[] = [
  {
    step: "01",
    title: "Define el perfil",
    description:
      "Describe el puesto en tus propias palabras. NovaHiring diseña el proceso de selección ideal adaptado a tus necesidades específicas.",
    Icon: Pencil as IconComponent,
  },
  {
    step: "02",
    title: "Filtra sin esfuerzo",
    description:
      "Identifica en minutos quién encaja con lo que buscas. Sin revisar cientos de CVs manualmente ni perderte en hojas de cálculo.",
    Icon: Users as IconComponent,
  },
  {
    step: "03",
    title: "Entrevistas consistentes",
    description:
      "Cada candidato recibe una evaluación estructurada y justa. Disponible cuando tú lo necesitas, sin depender de tu agenda.",
    Icon: MessageSquare as IconComponent,
  },
  {
    step: "04",
    title: "Decide con confianza",
    description:
      "Obtén un ranking claro con recomendaciones respaldadas. Elige al candidato ideal con seguridad, no con intuición.",
    Icon: ThumbsUp as IconComponent,
  },
]

export function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-28 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <motion.span
            className="inline-block font-mono text-[11px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ type: "tween", duration: 0.5, delay: 0 }}
          >
            Cómo funciona
          </motion.span>
          <motion.h2
            className="text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ds-gray-1000)]"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ type: "tween", duration: 0.5, delay: 0.08 }}
          >
            Del puesto al candidato ideal — sin el caos.
          </motion.h2>
        </div>

        {/* Stages grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
          {STAGES.map((stage, i) => {
            const StageIcon = stage.Icon
            return (
              <div key={stage.step} className="relative flex flex-col">
                {/* Connector line between cards */}
                {i < STAGES.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-1/2 right-0 h-px overflow-hidden z-0">
                    <motion.div
                      className="h-full bg-[var(--ds-border)]"
                      initial={{ scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{
                        type: "tween",
                        duration: 0.5,
                        delay: 0.35 + i * 0.15,
                      }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                )}

                <motion.div
                  className="relative z-10 pr-6 pb-8 md:pb-0"
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{
                    type: "tween",
                    duration: 0.45,
                    delay: 0.2 + i * 0.12,
                  }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-background-300)] shrink-0">
                      <StageIcon
                        size={16}
                        className="text-[var(--ds-gray-600)]"
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[var(--ds-gray-500)] uppercase tracking-widest">
                      {stage.step}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[var(--ds-gray-1000)] mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-[var(--ds-gray-600)] leading-relaxed">
                    {stage.description}
                  </p>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
