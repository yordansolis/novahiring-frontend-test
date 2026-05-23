import { Star } from "lucide-react"
import type { RankingCandidate } from "@/features/jobs/types"
import { cn } from "@/lib/utils"

interface Props {
  candidates: RankingCandidate[]
  names?: Record<string, string>
  scorecardLength?: number
}

export function RankingList({ candidates, names = {}, scorecardLength }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-16 text-center">
        <p className="text-sm text-[var(--ds-gray-600)]">
          No hay candidatos evaluados todavía.
        </p>
        <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
          Ve a la pestaña Candidatos y usa &ldquo;Analizar con IA&rdquo; para obtener resultados.
        </p>
      </div>
    )
  }

  const aptos = candidates.filter((c) => c.resultado === "APTO")
  const descartados = candidates.filter((c) => c.resultado === "DESCARTADO")
  const maxScore = Math.max(
    ...aptos.map((c) => parseFloat(c.weighted_score ?? "0")),
    1
  )

  const areaCount = scorecardLength ?? 8

  function displayName(c: RankingCandidate): string {
    return c.nombre ?? names[c.candidate_id] ?? c.candidate_id
  }

  return (
    <div className="space-y-6">
      {/* AI context banner */}
      <div className="rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] px-5 py-3.5">
        <p className="text-xs text-[var(--ds-gray-600)]">
          <span className="font-semibold text-[var(--ds-gray-700)]">¿Cómo funciona?</span>
          {" "}La IA evaluó las respuestas de cada candidato en {areaCount} áreas clave y asignó una
          puntuación de compatibilidad. Cuanto mayor sea la puntuación, mejor encaja el perfil con el puesto.
        </p>
      </div>

      {aptos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--ds-gray-500)]">
            Candidatos recomendados — {aptos.length} candidato{aptos.length !== 1 ? "s" : ""}
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
                  {/* Winner top accent */}
                  {isWinner && (
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--ds-accent-green)] via-[var(--ds-accent-green)]/40 to-transparent" />
                  )}

                  <span className={cn(
                    "w-6 shrink-0 text-center text-sm font-semibold",
                    isWinner ? "text-[var(--ds-accent-green)]" : "text-[var(--ds-gray-500)]"
                  )}>
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn(
                          "truncate text-sm font-medium",
                          isWinner ? "text-[var(--ds-gray-1000)]" : "text-[var(--ds-gray-1000)]"
                        )}>
                          {displayName(c)}
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
                        style={{ width: `${pct}%`, opacity: isWinner ? 1 : 0.6 }}
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
            No cumplen los requisitos mínimos — {descartados.length} candidato{descartados.length !== 1 ? "s" : ""}
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
                <span className="w-6 shrink-0 text-center text-sm text-[var(--ds-gray-500)]">
                  —
                </span>
                <span className="flex-1 truncate text-sm text-[var(--ds-gray-700)]">
                  {displayName(c)}
                </span>
                <span className="rounded-full bg-[var(--ds-accent-red)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-red)]">
                  No seleccionado
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
