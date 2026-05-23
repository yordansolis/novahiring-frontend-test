"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

export type AgentState = null | "thinking" | "listening" | "talking"

type OrbProps = {
  colors?: [string, string]
  agentState?: AgentState
  className?: string
}

export function Orb({
  colors = ["#4f93f8", "#2563eb"],
  agentState = null,
  className,
}: OrbProps) {
  const [c1, c2] = colors

  const duration =
    agentState === "talking"
      ? 0.65
      : agentState === "listening"
        ? 1.1
        : agentState === "thinking"
          ? 1.7
          : 3.5

  const coreScale =
    agentState === "talking"
      ? [1, 1.16, 0.95, 1.12, 1]
      : agentState === "listening"
        ? [1, 1.11, 1]
        : agentState === "thinking"
          ? [1, 1.08, 1]
          : [1, 1.03, 1]

  const glowOpacity =
    agentState === "talking"
      ? [0.55, 0.9, 0.55]
      : agentState === "listening"
        ? [0.45, 0.75, 0.45]
        : agentState === "thinking"
          ? [0.38, 0.62, 0.38]
          : [0.3, 0.48, 0.3]

  const repeatTransition = {
    duration,
    repeat: Infinity,
    ease: "easeInOut" as const,
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        className ?? "h-full w-full"
      )}
    >
      {/* Base gradient sphere */}
      <motion.div
        animate={{ scale: coreScale, transition: repeatTransition }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 38% 36%, ${c1}, ${c2} 72%)`,
        }}
      />
      {/* Specular highlight */}
      <motion.div
        animate={{ opacity: glowOpacity, transition: repeatTransition }}
        initial={{ opacity: 0.35 }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 26%, ${c1}aa 0%, transparent 55%)`,
        }}
      />
      {/* Ambient outer glow */}
      <motion.div
        animate={{
          opacity: glowOpacity,
          scale: coreScale,
          transition: { ...repeatTransition, duration: duration * 1.2 },
        }}
        initial={{ opacity: 0.25 }}
        className="absolute inset-[-25%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${c1}28 0%, transparent 68%)`,
          filter: "blur(10px)",
        }}
      />
    </div>
  )
}
