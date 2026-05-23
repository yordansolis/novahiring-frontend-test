"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Sparkles, ChevronRight } from "lucide-react"
import type { Components } from "react-markdown"

interface Props {
  content: string
}

// ── Normaliser ────────────────────────────────────────────────────────────────

const CAPS_RE = /^[A-ZÁÉÍÓÚÑÜ\s\d:,.\-–—/()]+$/
const JUST_RE  = /^(\*{1,2})?\s*justificaci[oó]n\s*[*:]*\s*$/i

function isPlainHeading(t: string): boolean {
  return (
    CAPS_RE.test(t) &&
    t !== t.toLowerCase() &&
    t.length >= 4 &&
    t.length <= 80 &&
    !t.endsWith(".")
  )
}

function normalise(raw: string): string {
  const lines = raw.split("\n")
  return lines
    .map((line, i) => {
      const t = line.trim()
      if (t.startsWith("#")) return line
      if (JUST_RE.test(t)) return "### Justificación"
      if (isPlainHeading(t)) {
        const prev = (lines[i - 1] ?? "").trim()
        if (i === 0 || prev === "") return `# ${t}`
      }
      return line
    })
    .join("\n")
}

// ── Segment splitter ──────────────────────────────────────────────────────────

interface TextSegment { kind: "text";          content: string }
interface JustSegment { kind: "justificacion"; heading: string; body: string }
type Segment = TextSegment | JustSegment

function buildSegments(md: string): Segment[] {
  const lines = md.split("\n")
  const out: Segment[] = []
  let buf: string[] = []
  let i = 0

  const flush = () => {
    const c = buf.join("\n").trim()
    if (c) out.push({ kind: "text", content: c })
    buf = []
  }

  while (i < lines.length) {
    const line = lines[i] ?? ""
    const m = line.match(/^(#{1,6})\s+(.+)$/)

    if (m && /justificaci/i.test(m[2] ?? "")) {
      flush()
      const level = (m[1] ?? "").length
      const heading = m[2] ?? ""
      i++

      const bodyLines: string[] = []
      while (i < lines.length) {
        const next = lines[i] ?? ""
        const nm = next.match(/^(#{1,4})\s+/)
        if (nm && (nm[1] ?? "").length <= level) break
        bodyLines.push(next)
        i++
      }

      out.push({ kind: "justificacion", heading, body: bodyLines.join("\n").trim() })
    } else {
      buf.push(line)
      i++
    }
  }

  flush()
  return out
}

// ── Expandable table cell ─────────────────────────────────────────────────────
// Detects overflow after mount and shows a "Ver más" toggle only when needed.

function ExpandableCell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [])

  return (
    <div>
      <div className="relative">
        <div ref={ref} className={!expanded ? "line-clamp-3" : undefined}>
          {children}
        </div>
        {!expanded && overflows && (
          <div className="pointer-events-none absolute bottom-0 left-0 h-8 w-full bg-gradient-to-t from-[var(--ds-background-200)] to-transparent" />
        )}
      </div>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-[11px] font-medium text-[var(--ds-accent-blue)] hover:opacity-70 transition-opacity"
        >
          {expanded ? "Ver menos ↑" : "Ver más ↓"}
        </button>
      )}
    </div>
  )
}

// ── Markdown component maps ───────────────────────────────────────────────────

