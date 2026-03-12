import { Metadata } from 'next'
import Link from 'next/link'
import { Clock, FileSearch, AlertTriangle, ArrowRight, Phone, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Insurance Claim Taking Too Long? Speed Up Your Settlement | Claim Command Pro',
  description: 'Your insurance claim is dragging on for months? Learn why claims get delayed and what you can do to speed up your settlement.',
  openGraph: {
    title: 'Insurance Claim Taking Too Long? Speed Up Your Settlement',
    description: 'Learn why insurance claims get delayed and how to accelerate your settlement.',
    type: 'article',
  },
}

export default function InsuranceClaimTakingTooLongPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Insurance Claim Taking Too Long?
          </h1>
          <p className="text-xl text-orange-100">
            Learn why claims get delayed and what you can do to speed up your settlement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Timeline Alert */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Why Timeline Matters</h3>
              <p className="text-red-800 mb-3">
                The longer your claim drags on, the more leverage your insurance company has. Delays can lead to:
              </p>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Lower settlement offers</li>
                <li>• Additional damage from waiting</li>
                <li>• Increased stress and financial burden</li>
                <li>• Approaching policy deadlines</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Delay Tactics */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Common Delay Tactics Insurers Use
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
              <h4 className="font-bold text-orange-900 mb-2">Requesting Endless Documentation</h4>
              <p className="text-sm text-orange-800">
                Asking for more and more documents, photos, and estimates to slow down the process
              </p>
            </div>
            <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
              <h4 className="font-bold text-orange-900 mb-2">"Under Investigation"</h4>
              <p className="text-sm text-orange-800">
                Claiming they need more time to investigate, without giving specific timelines
              </p>
            </div>
            <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
              <h4 className="font-bold text-orange-900 mb-2">Multiple Adjuster Changes</h4>
              <p className="text-sm text-orange-800">
                Switching adjusters repeatedly, forcing you to restart the process each time
              </p>
            </div>
            <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
              <h4 className="font-bold text-orange-900 mb-2">Slow Response Times</h4>
              <p className="text-sm text-orange-800">
                Taking weeks to respond to emails or return phone calls
              </p>
            </div>
            <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
              <h4 className="font-bold text-orange-900 mb-2">Scheduling Conflicts</h4>
              <p className="text-sm text-orange-800">
                Delaying inspections or meetings due to "scheduling issues"
              </p>
            </div>
          </div>
        </section>

        {/* Typical Timeline */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What's a Normal Timeline?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-bold text-sm">Days 1-7</div>
              <div>
                <h4 className="font-bold text-gray-900">Initial Contact</h4>
                <p className="text-sm text-gray-700">File claim, adjuster assigned, initial inspection scheduled</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-bold text-sm">Days 7-21</div>
              <div>
                <h4 className="font-bold text-gray-900">Inspection & Estimate</h4>
                <p className="text-sm text-gray-700">Adjuster inspects property, prepares estimate, sends to homeowner</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded font-bold text-sm">Days 21-45</div>
              <div>
                <h4 className="font-bold text-gray-900">Negotiation</h4>
                <p className="text-sm text-gray-700">Review estimate, submit contractor quotes, negotiate scope and pricing</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded font-bold text-sm">45+ Days</div>
              <div>
                <h4 className="font-bold text-gray-900">Delayed (Red Flag)</h4>
                <p className="text-sm text-gray-700">If your claim exceeds 45 days without resolution, take action immediately</p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Speed Up */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How to Speed Up Your Claim
          </h2>
          <div className="space-y-6">
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-900 mb-3">1. Document Everything</h3>
              <p className="text-gray-700">
                Keep a detailed log of all communications: dates, times, names, and what was discussed. This creates a paper trail.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-900 mb-3">2. Set Firm Deadlines</h3>
              <p className="text-gray-700">
                In every communication, request a specific response date. Example: "Please respond by [date] with your decision."
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-900 mb-3">3. Escalate to Supervisor</h3>
              <p className="text-gray-700">
                If your adjuster is unresponsive, ask to speak with their supervisor or claims manager.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-900 mb-3">4. File a DOI Complaint</h3>
              <p className="text-gray-700">
                If delays exceed 45 days, file a complaint with your state's Department of Insurance. This often accelerates resolution.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-900 mb-3">5. Invoke Appraisal</h3>
              <p className="text-gray-700">
                If the delay is about the amount owed (not coverage), invoke your policy's appraisal clause to force resolution.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Waiting. Take Control.
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Upload your insurance estimate and find out if you're being underpaid while you wait.
            </p>
            <Link
              href="/estimate-scan"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <FileSearch className="w-6 h-6" />
              Analyze My Claim - Free
            </Link>
            <p className="text-sm text-primary-200 mt-4">
              No credit card required • Results in 60 seconds
            </p>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Link href="/guides/insurance-claim-denied" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Claim Denied?</h3>
            <p className="text-gray-600 mb-4">
              Learn what to do if your insurance claim was denied
            </p>
            <div className="text-primary-600 font-semibold flex items-center gap-1">
              Read Guide
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/estimate-issues" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Missing Scope Items</h3>
            <p className="text-gray-600 mb-4">
              See what items insurers commonly exclude from estimates
            </p>
            <div className="text-primary-600 font-semibold flex items-center gap-1">
              Browse Issues
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
            headline: 'Insurance Claim Taking Too Long? Speed Up Your Settlement',
            description: 'Learn why insurance claims get delayed and how to accelerate your settlement.',
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
