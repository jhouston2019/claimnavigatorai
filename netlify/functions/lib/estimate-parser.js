/**
 * Estimate Parser - Deterministic PDF-to-Structured-Data Engine
 * Commercial-grade line item extraction with regex
 */

/**
 * Parse estimate PDF text into structured line items
 * @param {string} pdfText - Raw text from PDF
 * @param {string} estimateType - 'contractor' or 'carrier'
 * @returns {object} { lineItems: [], metadata: {} }
 */
function parseEstimate(pdfText, estimateType) {
  const startTime = Date.now();
  
  // Split into lines
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const lineItems = [];
  const metadata = {
    estimate_type: estimateType,
    total_lines_parsed: 0,
    lines_with_quantities: 0,
    lines_with_prices: 0,
    parse_success_rate: 0
  };
  
  let lineNumber = 0;
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line || line.length < 3) continue;
    
    // Detect section headers
    const sectionMatch = detectSection(line);
    if (sectionMatch) {
      currentSection = sectionMatch;
      continue;
    }
    
    // Try to parse as line item
    const parsed = parseLineItem(line, lineNumber, currentSection);
    
    if (parsed) {
      lineNumber++;
      lineItems.push(parsed);
      metadata.total_lines_parsed++;
      
      if (parsed.quantity) metadata.lines_with_quantities++;
      if (parsed.unit_price) metadata.lines_with_prices++;
    }
  }
  
  // Calculate parse success rate
  metadata.parse_success_rate = metadata.total_lines_parsed > 0
    ? ((metadata.lines_with_quantities / metadata.total_lines_parsed) * 100).toFixed(2)
    : 0;
  
  // Extract estimate metadata
  const estimateMetadata = extractEstimateMetadata(pdfText);
  Object.assign(metadata, estimateMetadata);
  
  const duration = Date.now() - startTime;
  
  return {
    lineItems,
    metadata: {
      ...metadata,
      parsing_duration_ms: duration
    }
  };
}

/**
 * Parse a single line into structured data
 * @param {string} line - Line text
 * @param {number} lineNumber - Line number
 * @param {string} section - Current section
 * @returns {object|null} Parsed line item or null
 */
function parseLineItem(line, lineNumber, section) {
  // Check if this is a total/subtotal line
  if (isTotalLine(line)) {
    return parseTotalLine(line, lineNumber, section);
  }
  
  // Try multiple parsing strategies
  const strategies = [
    parseStandardFormat,      // "Description  10 SF  $5.00  $50.00"
    parseXactimateFormat,     // "RCV  10.00 SF  $5.00  $50.00"
    parseTabularFormat,       // "Description\t10\tSF\t$5.00\t$50.00"
    parseCompactFormat        // "Description 10SF @$5.00 = $50.00"
  ];
  
  for (const strategy of strategies) {
    const result = strategy(line, lineNumber, section);
    if (result && result.total) {
      return result;
    }
  }
  
  return null;
}

/**
 * Standard format parser
 * Format: "Description  Qty Unit  $UnitPrice  $Total"
 */
function parseStandardFormat(line, lineNumber, section) {
  // Regex patterns
  const patterns = {
    // Match: "Tear off shingles  25 SQ  $3.50  $87.50"
    standard: /^(.+?)\s+(\d+(?:\.\d{1,2})?)\s+([A-Z]{1,4})\s+\$?([\d,]+(?:\.\d{2})?)\s+\$?([\d,]+(?:\.\d{2})?)$/i,
    
    // Match: "Labor - Framing  40 HR  $45.00  $1,800.00"
    withDash: /^(.+?)\s*[-–]\s*(.+?)\s+(\d+(?:\.\d{1,2})?)\s+([A-Z]{1,4})\s+\$?([\d,]+(?:\.\d{2})?)\s+\$?([\d,]+(?:\.\d{2})?)$/i,
    
    // Match: "2x4 Studs (qty: 100 EA @ $3.50 = $350.00)"
    withParens: /^(.+?)\s*\(.*?(\d+(?:\.\d{1,2})?)\s+([A-Z]{1,4})\s*@?\s*\$?([\d,]+(?:\.\d{2})?)\s*=?\s*\$?([\d,]+(?:\.\d{2})?)\)$/i
  };
  
  for (const [name, pattern] of Object.entries(patterns)) {
    const match = line.match(pattern);
    if (match) {
      const description = match[1].trim();
      const quantity = parseFloat(match[match.length - 4]);
      const unit = match[match.length - 3].toUpperCase();
      const unitPrice = parseFloat(match[match.length - 2].replace(/,/g, ''));
      const total = parseFloat(match[match.length - 1].replace(/,/g, ''));
      
      // Validate: total should equal quantity * unitPrice (within 1% tolerance)
      const expectedTotal = quantity * unitPrice;
      const tolerance = expectedTotal * 0.01;
      
      if (Math.abs(total - expectedTotal) <= tolerance) {
        return {
          line_number: lineNumber,
          section: section,
          category: categorizeLineItem(description, unit),
          description: description,
          description_normalized: normalizeDescription(description),
          quantity: quantity,
          unit: unit,
          unit_price: unitPrice,
          total: total,
          raw_line_text: line,
          confidence_score: 0.95,
          parsed_by: 'regex',
          is_tax: false,
          is_subtotal: false,
          is_total: false
        };
      }
    }
  }
  
  return null;
}

