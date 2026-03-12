import { NextRequest, NextResponse } from 'next/server'
import { getIndustryBenchmarks } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  try {
    const benchmarks = await getIndustryBenchmarks()

    return NextResponse.json({ benchmarks })
  } catch (error) {
    console.error('Industry benchmarks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industry benchmarks' },
      { status: 500 }
    )
  }
}
