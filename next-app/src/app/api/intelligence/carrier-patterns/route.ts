import { NextRequest, NextResponse } from 'next/server'
import { getCarrierPatterns } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const carrierName = searchParams.get('carrier')

    const patterns = await getCarrierPatterns(carrierName || undefined)

    return NextResponse.json({ patterns })
  } catch (error) {
    console.error('Carrier patterns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch carrier patterns' },
      { status: 500 }
    )
  }
}
