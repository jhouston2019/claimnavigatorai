'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card max-w-2xl text-center">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Claim Command Pro!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Your payment was successful. You now have full access to all premium features.
        </p>

        <div className="bg-primary-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            What's unlocked:
          </h2>
          <ul className="text-left space-y-2 max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Full Claim Gap Report Generator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Documentation Packet Builder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>AI Claim Strategy Advisor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Unlimited Estimate Analysis</span>
            </li>
          </ul>
        </div>

        <Link href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          Redirecting automatically in 5 seconds...
        </p>
      </div>
    </div>
  )
}
