'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, TrendingUp, FileText } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/analytics/events'),
      ])

      const statsData = await statsRes.json()
      const eventsData = await eventsRes.json()

      setStats(statsData)
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-7xl mx-auto">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <Users className="w-10 h-10 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <Users className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Paid Users</p>
                  <p className="text-3xl font-bold">{stats?.paidUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <DollarSign className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    ${stats?.revenue?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold">{stats?.conversionRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Policy Analyses</p>
                  <p className="text-2xl font-bold">{stats?.totalAnalyses || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Estimate Analyses</p>
                  <p className="text-2xl font-bold">{stats?.estimateAnalyses || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Doc Packets Created</p>
                  <p className="text-2xl font-bold">{stats?.docPackets || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <span className="font-medium text-gray-900">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    {event.metadata && (
                      <span className="text-sm text-gray-500 ml-2">
                        {JSON.stringify(event.metadata).slice(0, 50)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
