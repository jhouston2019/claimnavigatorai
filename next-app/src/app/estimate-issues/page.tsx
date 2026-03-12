import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Common Insurance Estimate Issues | Claim Command Pro',
  description: 'Learn about common issues in insurance estimates that lead to underpaid claims and how to detect them.',
}

async function getIssues() {
  const { data, error } = await supabase
    .from('estimate_issues')
    .select('*')
    .eq('is_published', true)
    .order('view_count', { ascending: false })

  return data || []
}

export default async function EstimateIssuesIndexPage() {
  const issues = await getIssues()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Claim Command Pro
            </Link>
            <Link href="/estimate-scan" className="btn-primary text-sm">
              Free Estimate Scan
            </Link>
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Common Insurance Estimate Issues
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about the most common reasons insurance estimates are too low and how to detect them in your own claim.
            </p>
          </div>

          {/* CTA Banner */}
          <div className="card bg-primary-700 text-white mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Check Your Estimate for These Issues
                </h2>
                <p className="text-primary-100">
                  Our free AI scan detects these problems in 60 seconds
                </p>
              </div>
              <Link href="/estimate-scan" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 whitespace-nowrap">
                Scan Your Estimate - Free
              </Link>
            </div>
          </div>

          {/* Issues Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/estimate-issues/${issue.slug}`}
                className="card hover:shadow-xl transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 rounded-lg p-3 group-hover:bg-red-200 transition-colors">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {issue.issue_name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {issue.short_description}
                    </p>
                    {issue.cost_impact && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 font-medium">
                          Typical impact: {issue.cost_impact.split('\n')[0]}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-primary-600 font-medium text-sm">
                      Learn more
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 card bg-gradient-to-br from-primary-600 to-primary-700 text-white text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-primary-200" />
            <h2 className="text-3xl font-bold mb-4">
              Don't Miss These Issues in Your Estimate
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Our AI-powered Estimate Quick Scan detects all of these issues and more in just 60 seconds.
            </p>
            <Link href="/estimate-scan" className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-10 rounded-lg text-lg transition-colors">
              Run Free Estimate Scan
              <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-primary-200 mt-4">
              No credit card required • Instant results
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enable ISR
export const revalidate = 3600
