"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { FocusField } from "@/components/ui/focus-field"
import { hasAdminKey } from "@/lib/api"
import { loginAdmin } from "@/features/auth/services/authApi"
import { STORAGE_KEYS } from "@/features/auth/types"
import type { AuthError } from "@/features/auth/types"

function getErrorMessage(err: AuthError): string {
  if (err.status === 401) return "Usuario o contraseña incorrectos."
  if (err.status === 503) return "El servidor no está configurado todavía."
  return "Error inesperado. Inténtalo de nuevo."
}

export function AdminLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (hasAdminKey()) router.replace("/dashboard")
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)
    try {
      const { api_key } = await loginAdmin({ username, password })
      localStorage.setItem(STORAGE_KEYS.adminApiKey, api_key)
      router.push("/dashboard")
    } catch (err) {
      const authErr = err as AuthError
      setErrorMsg(getErrorMessage(authErr))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-8 shadow-xl">
      <div className="mb-7 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-[var(--ds-gray-1000)]">
          Iniciar sesión
        </h1>
        <p className="text-sm text-[var(--ds-gray-600)]">
          Accede al panel de selección de candidatos
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <FocusField>
            <Field>
              <FieldLabel
                htmlFor="username"
                className="mb-2 text-sm font-medium text-[var(--ds-gray-700)]"
              >
                Usuario
              </FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="me@example.com"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)] placeholder:text-[var(--ds-gray-500)]"
              />
            </Field>
          </FocusField>

          <FocusField>
            <Field>
              <FieldLabel
                htmlFor="password"
                className="mb-2 text-sm font-medium text-[var(--ds-gray-700)]"
              >
                Contraseña
              </FieldLabel>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)] placeholder:tracking-widest"
              />
            </Field>
          </FocusField>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-4 py-3 text-sm text-[var(--ds-accent-red)]">
              <AlertCircle className="mt-px size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="btn-glow mt-1 w-full rounded-full border-0 py-2 text-sm font-medium"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
