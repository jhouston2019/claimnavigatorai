import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateClaimStrategy } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const claimData = await request.json()
    const recommendations = await generateClaimStrategy(claimData)

    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'strategy_advisor_used',
      user_id: user.id,
      metadata: { claim_type: claimData.claimType },
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Strategy advisor error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
