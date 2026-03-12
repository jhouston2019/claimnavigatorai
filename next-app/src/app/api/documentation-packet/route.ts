import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packetData = await request.json()

    // Create or get claim
    let claimId = packetData.claimId
    if (!claimId) {
      const { data: claim } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          claim_name: packetData.claimNumber || 'Documentation Packet',
          claim_type: packetData.claimType,
          carrier_name: packetData.carrier,
          claim_number: packetData.claimNumber,
          status: 'active',
        })
        .select()
        .single()
      
      claimId = claim?.id
    }

    // Save packet
    const { data, error } = await supabase
      .from('documentation_packets')
      .insert({
        claim_id: claimId,
        user_id: user.id,
        packet_data: packetData,
      })
      .select()
      .single()

    if (error) throw error

    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'documentation_packet_created',
      user_id: user.id,
      metadata: { packet_id: data.id },
    })

    return NextResponse.json({ packetId: data.id })
  } catch (error) {
    console.error('Documentation packet error:', error)
    return NextResponse.json(
      { error: 'Failed to create packet' },
      { status: 500 }
    )
  }
}
