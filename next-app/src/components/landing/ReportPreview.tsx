'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle, DollarSign, FileText } from 'lucide-react'

export default function ReportPreview() {
  return (
    <section className="bg-white">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              This Is What You'll Get
            </h2>
            <p className="text-lg text-gray-600">
              A complete claim analysis report with real line items, not vague summaries
            </p>
          </div>

          {/* Report Preview - Styled to look like actual document */}
          <div className="bg-gray-100 p-4 md:p-8 rounded-sm border-2 border-gray-300 shadow-2xl">
            <div className="bg-white border-2 border-gray-400 shadow-lg">
              {/* Report Header */}
              <div className="bg-gray-900 text-white p-6 border-b-4 border-red-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Claim Gap Analysis Report</h3>
                    <p className="text-xs text-gray-400">Report ID: CCP-2026-03-8472 | Generated: March 12, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Severity</p>
                    <p className="text-3xl font-bold text-red-500">8.4/10</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-6 bg-red-50 border-b-2 border-gray-300">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Financial Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Carrier's Estimate</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">$18,400</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Verified Scope</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">$36,750</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Potential Gap</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">$18,350</p>
                  </div>
                </div>
              </div>

              {/* Carrier Tactics Preview */}
              <div className="p-6 border-b-2 border-gray-300">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Carrier Arguments Detected
                </h4>
                <div className="space-y-2">
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Tactic 1: "Wear and Tear" Exclusion</p>
                    <p className="text-xs text-gray-700">
                      Carrier's statement: "Damage appears consistent with normal aging..."
                    </p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Tactic 2: Scope Reduction</p>
                    <p className="text-xs text-gray-700">
                      Carrier excluded roof decking, underlayment, interior damage...
                    </p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Tactic 3: Suppressed Labor Rates</p>
                    <p className="text-xs text-gray-700">
                      Using $42/hr vs market rate of $68/hr = $1,248 gap
                    </p>
                  </div>
                </div>
              </div>

              {/* Missing Scope Preview */}
              <div className="p-6 border-b-2 border-gray-300">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  Missing Scope Items (10 items)
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-700">Roof decking replacement (8 sheets)</span>
                    <span className="font-semibold text-gray-900">$384.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-700">Roof decking labor (12 hours @ $68)</span>
                    <span className="font-semibold text-gray-900">$816.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-700">Ice & water shield (6 rolls)</span>
                    <span className="font-semibold text-gray-900">$534.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-700">Attic insulation replacement (450 sq ft)</span>
                    <span className="font-semibold text-gray-900">$1,440.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-700">Interior ceiling repair (2 rooms)</span>
                    <span className="font-semibold text-gray-900">$1,700.00</span>
                  </div>
                  <div className="text-center py-2 text-gray-500">
                    + 5 more items...
                  </div>
                  <div className="flex justify-between py-2 bg-red-50 px-2 font-bold border-t-2 border-red-600">
                    <span className="text-gray-900">TOTAL MISSING SCOPE</span>
                    <span className="text-red-600">$9,067.00</span>
                  </div>
                </div>
              </div>

              {/* Action Items Preview */}
              <div className="p-6 bg-gray-50">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                  Recommended Actions (5 steps)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                    <span className="text-gray-700">Request supplemental inspection within 60 days...</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                    <span className="text-gray-700">Challenge "wear and tear" with contractor letter...</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                    <span className="text-gray-700">Submit labor rate documentation showing $68/hr...</span>
                  </div>
                  <div className="text-center py-2 text-gray-500">
                    + 2 more actions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Below Preview */}
          <div className="text-center mt-8">
            <Link
              href="/example-report"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg px-8 py-4 rounded-sm transition-colors shadow-lg"
            >
              View Full Example Report
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-600 mt-3">
              See all 18 pages with complete line items, pricing tables, and policy language
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
