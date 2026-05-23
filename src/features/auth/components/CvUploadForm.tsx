"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Info, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { FocusField } from "@/components/ui/focus-field"
import { uploadCv } from "@/features/auth/services/authApi"
import type { AuthError, CvUploadResponse } from "@/features/auth/types"

const ALLOWED_TYPES = [
  "application/pdf",
  "text/markdown",
  "text/x-markdown",
  "text/plain",
]
const ALLOWED_EXTS = [".pdf", ".md"]

function isAllowedFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
  return ALLOWED_EXTS.includes(ext) || ALLOWED_TYPES.includes(file.type)
}

interface ErrorMessageMap {
  [key: string]: string
}

const ERROR_MESSAGES: ErrorMessageMap = {
  applications_closed: "Esta posición ya no acepta más candidatos.",
  duplicate_applicant:
    "Ya existe una candidatura registrada con este email para este puesto.",
  duplicate_cv: "Este CV ya fue registrado anteriormente.",
  unsupported_file_type: "Solo se aceptan archivos .pdf o .md.",
  cv_unreadable: "No se pudo leer el archivo. Usa un PDF con texto o un .md.",
  job_not_found: "El puesto indicado no existe.",
}

function getUploadError(err: AuthError): string {
  if (err.error && err.error in ERROR_MESSAGES) {
    return ERROR_MESSAGES[err.error] ?? "Error desconocido."
  }
  if (err.status === 400) return ERROR_MESSAGES["unsupported_file_type"] ?? ""
  if (err.status === 404) return ERROR_MESSAGES["job_not_found"] ?? ""
  if (err.status === 409) return ERROR_MESSAGES["duplicate_applicant"] ?? ""
  if (err.status === 422) return ERROR_MESSAGES["cv_unreadable"] ?? ""
  return "Error inesperado. Inténtalo de nuevo."
}

interface Props {
  jobId: string
}

type SubmitState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: CvUploadResponse }
  | { type: "error"; message: string }

export function CvUploadForm({ jobId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" })

  function handleFileChange(incoming: File | null) {
    if (!incoming) return
    if (!isAllowedFile(incoming)) {
      setSubmitState({ type: "error", message: "Solo se aceptan archivos .pdf o .md." })
      return
    }
    setFile(incoming)
    if (submitState.type === "error") setSubmitState({ type: "idle" })
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0] ?? null
    handleFileChange(dropped)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return

    setSubmitState({ type: "loading" })
    try {
      const result = await uploadCv({ job_id: jobId, nombre, email, cv_file: file })
      setSubmitState({ type: "success", result })
    } catch (err) {
      const authErr = err as AuthError
      setSubmitState({ type: "error", message: getUploadError(authErr) })
    }
  }

  if (submitState.type === "success") {
    const { passed_ko } = submitState.result
    return (
      <AnimatePresence>
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.4 }}
          className="rounded-xl border bg-[var(--ds-background-200)] p-8 shadow-xl"
          style={{
            borderColor: passed_ko
              ? "rgba(34,197,94,0.3)"
              : "var(--ds-border)",
          }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            {passed_ko ? (
              <CheckCircle2 className="size-10 text-[var(--ds-accent-green)]" />
            ) : (
              <Info className="size-10 text-[var(--ds-gray-600)]" />
            )}

            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-[var(--ds-gray-1000)]">
                {passed_ko ? "¡CV recibido!" : "CV recibido"}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ds-gray-600)]">
                {passed_ko
                  ? "Tu CV fue recibido y pasaste el filtro inicial. El equipo lo revisará y te enviaremos las credenciales de acceso si eres seleccionado/a."
                  : "Tu CV fue recibido. Lamentablemente no cumples con los requisitos mínimos para este puesto."}
              </p>
            </div>

            {passed_ko && (
              <div className="mt-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-background-300)] px-4 py-3 text-left text-sm text-[var(--ds-gray-600)]">
                Nuestro equipo evaluará tu candidatura junto con las demás. Si
                eres seleccionado/a, recibirás un usuario y contraseña.{" "}
                <a
                  href="/login/candidate"
                  className="text-[var(--ds-accent-blue)] underline-offset-4 hover:underline"
                >
                  Acceder a la entrevista →
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-background-200)] p-8 shadow-xl">
      <div className="mb-7 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-[var(--ds-gray-1000)]">
          Enviar candidatura
        </h1>
        <p className="text-sm text-[var(--ds-gray-600)]">
          Sube tu CV para aplicar a esta oferta de empleo.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <FocusField>
            <Field>
              <FieldLabel
                htmlFor="nombre"
                className="mb-2 text-sm font-medium text-[var(--ds-gray-700)]"
              >
                Nombre completo
              </FieldLabel>
              <Input
                id="nombre"
                type="text"
                placeholder="Sofía Delgado"
                required
                disabled={submitState.type === "loading"}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)] placeholder:text-[var(--ds-gray-500)]"
              />
            </Field>
          </FocusField>

          <FocusField>
            <Field>
              <FieldLabel
                htmlFor="email"
                className="mb-2 text-sm font-medium text-[var(--ds-gray-700)]"
              >
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="sofia@ejemplo.com"
                required
                disabled={submitState.type === "loading"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)] placeholder:text-[var(--ds-gray-500)]"
              />
            </Field>
          </FocusField>

          <Field>
            <FieldLabel className="mb-2 text-sm font-medium text-[var(--ds-gray-700)]">
              CV
            </FieldLabel>
            <div
              role="button"
              tabIndex={0}
              aria-label="Zona de carga del CV"
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
              }}
              className={[
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                dragging
                  ? "border-[var(--ds-accent-blue)] bg-[var(--ds-accent-blue)]/5"
                  : "border-[var(--ds-border)] bg-[var(--ds-background-300)] hover:border-[var(--ds-gray-400)]",
              ].join(" ")}
            >
              {file ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ds-gray-1000)]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      aria-label="Eliminar archivo"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="text-[var(--ds-gray-500)] hover:text-[var(--ds-accent-red)]"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <span className="text-xs text-[var(--ds-gray-500)]">
                    Haz clic para cambiar
                  </span>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-[var(--ds-gray-500)]" />
                  <span className="text-sm text-[var(--ds-gray-600)]">
                    Arrastra tu CV aquí o haz clic para seleccionar
                  </span>
                  <span className="text-xs text-[var(--ds-gray-500)]">
                    Solo archivos .pdf o .md
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md"
              className="sr-only"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </Field>

          {submitState.type === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 px-4 py-3 text-sm text-[var(--ds-accent-red)]">
              <AlertCircle className="mt-px size-4 shrink-0" />
              <span>{submitState.message}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitState.type === "loading" || !file}
            className="btn-glow mt-2 w-full rounded-full border-0 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitState.type === "loading" ? "Enviando..." : "Enviar candidatura"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
