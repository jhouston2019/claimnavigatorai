import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { detectUnderpayment } from '@/lib/openai'
import { captureClaimIntelligence } from '@/lib/intelligence'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const carrierEstimate = formData.get('carrierEstimate') as File
    const contractorEstimate = formData.get('contractorEstimate') as File | null
    const policy = formData.get('policy') as File | null
    
    // Get photos
    const photos: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        photos.push(value)
      }
    }

    if (!carrierEstimate) {
      return NextResponse.json(
        { error: 'Carrier estimate required' },
        { status: 400 }
      )
    }

    // Upload files
    const carrierPath = await uploadFile(carrierEstimate, user.id, 'underpayment-detection')
    let contractorPath = null
    let policyPath = null
    const photoPaths: string[] = []

    if (contractorEstimate) {
      contractorPath = await uploadFile(contractorEstimate, user.id, 'underpayment-detection')
    }
    if (policy) {
      policyPath = await uploadFile(policy, user.id, 'underpayment-detection')
    }
    for (const photo of photos) {
      const path = await uploadFile(photo, user.id, 'underpayment-detection/photos')
      photoPaths.push(path)
    }

    // Extract text from documents
    const carrierText = await extractEstimateText(carrierEstimate)
    const contractorText = contractorEstimate ? await extractEstimateText(contractorEstimate) : undefined
    const policyText = policy ? await extractPolicyText(policy) : undefined

    // Analyze with AI
    const detectionResult = await detectUnderpayment({
      carrierText,
      contractorText,
      policyText,
      hasPhotos: photos.length > 0,
    })

    // Capture anonymized intelligence data
    await captureClaimIntelligence({
      carrierName: detectionResult.carrierName,
      state: detectionResult.state,
      city: detectionResult.city,
      claimType: detectionResult.claimType,
      propertyType: detectionResult.propertyType,
      carrierEstimateValue: detectionResult.carrierEstimateTotal,
      contractorEstimateValue: detectionResult.contractorEstimateTotal,
      predictedScopeValue: detectionResult.predictedScopeValue,
      potentialGapValue: detectionResult.underpaymentAmount,
      missingScopeItems: detectionResult.missingItems,
      detectedCarrierTactics: detectionResult.carrierTactics,
      severityScore: detectionResult.severityScore,
    })

    // Create claim if needed
    const { data: claim } = await supabase
      .from('claims')
      .insert({
        user_id: user.id,
        claim_name: 'Underpayment Detection',
        status: 'active',
      })
      .select()
      .single()

    // Save detection results
    const { data, error } = await supabase
      .from('underpayment_detections')
      .insert({
        claim_id: claim?.id,
        user_id: user.id,
        carrier_estimate_path: carrierPath,
        contractor_estimate_path: contractorPath,
        policy_path: policyPath,
        photo_paths: photoPaths,
        detection_result: detectionResult,
      })
      .select()
      .single()

    if (error) throw error

    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'underpayment_detection_completed',
      user_id: user.id,
      metadata: { 
        detection_id: data.id,
        underpayment_estimate: detectionResult.underpaymentRange,
      },
    })

    return NextResponse.json({ detectionId: data.id })
  } catch (error) {
    console.error('Underpayment detection error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze claim' },
      { status: 500 }
    )
  }
}

async function extractEstimateText(file: File): Promise<string> {
  return `Estimate document: ${file.name}`
}

async function extractPolicyText(file: File): Promise<string> {
  return `Policy document: ${file.name}`
}
