import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SEOGuidePage({ params }: { params: { slug: string } }) {
  const { data: page } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <article className="card">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            
            {page.meta_description && (
              <p className="text-xl text-gray-600 mb-8">
                {page.meta_description}
              </p>
            )}

            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">
                  Need Help With Your Claim?
                </h3>
                <p className="text-gray-700 mb-4">
                  Get a free policy analysis and see exactly what documentation your insurance company requires.
                </p>
                <Link href="/policy-analysis" className="btn-primary inline-block">
                  Get Free Policy Analysis
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const { data: pages } = await supabase
    .from('seo_pages')
    .select('slug')
    .eq('is_published', true)

  return pages?.map((page) => ({
    slug: page.slug,
  })) || []
}
