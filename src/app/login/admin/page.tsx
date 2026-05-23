import { AuthPageShell } from "@/components/auth/AuthPageShell"
import { AdminLoginForm } from "@/features/auth/components/AdminLoginForm"

export default function AdminLoginPage() {
  return (
    <AuthPageShell>
      <AdminLoginForm />
    </AuthPageShell>
  )
}
