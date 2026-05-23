"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  BarChart3,
  FileText,
  ClipboardList,
  ScrollText,
  LogOut,
  ChevronRight,
  Plus,
  Briefcase,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { logoutAdmin } from "@/lib/api"
import { getJobs, createJob } from "@/features/jobs/services/jobsApi"
import type { JobListItem, CreateJobRequest } from "@/features/jobs/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const JOB_NAV_ITEMS = [
  { href: "", label: "Candidatos", icon: Users },
  { href: "/ranking", label: "Top candidatos", icon: BarChart3 },
  { href: "/report", label: "Informe IA", icon: FileText },
  { href: "/profile", label: "Criterios", icon: ClipboardList },
  { href: "/cvs", label: "Auditoría CVs", icon: ScrollText },
] as const

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  jobId?: string
}

export function AdminSidebar({ jobId, ...props }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()

  const [jobs, setJobs] = React.useState<JobListItem[]>([])
  const [jobsLoading, setJobsLoading] = React.useState(true)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [formTitle, setFormTitle] = React.useState("")
  const [formNiche, setFormNiche] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const loadJobs = React.useCallback(async () => {
    setJobsLoading(true)
    try {
      const data = await getJobs()
      setJobs(data.jobs)
    } catch {
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  function openSheet() {
    setFormTitle("")
    setFormNiche("")
    setCreateError(null)
    setSheetOpen(true)
  }

  async function handleCreateJob(e: React.FormEvent) {
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
      setFormTitle("")
      setFormNiche("")
      await loadJobs()
      router.push(`/jobs/${newJob.job_id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear la vacante")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="border-b border-[var(--ds-border)] pb-0">
          <div className="flex h-14 items-center px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
            <Image
              src="/logo.png"
              alt="NovaHiring"
              width={1768}
              height={340}
              className="h-7 w-auto opacity-90 group-data-[collapsible=icon]:hidden"
            />
            <Image
              src="/icon.png"
              alt="N"
              width={256}
              height={256}
              className="hidden size-6 group-data-[collapsible=icon]:block"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Dashboard summary — only when no active job */}
          {jobId === undefined && (
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Resumen</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {jobsLoading ? (
                    <div className="space-y-1 px-2 py-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-8 animate-pulse rounded-md bg-[var(--ds-background-300)]" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {(
                        [
                          { label: "Vacantes",    value: String(jobs.length),                                         Icon: Briefcase,    badge: "blue"  },
                          { label: "En proceso",  value: String(jobs.filter((j) => j.status === "active").length),    Icon: TrendingUp,   badge: "green" },
                          { label: "Finalizadas", value: String(jobs.filter((j) => j.status !== "active").length),   Icon: CheckCircle2, badge: "gray"  },
                          { label: "Clientes",    value: String(new Set(jobs.map((j) => j.tenant_id)).size),          Icon: Building2,    badge: "blue"  },
                          { label: "Candidatos",  value: "—",                                                         Icon: Users,        badge: "amber" },
                          { label: "Por cerrar",  value: "—",                                                         Icon: Clock3,       badge: "red"   },
                        ] as const
                      ).map(({ label, value, Icon, badge }, i) => (
                        <SidebarMenuItem key={label}>
                          <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const, delay: i * 0.055 }}
                            className="w-full"
                          >
                            <SidebarMenuButton className="w-full cursor-default">
                              <Icon className="shrink-0" />
                              <span>{label}</span>
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                                  badge === "blue"  && "bg-[var(--ds-accent-blue)]/10  text-[var(--ds-accent-blue)]",
                                  badge === "green" && "bg-[var(--ds-accent-green)]/10 text-[var(--ds-accent-green)]",
                                  badge === "amber" && "bg-[var(--ds-accent-amber)]/10 text-[var(--ds-accent-amber)]",
                                  badge === "red"   && "bg-[var(--ds-accent-red)]/10   text-[var(--ds-accent-red)]",
                                  badge === "gray"  && "bg-[var(--ds-background-100)]  text-[var(--ds-gray-500)]",
                                )}
                              >
                                {value}
                              </span>
                            </SidebarMenuButton>
                          </motion.div>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {jobId !== undefined && <SidebarGroup>
            {/* Label + "+" button — hidden when sidebar is icon-collapsed */}
            <div className="flex items-center justify-between pr-1 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Convocatorias</SidebarGroupLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={openSheet}
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Nueva vacante"
                        className="size-6 text-[var(--ds-gray-500)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-1000)]"
                      />
                    }
                  >
                    <Plus className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right">Nueva vacante</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <SidebarGroupContent>
              <SidebarMenu>
                {/* Loading skeletons */}
                {jobsLoading && (
                  <div className="space-y-1 px-2 py-1 group-data-[collapsible=icon]:hidden">
                    <div className="h-8 animate-pulse rounded-md bg-[var(--ds-background-300)]" />
                    <div className="h-8 animate-pulse rounded-md bg-[var(--ds-background-300)]" />
                  </div>
                )}

                {/* Empty state */}
                {!jobsLoading && jobs.length === 0 && (
                  <div className="px-3 py-4 text-center group-data-[collapsible=icon]:hidden">
                    <p className="text-xs text-[var(--ds-gray-500)]">Sin convocatorias</p>
                    <Button
                      onClick={openSheet}
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs text-[var(--ds-accent-blue)] hover:text-[var(--ds-accent-blue)]"
                    >
                      Crear primera vacante
                    </Button>
                  </div>
                )}

                {/* Jobs list */}
                {!jobsLoading &&
                  jobs.map((job) => {
                    const isActiveJob = job.job_id === jobId
                    const jobBase = `/jobs/${job.job_id}`

                    return (
                      <SidebarMenuItem key={job.job_id}>
                        <SidebarMenuButton
                          render={<Link href={jobBase} />}
                          isActive={isActiveJob}
                          tooltip={job.title}
                          className="font-medium"
                        >
                          <Briefcase className="shrink-0" />
                          <span className="truncate">{job.title}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto size-3.5 shrink-0 text-[var(--ds-gray-500)] transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                              isActiveJob && "rotate-90"
                            )}
                          />
                        </SidebarMenuButton>

                        {/* Sub-navigation — only visible for the active job */}
                        {isActiveJob && (
                          <SidebarMenuSub>
                            {JOB_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                              const fullHref = `${jobBase}${href}`
                              const isActiveRoute =
                                href === ""
                                  ? pathname === jobBase
                                  : pathname === `${jobBase}${href}`
                              return (
                                <SidebarMenuSubItem key={href}>
                                  <SidebarMenuSubButton
                                    render={<Link href={fullHref} />}
                                    isActive={isActiveRoute}
                                  >
                                    <Icon />
                                    <span>{label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    )
                  })}

                {/* "Nueva vacante" in icon-collapsed mode */}
                <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
                  <SidebarMenuButton onClick={openSheet} tooltip="Nueva vacante">
                    <Plus />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
            <Avatar size="sm">
              <AvatarFallback className="rounded-md bg-[var(--ds-accent-blue)]/15 text-[var(--ds-accent-blue)] text-xs font-semibold">
                R
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-medium text-[var(--ds-gray-700)]">
                Reclutador
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() => logoutAdmin()}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Cerrar sesión"
                      className="shrink-0 text-[var(--ds-gray-500)] hover:bg-[var(--ds-accent-red)]/10 hover:text-[var(--ds-accent-red)]"
                    />
                  }
                >
                  <LogOut className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" hidden={state !== "collapsed"}>
                  Cerrar sesión
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* "Nueva vacante" sheet — outside Sidebar to avoid z-index conflicts */}
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
                htmlFor="job-title"
                className="text-xs font-medium text-[var(--ds-gray-700)]"
              >
                Nombre del puesto
              </Label>
              <Input
                id="job-title"
                placeholder="ej. Desarrollador Full-Stack"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="job-niche"
                className="text-xs font-medium text-[var(--ds-gray-700)]"
              >
                Sector
              </Label>
              <Input
                id="job-niche"
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
