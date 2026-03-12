'use client'

import Link from 'next/link'
import { Upload, Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
      <div className="section-container py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Insurance Company Has Already Started Building a Case Against Your Claim.
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-primary-100">
            The same documentation methodology professional adjusters use — without the 15% fee.
          </p>
          
          <p className="text-lg mb-8 text-primary-200">
            Built on documentation standards used in $3B+ in settled insurance claims.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/estimate-scan" 
              className="btn-primary inline-flex items-center gap-2 text-lg bg-white text-primary-700 hover:bg-gray-100"
            >
              <Zap className="w-5 h-5" />
              Scan Your Estimate - Free
            </Link>
            
            <Link 
              href="/policy-analysis" 
              className="inline-flex items-center gap-2 text-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              <Upload className="w-5 h-5" />
              Analyze Policy
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-primary-200">
            See What Your Policy Actually Requires You to Prove — Free
          </p>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Results in 60 seconds
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Bank-level security
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
