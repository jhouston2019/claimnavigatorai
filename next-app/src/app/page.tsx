import Link from 'next/link'
import HeroSection from '@/components/landing/HeroSection'
import CarrierPhrasesSection from '@/components/landing/CarrierPhrasesSection'
import ClaimTimelineSection from '@/components/landing/ClaimTimelineSection'
import CaseStudiesSection from '@/components/landing/CaseStudiesSection'
import CTASection from '@/components/landing/CTASection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CarrierPhrasesSection />
      <ClaimTimelineSection />
      <CaseStudiesSection />
      <CTASection />
    </main>
  )
}