/**
 * Xactimate format parser
 * Format: "RCV  Qty Unit  $UnitPrice  $Total"
 */
function parseXactimateFormat(line, lineNumber, section) {
  const pattern = /^(RCV|ACV|O&P|Tax)?\s*(.+?)\s+(\d+(?:\.\d{1,2})?)\s+([A-Z]{1,4})\s+\$?([\d,]+(?:\.\d{2})?)\s+\$?([\d,]+(?:\.\d{2})?)$/i;
  
  const match = line.match(pattern);
  if (match) {
    const prefix = match[1] || '';
    const description = match[2].trim();
    const quantity = parseFloat(match[3]);
    const unit = match[4].toUpperCase();
    const unitPrice = parseFloat(match[5].replace(/,/g, ''));
    const total = parseFloat(match[6].replace(/,/g, ''));
    
    return {
      line_number: lineNumber,
      section: section,
      category: categorizeLineItem(description, unit),
      description: `${prefix} ${description}`.trim(),
      description_normalized: normalizeDescription(description),
      quantity: quantity,
      unit: unit,
      unit_price: unitPrice,
      total: total,
      raw_line_text: line,
      confidence_score: 0.90,
      parsed_by: 'regex',
      is_tax: prefix.toLowerCase() === 'tax',
      is_subtotal: false,
      is_total: false
    };
  }
  
  return null;
}

/**
 * Tabular format parser (tab-separated)
 */
function parseTabularFormat(line, lineNumber, section) {
  const parts = line.split('\t').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length >= 4) {
    const description = parts[0];
    const quantity = parseFloat(parts[1]);
    const unit = parts[2].toUpperCase();
    const unitPrice = parseFloat(parts[3].replace(/[$,]/g, ''));
    const total = parts.length >= 5 
      ? parseFloat(parts[4].replace(/[$,]/g, ''))
      : quantity * unitPrice;
    
    if (!isNaN(quantity) && !isNaN(unitPrice) && !isNaN(total)) {
      return {
        line_number: lineNumber,
        section: section,
        category: categorizeLineItem(description, unit),
        description: description,
        description_normalized: normalizeDescription(description),
        quantity: quantity,
        unit: unit,
        unit_price: unitPrice,
        total: total,
        raw_line_text: line,
        confidence_score: 0.85,
        parsed_by: 'regex',
        is_tax: false,
        is_subtotal: false,
        is_total: false
      };
    }
  }
  
  return null;
}

/**
 * Compact format parser
 * Format: "Description QtyUnit @$Price = $Total"
 */
function parseCompactFormat(line, lineNumber, section) {
  const pattern = /^(.+?)\s+(\d+(?:\.\d{1,2})?)([A-Z]{1,4})\s*@?\s*\$?([\d,]+(?:\.\d{2})?)\s*=?\s*\$?([\d,]+(?:\.\d{2})?)$/i;
  
  const match = line.match(pattern);
  if (match) {
    const description = match[1].trim();
    const quantity = parseFloat(match[2]);
    const unit = match[3].toUpperCase();
    const unitPrice = parseFloat(match[4].replace(/,/g, ''));
    const total = parseFloat(match[5].replace(/,/g, ''));
    
    return {
      line_number: lineNumber,
      section: section,
      category: categorizeLineItem(description, unit),
      description: description,
      description_normalized: normalizeDescription(description),
      quantity: quantity,
      unit: unit,
      unit_price: unitPrice,
      total: total,
      raw_line_text: line,
      confidence_score: 0.80,
      parsed_by: 'regex',
      is_tax: false,
      is_subtotal: false,
      is_total: false
    };
  }
  
  return null;
}