const mdComponents: Components = {
  h1({ children }) {
    return (
      <div className="mb-5 mt-10 first:mt-0">
        <div className="flex items-start gap-3">
          <span className="mt-[2px] h-[14px] w-[3px] shrink-0 rounded-full bg-[var(--ds-accent-blue)]/70" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--ds-gray-1000)]">
            {children}
          </h2>
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-[var(--ds-accent-blue)]/30 via-[var(--ds-border)] to-transparent" />
      </div>
    )
  },
  h2({ children }) {
    return (
      <h3 className="mb-2.5 mt-7 pl-9 text-[13px] font-semibold text-[var(--ds-gray-900)]">
        {children}
      </h3>
    )
  },
  h3({ children }) {
    return (
      <h4 className="mb-2 mt-5 pl-9 text-[13px] font-medium text-[var(--ds-gray-700)]">
        {children}
      </h4>
    )
  },
  p({ children }) {
    return (
      <p className="mb-4 pl-9 text-[13px] leading-[1.85] text-[var(--ds-gray-700)]">
        {children}
      </p>
    )
  },
  ul({ children }) {
    return <ul className="mb-4 space-y-1.5 pl-9">{children}</ul>
  },
  ol({ children }) {
    return <ol className="mb-4 list-none space-y-1.5 pl-9">{children}</ol>
  },
  li({ children }) {
    return (
      <li className="flex items-start gap-3">
        <span className="mt-[0.65rem] size-[5px] shrink-0 rounded-full bg-[var(--ds-accent-blue)]/60" />
        <span className="text-[13px] leading-[1.75] text-[var(--ds-gray-700)]">
          {children}
        </span>
      </li>
    )
  },
  strong({ children }) {
    return (
      <strong className="font-semibold text-[var(--ds-gray-900)]">{children}</strong>
    )
  },
  em({ children }) {
    return <em className="italic text-[var(--ds-gray-600)]">{children}</em>
  },
  hr() {
    return (
      <div className="my-8 pl-9">
        <div className="h-px bg-gradient-to-r from-[var(--ds-border)] via-[var(--ds-border)] to-transparent" />
      </div>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className="mb-4 ml-9 border-l-2 border-[var(--ds-accent-blue)]/40 pl-4">
        <div className="text-[13px] leading-[1.85] italic text-[var(--ds-gray-600)]">
          {children}
        </div>
      </blockquote>
    )
  },
  code({ children, className }) {
    if (className?.includes("language-")) {
      return (
        <pre className="mb-4 ml-9 overflow-x-auto rounded-lg border border-[var(--ds-border)] bg-[var(--ds-background-300)] p-4">
          <code className="font-mono text-[12px] leading-relaxed text-[var(--ds-gray-700)]">
            {children}
          </code>
        </pre>
      )
    }
    return (
      <code className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-background-300)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--ds-accent-blue)]">
        {children}
      </code>
    )
  },
  table({ children }) {
    return (
      <div className="mb-4 pl-9">
        <div className="overflow-x-auto rounded-xl border border-[var(--ds-border)]">
          <table className="w-full text-[13px]">{children}</table>
        </div>
      </div>
    )
  },
  thead({ children }) {
    return (
      <thead className="border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]">
        {children}
      </thead>
    )
  },
  th({ children }) {
    return (
      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td className="border-t border-[var(--ds-border)] px-4 py-3 text-[var(--ds-gray-700)]">
        <ExpandableCell>{children}</ExpandableCell>
      </td>
    )
  },
}

// Body components inside a Justificación panel — no pl-9 offset
const bodyComponents: Components = {
  ...mdComponents,
  h1({ children }) {
    return (
      <h3 className="mb-2 mt-4 text-[13px] font-semibold text-[var(--ds-gray-900)]">
        {children}
      </h3>
    )
  },
  h2({ children }) {
    return (
      <h3 className="mb-2 mt-4 text-[13px] font-semibold text-[var(--ds-gray-900)]">
        {children}
      </h3>
    )
  },
  h3({ children }) {
    return (
      <h4 className="mb-1.5 mt-3 text-[13px] font-medium text-[var(--ds-gray-700)]">
        {children}
      </h4>
    )
  },
  p({ children }) {
    return (
      <p className="mb-3 text-[13px] leading-[1.85] text-[var(--ds-gray-700)]">
        {children}
      </p>
    )
  },
  ul({ children }) {
    return <ul className="mb-3 space-y-1.5">{children}</ul>
  },
  ol({ children }) {
    return <ol className="mb-3 list-none space-y-1.5">{children}</ol>
  },
}

// ── Justificación collapsible (heading-based) ─────────────────────────────────

function JustificacionBlock({ heading, body }: { heading: string; body: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-3 ml-9">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--ds-border)] bg-[var(--ds-background-300)] px-4 py-2.5 text-left transition-colors hover:border-[var(--ds-accent-blue)]/20 hover:bg-[var(--ds-background-300)]/80"
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight
            className={`size-3.5 shrink-0 text-[var(--ds-accent-blue)] transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
          <span className="text-[13px] font-medium text-[var(--ds-gray-700)]">
            {heading}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-[var(--ds-gray-500)]">
          {open ? "Ocultar" : "Ver detalle"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div className="ml-1.5 mt-1.5 border-l-2 border-[var(--ds-accent-blue)]/20 pb-3 pl-5 pt-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={bodyComponents}>
                {body}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function JobReport({ content }: Props) {
  const processed = useMemo(() => normalise(content), [content])
  const segments  = useMemo(() => buildSegments(processed), [processed])

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] shadow-xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] bg-[var(--ds-background-300)]/70 px-8 py-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-3.5 text-[var(--ds-accent-blue)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ds-accent-blue)]">
            Informe generado por IA
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--ds-accent-green)]" />
          <span className="text-[11px] text-[var(--ds-gray-500)]">Completado</span>
        </div>
      </div>

      <div className="px-10 py-9 md:px-14">
        {segments.map((seg, i) =>
          seg.kind === "justificacion" ? (
            <JustificacionBlock key={i} heading={seg.heading} body={seg.body} />
          ) : (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm]}
              components={mdComponents}
            >
              {seg.content}
            </ReactMarkdown>
          )
        )}
      </div>
    </div>
  )
}
