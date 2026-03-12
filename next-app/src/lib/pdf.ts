import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export async function generateClaimPacketPDF(packetData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(24).text('Claim Documentation Packet', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(18).text('Claim Summary', { underline: true })
    doc.moveDown()
    doc.fontSize(12)
    doc.text(`Claim Number: ${packetData.claimNumber || 'N/A'}`)
    doc.text(`Carrier: ${packetData.carrier || 'N/A'}`)
    doc.text(`Claim Type: ${packetData.claimType || 'N/A'}`)
    doc.text(`Date of Loss: ${packetData.dateOfLoss || 'N/A'}`)
    doc.moveDown(2)

    if (packetData.scopeDocumentation) {
      doc.addPage()
      doc.fontSize(18).text('Scope Documentation', { underline: true })
      doc.moveDown()
      doc.fontSize(12).text(packetData.scopeDocumentation)
      doc.moveDown(2)
    }

    if (packetData.evidenceChecklist && packetData.evidenceChecklist.length > 0) {
      doc.addPage()
      doc.fontSize(18).text('Evidence Checklist', { underline: true })
      doc.moveDown()
      doc.fontSize(12)
      packetData.evidenceChecklist.forEach((item: string, index: number) => {
        doc.text(`${index + 1}. ${item}`)
      })
      doc.moveDown(2)
    }

    if (packetData.disputeLetter) {
      doc.addPage()
      doc.fontSize(18).text('Dispute Letter Template', { underline: true })
      doc.moveDown()
      doc.fontSize(12).text(packetData.disputeLetter)
      doc.moveDown(2)
    }

    if (packetData.proofOfLoss) {
      doc.addPage()
      doc.fontSize(18).text('Proof of Loss Structure', { underline: true })
      doc.moveDown()
      doc.fontSize(12).text(packetData.proofOfLoss)
    }

    doc.end()
  })
}

export async function generateClaimGapReportPDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(24).text('Claim Gap Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(18).text('Financial Summary', { underline: true })
    doc.moveDown()
    doc.fontSize(14)
    doc.text(`Carrier Estimate: $${reportData.carrierAmount?.toLocaleString() || '0'}`)
    doc.text(`Estimated True Scope: $${reportData.estimatedTrueScope?.toLocaleString() || '0'}`)
    doc.moveDown()
    doc.fontSize(16).fillColor('red')
    doc.text(`Potential Gap: $${reportData.gapAmount?.toLocaleString() || '0'}`)
    doc.fillColor('black')
    doc.moveDown(2)

    doc.fontSize(18).text('Detected Issues', { underline: true })
    doc.moveDown()
    doc.fontSize(12)

    if (reportData.missingItems && reportData.missingItems.length > 0) {
      doc.fontSize(14).text('Missing Scope Items:', { underline: true })
      doc.fontSize(12)
      reportData.missingItems.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
      doc.moveDown()
    }

    if (reportData.pricingIssues && reportData.pricingIssues.length > 0) {
      doc.fontSize(14).text('Pricing Discrepancies:', { underline: true })
      doc.fontSize(12)
      reportData.pricingIssues.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
      doc.moveDown()
    }

    if (reportData.coverageIssues && reportData.coverageIssues.length > 0) {
      doc.fontSize(14).text('Coverage Issues:', { underline: true })
      doc.fontSize(12)
      reportData.coverageIssues.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
    }

    doc.end()
  })
}

export async function generateUnderpaymentReportPDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(24).text('Underpayment Detection Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(18).fillColor('red').text('⚠ POTENTIAL UNDERPAYMENT DETECTED', { align: 'center' })
    doc.fillColor('black')
    doc.moveDown(2)

    doc.fontSize(18).text('Financial Analysis', { underline: true })
    doc.moveDown()
    doc.fontSize(14)
    doc.text(`Carrier Estimate: $${reportData.carrierEstimate?.toLocaleString() || '0'}`)
    doc.text(`Estimated True Scope: $${reportData.estimatedTrueScope?.toLocaleString() || '0'}`)
    doc.moveDown()
    doc.fontSize(16).fillColor('red')
    doc.text(`Underpayment Range: $${reportData.underpaymentRange?.low?.toLocaleString() || '0'} - $${reportData.underpaymentRange?.high?.toLocaleString() || '0'}`)
    doc.fillColor('black')
    doc.fontSize(12)
    doc.text(`Confidence Level: ${reportData.confidence || 'N/A'}`)
    doc.moveDown(2)

    if (reportData.missingItems && reportData.missingItems.length > 0) {
      doc.addPage()
      doc.fontSize(18).text('Missing Scope Items', { underline: true })
      doc.moveDown()
      doc.fontSize(12)
      reportData.missingItems.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
      doc.moveDown(2)
    }

    if (reportData.laborRateIssues && reportData.laborRateIssues.length > 0) {
      doc.fontSize(18).text('Labor Rate Issues', { underline: true })
      doc.moveDown()
      doc.fontSize(12)
      reportData.laborRateIssues.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
      doc.moveDown(2)
    }

    if (reportData.documentationGaps && reportData.documentationGaps.length > 0) {
      doc.fontSize(18).text('Documentation Gaps', { underline: true })
      doc.moveDown()
      doc.fontSize(12)
      reportData.documentationGaps.forEach((item: string) => {
        doc.text(`• ${item}`)
      })
      doc.moveDown(2)
    }

    if (reportData.recommendedActions && reportData.recommendedActions.length > 0) {
      doc.addPage()
      doc.fontSize(18).text('Recommended Actions', { underline: true })
      doc.moveDown()
      doc.fontSize(12)
      reportData.recommendedActions.forEach((item: string, index: number) => {
        doc.text(`${index + 1}. ${item}`)
        doc.moveDown(0.5)
      })
    }

    doc.end()
  })
}
