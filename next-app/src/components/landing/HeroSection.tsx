'use client'

import Link from 'next/link'
import { FileSearch, ArrowRight } from 'lucide-react'
import ClaimGapGraphic from './ClaimGapGraphic'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
      <div className="section-container py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Is Your Insurance Claim Being Underpaid?
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-primary-100">
            Find out in 60 seconds with our free AI-powered claim analyzer.
          </p>
          
          <p className="text-lg mb-8 text-primary-200">
            Upload your insurance estimate and instantly detect missing scope items, carrier tactics, and potential underpayments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/estimate-scan" 
              className="btn-primary inline-flex items-center gap-2 text-lg bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg shadow-xl"
            >
              <FileSearch className="w-6 h-6" />
              Analyze My Claim - Free
            </Link>
            
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 text-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 border-2 border-primary-400"
            >
              See Full Features
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-primary-200">
            Join thousands of homeowners who've recovered underpaid claims
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
              $12M+ in gaps detected
            </span>
          </div>

          {/* Claim Gap Graphic */}
          <ClaimGapGraphic />
        </div>
      </div>
    </section>
  )
}
