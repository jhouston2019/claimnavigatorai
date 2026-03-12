import Link from 'next/link'
import HeroSection from '@/components/landing/HeroSection'
import ReportPreview from '@/components/landing/ReportPreview'
import ThreeStepProcess from '@/components/landing/ThreeStepProcess'
import CarrierTacticsCards from '@/components/landing/CarrierTacticsCards'
import DeadlineTimeline from '@/components/landing/DeadlineTimeline'
import CaseStudyOutcome from '@/components/landing/CaseStudyOutcome'
import FinalCTASection from '@/components/landing/FinalCTASection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ReportPreview />
      <ThreeStepProcess />
      <CarrierTacticsCards />
      <DeadlineTimeline />
      <CaseStudyOutcome />
      <FinalCTASection />
    </main>
  )
}
