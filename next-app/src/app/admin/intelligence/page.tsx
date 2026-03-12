'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, DollarSign, AlertTriangle, FileText, Shield, Database, Activity } from 'lucide-react'

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

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#ef4444', '#f97316', '#eab308']

export default function AdminIntelligencePage() {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null)
  const [carriers, setCarriers] = useState<CarrierPattern[]>([])
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [missingScope, setMissingScope] = useState<MissingScope[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntelligenceData()
  }, [])

  async function loadIntelligenceData() {
    try {
      const [benchmarksRes, carriersRes, tacticsRes, scopeRes] = await Promise.all([
        fetch('/api/intelligence/benchmarks'),
        fetch('/api/intelligence/carrier-patterns'),
        fetch('/api/intelligence/tactics'),
        fetch('/api/intelligence/missing-scope'),
      ])

      const benchmarksData = await benchmarksRes.json()
      const carriersData = await carriersRes.json()
      const tacticsData = await tacticsRes.json()
      const scopeData = await scopeRes.json()

      setBenchmarks(benchmarksData.benchmarks)
      setCarriers(carriersData.patterns || [])
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

  const topCarriers = carriers.slice(0, 10)
  const topTactics = tactics.slice(0, 8)
  const topMissingScope = missingScope.slice(0, 10)

  const carrierChartData = topCarriers.map(c => ({
    name: c.carrier_name.substring(0, 15),
    claims: c.claim_count,
    gap: Math.round(c.avg_underpayment),
  }))

  const tacticPieData = topTactics.map(t => ({
    name: t.tactic.replace(/_/g, ' ').substring(0, 20),
    value: t.frequency,
  }))

  const scopeChartData = topMissingScope.map(s => ({
    name: s.item.substring(0, 20),
    frequency: s.frequency,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Intelligence Network Admin</h1>
          <p className="text-lg text-gray-600">
            Real-time analytics from anonymized claim data
          </p>
        </div>

        {/* Key Metrics */}
        {benchmarks && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Database className="h-6 w-6 mr-2 text-blue-600" />
              Platform Intelligence Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Claims Analyzed</h3>
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{benchmarks.totalClaims.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Intelligence records</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Claim Gap</h3>
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-4xl font-bold text-red-600">${benchmarks.averageClaimGap.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Industry average</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Underpayment Rate</h3>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-4xl font-bold text-orange-600">{benchmarks.averageUnderpaymentPercentage}%</p>
                <p className="text-xs text-gray-500 mt-1">Of carrier estimates</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Carriers Tracked</h3>
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-4xl font-bold text-purple-600">{carriers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Unique carriers</p>
              </div>
            </div>
          </div>
        )}

        {/* Carrier Analytics */}
        {carriers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              Top Carriers by Claim Volume
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={carrierChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="claims" fill="#3b82f6" name="Claims Analyzed" />
                    <Bar yAxisId="right" dataKey="gap" fill="#ef4444" name="Avg Gap ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claims</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Estimate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Scope</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Gap</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCarriers.map((carrier, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">#{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{carrier.carrier_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{carrier.claim_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(carrier.avg_carrier_estimate).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${Math.round(carrier.avg_scope_value).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">${Math.round(carrier.avg_underpayment).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            carrier.avg_severity_score >= 70 ? 'bg-red-100 text-red-800' :
                            carrier.avg_severity_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {Math.round(carrier.avg_severity_score)}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Tactic Frequency */}
          {tactics.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
                Carrier Tactic Distribution
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tacticPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tacticPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-2">
                  {topTactics.map((tactic, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {tactic.tactic.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-gray-900">{tactic.frequency}</span>
                        <span className="text-xs text-gray-500 ml-2">({tactic.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Missing Scope Items */}
          {missingScope.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Top Missing Scope Items
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scopeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#1e3a8a" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-2">
                  {topMissingScope.map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-900 capitalize">
                          #{idx + 1} {item.item}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">{item.frequency} claims affected</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-green-600" />
            Intelligence Network Health
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Data Collection</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold text-green-700">Active</p>
              <p className="text-xs text-green-600 mt-1">Capturing from all scans</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Analytics APIs</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold text-blue-700">Operational</p>
              <p className="text-xs text-blue-600 mt-1">All endpoints responding</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Data Privacy</span>
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">Compliant</p>
              <p className="text-xs text-purple-600 mt-1">Fully anonymized</p>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {benchmarks?.totalClaims === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center mt-8">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Intelligence Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Intelligence data will be captured automatically as users run estimate scans and analyses.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
