import type { ReactNode } from "react"
import Image from "next/image"

interface Props {
  children: ReactNode
}

export function AuthPageShell({ children }: Props) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-[var(--ds-background-100)] px-6 py-16">
      {/* Subtle background glow — mirrors homepage hero */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="NovaHiring"
          width={180}
          height={44}
          className="opacity-80"
          priority
        />

        {/* Form slot */}
        <div className="w-full">{children}</div>

        {/* Copyright */}
        <p className="text-center text-xs text-[var(--ds-gray-500)]">
          © 2025 NovaHiring. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
