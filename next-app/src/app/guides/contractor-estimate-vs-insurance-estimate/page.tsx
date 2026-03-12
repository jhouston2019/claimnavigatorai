import { Metadata } from 'next'
import Link from 'next/link'
import { FileSearch, TrendingUp, ArrowRight, DollarSign, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contractor Estimate vs Insurance Estimate - Why the Gap? | Claim Command Pro',
  description: 'Your contractor's estimate is higher than your insurance estimate? Learn why this happens and how to get your insurer to pay the full amount.',
  openGraph: {
    title: 'Contractor Estimate vs Insurance Estimate - Why the Gap?',
    description: 'Understand the gap between contractor and insurance estimates and how to close it.',
    type: 'article',
  },
}

export default function ContractorVsInsuranceEstimatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contractor Estimate vs Insurance Estimate
          </h1>
          <p className="text-xl text-primary-100">
            Your contractor says $35,000. Your insurance says $22,000. Here's why — and how to close the gap.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* The Gap */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">The Average Gap: $12,400</h3>
              <p className="text-yellow-800">
                Based on thousands of claims analyzed, contractor estimates average <strong>36% higher</strong> than insurance estimates. This isn't because contractors are inflating prices — it's because insurers are suppressing them.
              </p>
            </div>
          </div>
        </div>

        {/* Why the Gap Exists */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Why the Gap Exists
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-primary-600 mb-3">1. Missing Scope Items</h3>
              <p className="text-gray-700 mb-3">
                Insurance adjusters often exclude necessary items from their estimates:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">Roof decking replacement</p>
                  <p className="text-xs text-gray-600">$3,000 - $8,000</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">Interior paint</p>
                  <p className="text-xs text-gray-600">$2,000 - $5,000</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">Insulation replacement</p>
                  <p className="text-xs text-gray-600">$1,500 - $4,000</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">Water mitigation</p>
                  <p className="text-xs text-gray-600">$2,000 - $6,000</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-primary-600 mb-3">2. Suppressed Labor Rates</h3>
              <p className="text-gray-700 mb-3">
                Insurance companies use software (like Xactimate) with labor rates that are often 20-40% below actual market rates.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Example:</strong> Insurance estimate uses $45/hour labor rate. Actual contractor rate: $75/hour. On a $20,000 job, that's a $6,000+ gap.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-primary-600 mb-3">3. Underestimated Quantities</h3>
              <p className="text-gray-700 mb-3">
                Adjusters may undercount square footage, materials needed, or hours required.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-primary-600 mb-3">4. Depreciation</h3>
              <p className="text-gray-700 mb-3">
                Insurance estimates often include depreciation that reduces the payout, while contractors quote replacement cost.
              </p>
            </div>
          </div>
        </section>

        {/* How to Close the Gap */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How to Close the Gap
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Get Multiple Contractor Estimates</h4>
                <p className="text-sm text-gray-700">Submit 2-3 detailed contractor estimates showing the true repair cost</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Create a Line-by-Line Comparison</h4>
                <p className="text-sm text-gray-700">Document every missing item and price difference between estimates</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Request a Supplement</h4>
                <p className="text-sm text-gray-700">Submit a formal supplement request with all supporting documentation</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Invoke Appraisal if Needed</h4>
                <p className="text-sm text-gray-700">Use your policy's appraisal clause to resolve pricing disputes</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find the Gap in Your Estimate
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Upload your insurance estimate and we'll compare it to actual repair costs, identifying missing items and pricing discrepancies.
            </p>
            <Link
              href="/estimate-scan"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              <FileSearch className="w-6 h-6" />
              Analyze My Claim - Free
            </Link>
            <p className="text-sm text-blue-200 mt-4">
              No credit card required • Results in 60 seconds
            </p>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Link href="/estimate-issues" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Common Missing Items</h3>
            <p className="text-gray-600 mb-4">
              See the most common scope items insurers exclude
            </p>
            <div className="text-primary-600 font-semibold flex items-center gap-1">
              View All Issues
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/pricing" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Command Center</h3>
            <p className="text-gray-600 mb-4">
              Get full access to our AI-powered claim analysis tools
            </p>
            <div className="text-primary-600 font-semibold flex items-center gap-1">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Contractor Estimate vs Insurance Estimate - Why the Gap?',
            description: 'Understanding the gap between contractor and insurance estimates.',
            author: {
              '@type': 'Organization',
              name: 'Claim Command Pro',
            },
          }),
        }}
      />
    </div>
  )
}
