"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LiveSystemPanel } from "./LiveSystemPanel"
import { LoginDropdown } from "./LoginDropdown"

const TRUST_SIGNALS = [
  "Proceso estructurado",
  "Candidatos evaluados",
  "Decisiones respaldadas",
] as const

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(59,130,246,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween", duration: 0.5, delay: 0 }}
            >
              <span className="inline-block font-mono text-[11px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-6">
                Contratación de talento con IA
              </span>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-[var(--ds-gray-1000)] leading-[1.06]">
                Contrata con
                <br />
                certeza.
              </h1>
            </motion.div>

            <motion.p
              className="text-lg text-[var(--ds-gray-600)] leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween", duration: 0.5, delay: 0.14 }}
            >
              Describe el perfil que buscas y NovaHiring evalúa a tus candidatos
              de forma consistente — para que puedas enfocarte en tomar la mejor
              decisión.
            </motion.p>

            <motion.div
              className="flex items-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween", duration: 0.5, delay: 0.26 }}
            >
              <LoginDropdown />
              <Button
                variant="outline"
                className="border-[var(--ds-border)] bg-transparent text-[var(--ds-gray-600)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-700)] px-6 h-11 text-sm rounded-full"
                render={<Link href={`/upload?job_id=${process.env.NEXT_PUBLIC_JOB_ID ?? ""}`} />}
              >
                Enviar mi CV
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center gap-6 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "tween", duration: 0.6, delay: 0.44 }}
            >
              {TRUST_SIGNALS.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-[var(--ds-gray-500)]"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400/60" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Recruiter dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "tween", duration: 0.6, delay: 0.18 }}
            className="w-full"
          >
            <LiveSystemPanel />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
