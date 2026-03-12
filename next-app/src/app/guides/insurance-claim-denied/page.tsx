import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, FileSearch, CheckCircle, ArrowRight, Shield, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Insurance Claim Denied – What To Do Next | Claim Command Pro',
  description: 'Your insurance claim was denied? Learn the exact steps to challenge the denial, gather evidence, and recover your claim payout.',
  openGraph: {
    title: 'Insurance Claim Denied – What To Do Next',
    description: 'Step-by-step guide to challenging an insurance claim denial and recovering your payout.',
    type: 'article',
  },
}

export default function InsuranceClaimDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Insurance Claim Denied – What To Do Next
          </h1>
          <p className="text-xl text-red-100">
            A denial doesn't mean your claim is over. Here's exactly what to do to challenge it and recover your payout.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Alert */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Important: You Have Limited Time</h3>
              <p className="text-yellow-800">
                Most policies give you 60-180 days to appeal a denial. Check your denial letter for the exact deadline.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">1</span>
            Read Your Denial Letter Carefully
          </h2>
          <p className="text-gray-700 mb-4">
            Your denial letter contains critical information about why your claim was denied and what you need to do next.
          </p>
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3">Look for these key details:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-blue-800"><strong>Specific reason for denial</strong> (wear and tear, pre-existing damage, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-blue-800"><strong>Policy sections cited</strong> (which exclusions they're claiming)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-blue-800"><strong>Appeal deadline</strong> (usually 60-180 days)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-blue-800"><strong>Appeal process</strong> (how to formally dispute)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">2</span>
            Understand Why Claims Get Denied
          </h2>
          <p className="text-gray-700 mb-6">
            Insurance companies use specific tactics to deny claims. Understanding these helps you build a stronger appeal.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Wear and Tear</h4>
              <p className="text-sm text-red-800">Claiming damage is from aging, not a covered event</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Pre-Existing Damage</h4>
              <p className="text-sm text-red-800">Asserting damage existed before the loss</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Maintenance Exclusion</h4>
              <p className="text-sm text-red-800">Blaming lack of proper maintenance</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <h4 className="font-bold text-red-900 mb-2">Not Storm Related</h4>
              <p className="text-sm text-red-800">Claiming damage wasn't from the covered event</p>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/denial-tactics" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-2">
              Learn how to challenge these tactics
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Step 3 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">3</span>
            Gather Evidence to Challenge the Denial
          </h2>
          <p className="text-gray-700 mb-6">
            To successfully appeal, you need documentation that proves your damage is covered.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Your Insurance Policy</h4>
                <p className="text-sm text-gray-700">Review the actual policy language to prove coverage applies</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Photos and Videos</h4>
                <p className="text-sm text-gray-700">Document the damage immediately after the loss event</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Weather Reports</h4>
                <p className="text-sm text-gray-700">Official records proving the storm or event occurred</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Independent Estimates</h4>
                <p className="text-sm text-gray-700">Get contractor quotes showing the true repair cost</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Maintenance Records</h4>
                <p className="text-sm text-gray-700">Prove you maintained your property properly</p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">4</span>
            File a Formal Appeal
          </h2>
          <p className="text-gray-700 mb-6">
            Submit your appeal in writing with all supporting documentation before the deadline.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-4">Your appeal letter should include:</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span className="text-blue-800">Policy number and claim number</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span className="text-blue-800">Specific reasons why the denial is incorrect</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span className="text-blue-800">Policy language proving coverage applies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span className="text-blue-800">All supporting evidence (photos, estimates, reports)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                <span className="text-blue-800">Request for specific action (full claim payout)</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Step 5 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">5</span>
            Consider Additional Options
          </h2>
          <p className="text-gray-700 mb-6">
            If your appeal is denied, you still have other options to recover your claim.
          </p>
          <div className="space-y-4">
            <div className="border-l-4 border-primary-600 bg-gray-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Appraisal Clause</h4>
              <p className="text-sm text-gray-700">Most policies allow you to invoke appraisal to resolve disputes about the amount owed</p>
            </div>
            <div className="border-l-4 border-primary-600 bg-gray-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Department of Insurance Complaint</h4>
              <p className="text-sm text-gray-700">File a complaint with your state's insurance regulator</p>
            </div>
            <div className="border-l-4 border-primary-600 bg-gray-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Public Adjuster</h4>
              <p className="text-sm text-gray-700">Hire a professional to negotiate on your behalf (typically 10-15% fee)</p>
            </div>
            <div className="border-l-4 border-primary-600 bg-gray-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Attorney</h4>
              <p className="text-sm text-gray-700">Consult an insurance attorney if the claim is large enough to warrant legal action</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Your Claim Analyzed - Free
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Upload your insurance estimate and we'll detect missing scope items and underpayments in 60 seconds.
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
          <Link href="/denial-tactics" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Common Denial Tactics</h3>
            <p className="text-gray-600 mb-4">
              Learn how to challenge specific denial phrases like "wear and tear" and "pre-existing damage"
            </p>
            <div className="text-primary-600 font-semibold flex items-center gap-1">
              View All Tactics
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/estimate-issues" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Missing Scope Items</h3>
            <p className="text-gray-600 mb-4">
              Discover what items insurers commonly exclude from estimates
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
            '@type': 'HowTo',
            name: 'What To Do When Your Insurance Claim Is Denied',
            description: 'Step-by-step guide to challenging an insurance claim denial',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Read Your Denial Letter',
                text: 'Carefully review the denial letter for specific reasons, policy citations, and appeal deadlines',
              },
              {
                '@type': 'HowToStep',
                name: 'Understand Denial Tactics',
                text: 'Learn common tactics like wear and tear, pre-existing damage, and maintenance exclusions',
              },
              {
                '@type': 'HowToStep',
                name: 'Gather Evidence',
                text: 'Collect policy documents, photos, weather reports, estimates, and maintenance records',
              },
              {
                '@type': 'HowToStep',
                name: 'File Formal Appeal',
                text: 'Submit written appeal with all supporting documentation before the deadline',
              },
              {
                '@type': 'HowToStep',
                name: 'Consider Additional Options',
                text: 'Explore appraisal, DOI complaints, public adjusters, or attorneys if needed',
              },
            ],
          }),
        }}
      />
    </div>
  )
}
