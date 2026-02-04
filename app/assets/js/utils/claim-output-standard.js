/**
 * Claim Output Standard
 * 
 * Enforces professional formatting for all AI-generated outputs.
 * Ensures every response is claim-grade, structured, and auditable.
 */

export const OutputTypes = {
  ANALYSIS: 'analysis',
  LETTER: 'letter',
  EMAIL: 'email',
  REPORT: 'report',
  CHECKLIST: 'checklist',
  RESPONSE: 'response',
  STRATEGY: 'strategy'
};

/**
 * Format AI output to claim-grade standard
 * 
 * @param {Object} params
 * @param {string} params.toolName - Name of the tool that generated output
 * @param {string} params.outputType - Type of output (analysis, letter, email, etc.)
 * @param {string} params.content - Raw AI-generated content
 * @param {Object} params.claimInfo - Claim context information
 * @param {string} params.userId - Current user ID
 * @returns {Object} Formatted output with HTML, plain text, and metadata
 */
export function formatClaimOutput({
  toolName,
  outputType,
  content,
  claimInfo = {},
  userId
}) {
  // Validate required fields
  if (!toolName || !outputType || !content) {
    throw new Error('Missing required fields: toolName, outputType, and content are mandatory');
  }

  // Generate metadata
  const metadata = {
    toolName,
    outputType,
    claimId: claimInfo.claimId || null,
    userId: userId || null,
    timestamp: new Date().toISOString(),
    generatedBy: 'Claim Navigator AI',
    version: '1.0'
  };

  // Generate title based on tool and output type
  const title = generateTitle(toolName, outputType, claimInfo);

  // Format content based on output type
  const formattedHtml = formatAsHtml(content, outputType, title, claimInfo, metadata);
  const plainText = formatAsPlainText(content, outputType, title, claimInfo, metadata);

  return {
    formattedHtml,
    plainText,
    metadata,
    title
  };
}

/**
 * Generate human-readable title for journal entry
 */
function generateTitle(toolName, outputType, claimInfo) {
  const date = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const claimRef = claimInfo.claimNumber 
    ? ` - Claim ${claimInfo.claimNumber}` 
    : '';

  const typeLabel = {
    analysis: 'Analysis',
    letter: 'Letter',
    email: 'Email',
    report: 'Report',
    checklist: 'Checklist',
    response: 'Response',
    strategy: 'Strategy'
  }[outputType] || 'Document';

  return `${toolName} ${typeLabel}${claimRef} - ${date}`;
}

/**
 * Format content as HTML with proper structure
 */
function formatAsHtml(content, outputType, title, claimInfo, metadata) {
  const headerHtml = generateHeaderHtml(claimInfo, metadata);
  const contentHtml = wrapContentByType(content, outputType);
  const footerHtml = generateFooterHtml(metadata);

  return `
    <div class="claim-output-document" data-output-type="${outputType}">
      ${headerHtml}
      <div class="claim-output-content">
        <h2 class="claim-output-title">${escapeHtml(title)}</h2>
        ${contentHtml}
      </div>
      ${footerHtml}
    </div>
  `;
}

/**
 * Generate document header with claim information
 */
