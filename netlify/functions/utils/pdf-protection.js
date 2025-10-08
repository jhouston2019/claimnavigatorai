const PDFLib = require('pdf-lib');
const crypto = require('crypto');

/**
 * Universal PDF Protection Utility
 * Adds claimant information headers, footers, and document IDs to PDFs
 */

/**
 * Generate a unique document ID based on user info and timestamp
 */
function generateDocumentId(userId, policyNumber, timestamp = Date.now()) {
  const data = `${userId}-${policyNumber}-${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
}

/**
 * Format loss location for display
 */
function formatLossLocation(lossLocation) {
  if (typeof lossLocation === 'object') {
    return `${lossLocation.address}, ${lossLocation.city}, ${lossLocation.state} ${lossLocation.zip}`;
  }
  return lossLocation;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Add claimant protection to a PDF document
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {Object} claimantInfo - Claimant information object
 * @param {string} claimantInfo.insured_name - Insured name
 * @param {string} claimantInfo.policy_number - Policy number
 * @param {string} claimantInfo.insurer - Insurance company
 * @param {string} claimantInfo.date_of_loss - Date of loss
 * @param {Object|string} claimantInfo.loss_location - Loss location
 * @param {string} claimantInfo.property_type - Property type
 * @param {string} claimantInfo.status - Claim status
 * @param {string} claimantInfo.user_id - User ID for document ID generation
 * @returns {Promise<Buffer>} - Protected PDF buffer
 */
async function addClaimantProtection(pdfBuffer, claimantInfo) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    // Generate document ID
    const documentId = generateDocumentId(
      claimantInfo.user_id, 
      claimantInfo.policy_number
    );
    
    // Format claimant information
    const formattedLocation = formatLossLocation(claimantInfo.loss_location);
    const formattedDate = formatDate(claimantInfo.date_of_loss);
    
    // Create header text
    const headerText = `Insured: ${claimantInfo.insured_name} | Policy #: ${claimantInfo.policy_number} | Insurer: ${claimantInfo.insurer} | Loss Date: ${formattedDate} | Location: ${formattedLocation}`;
    
    // Create footer text
    const footerText = `Generated for ${claimantInfo.insured_name} – Not transferable`;
    
    // Create document ID text
    const docIdText = `Doc ID: ${documentId}`;
    
    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Add header (top of page)
      page.drawText(headerText, {
        x: 20,
        y: height - 30,
        size: 8,
        color: PDFLib.rgb(0.2, 0.2, 0.2),
        font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica)
      });
      
      // Add footer (bottom of page)
      page.drawText(footerText, {
        x: 20,
        y: 20,
        size: 8,
        color: PDFLib.rgb(0.4, 0.4, 0.4),
        font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica)
      });
      
      // Add document ID (bottom right)
      page.drawText(docIdText, {
        x: width - 120,
        y: 20,
        size: 7,
        color: PDFLib.rgb(0.5, 0.5, 0.5),
        font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica)
      });
      
      // Add watermark (diagonal, semi-transparent)
      page.drawText(`Generated for ${claimantInfo.insured_name}`, {
        x: width / 2 - 100,
        y: height / 2,
        size: 24,
        color: PDFLib.rgb(0.8, 0.8, 0.8),
        font: await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold),
        rotate: PDFLib.degrees(-45),
        opacity: 0.1
      });
    }
    
    // Save the protected PDF
    const protectedPdfBytes = await pdfDoc.save();
    
    return {
      protectedPdf: Buffer.from(protectedPdfBytes),
      documentId: documentId
    };
    
  } catch (error) {
    console.error('Error adding claimant protection:', error);
    throw new Error('Failed to add claimant protection to PDF');
  }
}

/**
 * Add claimant protection to DOCX documents
 * Note: This is a placeholder - DOCX protection would require additional libraries
 */
async function addClaimantProtectionToDocx(docxBuffer, claimantInfo) {
  // For now, return the original buffer
  // In a full implementation, you would use a library like 'docx' to modify the document
  console.log('DOCX protection not yet implemented, returning original document');
  return {
    protectedDocx: docxBuffer,
    documentId: generateDocumentId(claimantInfo.user_id, claimantInfo.policy_number)
  };
}

/**
 * Log document access for audit tracking
 */
async function logDocumentAccess(documentId, claimantInfo, accessType = 'download') {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { error } = await supabase
      .from('document_access_log')
      .insert([{
        document_id: documentId,
        user_id: claimantInfo.user_id,
        insured_name: claimantInfo.insured_name,
        policy_number: claimantInfo.policy_number,
        access_type: accessType,
        accessed_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error logging document access:', error);
    }
  } catch (error) {
    console.error('Error logging document access:', error);
  }
}

module.exports = {
  addClaimantProtection,
  addClaimantProtectionToDocx,
  generateDocumentId,
  logDocumentAccess,
  formatLossLocation,
  formatDate
};
