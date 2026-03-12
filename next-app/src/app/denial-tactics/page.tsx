import { Metadata } from 'next'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { AlertTriangle, ArrowRight, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Insurance Denial Tactics - Claim Command Pro',
  description: 'Learn about common insurance denial tactics and how to challenge them. Understand what adjusters mean when they deny your claim.',
  openGraph: {
    title: 'Insurance Denial Tactics - Claim Command Pro',
    description: 'Learn about common insurance denial tactics and how to challenge them.',
    type: 'website',
  },
}

interface DenialTactic {
  id: string
  slug: string
  tactic_name: string
  short_description: string
  common_claim_types: string[]
}

async function getDenialTactics(): Promise<DenialTactic[]> {
  const { data, error } = await supabaseAdmin
    .from('denial_tactics')
    .select('id, slug, tactic_name, short_description, common_claim_types')
    .eq('is_published', true)
    .order('view_count', { ascending: false })

  if (error || !data) return []
  return data
}

export default async function DenialTacticsIndexPage() {
  const tactics = await getDenialTactics()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Insurance Denial Tactics
              </h1>
            </div>
            <p className="text-xl text-red-100 mb-8">
              Understand the language insurers use to deny claims and learn how to challenge these tactics effectively.
            </p>
            <Link
              href="/estimate-scan"
              className="inline-flex items-center gap-2 bg-white text-red-700 px-6 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors"
            >
              Check Your Estimate for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Insurers Use Denial Tactics
          </h2>
          <p className="text-gray-700 mb-4">
            Insurance adjusters are trained to use specific language that allows them to reduce or deny claim payouts. 
            These denial tactics are designed to shift blame away from covered events and onto excluded causes.
          </p>
          <p className="text-gray-700">
            Understanding these tactics is the first step to challenging them effectively and recovering the full value of your claim.
          </p>
        </div>

        {/* Tactics Grid */}
        {tactics.length > 0 ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Common Denial Tactics
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {tactics.map((tactic) => (
                <Link
                  key={tactic.id}
                  href={`/denial-tactics/${tactic.slug}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-l-4 border-red-600"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <h3 className="text-xl font-bold text-gray-900">
                      {tactic.tactic_name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {tactic.short_description}
                  </p>
                  {tactic.common_claim_types && tactic.common_claim_types.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tactic.common_claim_types.slice(0, 3).map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-red-600 font-semibold text-sm flex items-center gap-1">
                    Learn How to Challenge This
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Denial Tactics Coming Soon
            </h3>
            <p className="text-gray-600">
              We're building a comprehensive library of insurance denial tactics.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't Let Denial Tactics Cost You Thousands
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Upload your insurance estimate and we'll detect missing scope items and potential underpayments in 60 seconds.
            </p>
            <Link
              href="/estimate-scan"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Run Free Estimate Scan
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-blue-200 mt-4">
              No credit card required • Instant results
            </p>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Link
            href="/estimate-issues"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Common Estimate Issues
            </h3>
            <p className="text-gray-600 mb-4">
              Browse our library of missing scope items that insurers commonly exclude from estimates.
            </p>
            <div className="text-blue-600 font-semibold flex items-center gap-1">
              View Estimate Issues
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/pricing"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Command Center
            </h3>
            <p className="text-gray-600 mb-4">
              Get full access to our AI-powered claim analysis tools and documentation generators.
            </p>
            <div className="text-blue-600 font-semibold flex items-center gap-1">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export const revalidate = 3600 // Revalidate every hour