/**
 * Parse total/subtotal lines
 */
function parseTotalLine(line, lineNumber, section) {
  const patterns = {
    subtotal: /subtotal[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    tax: /tax[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    total: /total[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    grandTotal: /grand\s+total[:\s]*\$?([\d,]+(?:\.\d{2})?)/i
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const match = line.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      
      return {
        line_number: lineNumber,
        section: section,
        category: type,
        description: line,
        description_normalized: normalizeDescription(line),
        quantity: null,
        unit: null,
        unit_price: null,
        total: amount,
        raw_line_text: line,
        confidence_score: 1.00,
        parsed_by: 'regex',
        is_tax: type === 'tax',
        is_subtotal: type === 'subtotal',
        is_total: type === 'total' || type === 'grandTotal'
      };
    }
  }
  
  return null;
}

/**
 * Check if line is a total/subtotal
 */
function isTotalLine(line) {
  const totalKeywords = ['subtotal', 'tax', 'total', 'grand total', 'sum', 'amount due'];
  const lowerLine = line.toLowerCase();
  return totalKeywords.some(keyword => lowerLine.includes(keyword));
}

/**
 * Detect section headers
 */
function detectSection(line) {
  const sectionPatterns = [
    /^(roofing|roof)/i,
    /^(siding|exterior)/i,
    /^(interior|drywall|painting)/i,
    /^(electrical|electric)/i,
    /^(plumbing|hvac)/i,
    /^(framing|carpentry|structural)/i,
    /^(flooring|tile|carpet)/i,
    /^(windows|doors)/i,
    /^(foundation|concrete)/i,
    /^(demolition|demo|tear[- ]?out)/i,
    /^(labor|materials|equipment)/i
  ];
  
  for (const pattern of sectionPatterns) {
    if (pattern.test(line)) {
      return line.trim();
    }
  }
  
  return null;
}

/**
 * Categorize line item based on description and unit
 */
function categorizeLineItem(description, unit) {
  const desc = description.toLowerCase();
  
  // Labor indicators
  if (desc.includes('labor') || desc.includes('install') || unit === 'HR') {
    return 'Labor';
  }
  
  // Material indicators
  if (desc.includes('material') || desc.includes('supply') || 
      ['EA', 'PC', 'LF', 'SF', 'SQ'].includes(unit)) {
    return 'Materials';
  }
  
  // Equipment indicators
  if (desc.includes('equipment') || desc.includes('rental') || desc.includes('tool')) {
    return 'Equipment';
  }
  
  // Specific categories
  if (desc.includes('roof') || desc.includes('shingle')) return 'Roofing';
  if (desc.includes('siding') || desc.includes('exterior')) return 'Siding';
  if (desc.includes('drywall') || desc.includes('paint')) return 'Interior';
  if (desc.includes('electric') || desc.includes('wiring')) return 'Electrical';
  if (desc.includes('plumb') || desc.includes('hvac')) return 'Plumbing/HVAC';
  if (desc.includes('floor') || desc.includes('carpet') || desc.includes('tile')) return 'Flooring';
  if (desc.includes('window') || desc.includes('door')) return 'Windows/Doors';
  if (desc.includes('demo') || desc.includes('tear') || desc.includes('remove')) return 'Demolition';
  
  return 'Other';
}

/**
 * Normalize description for matching
 */
function normalizeDescription(description) {
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Extract estimate metadata from PDF text
 */
function extractEstimateMetadata(pdfText) {
  const metadata = {};
  
  // Extract estimate number
  const estimateNumMatch = pdfText.match(/estimate\s*#?\s*:?\s*(\d+[-\w]*)/i);
  if (estimateNumMatch) {
    metadata.estimate_number = estimateNumMatch[1];
  }
  
  // Extract date
  const dateMatch = pdfText.match(/date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    metadata.estimate_date = dateMatch[1];
  }
  
  // Extract estimator name
  const estimatorMatch = pdfText.match(/(?:prepared by|estimator|by)\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (estimatorMatch) {
    metadata.estimator_name = estimatorMatch[1];
  }
  
  // Extract company name
  const companyMatch = pdfText.match(/^([A-Z][A-Za-z\s&,\.]+(?:LLC|Inc|Corp|Company|Contractors?))/m);
  if (companyMatch) {
    metadata.estimator_company = companyMatch[1].trim();
  }
  
  return metadata;
}

module.exports = {
  parseEstimate,
  parseLineItem,
  normalizeDescription,
  categorizeLineItem
};
