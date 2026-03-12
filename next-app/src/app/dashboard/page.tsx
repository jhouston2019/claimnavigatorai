'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, TrendingUp, AlertCircle, Calendar, LogOut } from 'lucide-react'

interface Claim {
  id: string
  claim_name: string
  claim_type: string
  carrier_name: string
  status: string
  created_at: string
}

interface Deadline {
  id: string
  deadline_type: string
  deadline_date: string
  description: string
  is_completed: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    await loadDashboardData(user.id)
  }

  const loadDashboardData = async (userId: string) => {
    try {
      const [profileRes, claimsRes, deadlinesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('claims').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('deadlines').select('*').eq('user_id', userId).eq('is_completed', false).order('deadline_date', { ascending: true }).limit(5),
      ])

      setProfile(profileRes.data)
      setClaims(claimsRes.data || [])
      setDeadlines(deadlinesRes.data || [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-7xl mx-auto">
          {/* Account Status */}
          <div className="card mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">Account Status</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              {!profile?.is_paid && (
                <Link href="/pricing" className="btn-primary">
                  Upgrade to Pro
                </Link>
              )}
              {profile?.is_paid && (
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                  Pro Member
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/estimate-analyzer" className="card hover:shadow-xl transition-shadow">
              <TrendingUp className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">Analyze Estimates</h3>
              <p className="text-gray-600 text-sm">
                Compare carrier and contractor estimates to identify gaps
              </p>
            </Link>

            <Link href="/documentation-builder" className="card hover:shadow-xl transition-shadow">
              <FileText className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">Build Documentation</h3>
              <p className="text-gray-600 text-sm">
                Create comprehensive claim documentation packets
              </p>
            </Link>

            <Link href="/strategy-advisor" className="card hover:shadow-xl transition-shadow">
              <AlertCircle className="w-10 h-10 text-primary-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">Get Strategy Advice</h3>
              <p className="text-gray-600 text-sm">
                AI-powered recommendations for your claim
              </p>
            </Link>
          </div>

          {/* Upcoming Deadlines */}
          {deadlines.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold mb-4">Upcoming Deadlines</h2>
              <div className="space-y-3">
                {deadlines.map((deadline) => {
                  const daysUntil = getDaysUntil(deadline.deadline_date)
                  const isUrgent = daysUntil <= 7
                  
                  return (
                    <div
                      key={deadline.id}
                      className={`flex items-start gap-3 p-4 rounded-lg ${
                        isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <Calendar className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        isUrgent ? 'text-red-600' : 'text-gray-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {deadline.deadline_type}
                            </h3>
                            {deadline.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {deadline.description}
                              </p>
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${
                            isUrgent ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(deadline.deadline_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Claims */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Claims</h2>
              <Link href="/claims/new" className="btn-secondary text-sm">
                New Claim
              </Link>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">No claims yet</p>
                <Link href="/estimate-analyzer" className="btn-primary">
                  Start Your First Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/claims/${claim.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {claim.claim_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {claim.claim_type} • {claim.carrier_name}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
