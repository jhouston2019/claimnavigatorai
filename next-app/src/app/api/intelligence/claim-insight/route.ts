import { NextRequest, NextResponse } from 'next/server'
import { getClaimInsight } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const claimType = searchParams.get('claimType')
    const state = searchParams.get('state')
    const carrierName = searchParams.get('carrierName')

    const insight = await getClaimInsight({
      claimType: claimType || undefined,
      state: state || undefined,
      carrierName: carrierName || undefined,
    })

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Claim insight error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim insight' },
      { status: 500 }
    )
  }
}
