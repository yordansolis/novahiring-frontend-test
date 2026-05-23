import { AuthPageShell } from "@/components/auth/AuthPageShell"
import { CvUploadForm } from "@/features/auth/components/CvUploadForm"

interface Props {
  searchParams: Promise<{ job_id?: string }>
}

export default async function UploadPage({ searchParams }: Props) {
  const { job_id } = await searchParams

  return (
    <AuthPageShell>
      {job_id ? (
        <CvUploadForm jobId={job_id} />
      ) : (
        <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-8 text-center shadow-xl">
          <p className="text-sm text-[var(--ds-gray-600)]">
            Enlace de candidatura inválido. Solicita el enlace correcto al
            equipo de selección.
          </p>
        </div>
      )}
    </AuthPageShell>
  )
}
