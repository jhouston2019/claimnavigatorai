'use client'

import { useEffect, useState } from 'next'
import { AlertTriangle, Plus, Edit2, Trash2, Eye, Sparkles, Database } from 'lucide-react'

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
  is_published: boolean
  view_count: number
  scan_conversion_count: number
}

export default function AdminDenialTacticsPage() {
  const [tactics, setTactics] = useState<DenialTactic[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const [formData, setFormData] = useState({
    slug: '',
    tactic_name: '',
    short_description: '',
    what_it_means: '',
    why_insurers_use_it: '',
    how_to_challenge: '',
    common_claim_types: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
  })

  useEffect(() => {
    loadTactics()
  }, [])

  const loadTactics = async () => {
    try {
      const response = await fetch('/api/admin/denial-tactics')
      const data = await response.json()
      setTactics(data.tactics || [])
    } catch (error) {
      console.error('Failed to load tactics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      common_claim_types: formData.common_claim_types
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      const url = editingId
        ? `/api/admin/denial-tactics/${editingId}`
        : '/api/admin/denial-tactics'
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await loadTactics()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save tactic:', error)
    }
  }

  const handleEdit = (tactic: DenialTactic) => {
    setEditingId(tactic.id)
    setFormData({
      slug: tactic.slug,
      tactic_name: tactic.tactic_name,
      short_description: tactic.short_description,
      what_it_means: tactic.what_it_means,
      why_insurers_use_it: tactic.why_insurers_use_it,
      how_to_challenge: tactic.how_to_challenge,
      common_claim_types: (tactic.common_claim_types || []).join(', '),
      seo_title: tactic.seo_title,
      seo_description: tactic.seo_description,
      is_published: tactic.is_published,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tactic?')) return

    try {
      await fetch(`/api/admin/denial-tactics/${id}`, { method: 'DELETE' })
      await loadTactics()
    } catch (error) {
      console.error('Failed to delete tactic:', error)
    }
  }

  const handleGenerateContent = async () => {
    if (!formData.tactic_name) {
      alert('Please enter a tactic name first')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/admin/generate-tactic-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tacticName: formData.tactic_name }),
      })

      const data = await response.json()
      
      setFormData({
        ...formData,
        short_description: data.short_description,
        what_it_means: data.what_it_means,
        why_insurers_use_it: data.why_insurers_use_it,
        how_to_challenge: data.how_to_challenge,
        common_claim_types: (data.common_claim_types || []).join(', '),
        seo_description: data.seo_description,
        seo_title: formData.seo_title || `${formData.tactic_name} - Insurance Denial Tactic Explained`,
      })
    } catch (error) {
      console.error('Failed to generate content:', error)
      alert('Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  const handleSeedTactics = async () => {
    if (!confirm('This will create 10 initial denial tactics. Continue?')) return

    setSeeding(true)
    try {
      const response = await fetch('/api/admin/seed-denial-tactics', {
        method: 'POST',
      })

      if (response.ok) {
        await loadTactics()
        alert('Successfully seeded 10 denial tactics!')
      }
    } catch (error) {
      console.error('Failed to seed tactics:', error)
      alert('Failed to seed tactics')
    } finally {
      setSeeding(false)
    }
  }

  const resetForm = () => {
    setFormData({
      slug: '',
      tactic_name: '',
      short_description: '',
      what_it_means: '',
      why_insurers_use_it: '',
      how_to_challenge: '',
      common_claim_types: '',
      seo_title: '',
      seo_description: '',
      is_published: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Denial Tactics Management</h1>
            <div className="flex gap-3">
              <button
                onClick={handleSeedTactics}
                disabled={seeding || tactics.length > 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="w-4 h-4" />
                {seeding ? 'Seeding...' : 'Seed Tactics'}
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Tactic
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Tactic' : 'Create New Tactic'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tactic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.tactic_name}
                    onChange={(e) => setFormData({ ...formData, tactic_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="wear-and-tear-insurance-denial"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description *
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate Content with AI'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What It Means
                </label>
                <textarea
                  value={formData.what_it_means}
                  onChange={(e) => setFormData({ ...formData, what_it_means: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why Insurers Use It
                </label>
                <textarea
                  value={formData.why_insurers_use_it}
                  onChange={(e) => setFormData({ ...formData, why_insurers_use_it: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How to Challenge It
                </label>
                <textarea
                  value={formData.how_to_challenge}
                  onChange={(e) => setFormData({ ...formData, how_to_challenge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Common Claim Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.common_claim_types}
                  onChange={(e) => setFormData({ ...formData, common_claim_types: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Roof Claims, Water Damage, Hail Damage"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Title *
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description *
                  </label>
                  <input
                    type="text"
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Published
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Tactic
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tactics List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tactic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tactics.map((tactic) => (
                <tr key={tactic.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{tactic.tactic_name}</div>
                        <div className="text-sm text-gray-500">/denial-tactics/{tactic.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        tactic.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tactic.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tactic.view_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tactic.scan_conversion_count}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/denial-tactics/${tactic.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleEdit(tactic)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tactic.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tactics.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No denial tactics yet. Click "Seed Tactics" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
