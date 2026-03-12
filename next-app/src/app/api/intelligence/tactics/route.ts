import { NextRequest, NextResponse } from 'next/server'
import { getTacticFrequency } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const tactics = await getTacticFrequency()

    return NextResponse.json({ tactics })
  } catch (error) {
    console.error('Tactic frequency error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tactic frequency' },
      { status: 500 }
    )
  }
}
