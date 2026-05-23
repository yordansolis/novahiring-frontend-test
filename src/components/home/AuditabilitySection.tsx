"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Clock, Scale, CheckCircle } from "lucide-react"
import type { FC, SVGProps } from "react"

type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number | string }>

interface Benefit {
  Icon: IconComponent
  title: string
  description: string
}

const BENEFITS: Benefit[] = [
  {
    Icon: Clock as IconComponent,
    title: "Ahorra semanas",
    description:
      "Reduce el proceso de selección de semanas a horas. Identifica a los mejores perfiles sin revisar cientos de documentos manualmente.",
  },
  {
    Icon: Scale as IconComponent,
    title: "Proceso imparcial",
    description:
      "Todos los candidatos son evaluados con los mismos criterios, de forma consistente. Sin improvisación, sin sesgos, sin favoritismos.",
  },
  {
    Icon: CheckCircle as IconComponent,
    title: "Decisiones claras",
    description:
      "Cada recomendación viene acompañada de razones concretas. Contrata con seguridad y explica tu decisión con confianza.",
  },
]

export function AuditabilitySection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section className="py-28 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <motion.span
            className="inline-block font-mono text-[11px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ type: "tween", duration: 0.5, delay: 0 }}
          >
            Por qué NovaHiring
          </motion.span>
          <motion.h2
            className="text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ds-gray-1000)] mb-4"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ type: "tween", duration: 0.5, delay: 0.08 }}
          >
            Contrata mejor. Sin complicaciones.
          </motion.h2>
          <motion.p
            className="text-[var(--ds-gray-600)] leading-relaxed text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ type: "tween", duration: 0.5, delay: 0.16 }}
          >
            Desde la descripción del puesto hasta la decisión final. Un proceso
            claro, consistente y pensado para ti — no para ingenieros.
          </motion.p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, i) => {
            const BenefitIcon = benefit.Icon
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  type: "tween",
                  duration: 0.5,
                  delay: 0.2 + i * 0.12,
                }}
                className="p-6 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] flex flex-col gap-4"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-background-300)] shrink-0">
                  <BenefitIcon size={18} className="text-[var(--ds-gray-600)]" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[var(--ds-gray-1000)] mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[var(--ds-gray-600)] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
