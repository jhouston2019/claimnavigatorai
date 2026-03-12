'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertTriangle, TrendingUp, Clock, Lock, ChevronRight, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ScanResult {
  carrierEstimateValue: number
  estimatedScopeRange: {
    low: number
    high: number
  }
  potentialGapLow: number
  potentialGapHigh: number
  detectedIssues: string[]
  detectedCarrierTactics: Array<{
    tactic: string
    explanation: string
  }>
  claimSeverityScore: number
  timelineRisk: {
    daysInClaim: number
    riskLevel: string
    message: string
  }
  claimType?: string
  state?: string
  carrierName?: string
}

export default function EstimateScanResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scanId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [industryInsight, setIndustryInsight] = useState<string | null>(null)

  useEffect(() => {
    if (!scanId) {
      router.push('/estimate-scan')
      return
    }
    fetchResults()
  }, [scanId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/estimate-scan/${scanId}`)
      if (!response.ok) throw new Error('Failed to fetch results')
      
      const data = await response.json()
      setResult(data.scan_result)
      
      // Fetch industry insight
      if (data.scan_result) {
        fetchIndustryInsight(data.scan_result)
      }
    } catch (err) {
      console.error('Failed to load results:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchIndustryInsight = async (scanResult: ScanResult) => {
    try {
      const params = new URLSearchParams()
      if (scanResult.claimType) params.append('claimType', scanResult.claimType)
      if (scanResult.state) params.append('state', scanResult.state)
      if (scanResult.carrierName) params.append('carrierName', scanResult.carrierName)
      
      const response = await fetch(`/api/intelligence/claim-insight?${params}`)
      if (response.ok) {
        const data = await response.json()
        setIndustryInsight(data.insight)
      }
    } catch (err) {
      console.error('Failed to load industry insight:', err)
    }
  }

  const handleUpgrade = async () => {
    router.push('/pricing?source=estimate-scan')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Analyzing your estimate...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 60 seconds</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Scan results not found</p>
          <button onClick={() => router.push('/estimate-scan')} className="btn-primary">
            Start New Scan
          </button>
        </div>
      </div>
    )
  }

  const midGap = (result.potentialGapLow + result.potentialGapHigh) / 2
  const chartData = [
    { name: 'Carrier Estimate', value: result.carrierEstimateValue, fill: '#ef4444' },
    { name: 'Estimated True Scope', value: result.estimatedScopeRange.high, fill: '#10b981' },
  ]

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSeverityBg = (score: number) => {
    if (score >= 70) return 'bg-red-100 border-red-300'
    if (score >= 40) return 'bg-yellow-100 border-yellow-300'
    return 'bg-green-100 border-green-300'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Estimate Quick Scan Results</h1>
            <button onClick={() => router.push('/estimate-scan')} className="text-sm text-gray-600 hover:text-gray-900">
              New Scan
            </button>
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Alert Banner */}
          <div className="card mb-6 bg-gradient-to-r from-red-600 to-red-700 text-white">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold mb-2">CLAIM GAP DETECTED</h2>
                <p className="text-red-100 text-lg">
                  Our analysis indicates your claim may be underpaid by <strong>${result.potentialGapLow.toLocaleString()} - ${result.potentialGapHigh.toLocaleString()}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Industry Insight Panel */}
          {industryInsight && (
            <div className="card mb-6 bg-blue-50 border-2 border-blue-300">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Industry Insight</h3>
                  <p className="text-blue-800 text-base">
                    {industryInsight}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Based on analysis of thousands of anonymized claims
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Carrier Estimate */}
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-2">Carrier Estimate</p>
              <p className="text-3xl font-bold text-gray-900">
                ${result.carrierEstimateValue.toLocaleString()}
              </p>
            </div>

            {/* Estimated True Scope */}
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-2">Estimated True Scope</p>
              <p className="text-3xl font-bold text-green-600">
                ${result.estimatedScopeRange.low.toLocaleString()} - ${result.estimatedScopeRange.high.toLocaleString()}
              </p>
            </div>

            {/* Potential Gap */}
            <div className="card text-center bg-yellow-50 border-2 border-yellow-300">
              <p className="text-sm text-gray-600 mb-2">Potential Gap</p>
              <p className="text-3xl font-bold text-red-600">
                ${midGap.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Range: ${result.potentialGapLow.toLocaleString()} - ${result.potentialGapHigh.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Claim Gap Visualization */}
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              Claim Gap Visualization
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-sm text-gray-600 mt-4">
              The gap represents potential missing scope items and pricing discrepancies
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Claim Severity Score */}
            <div className={`card border-2 ${getSeverityBg(result.claimSeverityScore)}`}>
              <h2 className="text-xl font-bold mb-4">Claim Severity Score</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - result.claimSeverityScore / 100)}`}
                      className={getSeverityColor(result.claimSeverityScore)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getSeverityColor(result.claimSeverityScore)}`}>
                      {result.claimSeverityScore}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Severity Level</p>
                  <p className={`text-xl font-bold ${getSeverityColor(result.claimSeverityScore)}`}>
                    {result.claimSeverityScore >= 70 ? 'High Risk' : result.claimSeverityScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.claimSeverityScore >= 70 ? 'High likelihood of underpayment' : 
                     result.claimSeverityScore >= 40 ? 'Moderate underpayment risk' : 
                     'Low underpayment risk'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Risk */}
            <div className={`card border-2 ${
              result.timelineRisk.riskLevel === 'high' ? 'bg-red-50 border-red-300' :
              result.timelineRisk.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-300' :
              'bg-green-50 border-green-300'
            }`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Claim Timeline Risk
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Days in Claim Process</p>
                <p className="text-4xl font-bold text-gray-900">
                  Day {result.timelineRisk.daysInClaim}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                result.timelineRisk.riskLevel === 'high' ? 'bg-red-100' :
                result.timelineRisk.riskLevel === 'medium' ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                <p className="font-semibold text-gray-900 mb-1">
                  {result.timelineRisk.riskLevel === 'high' ? '⚠️ Urgent Action Required' :
                   result.timelineRisk.riskLevel === 'medium' ? '⏰ Time Sensitive' :
                   '✓ Good Timeline Position'}
                </p>
                <p className="text-sm text-gray-700">
                  {result.timelineRisk.message}
                </p>
              </div>
            </div>
          </div>

          {/* Detected Issues */}
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4">Potential Missing Scope Items</h2>
            <div className="space-y-2">
              {result.detectedIssues.slice(0, 3).map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900">{issue}</span>
                </div>
              ))}
              {result.detectedIssues.length > 3 && (
                <div className="p-4 bg-gray-100 rounded-lg text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-lg p-4">
                      <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-900">
                        +{result.detectedIssues.length - 3} more issues detected
                      </p>
                      <p className="text-xs text-gray-600">Unlock full report to view all</p>
                    </div>
                  </div>
                  <p className="text-gray-400 blur-sm">• Additional scope items hidden</p>
                  <p className="text-gray-400 blur-sm">• More pricing discrepancies found</p>
                  <p className="text-gray-400 blur-sm">• Coverage issues identified</p>
                </div>
              )}
            </div>
          </div>

          {/* Carrier Tactic Detector */}
          {result.detectedCarrierTactics.length > 0 && (
            <div className="card mb-6 bg-yellow-50 border-2 border-yellow-300">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                Carrier Tactic Detected
              </h2>
              {result.detectedCarrierTactics.map((tactic, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    "{tactic.tactic}"
                  </p>
                  <p className="text-gray-700">
                    {tactic.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Report Preview (Blurred) */}
          <div className="card mb-6 relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-4">Full Claim Gap Report Preview</h2>
            
            {/* Visible Section */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Detected Issues:</h3>
                <ul className="space-y-2">
                  {result.detectedIssues.slice(0, 3).map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Blurred Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-white z-10 flex items-center justify-center pt-12">
                <div className="text-center bg-white rounded-lg shadow-2xl p-8 max-w-md border-2 border-primary-200">
                  <Lock className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Unlock Full Analysis
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get complete access to all detected issues, detailed pricing analysis, and actionable recommendations.
                  </p>
                  <button onClick={handleUpgrade} className="btn-primary w-full">
                    View Full Report
                  </button>
                </div>
              </div>
              
              <div className="blur-md pointer-events-none">
                <div className="space-y-4 pb-32">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Labor Rate Analysis:</h3>
                    <p className="text-gray-700">Detailed labor rate comparison showing...</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Coverage Alignment:</h3>
                    <p className="text-gray-700">Policy coverage triggers and alignment...</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Recommended Actions:</h3>
                    <ul className="space-y-2">
                      <li>• Action item one...</li>
                      <li>• Action item two...</li>
                      <li>• Action item three...</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="card bg-primary-700 text-white">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4">
                Unlock Full Claim Analysis
              </h2>
              <p className="text-xl text-primary-100 mb-2">
                Get complete access to the Command Center
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">What You'll Get:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Full estimate analyzer with line-item breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Complete claim gap report (PDF export)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Documentation packet generator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>AI claim strategy advisor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Claim timeline manager with deadline tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Unlimited analyses and reports</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Compare the Cost:</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-primary-200 text-sm mb-1">Public Adjuster Fee</p>
                    <p className="text-3xl font-bold">15% of settlement</p>
                    <p className="text-sm text-primary-200 mt-1">
                      On $50,000 claim = <strong className="text-white">$7,500</strong>
                    </p>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-primary-200 text-sm mb-1">Claim Command Pro</p>
                    <p className="text-4xl font-bold">$299</p>
                    <p className="text-sm text-primary-200 mt-1">
                      One-time • <strong className="text-white">Save $7,201</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="w-full bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors flex items-center justify-center gap-2"
            >
              Unlock Command Center - $299
              <ChevronRight className="w-6 h-6" />
            </button>

            <p className="text-center text-sm text-primary-200 mt-4">
              30-day money-back guarantee • Secure payment via Stripe
            </p>
          </div>

          {/* Social Proof */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Join hundreds of homeowners who've recovered underpaid claims
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span>⭐⭐⭐⭐⭐</span>
              <span>•</span>
              <span>$12M+ in gaps identified</span>
              <span>•</span>
              <span>Average recovery: $18,400</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
