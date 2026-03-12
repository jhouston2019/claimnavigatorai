import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { analyzeEstimates } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const carrierFile = formData.get('carrierFile') as File
    const contractorFile = formData.get('contractorFile') as File | null
    const claimId = formData.get('claimId') as string | null

    if (!carrierFile) {
      return NextResponse.json(
        { error: 'Carrier estimate required' },
        { status: 400 }
      )
    }

    // Upload files
    const carrierPath = await uploadFile(carrierFile, user.id, 'estimates')
    let contractorPath = null
    if (contractorFile) {
      contractorPath = await uploadFile(contractorFile, user.id, 'estimates')
    }

    // Extract text (placeholder)
    const carrierText = await extractEstimateText(carrierFile)
    const contractorText = contractorFile ? await extractEstimateText(contractorFile) : undefined

    // Analyze with AI
    const analysisResult = await analyzeEstimates(carrierText, contractorText)

    // Create claim if not provided
    let finalClaimId = claimId
    if (!finalClaimId) {
      const { data: claim } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          claim_name: 'Estimate Analysis',
          status: 'active',
        })
        .select()
        .single()
      
      finalClaimId = claim?.id
    }

    // Save analysis
    const { data, error } = await supabase
      .from('estimate_analyses')
      .insert({
        claim_id: finalClaimId,
        user_id: user.id,
        carrier_estimate_path: carrierPath,
        contractor_estimate_path: contractorPath,
        carrier_amount: analysisResult.carrierAmount,
        estimated_true_scope: analysisResult.estimatedTrueScope,
        gap_amount: analysisResult.gapAmount,
        analysis_result: analysisResult,
      })
      .select()
      .single()

    if (error) throw error

    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'estimate_analysis_completed',
      user_id: user.id,
      metadata: { analysis_id: data.id, gap_amount: analysisResult.gapAmount },
    })

    return NextResponse.json({ analysisId: data.id })
  } catch (error) {
    console.error('Estimate analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze estimates' },
      { status: 500 }
    )
  }
}

async function extractEstimateText(file: File): Promise<string> {
  // Placeholder - in production use pdf-parse
  return `
    ESTIMATE DOCUMENT
    
    Roof Replacement: $12,500
    Siding Repair: $3,200
    Interior Paint: $2,500
    
    Total: $18,200
  `
}
