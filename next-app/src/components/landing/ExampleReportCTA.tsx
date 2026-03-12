'use client'

import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'

export default function ExampleReportCTA() {
  return (
    <section className="bg-white border-y-2 border-gray-200">
      <div className="section-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="bg-primary-100 rounded-full p-6">
                <FileText className="w-16 h-16 text-primary-600" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                See What You'll Get
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                View a complete claim analysis report with real line items, pricing discrepancies, carrier tactics, and specific recovery amounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/example-report"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-sm transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  View Example Report
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-sm text-gray-600 flex items-center justify-center md:justify-start">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                    Real data • 18-page report
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
