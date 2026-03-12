import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { analyzePolicyDocument } from '@/lib/openai'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string

    if (!file || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // Simple text extraction (in production, use a proper PDF parser)
    let policyText = `Policy document with ${pages.length} pages`
    
    // For demo purposes, we'll use a placeholder
    // In production, use pdf-parse or similar library
    policyText = await extractTextFromPDF(arrayBuffer)

    // Analyze with AI
    const analysisResult = await analyzePolicyDocument(policyText)

    // Upload file to storage
    const filePath = await uploadFile(file, 'guest', 'policies')

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('policy_analyses')
      .insert({
        email,
        policy_file_path: filePath,
        analysis_result: analysisResult,
      })
      .select()
      .single()

    if (error) throw error

    // Capture email
    await supabaseAdmin.from('email_captures').insert({
      email,
      source: 'policy_analysis',
      metadata: { analysis_id: data.id },
    })

    // Track analytics event
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'policy_analysis_completed',
      metadata: { email, analysis_id: data.id },
    })

    return NextResponse.json({ analysisId: data.id })
  } catch (error) {
    console.error('Policy analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze policy' },
      { status: 500 }
    )
  }
}

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Placeholder implementation
  // In production, use pdf-parse or similar library
  return `
    INSURANCE POLICY DOCUMENT
    
    Coverage: This policy provides coverage for direct physical loss or damage to covered property.
    
    Covered Perils: Wind, hail, fire, lightning, explosion, theft, vandalism
    
    Documentation Requirements:
    - Proof of ownership
    - Photos of damage
    - Repair estimates
    - Police reports (if applicable)
    
    Proof of Loss: Must be submitted within 60 days of loss
    
    Exclusions: Flood, earthquake, wear and tear, maintenance issues
  `
}
