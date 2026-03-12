'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, AlertTriangle, DollarSign, FileText, CheckCircle } from 'lucide-react'

interface DetectionResult {
  carrierEstimate: number
  estimatedTrueScope: number
  underpaymentRange: {
    low: number
    high: number
  }
  confidence: string
  missingItems: string[]
  documentationGaps: string[]
  recommendedActions: string[]
  laborRateIssues: string[]
  coverageIssues: string[]
}

export default function UnderpaymentDetectorResultsPage() {
  const searchParams = useSearchParams()
  const detectionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<DetectionResult | null>(null)

  useEffect(() => {
    if (detectionId) {
      fetchResults()
    }
  }, [detectionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/underpayment-detector/${detectionId}`)
      const data = await response.json()
      setResult(data.detection_result)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/underpayment-detector/${detectionId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `underpayment-detection-report-${detectionId}.pdf`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your claim for underpayment...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Detection results not found</p>
      </div>
    )
  }

  const midpoint = (result.underpaymentRange.low + result.underpaymentRange.high) / 2

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Underpayment Detection Report
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
              Download Report
            </button>
          </div>

          {/* Underpayment Alert */}
          <div className="card mb-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">Potential Underpayment Detected</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-red-200 text-sm mb-1">Carrier Estimate</p>
                    <p className="text-3xl font-bold">
                      ${result.carrierEstimate.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-red-200 text-sm mb-1">Estimated True Scope</p>
                    <p className="text-3xl font-bold">
                      ${result.estimatedTrueScope.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-red-200 text-sm mb-1">Underpayment Range</p>
                    <p className="text-2xl font-bold">
                      ${result.underpaymentRange.low.toLocaleString()} - ${result.underpaymentRange.high.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-100 mt-1">
                      Estimated: ${midpoint.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">Confidence: {result.confidence}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Missing Scope Items */}
            {result.missingItems.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Missing Scope Items
                    </h2>
                    <ul className="space-y-2">
                      {result.missingItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Labor Rate Issues */}
            {result.laborRateIssues.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Labor Rate Issues
                    </h2>
                    <ul className="space-y-2">
                      {result.laborRateIssues.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Documentation Gaps */}
            {result.documentationGaps.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Documentation Gaps
                    </h2>
                    <ul className="space-y-2">
                      {result.documentationGaps.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Issues */}
            {result.coverageIssues.length > 0 && (
              <div className="card">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Coverage Issues
                    </h2>
                    <ul className="space-y-2">
                      {result.coverageIssues.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div className="card bg-primary-700 text-white">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Recommended Actions
                </h2>
                <div className="space-y-3">
                  {result.recommendedActions.map((action, index) => (
                    <div key={index} className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-white text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-primary-50">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Link href="/documentation-builder" className="card hover:shadow-xl transition-shadow">
              <FileText className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Build Documentation Packet</h3>
              <p className="text-gray-600">
                Create a comprehensive claim packet to support your dispute
              </p>
            </Link>

            <Link href="/strategy-advisor" className="card hover:shadow-xl transition-shadow">
              <AlertTriangle className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Get Strategy Advice</h3>
              <p className="text-gray-600">
                Receive AI-powered recommendations for your specific situation
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
