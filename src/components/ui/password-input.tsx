"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-gray-500)] transition-colors hover:text-[var(--ds-gray-1000)]"
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  )
}
