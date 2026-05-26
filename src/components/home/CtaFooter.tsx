import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function CtaFooter() {
  return (
    <section className="py-32 px-6 lg:px-12 border-t border-[var(--ds-border)]">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ds-gray-500)] mb-6">
          Empieza ahora
        </p>
        <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--ds-gray-1000)] mb-4 leading-tight">
          ¿Listo para contratar mejor?
        </h2>
        <p className="text-[var(--ds-gray-600)] mb-10 text-lg">
          Rápido. Consistente. Confiable.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            className="btn-glow px-8 h-12 text-sm font-medium rounded-full border-0"
            render={<Link href="/login/admin" />}
          >
            Acceder al panel
          </Button>
          <Button
            variant="outline"
            className="border-[var(--ds-border)] bg-transparent text-[var(--ds-gray-600)] hover:bg-[var(--ds-background-300)] hover:text-[var(--ds-gray-700)] px-8 h-12 text-sm rounded-full"
            render={<Link href={`/upload?job_id=${process.env.NEXT_PUBLIC_JOB_ID ?? ""}`} />}
          >
            Enviar mi CV
          </Button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <Image
            src="/logo-withe.png"
            alt="NovaHiring"
            width={2172}
            height={724}
            className="h-10 w-auto opacity-80 dark:hidden"
          />
          <Image
            src="/logo.png"
            alt="NovaHiring"
            width={1768}
            height={340}
            className="hidden h-10 w-auto opacity-70 dark:block"
          />
          <p className="text-xs text-[var(--ds-gray-500)]">
            © 2025 NovaHiring. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </section>
  )
}
