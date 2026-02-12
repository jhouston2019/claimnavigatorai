/**
 * Supplement Formatter
 * Converts structured supplement data to professional document
 * DETERMINISTIC TEMPLATE - AI only polishes language if requested
 */

/**
 * Format supplement as HTML
 * @param {object} supplementData - Structured supplement from builder
 * @returns {string} HTML document
 */
function formatSupplementHTML(supplementData) {
  const { claim_info, totals, sections } = supplementData;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Supplement Request - Claim ${claim_info.claim_number}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 24px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      margin-top: 15px;
    }
    .header-label {
      font-weight: bold;
      color: #555;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .category-section {
      margin: 25px 0;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #e74c3c;
    }
    .category-title {
      font-size: 16px;
      font-weight: bold;
      color: #e74c3c;
      margin-bottom: 15px;
    }
    .category-total {
      font-size: 20px;
      font-weight: bold;
      color: #c0392b;
    }
    .discrepancy-item {
      margin: 15px 0;
      padding: 15px;
      background: white;
      border-left: 3px solid #3498db;
    }
    .discrepancy-type {
      font-weight: bold;
      color: #3498db;
      margin-bottom: 5px;
    }
    .discrepancy-note {
      color: #555;
      font-size: 14px;
      margin: 5px 0;
    }
    .discrepancy-delta {
      font-weight: bold;
      color: #e74c3c;
      font-size: 16px;
    }
    .op-section, .depreciation-section {
      margin: 25px 0;
      padding: 20px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    .summary-section {
      margin: 40px 0;
      padding: 25px;
      background: #e8f5e9;
      border: 2px solid #4caf50;
    }
    .summary-title {
      font-size: 20px;
      font-weight: bold;
      color: #2e7d32;
      margin-bottom: 20px;
    }
    .summary-breakdown {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin: 15px 0;
    }
    .summary-label {
      font-weight: 500;
    }
    .summary-amount {
      font-weight: bold;
      text-align: right;
    }
    .total-request {
      font-size: 24px;
      font-weight: bold;
      color: #1b5e20;
      text-align: right;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #4caf50;
    }
    .closing {
      margin: 30px 0;
      font-style: italic;
      color: #555;
    }
    .signature {
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${sections.header.subject}</h1>
    <div class="header-info">
      <div class="header-label">Carrier:</div>
      <div>${sections.header.carrier}</div>
      <div class="header-label">Date of Loss:</div>
      <div>${sections.header.loss_date}</div>
      <div class="header-label">Adjuster:</div>
      <div>${sections.header.adjuster}</div>
      <div class="header-label">Date:</div>
      <div>${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Introduction</div>
    <p>${sections.introduction.text}</p>
  </div>

  ${formatCategorySections(sections.categories)}

  ${sections.op_section ? formatOPSection(sections.op_section) : ''}

  ${sections.depreciation_section ? formatDepreciationSection(sections.depreciation_section) : ''}

  <div class="summary-section">
    <div class="summary-title">Summary of Supplement Request</div>
    <div class="summary-breakdown">
      <div class="summary-label">Scope Discrepancies:</div>
      <div class="summary-amount">$${formatCurrency(sections.summary.breakdown.scope_discrepancies)}</div>
      ${sections.summary.breakdown.op_gap > 0 ? `
        <div class="summary-label">Overhead & Profit Gap:</div>
        <div class="summary-amount">$${formatCurrency(sections.summary.breakdown.op_gap)}</div>
      ` : ''}
      ${sections.summary.breakdown.depreciation_adjustment > 0 ? `
        <div class="summary-label">Depreciation Adjustment:</div>
        <div class="summary-amount">$${formatCurrency(sections.summary.breakdown.depreciation_adjustment)}</div>
      ` : ''}
    </div>
    <div class="total-request">
      Total Supplement Requested: $${formatCurrency(sections.summary.total_supplement_requested)}
    </div>
  </div>

  <div class="closing">
    <p>${sections.summary.closing}</p>
  </div>

  <div class="signature">
    <p>Respectfully,</p>
    <p><strong>${claim_info.policyholder_name}</strong></p>
  </div>
</body>
</html>
  `;
}

/**
 * Format category sections
 */
function formatCategorySections(categories) {
  return categories.map(cat => `
    <div class="category-section">
      <div class="category-title">
        ${cat.category_name} — <span class="category-total">$${formatCurrency(cat.total_underpayment)} Underpayment</span>
      </div>
      ${cat.items.map(item => `
        <div class="discrepancy-item">
          <div class="discrepancy-type">${formatDiscrepancyType(item.type)}</div>
          <div class="discrepancy-note">
            <strong>${item.description}</strong><br>
            ${item.carrier_line}<br>
            ${item.note}
          </div>
          <div class="discrepancy-delta">Delta: $${formatCurrency(item.delta)}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

/**
 * Format O&P section
 */
function formatOPSection(opSection) {
  return `
    <div class="op-section">
      <div class="section-title">${opSection.title} — $${formatCurrency(opSection.amount)}</div>
      <p>${opSection.description}</p>
    </div>
  `;
}

/**
 * Format depreciation section
 */
function formatDepreciationSection(depSection) {
  return `
    <div class="depreciation-section">
      <div class="section-title">${depSection.title} — $${formatCurrency(depSection.amount)}</div>
      <p>${depSection.description}</p>
    </div>
  `;
}

/**
 * Format discrepancy type
 */
function formatDiscrepancyType(type) {
  const types = {
    'missing_scope': '• Missing Scope',
    'quantity_understated': '• Quantity Understated',
    'unit_price_below_market': '• Unit Price Below Market',
    'scope_variation': '• Scope Variation'
  };
  return types[type] || '• Discrepancy';
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format supplement as plain text
 * @param {object} supplementData 
 * @returns {string}
 */
function formatSupplementText(supplementData) {
  const { claim_info, totals, sections } = supplementData;
  
  let text = '';
  
  // Header
  text += `${sections.header.subject}\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `Carrier: ${sections.header.carrier}\n`;
  text += `Date of Loss: ${sections.header.loss_date}\n`;
  text += `Adjuster: ${sections.header.adjuster}\n`;
  text += `Date: ${new Date().toLocaleDateString()}\n\n`;
  
  // Introduction
  text += `INTRODUCTION\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `${sections.introduction.text}\n\n`;
  
  // Categories
  for (const cat of sections.categories) {
    text += `\n${cat.category_name.toUpperCase()} — $${formatCurrency(cat.total_underpayment)} UNDERPAYMENT\n`;
    text += `${'-'.repeat(60)}\n\n`;
    
    for (const item of cat.items) {
      text += `${formatDiscrepancyType(item.type)}\n`;
      text += `  ${item.description}\n`;
      text += `  ${item.carrier_line}\n`;
      text += `  ${item.note}\n`;
      text += `  Delta: $${formatCurrency(item.delta)}\n\n`;
    }
  }
  
  // O&P
  if (sections.op_section) {
    text += `\n${sections.op_section.title.toUpperCase()} — $${formatCurrency(sections.op_section.amount)}\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `${sections.op_section.description}\n\n`;
  }
  
  // Depreciation
  if (sections.depreciation_section) {
    text += `\n${sections.depreciation_section.title.toUpperCase()} — $${formatCurrency(sections.depreciation_section.amount)}\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `${sections.depreciation_section.description}\n\n`;
  }
  
  // Summary
  text += `\nSUMMARY OF SUPPLEMENT REQUEST\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `Scope Discrepancies: $${formatCurrency(sections.summary.breakdown.scope_discrepancies)}\n`;
  if (sections.summary.breakdown.op_gap > 0) {
    text += `Overhead & Profit Gap: $${formatCurrency(sections.summary.breakdown.op_gap)}\n`;
  }
  if (sections.summary.breakdown.depreciation_adjustment > 0) {
    text += `Depreciation Adjustment: $${formatCurrency(sections.summary.breakdown.depreciation_adjustment)}\n`;
  }
  text += `\nTOTAL SUPPLEMENT REQUESTED: $${formatCurrency(sections.summary.total_supplement_requested)}\n\n`;
  
  // Closing
  text += `${sections.summary.closing}\n\n`;
  
  // Signature
  text += `Respectfully,\n`;
  text += `${claim_info.policyholder_name}\n`;
  
  return text;
}

/**
 * Optional: AI polish for language (NUMBERS STAY UNCHANGED)
 * @param {string} text - Formatted text
 * @param {object} openaiClient 
 * @returns {string}
 */
async function polishWithAI(text, openaiClient) {
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional insurance supplement writer. Polish the language for professionalism and clarity. DO NOT modify any numbers, dollar amounts, or calculations. Return only the polished text.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI polish failed:', error);
    return text; // Return original if AI fails
  }
}

module.exports = {
  formatSupplementHTML,
  formatSupplementText,
  polishWithAI
};
