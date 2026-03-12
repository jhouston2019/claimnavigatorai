'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Loader2, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source')
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push(`/login?redirect=/pricing${source ? `?source=${source}` : ''}`)
        return
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          source: source || 'pricing_page',
        }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Full estimate analyzer with line-item breakdown',
    'Complete claim gap report (PDF export)',
    'Insurance claim underpayment detector',
    'Documentation packet builder (PDF & Word)',
    'AI claim strategy advisor',
    'Claim timeline manager with deadline tracking',
    'Unlimited estimate analyses',
    'Unlimited documentation packets',
    'Secure document storage',
    'Priority email support',
    'Access to all future features',
    'Lifetime access - no recurring fees',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Claim Command Pro</h1>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          {/* Coming from scan? */}
          {source === 'estimate-scan' && (
            <div className="card mb-8 bg-yellow-50 border-2 border-yellow-300">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-gray-900 mb-1">
                    Your scan detected potential underpayment
                  </p>
                  <p className="text-gray-700">
                    Unlock the full Command Center to see complete analysis, get AI recommendations, and build professional documentation packets.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Unlock the Command Center
            </h1>
            <p className="text-xl text-gray-600">
              Professional insurance claim documentation tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Free Scan */}
            <div className="card">
              <h3 className="text-xl font-bold mb-2">Quick Scan</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">Free</p>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Basic estimate scan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Partial results</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Severity score</span>
                </li>
              </ul>
              <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="card border-4 border-primary-600 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Command Center</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-900">$299</span>
                <span className="text-gray-600">one-time</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">Lifetime access • No recurring fees</p>
              <ul className="space-y-3 mb-6 text-sm">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Unlock Command Center'
                )}
              </button>
            </div>

            {/* Comparison */}
            <div className="card bg-gray-50">
              <h3 className="text-xl font-bold mb-2">Public Adjuster</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">15%</p>
              <p className="text-sm text-gray-600 mb-6">of final settlement</p>
              <div className="bg-white rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">On $50,000 claim:</p>
                <p className="text-2xl font-bold text-red-600">$7,500 fee</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✕</span>
                  <span>15% of settlement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✕</span>
                  <span>Ongoing fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✕</span>
                  <span>Limited control</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="card bg-primary-50 border-2 border-primary-200 mb-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Save Thousands Compared to a Public Adjuster
              </h3>
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Public Adjuster on $50k Claim</p>
                  <p className="text-4xl font-bold text-red-600">$7,500</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Claim Command Pro</p>
                  <p className="text-4xl font-bold text-green-600">$299</p>
                </div>
              </div>
              <p className="text-xl font-bold text-primary-700 mt-6">
                You Save: $7,201
              </p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              🔒 Secure payment powered by Stripe
            </p>
            <p className="text-gray-600">
              ✓ 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
