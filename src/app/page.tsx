import { HeroSection } from "@/components/home/HeroSection"
import { ProcessSection } from "@/components/home/ProcessSection"
import { CandidateTableSection } from "@/components/home/CandidateTableSection"
import { AuditabilitySection } from "@/components/home/AuditabilitySection"
import { CtaFooter } from "@/components/home/CtaFooter"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--ds-background-100)]">
      <HeroSection />
      <ProcessSection />
      <CandidateTableSection />
      <AuditabilitySection />
      <CtaFooter />
    </main>
  )
}
