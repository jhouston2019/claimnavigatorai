import { NextRequest, NextResponse } from 'next/server'
import { getRegionalPricing } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const claimType = searchParams.get('claim_type')

    const pricing = await getRegionalPricing(
      state || undefined,
      city || undefined,
      claimType || undefined
    )

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Regional pricing error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch regional pricing' },
      { status: 500 }
    )
  }
}
