'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function CaseStudiesAdminPage() {
  const [caseStudies, setCaseStudies] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    property_type: '',
    claim_type: '',
    carrier_offer: '',
    final_settlement: '',
    timeline_days: '',
    description: '',
    is_published: false,
  })

  useEffect(() => {
    loadCaseStudies()
  }, [])

  const loadCaseStudies = async () => {
    const { data } = await supabase
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false })
    
    setCaseStudies(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      ...formData,
      carrier_offer: parseFloat(formData.carrier_offer),
      final_settlement: parseFloat(formData.final_settlement),
      timeline_days: formData.timeline_days ? parseInt(formData.timeline_days) : null,
    }

    if (editingId) {
      await supabase.from('case_studies').update(data).eq('id', editingId)
    } else {
      await supabase.from('case_studies').insert(data)
    }

    resetForm()
    loadCaseStudies()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this case study?')) {
      await supabase.from('case_studies').delete().eq('id', id)
      loadCaseStudies()
    }
  }

  const handleEdit = (study: any) => {
    setFormData({
      title: study.title,
      property_type: study.property_type,
      claim_type: study.claim_type,
      carrier_offer: study.carrier_offer.toString(),
      final_settlement: study.final_settlement.toString(),
      timeline_days: study.timeline_days?.toString() || '',
      description: study.description,
      is_published: study.is_published,
    })
    setEditingId(study.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      property_type: '',
      claim_type: '',
      carrier_offer: '',
      final_settlement: '',
      timeline_days: '',
      description: '',
      is_published: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage Case Studies</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Case Study
            </button>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit' : 'New'} Case Study
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Property Type"
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Claim Type"
                    value={formData.claim_type}
                    onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Carrier Offer"
                    value={formData.carrier_offer}
                    onChange={(e) => setFormData({ ...formData, carrier_offer: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Final Settlement"
                    value={formData.final_settlement}
                    onChange={(e) => setFormData({ ...formData, final_settlement: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Timeline (days)"
                    value={formData.timeline_days}
                    onChange={(e) => setFormData({ ...formData, timeline_days: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <span>Published</span>
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {caseStudies.map((study) => (
              <div key={study.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{study.title}</h3>
                    <p className="text-sm text-gray-600">
                      {study.property_type} • {study.claim_type}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      ${study.carrier_offer.toLocaleString()} → ${study.final_settlement.toLocaleString()}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                      study.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {study.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(study)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(study.id)}
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
