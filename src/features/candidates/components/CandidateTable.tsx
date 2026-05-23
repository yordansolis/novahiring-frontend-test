"use client"

import { useState } from "react"
import { Check, Copy, Eye, EyeOff, Users, Info } from "lucide-react"
import type { CandidateListItem } from "@/features/candidates/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  candidates: CandidateListItem[]
}

function StatusBadge({
  resultado,
  passed_ko,
}: {
  resultado: CandidateListItem["resultado"]
  passed_ko: boolean | null
}) {
  if (resultado === "APTO" && passed_ko !== false) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--ds-accent-green)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-green)]">
        Apto
      </span>
    )
  }
  if (resultado === "DESCARTADO" || passed_ko === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--ds-accent-red)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-red)]">
        Descartado
      </span>
    )
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex cursor-default items-center rounded-full bg-[var(--ds-accent-amber)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--ds-accent-amber)]">
            Sin analizar
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          Este candidato aún no ha sido analizado por la IA.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      onClick={() => void copy()}
      variant="ghost"
      size="icon-xs"
      aria-label="Copiar"
      className="ml-1 text-[var(--ds-gray-500)] hover:text-[var(--ds-gray-1000)]"
    >
      {copied ? (
        <Check className="text-[var(--ds-accent-green)]" />
      ) : (
        <Copy />
      )}
    </Button>
  )
}

function CredentialCell({
  username,
  password,
}: {
  username: string
  password: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center">
        <span className="font-mono text-xs text-[var(--ds-gray-700)]">{username}</span>
        <CopyBtn value={username} />
      </div>
      <div className="flex items-center">
        <span className="font-mono text-xs text-[var(--ds-gray-600)]">
          {show ? password : "••••••••••"}
        </span>
        <Button
          onClick={() => setShow((p) => !p)}
          variant="ghost"
          size="icon-xs"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="ml-1 text-[var(--ds-gray-500)] hover:text-[var(--ds-gray-1000)]"
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
        <CopyBtn value={password} />
      </div>
    </div>
  )
}

const COLUMNS = [
  { key: "candidato", label: "Candidato", tooltip: null },
  { key: "email", label: "Email", tooltip: null },
  { key: "resultado", label: "Resultado", tooltip: null },
  { key: "compatibilidad", label: "Compatibilidad", tooltip: null },
  {
    key: "acceso",
    label: "Acceso entrevista",
    tooltip: "Comparte estos datos con el candidato para que acceda a la entrevista en línea.",
  },
] as const

export function CandidateTable({ candidates }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] px-8 py-20 text-center">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--ds-background-300)]">
          <Users className="size-5 text-[var(--ds-gray-500)]" />
        </div>
        <p className="text-sm font-medium text-[var(--ds-gray-700)]">
          No hay candidatos todavía
        </p>
        <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
          Cuando los candidatos completen su postulación, aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[var(--ds-border)]">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 text-left text-xs font-medium text-[var(--ds-gray-500)]"
              >
                {col.tooltip ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="flex cursor-default items-center gap-1">
                          {col.label}
                          <Info className="size-3 text-[var(--ds-gray-400)]" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {col.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr
              key={c.candidate_id}
              className={cn(
                "transition-colors hover:bg-[var(--ds-background-300)]/60",
                i !== candidates.length - 1 && "border-b border-[var(--ds-border)]"
              )}
            >
              <td className="px-5 py-4">
                <span className="font-medium text-[var(--ds-gray-1000)]">
                  {c.nombre}
                </span>
              </td>
              <td className="px-5 py-4 text-[var(--ds-gray-600)]">
                {c.email ?? "—"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge resultado={c.resultado} passed_ko={c.passed_ko} />
              </td>
              <td className="px-5 py-4">
                {c.weighted_score !== null ? (
                  <span className="font-mono font-semibold text-[var(--ds-gray-1000)]">
                    {c.weighted_score}
                  </span>
                ) : (
                  <span className="text-[var(--ds-gray-500)]">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                {c.login_username !== null && c.login_password !== null ? (
                  <CredentialCell
                    username={c.login_username}
                    password={c.login_password}
                  />
                ) : (
                  <span className="text-[var(--ds-gray-500)]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
