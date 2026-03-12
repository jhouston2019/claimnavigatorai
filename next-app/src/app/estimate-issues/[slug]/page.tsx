import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, DollarSign, Search, FileText, ChevronRight } from 'lucide-react'
import { Metadata } from 'next'

interface EstimateIssue {
  id: string
  slug: string
  issue_name: string
  short_description: string
  why_it_happens: string
  cost_impact: string
  detection_method: string
  repair_example: string
  seo_title: string
  seo_description: string
}

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: issue } = await supabase
    .from('estimate_issues')
    .select('seo_title, seo_description, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!issue) {
    return {
      title: 'Issue Not Found',
    }
  }

  return {
    title: issue.seo_title,
    description: issue.seo_description,
    openGraph: {
      title: issue.seo_title,
      description: issue.seo_description,
      type: 'article',
    },
  }
}

async function getIssue(slug: string): Promise<EstimateIssue | null> {
  const { data, error } = await supabase
    .from('estimate_issues')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null

  // Increment view count
  await supabase
    .from('estimate_issues')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)

  return data
}

async function getRelatedIssues(issueId: string): Promise<EstimateIssue[]> {
  const { data: relations } = await supabase
    .from('related_issues')
    .select('related_issue_id')
    .eq('issue_id', issueId)
    .limit(4)

  if (!relations || relations.length === 0) {
    // Fallback: get random published issues
    const { data } = await supabase
      .from('estimate_issues')
      .select('*')
      .eq('is_published', true)
      .neq('id', issueId)
      .limit(4)
    
    return data || []
  }

  const relatedIds = relations.map(r => r.related_issue_id)
  const { data } = await supabase
    .from('estimate_issues')
    .select('*')
    .in('id', relatedIds)
    .eq('is_published', true)

  return data || []
}

export default async function EstimateIssuePage({ params }: PageProps) {
  const issue = await getIssue(params.slug)

  if (!issue) {
    notFound()
  }

  const relatedIssues = await getRelatedIssues(issue.id)

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
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-600">
              <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/estimate-issues" className="hover:text-primary-600">Estimate Issues</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{issue.issue_name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <AlertTriangle className="w-4 h-4" />
              Common Estimate Issue
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {issue.issue_name}
            </h1>
            
            <p className="text-xl text-gray-600">
              {issue.short_description}
            </p>
          </div>

          {/* Main Content */}
          <article className="space-y-8">
            {/* What This Issue Means */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What This Issue Means
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {issue.why_it_happens || 'This is a common issue in insurance estimates that can significantly impact your claim settlement.'}
                </p>
              </div>
            </div>

            {/* Why Insurers Miss It */}
            {issue.why_it_happens && (
              <div className="card bg-yellow-50 border-2 border-yellow-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  Why Insurance Adjusters Miss This
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {issue.why_it_happens}
                  </p>
                </div>
              </div>
            )}

            {/* Financial Impact */}
            {issue.cost_impact && (
              <div className="card bg-red-50 border-2 border-red-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-red-600" />
                  How Much This Can Affect Your Claim
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {issue.cost_impact}
                  </p>
                  {issue.repair_example && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="font-semibold text-gray-900 mb-2">Example Repair Cost:</p>
                      <p className="text-gray-700">{issue.repair_example}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* How to Detect It */}
            {issue.detection_method && (
              <div className="card bg-blue-50 border-2 border-blue-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-6 h-6 text-blue-600" />
                  How to Detect This Issue
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {issue.detection_method}
                  </p>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="card bg-gradient-to-br from-primary-700 to-primary-800 text-white">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-primary-200" />
                <h2 className="text-3xl font-bold mb-4">
                  Scan Your Insurance Estimate for Hidden Underpayments
                </h2>
                <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                  Our AI-powered tool analyzes your estimate in 60 seconds and identifies issues like this one — plus many more you might be missing.
                </p>
                <Link 
                  href="/estimate-scan"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-10 rounded-lg text-lg transition-colors"
                >
                  Run Free Estimate Scan
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <p className="text-sm text-primary-200 mt-4">
                  No credit card required • Results in 60 seconds
                </p>
              </div>
            </div>

            {/* Related Issues */}
            {relatedIssues.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Related Estimate Issues
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {relatedIssues.map((relatedIssue) => (
                    <Link
                      key={relatedIssue.id}
                      href={`/estimate-issues/${relatedIssue.slug}`}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-primary-300"
                    >
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-primary-600" />
                        {relatedIssue.issue_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {relatedIssue.short_description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-primary-50 rounded-lg p-8 border-2 border-primary-200">
              <p className="text-lg text-gray-900 mb-4">
                Don't let issues like this cost you thousands in underpayment.
              </p>
              <Link href="/estimate-scan" className="btn-primary inline-flex items-center gap-2">
                Scan Your Estimate Now - Free
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: issue.issue_name,
            description: issue.short_description,
            author: {
              '@type': 'Organization',
              name: 'Claim Command Pro',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Claim Command Pro',
            },
            datePublished: issue.created_at,
            dateModified: issue.updated_at,
          }),
        }}
      />
    </div>
  )
}

export async function generateStaticParams() {
  const { data: issues } = await supabase
    .from('estimate_issues')
    .select('slug')
    .eq('is_published', true)

  return issues?.map((issue) => ({
    slug: issue.slug,
  })) || []
}

// Enable ISR - revalidate every hour
export const revalidate = 3600
