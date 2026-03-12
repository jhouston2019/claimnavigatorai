'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

export default function SEOPagesAdminPage() {
  const [pages, setPages] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    meta_description: '',
    content: '',
    is_published: false,
  })

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    const { data } = await supabase
      .from('seo_pages')
      .select('*')
      .order('created_at', { ascending: false })
    
    setPages(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      await supabase.from('seo_pages').update(formData).eq('id', editingId)
    } else {
      await supabase.from('seo_pages').insert(formData)
    }

    resetForm()
    loadPages()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this page?')) {
      await supabase.from('seo_pages').delete().eq('id', id)
      loadPages()
    }
  }

  const handleEdit = (page: any) => {
    setFormData({
      slug: page.slug,
      title: page.title,
      meta_description: page.meta_description || '',
      content: page.content,
      is_published: page.is_published,
    })
    setEditingId(page.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      meta_description: '',
      content: '',
      is_published: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const createDefaultPages = async () => {
    const defaultPages = [
      {
        slug: 'insurance-claim-underpayment',
        title: 'Insurance Claim Underpayment: How to Detect and Challenge It',
        meta_description: 'Learn how to identify if your insurance claim is underpaid and what steps to take to get the full settlement you deserve.',
        content: '<h2>What is Insurance Claim Underpayment?</h2><p>Insurance claim underpayment occurs when your insurance company settles your claim for less than its true value...</p>',
        is_published: true,
      },
      {
        slug: 'how-to-challenge-insurance-estimate',
        title: 'How to Challenge an Insurance Estimate: Complete Guide',
        meta_description: 'Step-by-step guide to challenging a low insurance estimate and getting the settlement you deserve.',
        content: '<h2>Why Insurance Estimates Are Often Low</h2><p>Insurance companies have financial incentives to minimize claim payouts...</p>',
        is_published: true,
      },
      {
        slug: 'proof-of-loss-explained',
        title: 'Proof of Loss Explained: What You Need to Know',
        meta_description: 'Understanding proof of loss requirements and how to properly document your insurance claim.',
        content: '<h2>What is Proof of Loss?</h2><p>A proof of loss is a formal document you submit to your insurance company...</p>',
        is_published: true,
      },
      {
        slug: 'wear-and-tear-insurance-claims',
        title: 'What "Wear and Tear" Means in Insurance Claims',
        meta_description: 'Learn what wear and tear means in insurance claims and how to challenge this common denial reason.',
        content: '<h2>Understanding Wear and Tear</h2><p>Wear and tear is one of the most common reasons insurance companies deny or reduce claims...</p>',
        is_published: true,
      },
      {
        slug: 'how-adjusters-write-estimates',
        title: 'How Insurance Adjusters Write Estimates',
        meta_description: 'Inside look at how insurance adjusters create estimates and where underpayments commonly occur.',
        content: '<h2>The Adjuster\'s Process</h2><p>Understanding how adjusters work helps you identify where your estimate may be too low...</p>',
        is_published: true,
      },
      {
        slug: 'how-to-read-xactimate-estimate',
        title: 'How to Read an Xactimate Estimate',
        meta_description: 'Learn how to read and understand Xactimate insurance estimates to identify potential underpayments.',
        content: '<h2>What is Xactimate?</h2><p>Xactimate is the industry-standard software used by insurance adjusters to create estimates...</p>',
        is_published: true,
      },
    ]

    for (const page of defaultPages) {
      await supabase.from('seo_pages').insert(page)
    }

    loadPages()
    alert('Default SEO pages created!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage SEO Pages</h1>
            <div className="flex gap-2">
              <button
                onClick={createDefaultPages}
                className="btn-secondary text-sm"
              >
                Create Default Pages
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Page
              </button>
            </div>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit' : 'New'} SEO Page
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="insurance-claim-underpayment"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will be accessible at: /guides/{formData.slug}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    placeholder="Insurance Claim Underpayment: Complete Guide"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    placeholder="Learn how to identify and challenge insurance claim underpayments..."
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (HTML)
                  </label>
                  <textarea
                    placeholder="<h2>Section Title</h2><p>Content here...</p>"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    required
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Published</span>
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingId ? 'Update' : 'Create'} Page
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {pages.map((page) => (
              <div key={page.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{page.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      /guides/{page.slug}
                    </p>
                    {page.meta_description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {page.meta_description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {page.is_published && (
                      <Link
                        href={`/guides/${page.slug}`}
                        target="_blank"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleEdit(page)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
