import { NextRequest, NextResponse } from 'next/server'
import { getMissingScopeAnalytics } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const missingScope = await getMissingScopeAnalytics()

    return NextResponse.json({ missingScope })
  } catch (error) {
    console.error('Missing scope analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missing scope analytics' },
      { status: 500 }
    )
  }
}
