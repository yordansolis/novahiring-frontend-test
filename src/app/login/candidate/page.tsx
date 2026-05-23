import { AuthPageShell } from "@/components/auth/AuthPageShell"
import { CandidateLoginForm } from "@/features/auth/components/CandidateLoginForm"

export default function CandidateLoginPage() {
  return (
    <AuthPageShell>
      <CandidateLoginForm />
    </AuthPageShell>
  )
}
