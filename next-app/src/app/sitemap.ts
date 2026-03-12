import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://claimcommandpro.com'

  // Static pages
  const staticPages = [
    '',
    '/estimate-scan',
    '/policy-analysis',
    '/pricing',
    '/login',
    '/estimate-issues',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic estimate issue pages
  const { data: issues } = await supabase
    .from('estimate_issues')
    .select('slug, updated_at')
    .eq('is_published', true)

  const issuePages = (issues || []).map((issue) => ({
    url: `${baseUrl}/estimate-issues/${issue.slug}`,
    lastModified: new Date(issue.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic SEO guide pages
  const { data: seoPages } = await supabase
    .from('seo_pages')
    .select('slug, updated_at')
    .eq('is_published', true)

  const guidePages = (seoPages || []).map((page) => ({
    url: `${baseUrl}/guides/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...issuePages, ...guidePages]
}
