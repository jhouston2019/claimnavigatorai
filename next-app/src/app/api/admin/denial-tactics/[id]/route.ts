import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('denial_tactics')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ tactic: data })
  } catch (error) {
    console.error('Update denial tactic error:', error)
    return NextResponse.json(
      { error: 'Failed to update denial tactic' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('denial_tactics')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete denial tactic error:', error)
    return NextResponse.json(
      { error: 'Failed to delete denial tactic' },
      { status: 500 }
    )
  }
}
