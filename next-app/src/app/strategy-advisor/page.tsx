'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lightbulb, Loader2 } from 'lucide-react'

export default function StrategyAdvisorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    claimType: '',
    carrierPosition: '',
    issues: '',
  })
  const [recommendations, setRecommendations] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/strategy-advisor')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/strategy-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Strategy advisor error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Upgrade to access AI-powered claim strategy recommendations.
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
            AI Claim Strategy Advisor
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get personalized recommendations for strengthening your insurance claim.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div className="card">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Type
                  </label>
                  <input
                    type="text"
                    value={formData.claimType}
                    onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Wind/Hail, Fire, Water Damage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrier Position
                  </label>
                  <textarea
                    value={formData.carrierPosition}
                    onChange={(e) => setFormData({ ...formData, carrierPosition: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="What is the insurance company saying? (e.g., 'wear and tear', 'pre-existing', etc.)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Issues
                  </label>
                  <textarea
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe any challenges or disputes with your claim..."
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5" />
                  Get Strategy Recommendations
                </>
              )}
            </button>
          </form>

          {recommendations && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Recommended Evidence</h2>
                <ul className="space-y-2">
                  {recommendations.recommendedEvidence.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Documentation Strategy</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {recommendations.documentationStrategy}
                </p>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Response Tactics</h2>
                <ul className="space-y-2">
                  {recommendations.responseTactics.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {recommendations.timelineNotes && (
                <div className="card bg-yellow-50 border-2 border-yellow-200">
                  <h2 className="text-2xl font-bold mb-4">Timeline Considerations</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {recommendations.timelineNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
