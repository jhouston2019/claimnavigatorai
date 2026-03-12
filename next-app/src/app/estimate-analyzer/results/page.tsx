'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, AlertCircle, TrendingUp } from 'lucide-react'

interface AnalysisResult {
  carrierAmount: number
  estimatedTrueScope: number
  gapAmount: number
  missingItems: string[]
  pricingIssues: string[]
  coverageIssues: string[]
}

export default function EstimateAnalysisResultsPage() {
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    if (analysisId) {
      fetchResults()
    }
  }, [analysisId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/estimate-analysis/${analysisId}`)
      const data = await response.json()
      setResult(data.analysis_result)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/estimate-analysis/${analysisId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claim-gap-report-${analysisId}.pdf`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Analysis not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Claim Gap Report
              </h1>
              <p className="text-gray-600">
                Analysis completed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={downloadReport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Financial Summary */}
          <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
            <h2 className="text-2xl font-bold mb-6">Financial Summary</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-primary-200 mb-1">Carrier Estimate</p>
                <p className="text-3xl font-bold">
                  ${result.carrierAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-primary-200 mb-1">Estimated True Scope</p>
                <p className="text-3xl font-bold">
                  ${result.estimatedTrueScope.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-primary-200 mb-1">Potential Gap</p>
                <p className="text-4xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-8 h-8" />
                  ${result.gapAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Detected Issues */}
          <div className="space-y-6">
            {result.missingItems.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Missing Scope Items
                    </h2>
                    <ul className="space-y-3">
                      {result.missingItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {result.pricingIssues.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Pricing Discrepancies
                    </h2>
                    <ul className="space-y-3">
                      {result.pricingIssues.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {result.coverageIssues.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Coverage Issues
                    </h2>
                    <ul className="space-y-3">
                      {result.coverageIssues.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="card mt-8 bg-primary-50 border-2 border-primary-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Next Steps
            </h2>
            <p className="text-gray-700 mb-4">
              Use this analysis to build your documentation packet and strengthen your claim position.
            </p>
            <Link href="/documentation-builder" className="btn-primary">
              Build Documentation Packet
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
