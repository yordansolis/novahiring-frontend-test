"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { hasAdminKey } from "@/lib/api"
import { getJobOffer } from "@/features/jobs/services/jobsApi"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { JobMetricsPanel } from "@/components/admin/JobMetricsPanel"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, PanelRight } from "lucide-react"

interface Props {
  children: React.ReactNode
  params: { job_id: string }
}

const PAGE_LABELS: Record<string, string> = {
  "": "Candidatos",
  "/ranking": "Top candidatos",
  "/report": "Informe IA",
  "/profile": "Criterios",
  "/cvs": "Auditoría CVs",
}

export default function JobLayout({ children, params }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [metricsOpen, setMetricsOpen] = useState(false)

  useEffect(() => {
    if (!hasAdminKey()) {
      router.replace("/login/admin")
    } else {
      setReady(true)
    }
  }, [router])

  const fetchTitle = useCallback(async () => {
    try {
      const offer = await getJobOffer(params.job_id)
      setJobTitle(offer.title)
    } catch {
      setJobTitle(null)
    }
  }, [params.job_id])

  useEffect(() => {
    if (ready) void fetchTitle()
  }, [ready, fetchTitle])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ds-background-100)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ds-accent-blue)] border-t-transparent" />
      </div>
    )
  }

  const base = `/jobs/${params.job_id}`
  const suffix = pathname.replace(base, "") as keyof typeof PAGE_LABELS
  const pageLabel = PAGE_LABELS[suffix] ?? "Dashboard"

  return (
    <SidebarProvider>
      <AdminSidebar jobId={params.job_id} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ds-border)] bg-[var(--ds-background-200)]/80 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1 size-8 text-[var(--ds-gray-600)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href="/dashboard" />}
                  className="flex items-center gap-1.5 text-[var(--ds-gray-700)] hover:text-[var(--ds-gray-1000)]"
                >
                  <Home className="size-3.5" />
                  <span className="hidden sm:inline">Inicio</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={<span />}
                  className="cursor-default text-[var(--ds-gray-500)] hover:text-[var(--ds-gray-500)]"
                >
                  {jobTitle ?? params.job_id}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-[var(--ds-gray-900)]">
                  {pageLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* Metrics panel toggle */}
          <Button
            onClick={() => setMetricsOpen((v) => !v)}
            variant="ghost"
            size="icon-sm"
            aria-label="Ver métricas"
            className={cn(
              "size-7 text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]",
              metricsOpen && "bg-[var(--ds-background-300)] text-[var(--ds-accent-blue)]"
            )}
          >
            <PanelRight className="size-3.5" />
          </Button>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <motion.div
              key={pathname}
              className="mx-auto w-full max-w-7xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
            >
              {children}
            </motion.div>
          </div>
          <JobMetricsPanel jobId={params.job_id} open={metricsOpen} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
