'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react'

interface AnalysisResult {
  coverageTriggers: string[]
  documentationRequirements: string[]
  proofOfLossObligations: string[]
  policyExclusions: string[]
  disputeRisks: string[]
}

export default function PolicyAnalysisResultsPage() {
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!analysisId) {
      setError('No analysis ID provided')
      setLoading(false)
      return
    }

    fetchResults()
  }, [analysisId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/policy-analysis/${analysisId}`)
      if (!response.ok) throw new Error('Failed to fetch results')
      
      const data = await response.json()
      setResult(data.analysis_result)
    } catch (err) {
      setError('Failed to load analysis results')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Analysis not found'}</p>
          <Link href="/policy-analysis" className="btn-primary">
            Start New Analysis
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Policy Analysis Results
            </h1>
            <p className="text-xl text-gray-600">
              Here's what your policy requires and where disputes commonly occur
            </p>
          </div>

          <div className="space-y-6">
            {/* Coverage Triggers */}
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Coverage Triggers
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Events and conditions that activate your coverage
                  </p>
                  <ul className="space-y-2">
                    {result.coverageTriggers.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary-600 font-bold">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Documentation Requirements */}
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Documentation Requirements
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Evidence you must provide to support your claim
                  </p>
                  <ul className="space-y-2">
                    {result.documentationRequirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary-600 font-bold">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Proof of Loss Obligations */}
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Proof of Loss Obligations
                  </h2>
                  <p className="text-gray-600 mb-4">
                    What you must prove to receive payment
                  </p>
                  <ul className="space-y-2">
                    {result.proofOfLossObligations.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary-600 font-bold">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Common Dispute Risks */}
            <div className="card bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Common Dispute Risks
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Areas where claims are frequently challenged
                  </p>
                  <ul className="space-y-2">
                    {result.disputeRisks.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">⚠</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Policy Exclusions */}
            {result.policyExclusions.length > 0 && (
              <div className="card bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Policy Exclusions
                    </h2>
                    <p className="text-gray-600 mb-4">
                      What is NOT covered under your policy
                    </p>
                    <ul className="space-y-2">
                      {result.policyExclusions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">✕</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-12 card bg-primary-700 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Build Your Complete Claim Documentation?
            </h3>
            <p className="text-primary-100 mb-6">
              Get access to our full suite of tools including estimate analysis, documentation packet builder, and claim strategy advisor.
            </p>
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Unlock Full Access - $299
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