function generateHeaderHtml(claimInfo, metadata) {
  const insuredName = claimInfo.insuredName || 'N/A';
  const claimNumber = claimInfo.claimNumber || 'N/A';
  const carrier = claimInfo.carrier || 'N/A';
  const dateOfLoss = claimInfo.dateOfLoss 
    ? new Date(claimInfo.dateOfLoss).toLocaleDateString('en-US')
    : 'N/A';
  const generatedDate = new Date(metadata.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="claim-output-header">
      <div class="claim-output-header-row">
        <div class="claim-output-header-col">
          <strong>Insured:</strong> ${escapeHtml(insuredName)}
        </div>
        <div class="claim-output-header-col">
          <strong>Claim #:</strong> ${escapeHtml(claimNumber)}
        </div>
      </div>
      <div class="claim-output-header-row">
        <div class="claim-output-header-col">
          <strong>Carrier:</strong> ${escapeHtml(carrier)}
        </div>
        <div class="claim-output-header-col">
          <strong>Date of Loss:</strong> ${escapeHtml(dateOfLoss)}
        </div>
      </div>
      <div class="claim-output-header-row">
        <div class="claim-output-header-col">
          <strong>Generated:</strong> ${generatedDate}
        </div>
        <div class="claim-output-header-col">
          <strong>Tool:</strong> ${escapeHtml(metadata.toolName)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Wrap content based on output type
 */
function wrapContentByType(content, outputType) {
  switch (outputType) {
    case OutputTypes.LETTER:
    case OutputTypes.EMAIL:
      return `<div class="claim-output-letter">${formatLetterContent(content)}</div>`;
    
    case OutputTypes.CHECKLIST:
      return `<div class="claim-output-checklist">${formatChecklistContent(content)}</div>`;
    
    case OutputTypes.REPORT:
      return `<div class="claim-output-report">${formatReportContent(content)}</div>`;
    
    case OutputTypes.ANALYSIS:
    case OutputTypes.RESPONSE:
    case OutputTypes.STRATEGY:
    default:
      return `<div class="claim-output-analysis">${formatAnalysisContent(content)}</div>`;
  }
}

/**
 * Format letter/email content with proper structure
 */
function formatLetterContent(content) {
  // Preserve existing HTML structure or add paragraph tags
  if (content.includes('<p>') || content.includes('<div>')) {
    return content;
  }
  
  // Split by double newlines and wrap in paragraphs
  return content
    .split(/\n\n+/)
    .map(para => `<p>${escapeHtml(para.trim())}</p>`)
    .join('\n');
}

/**
 * Format checklist content
 */
function formatChecklistContent(content) {
  // If already HTML, return as-is
  if (content.includes('<ul>') || content.includes('<ol>')) {
    return content;
  }
  
  // Convert line items to checklist
  const lines = content.split('\n').filter(line => line.trim());
  const items = lines.map(line => {
    const cleaned = line.replace(/^[-*•]\s*/, '').trim();
    return `<li><input type="checkbox" disabled> ${escapeHtml(cleaned)}</li>`;
  });
  
  return `<ul class="claim-checklist">${items.join('\n')}</ul>`;
}

/**
 * Format report content with sections
 */
function formatReportContent(content) {
  // Preserve HTML or add basic structure
  if (content.includes('<h3>') || content.includes('<section>')) {
    return content;
  }
  
  return content
    .split(/\n\n+/)
    .map(para => `<p>${escapeHtml(para.trim())}</p>`)
    .join('\n');
}

/**
 * Format analysis content
 */
function formatAnalysisContent(content) {
  // Preserve HTML structure
  if (content.includes('<div>') || content.includes('<p>')) {
    return content;
  }
  
  // Add paragraph structure
  return content
    .split(/\n\n+/)
    .map(para => `<p>${escapeHtml(para.trim())}</p>`)
    .join('\n');
}

/**
 * Generate footer with watermark and disclaimer
 */
function generateFooterHtml(metadata) {
  return `
    <div class="claim-output-footer">
      <div class="claim-output-watermark">
        Claim Documentation — Not Legal Advice
      </div>
      <div class="claim-output-generator">
        Generated by Claim Navigator on ${new Date(metadata.timestamp).toLocaleDateString('en-US')}
      </div>
      <div class="claim-output-disclaimer">
        This document provides guidance and documentation support based on the information provided. 
        It does not replace professional legal or adjusting advice.
      </div>
    </div>
  `;
}

/**
 * Format as plain text for storage and export
 */
function formatAsPlainText(content, outputType, title, claimInfo, metadata) {
  const lines = [];
  
  // Header
  lines.push('='.repeat(80));
  lines.push(title);
  lines.push('='.repeat(80));
  lines.push('');
  
  // Claim info
  lines.push(`Insured: ${claimInfo.insuredName || 'N/A'}`);
  lines.push(`Claim #: ${claimInfo.claimNumber || 'N/A'}`);
  lines.push(`Carrier: ${claimInfo.carrier || 'N/A'}`);
  lines.push(`Date of Loss: ${claimInfo.dateOfLoss || 'N/A'}`);
  lines.push(`Generated: ${new Date(metadata.timestamp).toLocaleString('en-US')}`);
  lines.push(`Tool: ${metadata.toolName}`);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Content (strip HTML tags)
  const plainContent = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  lines.push(plainContent);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Footer
  lines.push('Generated by Claim Navigator');
  lines.push('Claim Documentation — Not Legal Advice');
  lines.push('');
  lines.push('This document provides guidance and documentation support based on the');
  lines.push('information provided. It does not replace professional legal or adjusting advice.');
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get entry type for journal based on output type
 */
export function getJournalEntryType(outputType) {
  const mapping = {
    [OutputTypes.ANALYSIS]: 'ai_analysis',
    [OutputTypes.LETTER]: 'ai_letter',
    [OutputTypes.EMAIL]: 'ai_letter',
    [OutputTypes.REPORT]: 'ai_document',
    [OutputTypes.CHECKLIST]: 'ai_document',
    [OutputTypes.RESPONSE]: 'ai_response',
    [OutputTypes.STRATEGY]: 'ai_strategy'
  };
  
  return mapping[outputType] || 'ai_analysis';
}



