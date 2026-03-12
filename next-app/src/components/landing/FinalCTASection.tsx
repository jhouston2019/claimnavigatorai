'use client'

import Link from 'next/link'

export default function FinalCTASection() {
  return (
    <section className="bg-gray-900 text-white">
      <div className="section-container py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            The money is likely there. The coverage is probably in your policy. What's missing is proof structured the way insurers require it.
          </h2>
          
          {/* Subhead */}
          <p className="text-2xl text-gray-300 mb-12">
            That's exactly what Claim Command Pro produces.
          </p>

          {/* Trust Signals */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mb-12 text-gray-400">
            <p className="text-sm">
              No credit card required for free analysis
            </p>
            <p className="text-sm">
              Most users identify a documentation gap in under 10 minutes
            </p>
            <p className="text-sm">
              Built on the documentation standards used in $3B+ in settled claims
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-6">
            <Link
              href="/estimate-scan"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-12 py-5 transition-colors"
            >
              Start Your Free Claim Analysis
            </Link>
          </div>

          {/* Fine Print */}
          <p className="text-sm text-gray-500">
            One free policy analysis per email. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
