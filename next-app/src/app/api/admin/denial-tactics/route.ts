import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('denial_tactics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tactics: data || [] })
  } catch (error) {
    console.error('Get denial tactics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch denial tactics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('denial_tactics')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ tactic: data })
  } catch (error) {
    console.error('Create denial tactic error:', error)
    return NextResponse.json(
      { error: 'Failed to create denial tactic' },
      { status: 500 }
    )
  }
}
