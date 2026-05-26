"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import {
  Trophy,
  Star,
  TrendingUp,
  Users,
  RefreshCw,
  CheckCircle2,
  BarChart2,
  Minus,
} from "lucide-react"
import { motion } from "framer-motion"
import type { CandidateListItem } from "@/features/candidates/types"
import type { JobRanking, JobProfile, RankingCandidate } from "@/features/jobs/types"
import { getCandidates } from "@/features/candidates/services/candidatesApi"
import { getJobRanking, getJobProfile } from "@/features/jobs/services/jobsApi"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface Props {
  params: { job_id: string }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}

const chartConfig = {
  score: {
    label: "Puntuación",
    color: "var(--ds-accent-green)",
  },
} satisfies ChartConfig

interface ChartPoint {
  rank: string
  name: string
  score: number
  resultado: "APTO" | "DESCARTADO"
}

function buildChartData(
  candidates: RankingCandidate[],
  names: Record<string, string>
): ChartPoint[] {
  const sorted = [...candidates].sort((a, b) => {
    const sa = parseFloat(a.weighted_score ?? "0")
    const sb = parseFloat(b.weighted_score ?? "0")
    return sb - sa
  })

  return sorted.map((c, i) => {
    const rawName = c.nombre ?? names[c.candidate_id] ?? c.candidate_id
    const parts = rawName.split(".")
    const first = (parts[0] ?? rawName).replace(/\d+$/, "")
    const display =
      first.length > 0 ? first.charAt(0).toUpperCase() + first.slice(1) : rawName
    return {
      rank: `#${i + 1}`,
      name: display,
      score: parseFloat(c.weighted_score ?? "0"),
      resultado: c.resultado,
    }
  })
}

function displayName(c: RankingCandidate, names: Record<string, string>): string {
  return c.nombre ?? names[c.candidate_id] ?? c.candidate_id
}

