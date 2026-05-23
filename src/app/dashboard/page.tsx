"use client"

import { useEffect, useState, useCallback, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Briefcase, ArrowRight } from "lucide-react"
import { hasAdminKey } from "@/lib/api"
import { getJobs, createJob } from "@/features/jobs/services/jobsApi"
import type { JobListItem, CreateJobRequest } from "@/features/jobs/types"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formNiche, setFormNiche] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAdminKey()) {
      router.replace("/login/admin")
    } else {
      setReady(true)
    }
  }, [router])

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getJobs()
      setJobs(data.jobs)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready) void loadJobs()
  }, [ready, loadJobs])

  function openSheet() {
    setFormTitle("")
    setFormNiche("")
    setCreateError(null)
    setSheetOpen(true)
  }

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formNiche.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const request: CreateJobRequest = {
        title: formTitle.trim(),
        niche: formNiche.trim(),
      }
      const newJob = await createJob(request)
      setSheetOpen(false)
      await loadJobs()
      router.push(`/jobs/${newJob.job_id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear la vacante")
    } finally {
      setCreating(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ds-background-100)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ds-accent-blue)] border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ds-border)] bg-[var(--ds-background-200)]/80 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1 size-8 text-[var(--ds-gray-600)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-[var(--ds-gray-900)]">
                    Convocatorias
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button
              onClick={openSheet}
              size="sm"
              className="btn-glow rounded-full border-0"
            >
              <Plus />
              Nueva vacante
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto">
            <motion.main
              className="mx-auto max-w-5xl px-6 py-10"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
            >
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--ds-gray-1000)]">
                  Convocatorias
                </h1>
                <p className="mt-1 text-sm text-[var(--ds-gray-600)]">
                  {loading
                    ? "Cargando..."
                    : `${jobs.length} convocatoria${jobs.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[130px] animate-pulse rounded-xl bg-[var(--ds-background-200)]"
                    />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.14] py-24">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--ds-background-300)]">
                    <Briefcase className="size-5 text-[var(--ds-gray-500)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[var(--ds-gray-700)]">
                    Sin convocatorias todavía
                  </p>
                  <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
                    Crea tu primera vacante para comenzar a recibir candidatos
                  </p>
                  <Button
                    onClick={openSheet}
                    className="btn-glow mt-6 rounded-full border-0"
                    size="sm"
                  >
                    <Plus />
                    Crear vacante
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => (
                    <Link
                      key={job.job_id}
                      href={`/jobs/${job.job_id}`}
                      className="group block"
                    >
                      <div className="h-full rounded-xl border border-white/[0.14] bg-[var(--ds-background-200)] p-5 transition-colors hover:bg-[var(--ds-background-300)]/80">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-accent-blue)]/10">
                            <Briefcase className="size-4 text-[var(--ds-accent-blue)]" />
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              job.status === "active"
                                ? "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]"
                                : "bg-[var(--ds-background-300)] text-[var(--ds-gray-500)]"
                            }`}
                          >
                            {job.status === "active" ? "Activa" : job.status}
                          </span>
                        </div>
                        <div className="mt-3">
                          <p className="font-semibold leading-snug text-[var(--ds-gray-1000)]">
                            {job.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ds-gray-500)]">{job.niche}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--ds-accent-blue)] opacity-0 transition-opacity group-hover:opacity-100">
                          Abrir workspace
                          <ArrowRight className="size-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.main>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Sheet outside SidebarProvider to avoid z-index conflicts */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-80 border-white/[0.14] bg-[var(--ds-background-200)] p-0"
        >
          <SheetHeader className="border-b border-[var(--ds-border)] px-5 py-4">
            <SheetTitle className="text-sm font-semibold text-[var(--ds-gray-1000)]">
              Nueva vacante
            </SheetTitle>
            <SheetDescription className="text-xs text-[var(--ds-gray-600)]">
              Crea una nueva convocatoria de selección.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => void handleCreateJob(e)}
            className="flex flex-col gap-4 px-5 py-5"
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="dash-title"
                className="text-xs font-medium text-[var(--ds-gray-700)]"
              >
                Nombre del puesto
              </Label>
              <Input
                id="dash-title"
                placeholder="ej. Desarrollador Full-Stack"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="dash-niche"
                className="text-xs font-medium text-[var(--ds-gray-700)]"
              >
                Sector
              </Label>
              <Input
                id="dash-niche"
                placeholder="ej. clinica_medica"
                value={formNiche}
                onChange={(e) => setFormNiche(e.target.value)}
                required
              />
            </div>

            {createError !== null && (
              <p className="text-xs text-[var(--ds-accent-red)]">{createError}</p>
            )}

            <Button
              type="submit"
              disabled={creating || !formTitle.trim() || !formNiche.trim()}
              className="btn-glow mt-1 w-full rounded-full border-0"
            >
              {creating ? "Creando..." : "Crear vacante"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
