import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get paid users
    const { count: paidUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_paid', true)

    // Get total revenue
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    // Get total policy analyses
    const { count: totalAnalyses } = await supabaseAdmin
      .from('policy_analyses')
      .select('*', { count: 'exact', head: true })

    // Get estimate analyses
    const { count: estimateAnalyses } = await supabaseAdmin
      .from('estimate_analyses')
      .select('*', { count: 'exact', head: true })

    // Get documentation packets
    const { count: docPackets } = await supabaseAdmin
      .from('documentation_packets')
      .select('*', { count: 'exact', head: true })

    // Get estimate scans (free tool)
    const { count: estimateScans } = await supabaseAdmin
      .from('estimate_scans')
      .select('*', { count: 'exact', head: true })

    // Get scan conversions
    const { count: scanConversions } = await supabaseAdmin
      .from('scan_conversions')
      .select('*', { count: 'exact', head: true })

    // Calculate conversion rates
    const overallConversionRate = totalUsers && paidUsers
      ? ((paidUsers / totalUsers) * 100).toFixed(1)
      : 0

    const scanConversionRate = estimateScans && scanConversions
      ? ((scanConversions / estimateScans) * 100).toFixed(1)
      : 0

    return NextResponse.json({
      totalUsers,
      paidUsers,
      revenue,
      totalAnalyses,
      estimateAnalyses,
      docPackets,
      estimateScans,
      scanConversions,
      conversionRate: overallConversionRate,
      scanConversionRate,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    )
  }
}
