'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/pricing')
        return
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
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
    'Full Claim Gap Report with detailed analysis',
    'Documentation Packet Builder (PDF & Word)',
    'AI Claim Strategy Advisor',
    'Unlimited estimate comparisons',
    'Deadline tracking and reminders',
    'Secure document storage',
    'Priority email support',
    'Access to all future features',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Claim Command Pro
            </h1>
            <p className="text-xl text-gray-600">
              Professional insurance claim documentation tools
            </p>
          </div>

          <div className="card max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-bold text-gray-900">$299</span>
                <span className="text-2xl text-gray-600">one-time</span>
              </div>
              <p className="text-gray-600">
                Lifetime access • No recurring fees
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade to Pro - $299'
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Secure payment powered by Stripe • 30-day money-back guarantee
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Compare to hiring a public adjuster at 15% of your settlement
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="card bg-gray-100">
                <h3 className="text-xl font-bold mb-2">Public Adjuster</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">15%</p>
                <p className="text-gray-600 text-sm">
                  On a $50,000 settlement: <strong>$7,500 fee</strong>
                </p>
              </div>
              <div className="card bg-primary-50 border-2 border-primary-200">
                <h3 className="text-xl font-bold mb-2">Claim Command Pro</h3>
                <p className="text-3xl font-bold text-primary-600 mb-2">$299</p>
                <p className="text-gray-600 text-sm">
                  One-time fee • <strong>Save $7,201</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
