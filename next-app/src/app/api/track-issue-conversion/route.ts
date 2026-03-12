import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { issueSlug } = await request.json()

    if (!issueSlug) {
      return NextResponse.json(
        { error: 'Issue slug required' },
        { status: 400 }
      )
    }

    // Increment conversion count for this issue
    const { data: issue } = await supabaseAdmin
      .from('estimate_issues')
      .select('id, scan_conversion_count')
      .eq('slug', issueSlug)
      .single()

    if (issue) {
      await supabaseAdmin
        .from('estimate_issues')
        .update({ 
          scan_conversion_count: (issue.scan_conversion_count || 0) + 1 
        })
        .eq('id', issue.id)
    }

    // Track analytics event
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'issue_page_conversion',
      metadata: { issue_slug: issueSlug },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    )
  }
}
