'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DocumentationBuilderPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    claimNumber: '',
    carrier: '',
    claimType: '',
    dateOfLoss: '',
    scopeDocumentation: '',
    evidenceChecklist: [] as string[],
    disputeLetter: '',
    proofOfLoss: '',
  })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/documentation-builder')
      return
    }
    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid')
      .eq('id', user.id)
      .single()

    setIsPaid(profile?.is_paid || false)
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        evidenceChecklist: [...formData.evidenceChecklist, newChecklistItem.trim()],
      })
      setNewChecklistItem('')
    }
  }

  const removeChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      evidenceChecklist: formData.evidenceChecklist.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/documentation-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to generate packet')

      const data = await response.json()
      router.push(`/documentation-builder/results?id=${data.packetId}`)
    } catch (error) {
      console.error('Failed to generate packet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Upgrade to access the documentation packet builder.
          </p>
          <button onClick={() => router.push('/pricing')} className="btn-primary">
            Upgrade Now - $299
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation Packet Builder
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create a comprehensive claim documentation packet with all required evidence and templates.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Claim Information */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Claim Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Number
                  </label>
                  <input
                    type="text"
                    value={formData.claimNumber}
                    onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Carrier
                  </label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Type
                  </label>
                  <input
                    type="text"
                    value={formData.claimType}
                    onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Wind/Hail, Fire, Water"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Loss
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfLoss}
                    onChange={(e) => setFormData({ ...formData, dateOfLoss: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Scope Documentation */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Scope Documentation</h2>
              <textarea
                value={formData.scopeDocumentation}
                onChange={(e) => setFormData({ ...formData, scopeDocumentation: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the full scope of damage and required repairs..."
              />
            </div>

            {/* Evidence Checklist */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Evidence Checklist</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Add evidence item..."
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {formData.evidenceChecklist.map((item, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dispute Letter */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Dispute Letter Template</h2>
              <textarea
                value={formData.disputeLetter}
                onChange={(e) => setFormData({ ...formData, disputeLetter: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Draft your dispute letter..."
              />
            </div>

            {/* Proof of Loss */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Proof of Loss Structure</h2>
              <textarea
                value={formData.proofOfLoss}
                onChange={(e) => setFormData({ ...formData, proofOfLoss: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Outline your proof of loss documentation..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Packet...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Documentation Packet
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
