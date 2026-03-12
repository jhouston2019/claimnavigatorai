import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('documentation_packets')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    const packetData = data.packet_data

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'Claim Documentation Packet',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Generated: ${new Date().toLocaleDateString()}`,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Claim Summary',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Claim Number: ', bold: true }),
              new TextRun(packetData.claimNumber || 'N/A'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Carrier: ', bold: true }),
              new TextRun(packetData.carrier || 'N/A'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Claim Type: ', bold: true }),
              new TextRun(packetData.claimType || 'N/A'),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Scope Documentation',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: packetData.scopeDocumentation || '',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Evidence Checklist',
            heading: HeadingLevel.HEADING_2,
          }),
          ...(packetData.evidenceChecklist || []).map((item: string) =>
            new Paragraph({ text: `• ${item}` })
          ),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="claim-documentation-packet-${params.id}.docx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    )
  }
}
