/**
 * Document Spacing Fix Utility
 * Phase 12A.1 - Cleans up spacing issues in generated documents
 */

function fixDocumentSpacing(html) {
  if (!html || typeof html !== 'string') return html;
  
  // Replace double <br><br> with <p></p> for better spacing
  let fixed = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');
  
  // Ensure h1 has margin-top: 0
  fixed = fixed.replace(/<h1([^>]*)>/gi, '<h1$1 style="margin-top:0;">');
  
  // Remove excessive line breaks
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  // Clean up empty paragraphs
  fixed = fixed.replace(/<p>\s*<\/p>/gi, '');
  
  return fixed;
}

window.fixDocumentSpacing = fixDocumentSpacing;

