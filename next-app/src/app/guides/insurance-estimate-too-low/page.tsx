import { Metadata } from 'next'
import Link from 'next/link'
import { DollarSign, FileSearch, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Insurance Estimate Too Low? How to Get More Money | Claim Command Pro',
  description: 'Your insurance estimate seems too low? Learn how to prove underpayment, get a fair settlement, and recover the full cost of repairs.',
  openGraph: {
    title: 'Insurance Estimate Too Low? How to Get More Money',
    description: 'Step-by-step guide to challenging a low insurance estimate and getting a fair settlement.',
    type: 'article',
  },
}

export default function InsuranceEstimateTooLowPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Insurance Estimate Too Low? Here's What to Do
          </h1>
          <p className="text-xl text-primary-100">
            Your contractor says it'll cost more than your insurance estimate. Here's how to prove it and get a fair settlement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Why Estimates Are Low */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Why Insurance Estimates Are Often Too Low
          </h2>
          <p className="text-gray-700 mb-6">
            Insurance adjusters have financial incentives to minimize claim payouts. They use several tactics to keep estimates artificially low:
          </p>
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Missing Scope Items</h4>
              <p className="text-sm text-red-800">Excluding necessary repairs like roof decking, insulation, or interior paint</p>
              <p className="text-xs text-red-700 mt-2">Average impact: $3,000 - $12,000</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Suppressed Labor Rates</h4>
              <p className="text-sm text-red-800">Using outdated or below-market labor rates</p>
              <p className="text-xs text-red-700 mt-2">Average impact: $2,000 - $8,000</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Underestimated Quantities</h4>
              <p className="text-sm text-red-800">Reducing square footage or material quantities</p>
              <p className="text-xs text-red-700 mt-2">Average impact: $1,500 - $5,000</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Depreciation Deductions</h4>
              <p className="text-sm text-red-800">Excessive depreciation on materials and labor</p>
              <p className="text-xs text-red-700 mt-2">Average impact: $2,000 - $10,000</p>
            </div>
          </div>
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">
                <strong>Industry data shows:</strong> Insurance estimates are underpaid by an average of $12,400 compared to actual repair costs.
              </p>
            </div>
          </div>
        </section>

        {/* How to Prove It */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How to Prove Your Estimate Is Too Low
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Get Independent Contractor Estimates
              </h3>
              <p className="text-gray-700 mb-3">
                Get at least 2-3 written estimates from licensed contractors. Make sure they include:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-700">• Line-item breakdown of all repairs</li>
                <li className="text-gray-700">• Material specifications and quantities</li>
                <li className="text-gray-700">• Labor rates and hours</li>
                <li className="text-gray-700">• Contractor license number</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Compare Line-by-Line
              </h3>
              <p className="text-gray-700 mb-3">
                Create a detailed comparison showing:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-700">• Items in contractor estimate but missing from insurance estimate</li>
                <li className="text-gray-700">• Price differences for identical items</li>
                <li className="text-gray-700">• Labor rate discrepancies</li>
                <li className="text-gray-700">• Total gap amount</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Document Everything
              </h3>
              <p className="text-gray-700 mb-3">
                Build a comprehensive evidence packet:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-700">• Photos of all damage</li>
                <li className="text-gray-700">• Contractor estimates with company letterhead</li>
                <li className="text-gray-700">• Material price quotes from suppliers</li>
                <li className="text-gray-700">• Expert opinions (if available)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What to Do Next */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What to Do Next
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Request a Supplement</h4>
                <p className="text-sm text-gray-700">Submit additional documentation to request a supplemental payment</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">File a Formal Complaint</h4>
                <p className="text-sm text-gray-700">Submit your evidence in writing with contractor estimates attached</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Invoke Appraisal</h4>
                <p className="text-sm text-gray-700">Use your policy's appraisal clause to resolve the dispute</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find Out Exactly How Much You're Owed
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our AI analyzer compares your insurance estimate to actual repair costs and identifies the gap.
            </p>
            <Link
              href="/estimate-scan"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              <FileSearch className="w-6 h-6" />
              Analyze My Claim - Free
            </Link>
            <p className="text-sm text-blue-200 mt-4">
              No credit card required • Instant results
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
