'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Eye, Wand2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function IssuesAdminPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    slug: '',
    issue_name: '',
    short_description: '',
    why_it_happens: '',
    cost_impact: '',
    detection_method: '',
    repair_example: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
  })

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    const { data } = await supabase
      .from('estimate_issues')
      .select('*')
      .order('created_at', { ascending: false })
    
    setIssues(data || [])
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleIssueNameChange = (name: string) => {
    setFormData({
      ...formData,
      issue_name: name,
      slug: generateSlug(name),
      seo_title: `${name} | Insurance Estimate Issues`,
    })
  }

  const generateContent = async () => {
    if (!formData.issue_name) {
      alert('Please enter an issue name first')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/admin/generate-issue-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueName: formData.issue_name }),
      })

      const data = await response.json()
      
      setFormData({
        ...formData,
        short_description: data.short_description,
        why_it_happens: data.why_it_happens,
        cost_impact: data.cost_impact,
        detection_method: data.detection_method,
        repair_example: data.repair_example,
        seo_description: data.seo_description,
      })
    } catch (error) {
      console.error('Failed to generate content:', error)
      alert('Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      await supabase.from('estimate_issues').update(formData).eq('id', editingId)
    } else {
      await supabase.from('estimate_issues').insert(formData)
    }

    resetForm()
    loadIssues()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this issue?')) {
      await supabase.from('estimate_issues').delete().eq('id', id)
      loadIssues()
    }
  }

  const handleEdit = (issue: any) => {
    setFormData({
      slug: issue.slug,
      issue_name: issue.issue_name,
      short_description: issue.short_description,
      why_it_happens: issue.why_it_happens || '',
      cost_impact: issue.cost_impact || '',
      detection_method: issue.detection_method || '',
      repair_example: issue.repair_example || '',
      seo_title: issue.seo_title,
      seo_description: issue.seo_description,
      is_published: issue.is_published,
    })
    setEditingId(issue.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      slug: '',
      issue_name: '',
      short_description: '',
      why_it_happens: '',
      cost_impact: '',
      detection_method: '',
      repair_example: '',
      seo_title: '',
      seo_description: '',
      is_published: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const seedIssues = async () => {
    if (!confirm('This will create 10 seed issues. Continue?')) return

    const response = await fetch('/api/admin/seed-issues', {
      method: 'POST',
    })

    if (response.ok) {
      alert('Seed issues created!')
      loadIssues()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Manage Estimate Issues</h1>
              <p className="text-gray-600 mt-1">Programmatic SEO pages for estimate problems</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={seedIssues}
                className="btn-secondary text-sm"
              >
                Seed Issues
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Issue
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-3xl font-bold">{issues.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-3xl font-bold">{issues.filter(i => i.is_published).length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-3xl font-bold">{issues.reduce((sum, i) => sum + (i.view_count || 0), 0)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-3xl font-bold">{issues.reduce((sum, i) => sum + (i.scan_conversion_count || 0), 0)}</p>
            </div>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit' : 'New'} Estimate Issue
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Name
                    </label>
                    <input
                      type="text"
                      placeholder="Missing Roof Decking in Insurance Estimates"
                      value={formData.issue_name}
                      onChange={(e) => handleIssueNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      /estimate-issues/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    placeholder="One of the most common reasons homeowners receive underpaid roof claims..."
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={generateContent}
                    disabled={generating || !formData.issue_name}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Auto-Generate Content
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why It Happens
                  </label>
                  <textarea
                    value={formData.why_it_happens}
                    onChange={(e) => setFormData({ ...formData, why_it_happens: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Explain why insurance adjusters commonly miss this..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Impact
                  </label>
                  <textarea
                    value={formData.cost_impact}
                    onChange={(e) => setFormData({ ...formData, cost_impact: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Typical additional cost: $3,000 - $12,000..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Method
                  </label>
                  <textarea
                    value={formData.detection_method}
                    onChange={(e) => setFormData({ ...formData, detection_method: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="How homeowners can identify this issue in their estimate..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repair Example
                  </label>
                  <input
                    type="text"
                    value={formData.repair_example}
                    onChange={(e) => setFormData({ ...formData, repair_example: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Roof decking replacement: $4,500 - $8,000"
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
                    {editingId ? 'Update' : 'Create'} Issue
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Issues List */}
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{issue.issue_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        issue.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      /estimate-issues/{issue.slug}
                    </p>
                    <p className="text-sm text-gray-500">
                      {issue.short_description}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>Views: {issue.view_count || 0}</span>
                      <span>Conversions: {issue.scan_conversion_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {issue.is_published && (
                      <Link
                        href={`/estimate-issues/${issue.slug}`}
                        target="_blank"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleEdit(issue)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(issue.id)}
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
