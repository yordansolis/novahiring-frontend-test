"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function applyUrlForJob(jobId: string, origin = ""): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/upload?job_id=${encodeURIComponent(jobId)}`
}

interface ApplyLinkCopyProps {
  jobId: string
  variant?: "bar" | "compact"
  className?: string
}

export function ApplyLinkCopy({
  jobId,
  variant = "bar",
  className,
}: ApplyLinkCopyProps) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = applyUrlForJob(jobId, origin)

  async function copy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard permission denied — keep the visible URL so it can be selected */
    }
  }

  if (variant === "compact") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => void copy(e)}
        aria-label="Copiar link de postulación"
        className={cn(
          "text-[var(--ds-gray-600)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]",
          className
        )}
      >
        {copied ? (
          <Check className="text-[var(--ds-accent-green)]" />
        ) : (
          <Link2 />
        )}
        {copied ? "Copiado" : "Copiar link"}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] px-4 py-3",
        className
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-blue)]/10">
        <Link2 className="size-4 text-[var(--ds-accent-blue)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--ds-gray-700)]">
          Link de postulación
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--ds-gray-500)]">
          {url || "…"}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => void copy(e)}
        className="shrink-0 border-white/[0.14] bg-transparent text-[var(--ds-gray-1000)] hover:bg-[var(--ds-background-300)]"
      >
        {copied ? (
          <Check className="text-[var(--ds-accent-green)]" />
        ) : (
          <Copy />
        )}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  )
}
