'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, AlertTriangle, FileText, Shield, MapPin } from 'lucide-react'

interface Benchmarks {
  totalClaims: number
  averageClaimGap: number
  averageCarrierEstimate: number
  averageTrueScope: number
  averageUnderpaymentPercentage: number
  averageSeverityScore: number
}

interface CarrierPattern {
  carrier_name: string
  claim_count: number
  avg_carrier_estimate: number
  avg_scope_value: number
  avg_underpayment: number
  avg_severity_score: number
}

interface RegionalPricing {
  state: string
  city: string
  claim_type: string
  claim_count: number
  avg_carrier_estimate: number
  avg_actual_scope: number
  avg_underpayment: number
}

interface Tactic {
  tactic: string
  frequency: number
  percentage: string
}

interface MissingScope {
  item: string
  frequency: number
  percentage: string
}

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']

export default function IntelligenceDashboard() {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null)
  const [carriers, setCarriers] = useState<CarrierPattern[]>([])
  const [regions, setRegions] = useState<RegionalPricing[]>([])
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [missingScope, setMissingScope] = useState<MissingScope[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntelligenceData()
  }, [])

  async function loadIntelligenceData() {
    try {
      const [benchmarksRes, carriersRes, regionsRes, tacticsRes, scopeRes] = await Promise.all([
        fetch('/api/intelligence/benchmarks'),
        fetch('/api/intelligence/carrier-patterns'),
        fetch('/api/intelligence/regional-pricing'),
        fetch('/api/intelligence/tactics'),
        fetch('/api/intelligence/missing-scope'),
      ])

      const benchmarksData = await benchmarksRes.json()
      const carriersData = await carriersRes.json()
      const regionsData = await regionsRes.json()
      const tacticsData = await tacticsRes.json()
      const scopeData = await scopeRes.json()

      setBenchmarks(benchmarksData.benchmarks)
      setCarriers(carriersData.patterns || [])
      setRegions(regionsData.pricing || [])
      setTactics(tacticsData.tactics || [])
      setMissingScope(scopeData.missingScope || [])
    } catch (error) {
      console.error('Failed to load intelligence:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading intelligence data...</p>
        </div>
      </div>
    )
  }

  const carrierChartData = carriers.slice(0, 10).map(c => ({
    name: c.carrier_name.substring(0, 20),
    gap: Math.round(c.avg_underpayment),
    claims: c.claim_count,
  }))

  const tacticChartData = tactics.slice(0, 8).map(t => ({
    name: t.tactic.replace(/_/g, ' ').substring(0, 25),
    value: t.frequency,
    percentage: parseFloat(t.percentage),
  }))

  const scopeChartData = missingScope.slice(0, 10).map(s => ({
    name: s.item.substring(0, 20),
    frequency: s.frequency,
    percentage: parseFloat(s.percentage),
  }))

  const regionalChartData = regions.slice(0, 10).map(r => ({
    name: `${r.city}, ${r.state}`,
    gap: Math.round(r.avg_underpayment),
    claims: r.claim_count,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Claim Intelligence Network</h1>
          <p className="text-lg text-gray-600">
            Industry insights powered by anonymized claim data
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Data Privacy</h3>
              <p className="text-sm text-blue-800">
                All intelligence data is fully anonymized and aggregated. No personal information is stored or displayed.
              </p>
            </div>
          </div>
        </div>

        {/* Industry Benchmarks */}
        {benchmarks && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
              Industry Benchmarks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Claims Analyzed</h3>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{benchmarks.totalClaims.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Claim Gap</h3>
                  <DollarSign className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600">${benchmarks.averageClaimGap.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Carrier Estimate</h3>
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${benchmarks.averageCarrierEstimate.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg True Scope</h3>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">${benchmarks.averageTrueScope.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Underpayment %</h3>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{benchmarks.averageUnderpaymentPercentage}%</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Severity Score</h3>
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{benchmarks.averageSeverityScore}/10</p>
              </div>
            </div>
          </div>
        )}

        {/* Carrier Behavior */}
        {carriers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              Carrier Behavior Analytics
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={carrierChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="gap" fill="#ef4444" name="Avg Underpayment" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claims</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Estimate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Scope</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {carriers.slice(0, 10).map((carrier, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{carrier.carrier_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{carrier.claim_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(carrier.avg_carrier_estimate).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(carrier.avg_scope_value).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">${Math.round(carrier.avg_underpayment).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Regional Pricing */}
        {regions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-blue-600" />
              Regional Pricing Intelligence
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionalChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="gap" fill="#3b82f6" name="Avg Underpayment" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claims</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Estimate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Scope</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {regions.slice(0, 10).map((region, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{region.city}, {region.state}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{region.claim_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{region.claim_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(region.avg_carrier_estimate).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(region.avg_actual_scope).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">${Math.round(region.avg_underpayment).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Carrier Tactics */}
        {tactics.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
              Common Carrier Tactics
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={tacticChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tacticChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {tactics.slice(0, 10).map((tactic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {tactic.tactic.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{tactic.frequency}</span>
                      <span className="text-sm text-gray-500 ml-2">({tactic.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Missing Scope Items */}
        {missingScope.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Most Common Missing Scope Items
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={scopeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="frequency" fill="#1e3a8a" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missingScope.slice(0, 12).map((item, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-900 capitalize">{item.item}</span>
                      <span className="text-xs text-blue-600 font-medium">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">{item.frequency} claims</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {benchmarks?.totalClaims === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Intelligence Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Intelligence data will appear here as users analyze their claims.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
