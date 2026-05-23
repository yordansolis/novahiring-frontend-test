"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, FileText, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LoginDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        onClick={() => setOpen((prev) => !prev)}
        className="btn-glow flex items-center gap-2 px-7 h-11 text-sm font-medium rounded-full border-0"
      >
        Acceder
        <ChevronDown
          className="size-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "tween", duration: 0.14 }}
            className="absolute left-0 top-full mt-2 z-50 w-52 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-1.5 shadow-2xl"
          >
            <Link
              href="/login/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--ds-gray-700)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
            >
              <UserRound className="size-4 shrink-0 text-[var(--ds-gray-500)]" />
              Soy reclutador/a
            </Link>
            <Link
              href="/login/candidate"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--ds-gray-700)] transition-colors hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
            >
              <FileText className="size-4 shrink-0 text-[var(--ds-gray-500)]" />
              Soy candidato/a
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
