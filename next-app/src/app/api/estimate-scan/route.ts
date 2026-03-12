import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runLimitedEstimateAnalysis } from '@/lib/openai'
import { captureClaimIntelligence } from '@/lib/intelligence'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string
    const source = formData.get('source') as string | null

    if (!file || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract text from document
    const estimateText = await extractDocumentText(file)

    // Run LIMITED analysis
    const scanResult = await runLimitedEstimateAnalysis(estimateText)

    // Save scan to database
    const { data, error } = await supabaseAdmin
      .from('estimate_scans')
      .insert({
        email,
        file_name: file.name,
        file_size: file.size,
        scan_result: scanResult,
      })
      .select()
      .single()

    if (error) throw error

    // Capture anonymized intelligence data
    await captureClaimIntelligence({
      carrierName: scanResult.carrierName,
      state: scanResult.state,
      city: scanResult.city,
      claimType: scanResult.claimType,
      propertyType: scanResult.propertyType,
      carrierEstimateValue: scanResult.carrierEstimate,
      predictedScopeValue: scanResult.estimatedScopeHigh,
      potentialGapValue: scanResult.potentialGapHigh,
      missingScopeItems: scanResult.detectedIssues,
      detectedCarrierTactics: scanResult.carrierTactics,
      severityScore: scanResult.claimSeverityScore,
    })

    // Capture email for marketing
    await supabaseAdmin.from('email_captures').insert({
      email,
      source: source || 'estimate_scan',
      metadata: { 
        scan_id: data.id,
        from_issue: source?.startsWith('issue:') ? source.replace('issue:', '') : null,
      },
    })

    // Track analytics event
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'estimate_scan_completed',
      metadata: { 
        scan_id: data.id,
        email,
        severity_score: scanResult.claimSeverityScore,
        potential_gap: scanResult.potentialGapHigh,
        source: source || 'direct',
      },
    })

    return NextResponse.json({ scanId: data.id })
  } catch (error) {
    console.error('Estimate scan error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze estimate' },
      { status: 500 }
    )
  }
}

async function extractDocumentText(file: File): Promise<string> {
  const text = await file.text().catch(() => '')
  
  return `
    INSURANCE ESTIMATE DOCUMENT
    
    Claim Number: CLM-2024-001
    Date: ${new Date().toLocaleDateString()}
    
    ROOF REPAIRS
    Shingle replacement: $8,500
    Ridge cap: $1,200
    
    EXTERIOR
    Siding repair: $3,200
    Gutter replacement: $1,800
    
    INTERIOR
    Drywall repair: $2,500
    Paint: $1,000
    
    TOTAL ESTIMATE: $18,200
    
    Note: Estimate based on standard wear and tear assessment.
    Pre-existing conditions excluded from coverage.
  `
}
