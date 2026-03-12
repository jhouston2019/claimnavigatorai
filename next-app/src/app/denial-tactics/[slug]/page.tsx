import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { AlertTriangle, FileText, Shield, CheckCircle, ArrowRight } from 'lucide-react'

interface DenialTactic {
  id: string
  slug: string
  tactic_name: string
  short_description: string
  what_it_means: string
  why_insurers_use_it: string
  how_to_challenge: string
  common_claim_types: string[]
  seo_title: string
  seo_description: string
  created_at: string
  updated_at: string
}

interface RelatedTactic {
  id: string
  slug: string
  tactic_name: string
  short_description: string
}

async function getTactic(slug: string): Promise<DenialTactic | null> {
  const { data, error } = await supabaseAdmin
    .from('denial_tactics')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null

  // Increment view count
  await supabaseAdmin
    .from('denial_tactics')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)

  return data
}

async function getRelatedTactics(tacticId: string): Promise<RelatedTactic[]> {
  const { data, error } = await supabaseAdmin
    .from('related_denial_tactics')
    .select(`
      related_tactic_id,
      related_tactic:denial_tactics!related_denial_tactics_related_tactic_id_fkey(
        id,
        slug,
        tactic_name,
        short_description
      )
    `)
    .eq('tactic_id', tacticId)
    .limit(6)

  if (error || !data) {
    // Fallback: get random tactics
    const { data: fallbackData } = await supabaseAdmin
      .from('denial_tactics')
      .select('id, slug, tactic_name, short_description')
      .eq('is_published', true)
      .neq('id', tacticId)
      .limit(6)
    
    return fallbackData || []
  }

  return data.map((item: any) => item.related_tactic).filter(Boolean)
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tactic = await getTactic(params.slug)

  if (!tactic) {
    return {
      title: 'Denial Tactic Not Found',
    }
  }

  return {
    title: tactic.seo_title,
    description: tactic.seo_description,
    openGraph: {
      title: tactic.seo_title,
      description: tactic.seo_description,
      type: 'article',
      publishedTime: tactic.created_at,
      modifiedTime: tactic.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: tactic.seo_title,
      description: tactic.seo_description,
    },
  }
}

export default async function DenialTacticPage({ params }: { params: { slug: string } }) {
  const tactic = await getTactic(params.slug)

  if (!tactic) {
    notFound()
  }

  const relatedTactics = await getRelatedTactics(tactic.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-12 h-12 flex-shrink-0" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {tactic.tactic_name}
              </h1>
              <p className="text-xl text-red-100">
                {tactic.short_description}
              </p>
            </div>
          </div>
          
          {tactic.common_claim_types && tactic.common_claim_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-sm text-red-200">Common in:</span>
              {tactic.common_claim_types.map((type, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-800 rounded-full text-sm font-medium"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content Sections */}
        <div className="space-y-12">
          {/* What This Denial Means */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                What This Denial Means
              </h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              {tactic.what_it_means.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Why Insurers Use It */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Why Insurers Use This Tactic
              </h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              {tactic.why_insurers_use_it.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* How It Affects Claims */}
          <section className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                How This Affects Your Claim
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-lg text-gray-800">
                When insurers use this denial tactic, they can:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span className="text-gray-700">Reduce your claim payout by thousands of dollars</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span className="text-gray-700">Exclude entire categories of damage from coverage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span className="text-gray-700">Delay your claim while you gather additional documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span className="text-gray-700">Force you to accept a settlement far below actual repair costs</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How to Challenge It */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                How to Challenge This Denial
              </h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              {tactic.how_to_challenge.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* CTA Block */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-8 md:p-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Check Your Estimate for Hidden Underpayments
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Upload your insurance estimate and detect missing scope items instantly.
              </p>
              <Link
                href="/estimate-scan"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Run Free Estimate Scan
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-blue-200 mt-4">
                No credit card required • Results in 60 seconds
              </p>
            </div>
          </section>

          {/* Related Tactics */}
          {relatedTactics.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Related Denial Tactics
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedTactics.map((related) => (
                  <Link
                    key={related.id}
                    href={`/denial-tactics/${related.slug}`}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {related.tactic_name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {related.short_description}
                    </p>
                    <div className="mt-4 text-blue-600 font-semibold text-sm flex items-center gap-1">
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Internal Linking to Estimate Issues */}
          <section className="bg-gray-100 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Common Estimate Issues Related to This Denial
            </h2>
            <p className="text-gray-700 mb-6">
              When insurers use this denial tactic, they often exclude these scope items:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/estimate-issues"
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900">Browse All Estimate Issues</span>
              </Link>
              <Link
                href="/estimate-scan"
                className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Scan Your Estimate Now</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Structured Data - Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: tactic.tactic_name,
            description: tactic.short_description,
            datePublished: tactic.created_at,
            dateModified: tactic.updated_at,
            author: {
              '@type': 'Organization',
              name: 'Claim Command Pro',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Claim Command Pro',
            },
          }),
        }}
      />

      {/* Structured Data - FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `What does "${tactic.tactic_name}" mean?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: tactic.what_it_means,
                },
              },
              {
                '@type': 'Question',
                name: 'Why do insurance companies use this denial tactic?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: tactic.why_insurers_use_it,
                },
              },
              {
                '@type': 'Question',
                name: 'How can I challenge this denial?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: tactic.how_to_challenge,
                },
              },
            ],
          }),
        }}
      />
    </div>
  )
}

export async function generateStaticParams() {
  const { data: tactics } = await supabaseAdmin
    .from('denial_tactics')
    .select('slug')
    .eq('is_published', true)

  if (!tactics) return []

  return tactics.map((tactic) => ({
    slug: tactic.slug,
  }))
}

export const revalidate = 3600 // Revalidate every hour
