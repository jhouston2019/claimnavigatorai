'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, DollarSign, FileText, TrendingUp, Zap, Target } from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-7xl mx-auto">
          {/* Primary Stats */}
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
                  <p className="text-sm text-gray-600">Revenue</p>
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

          {/* Estimate Scan Funnel */}
          <div className="card mb-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Estimate Scan Funnel (Free Tool)
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Scans</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.estimateScans || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.scanConversions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Scan → Paid</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.scanConversionRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Usage */}
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
                  <p className="text-sm text-gray-600">Doc Packets</p>
                  <p className="text-2xl font-bold">{stats?.docPackets || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/admin/case-studies" className="card hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-bold mb-2">Manage Case Studies</h3>
              <p className="text-gray-600 text-sm">
                Create and edit case studies for the landing page
              </p>
            </Link>

            <Link href="/admin/seo-pages" className="card hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-bold mb-2">SEO Pages</h3>
              <p className="text-gray-600 text-sm">
                Manage authority content pages
              </p>
            </Link>

            <Link href="/admin/analytics" className="card hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-bold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600 text-sm">
                View event log and user behavior
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