export default function RankingPage({ params }: Props) {
  const [ranking, setRanking] = useState<JobRanking | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<JobProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const [rankData, candidateData, profileData] = await Promise.all([
        getJobRanking(params.job_id, force),
        getCandidates(params.job_id, force).catch((): CandidateListItem[] => []),
        getJobProfile(params.job_id, force).catch((): JobProfile | null => null),
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

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 p-4 text-sm text-[var(--ds-accent-red)]">
          {error}
        </div>
      </div>
    )
  }

  if (!ranking) return null

  const aptos = ranking.candidates.filter((c) => c.resultado === "APTO")
  const descartados = ranking.candidates.filter((c) => c.resultado === "DESCARTADO")
  const winner = aptos[0] ?? null
  const winnerScore = winner ? parseFloat(winner.weighted_score ?? "0") : 0
  const totalAptos = aptos.length
  const totalCandidates = ranking.candidates.length
  const avgScore =
    aptos.length > 0
      ? (
          aptos.reduce((s, c) => s + parseFloat(c.weighted_score ?? "0"), 0) /
          aptos.length
        ).toFixed(1)
      : "—"
  const areaCount = profile?.scorecard.length ?? 8
  const chartData = buildChartData(ranking.candidates, names)
  const maxScore = chartData.reduce((m, d) => Math.max(m, d.score), 1)
  const aptoCutoff = aptos.length > 0 ? parseFloat(aptos[aptos.length - 1]?.weighted_score ?? "0") : 0

  const winnerDisplayName = winner ? displayName(winner, names) : null

  return (
    <motion.div
      className="space-y-6 p-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-accent-blue)]/10 text-[var(--ds-accent-blue)]">
            <BarChart2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ds-gray-1000)]">
              Ranking de candidatos
            </h1>
            <p className="mt-0.5 text-sm text-[var(--ds-gray-600)]">
              Evaluados en {areaCount} áreas · {totalCandidates} candidato{totalCandidates !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => void load(true)} disabled={loading} variant="ghost" size="sm">
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Metric chips row */}
      <motion.div
        variants={cardVariants}
        transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          {
            icon: <Users className="size-4" />,
            label: "Candidatos totales",
            value: totalCandidates,
            color: "text-[var(--ds-gray-700)]",
            bg: "bg-[var(--ds-background-300)]/60",
          },
          {
            icon: <CheckCircle2 className="size-4" />,
            label: "Recomendados",
            value: totalAptos,
            color: "text-[var(--ds-accent-green)]",
            bg: "bg-[var(--ds-accent-green)]/[0.06]",
          },
          {
            icon: <TrendingUp className="size-4" />,
            label: "Score medio (aptos)",
            value: avgScore,
            color: "text-[var(--ds-accent-blue)]",
            bg: "bg-[var(--ds-accent-blue)]/[0.06]",
          },
        ].map((m) => (
          <div
            key={m.label}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-white/[0.14] px-4 py-3",
              m.bg
            )}
          >
            <span className={m.color}>{m.icon}</span>
            <div>
              <p className="text-xs text-[var(--ds-gray-500)]">{m.label}</p>
              <p className={cn("text-lg font-bold tabular-nums leading-tight", m.color)}>
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Winner hero */}
      {winner && winnerDisplayName && (
        <motion.div
          variants={cardVariants}
          transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)]"
        >
          {/* Green top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-[var(--ds-accent-green)] via-[var(--ds-accent-green)]/40 to-transparent" />

          <div className="flex items-center gap-6 px-6 py-5">
            {/* Trophy icon */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--ds-accent-green)]/10">
              <Trophy className="size-7 text-[var(--ds-accent-green)]" />
            </div>

            {/* Winner info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                  Candidato ganador
                </span>
                <span className="flex items-center gap-1 rounded-full border border-[var(--ds-accent-green)]/25 bg-[var(--ds-accent-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-accent-green)]">
                  <Star size={9} />
                  Recomendado
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--ds-gray-1000)] truncate">
                {winnerDisplayName}
              </h2>
              <p className="mt-1 text-sm text-[var(--ds-gray-600)]">
                Mayor compatibilidad entre {totalCandidates} candidato{totalCandidates !== 1 ? "s" : ""} evaluados
              </p>
            </div>

            {/* Score ticker */}
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
                Score
              </p>
              <p className="font-mono text-4xl font-black text-[var(--ds-accent-green)] leading-none mt-1">
                {winnerScore.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
                de {maxScore.toFixed(0)} max
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Score distribution chart (stock-market style) */}
      {chartData.length > 0 && (
        <motion.div
          variants={cardVariants}
          transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
          className="rounded-2xl border border-white/[0.14] bg-[var(--ds-background-200)] px-6 pb-4 pt-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--ds-gray-1000)]">
                Distribución de puntuaciones
              </h3>
              <p className="mt-0.5 text-xs text-[var(--ds-gray-600)]">
                Curva de rendimiento · candidatos ordenados por score
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--ds-gray-500)]">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-[var(--ds-accent-green)]" />
                Recomendados
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-[var(--ds-accent-red)]/60" />
                No seleccionados
              </span>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-52 w-full">
            <AreaChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ds-accent-green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--ds-accent-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--ds-border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="rank"
                tick={{ fontSize: 11, fill: "var(--ds-gray-500)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.ceil(maxScore * 1.1)]}
                tick={{ fontSize: 11, fill: "var(--ds-gray-500)" }}
                axisLine={false}
                tickLine={false}
              />
              {aptoCutoff > 0 && totalCandidates > totalAptos && (
                <ReferenceLine
                  y={aptoCutoff}
                  stroke="var(--ds-border)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Corte",
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "var(--ds-gray-500)",
                  }}
                />
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[var(--ds-gray-700)]">
                          {(item.payload as unknown as ChartPoint).name}
                        </span>
                        <span className="font-mono font-bold text-[var(--ds-accent-green)]">
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </span>
                      </div>
                    )}
                    hideLabel
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--ds-accent-green)"
                strokeWidth={2.5}
                fill="url(#scoreGradient)"
                dot={(props) => {
                  const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                  const point = chartData[index]
                  const isApto = point?.resultado === "APTO"
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={index === 0 ? 5 : 3.5}
                      fill={isApto ? "var(--ds-accent-green)" : "var(--ds-accent-red)"}
                      stroke="var(--ds-background-200)"
                      strokeWidth={2}
                      opacity={isApto ? 1 : 0.6}
                    />
                  )
                }}
                activeDot={{ r: 6, stroke: "var(--ds-background-200)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        </motion.div>
      )}

      {/* Full ranking table */}
      <motion.div
        variants={cardVariants}
        transition={{ type: "tween" as const, duration: 0.28, ease: "easeOut" as const }}
      >
        {aptos.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--ds-gray-500)]">
              Candidatos recomendados — {aptos.length}
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]">
              {aptos.map((c, i) => {
                const score = parseFloat(c.weighted_score ?? "0")
                const pct = (score / maxScore) * 100
                const isWinner = i === 0

                return (
                  <div
                    key={c.candidate_id}
                    className={cn(
                      "relative flex items-center gap-5 px-5 py-4",
                      i !== aptos.length - 1 && "border-b border-[var(--ds-border)]",
                      isWinner && "bg-[var(--ds-accent-green)]/[0.03]"
                    )}
                  >
                    {isWinner && (
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--ds-accent-green)] via-[var(--ds-accent-green)]/40 to-transparent" />
                    )}

                    <span
                      className={cn(
                        "w-6 shrink-0 text-center text-sm font-semibold",
                        isWinner ? "text-[var(--ds-accent-green)]" : "text-[var(--ds-gray-500)]"
                      )}
                    >
                      {i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-[var(--ds-gray-1000)]">
                            {displayName(c, names)}
                          </span>
                          {isWinner && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--ds-accent-green)]/25 bg-[var(--ds-accent-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-accent-green)]">
                              <Star size={9} />
                              Recomendado
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold text-[var(--ds-accent-green)]">
                          {c.weighted_score ?? "—"}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ds-background-300)]">
                        <div
                          className="h-full rounded-full bg-[var(--ds-accent-green)] transition-all"
                          style={{ width: `${pct}%`, opacity: isWinner ? 1 : 0.65 }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {descartados.length > 0 && (
          <section>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ds-gray-500)]">
              No cumplen los requisitos mínimos — {descartados.length}
            </h2>
            <p className="mb-3 text-xs text-[var(--ds-gray-500)]">
              No superaron uno o más criterios obligatorios del puesto.
            </p>
            <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]">
              {descartados.map((c, i) => (
                <div
                  key={c.candidate_id}
                  className={cn(
                    "flex items-center gap-5 px-5 py-4 opacity-50",
                    i !== descartados.length - 1 && "border-b border-[var(--ds-border)]"
                  )}
                >
                  <Minus className="size-4 shrink-0 text-[var(--ds-gray-500)]" />
                  <span className="flex-1 truncate text-sm text-[var(--ds-gray-700)]">
                    {displayName(c, names)}
                  </span>
                  <span className="rounded-full bg-[var(--ds-accent-red)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-red)]">
                    No seleccionado
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {ranking.candidates.length === 0 && (
          <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-16 text-center">
            <p className="text-sm text-[var(--ds-gray-600)]">
              No hay candidatos evaluados todavía.
            </p>
            <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
              Ve a la pestaña Candidatos y usa &ldquo;Analizar con IA&rdquo; para obtener resultados.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
