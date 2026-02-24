/**
 * Expert-to-Estimate Crosswalk Engine
 * Maps expert report narrative scope to estimate line items
 * Deterministic category mapping and scope comparison
 */

const CATEGORY_KEYWORDS = {
  roofing: [
    'roof', 'roofing', 'shingle', 'shingles', 'ridge', 'valley', 'flashing', 
    'underlayment', 'decking', 'roof deck', 'eave', 'soffit', 'fascia', 
    'gutter', 'downspout', 'ridge vent', 'roof vent'
  ],
  siding: [
    'siding', 'exterior', 'cladding', 'lap siding', 'vinyl siding', 
    'fiber cement', 'hardie', 'exterior wall', 'sheathing'
  ],
  drywall: [
    'drywall', 'sheetrock', 'gypsum', 'wall', 'ceiling', 'interior wall',
    'wallboard', 'plaster'
  ],
  flooring: [
    'floor', 'flooring', 'carpet', 'hardwood', 'tile', 'vinyl', 'laminate',
    'subflooring', 'subfloor'
  ],
  hvac: [
    'hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'air handler',
    'condenser', 'ductwork', 'duct', 'ac unit', 'heat pump'
  ],
  electrical: [
    'electrical', 'electric', 'wiring', 'circuit', 'breaker', 'panel',
    'outlet', 'switch', 'fixture', 'service panel'
  ],
  plumbing: [
    'plumbing', 'pipe', 'piping', 'water heater', 'drain', 'supply line',
    'waste line', 'fixture', 'toilet', 'sink', 'faucet'
  ],
  foundation: [
    'foundation', 'slab', 'footing', 'pier', 'beam', 'structural',
    'load-bearing', 'support', 'concrete slab'
  ],
  water_mitigation: [
    'water extraction', 'drying', 'dehumidification', 'mitigation',
    'water removal', 'moisture removal', 'emergency services'
  ],
  mold_remediation: [
    'mold', 'mold remediation', 'mold removal', 'antimicrobial',
    'fungal growth', 'spore', 'remediation', 'containment'
  ]
};

const QUANTITY_PATTERNS = [
  { pattern: /(\d+(?:\.\d+)?)\s*%\s*(?:of)?\s*([a-z\s]+)/gi, type: 'percentage' },
  { pattern: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(SF|square feet|sq\.?\s*ft\.?)/gi, type: 'square_feet' },
  { pattern: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(LF|linear feet|lin\.?\s*ft\.?)/gi, type: 'linear_feet' },
  { pattern: /(\d+)\s*(room|bedroom|bathroom|area|zone)/gi, type: 'count' },
  { pattern: /entire|full|complete|whole/gi, type: 'full_scope' }
];

function crosswalkExpertToEstimate(expertReport, estimateLineItems) {
  const expertCategories = extractCategoriesFromNarrative(expertReport.narrative_data);
  
  const estimateCategories = categorizeEstimateItems(estimateLineItems);
  
  const missingLineItems = identifyMissingScope(expertCategories, estimateCategories);
  
  const quantityConflicts = identifyQuantityConflicts(expertReport, estimateLineItems);
  
  const scopeConflicts = identifyScopeConflicts(expertCategories, estimateCategories);
  
  return {
    expert_categories: expertCategories,
    estimate_categories: estimateCategories,
    missing_line_items: missingLineItems,
    quantity_conflicts: quantityConflicts,
    scope_conflicts: scopeConflicts,
    crosswalk_summary: {
      expert_scope_items: expertCategories.length,
      estimate_line_items: estimateLineItems.length,
      missing_items_count: missingLineItems.length,
      conflict_count: quantityConflicts.length + scopeConflicts.length
    }
  };
}

function extractCategoriesFromNarrative(narrativeData) {
  const categories = [];
  
  for (const sentenceObj of narrativeData.sentences) {
    const sentence = sentenceObj.text;
    const lowerSentence = sentence.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matchedKeywords = keywords.filter(keyword => 
        lowerSentence.includes(keyword)
      );
      
      if (matchedKeywords.length > 0) {
        const quantities = extractQuantitiesFromSentence(sentence);
        
        const existingCategory = categories.find(c => c.category === category);
        
        if (existingCategory) {
          existingCategory.mention_count++;
          existingCategory.sentences.push(sentence);
          if (quantities.length > 0) {
            existingCategory.quantities.push(...quantities);
          }
        } else {
          categories.push({
            category: category,
            mention_count: 1,
            sentences: [sentence],
            matched_keywords: matchedKeywords,
            quantities: quantities,
            has_quantification: quantities.length > 0
          });
        }
      }
    }
  }
  
  return categories;
}

function extractQuantitiesFromSentence(sentence) {
  const quantities = [];
  
  for (const quantPattern of QUANTITY_PATTERNS) {
    const matches = [...sentence.matchAll(quantPattern.pattern)];
    
    for (const match of matches) {
      if (quantPattern.type === 'percentage') {
        quantities.push({
          type: 'percentage',
          value: parseFloat(match[1]),
          scope: match[2] ? match[2].trim() : null,
          raw_text: match[0]
        });
      } else if (quantPattern.type === 'square_feet' || quantPattern.type === 'linear_feet') {
        quantities.push({
          type: quantPattern.type,
          value: parseFloat(match[1].replace(/,/g, '')),
          unit: match[2],
          raw_text: match[0]
        });
      } else if (quantPattern.type === 'count') {
        quantities.push({
          type: 'count',
          value: parseInt(match[1]),
          scope: match[2],
          raw_text: match[0]
        });
      } else if (quantPattern.type === 'full_scope') {
        quantities.push({
          type: 'full_replacement',
          value: 100,
          unit: '%',
          raw_text: match[0]
        });
      }
    }
  }
  
  return quantities;
}

function categorizeEstimateItems(lineItems) {
  const categories = {};
  
  for (const item of lineItems) {
    const category = item.category || 'Other';
    
    if (!categories[category]) {
      categories[category] = {
        category: category,
        line_items: [],
        total_value: 0,
        item_count: 0
      };
    }
    
    categories[category].line_items.push(item);
    categories[category].total_value += (item.rcv_total || item.total || 0);
    categories[category].item_count++;
  }
  
  return Object.values(categories);
}

function identifyMissingScope(expertCategories, estimateCategories) {
  const missingItems = [];
  
  const estimateCategoryNames = new Set(
    estimateCategories.map(c => c.category.toLowerCase())
  );
  
  for (const expertCat of expertCategories) {
    const expertCatName = expertCat.category.toLowerCase();
    
    const hasMatch = estimateCategoryNames.has(expertCatName) ||
                     estimateCategoryNames.has(mapCategoryName(expertCatName));
    
    if (!hasMatch && expertCat.mention_count >= 2) {
      missingItems.push({
        category: expertCat.category,
        expert_mentions: expertCat.mention_count,
        expert_sentences: expertCat.sentences,
        quantities: expertCat.quantities,
        severity: expertCat.has_quantification ? 'high' : 'medium',
        description: `Expert report mentions ${expertCat.category} (${expertCat.mention_count} times) but no corresponding line items found in estimate`
      });
    }
  }
  
  return missingItems;
}

function mapCategoryName(expertCategory) {
  const mapping = {
    'roofing': 'roof',
    'drywall': 'interior',
    'flooring': 'floor',
    'hvac': 'mechanical',
    'electrical': 'electric',
    'plumbing': 'mechanical',
    'foundation': 'structural',
    'water_mitigation': 'mitigation',
    'mold_remediation': 'remediation'
  };
  
  return mapping[expertCategory] || expertCategory;
}

function identifyQuantityConflicts(expertReport, estimateLineItems) {
  const conflicts = [];
  
  const expertMeasurements = expertReport.narrative_data.measurements;
  
  for (const measurement of expertMeasurements) {
    if (measurement.type === 'percentage' && measurement.scope) {
      const scope = measurement.scope.toLowerCase();
      
      const relatedCategory = Object.keys(CATEGORY_KEYWORDS).find(cat =>
        CATEGORY_KEYWORDS[cat].some(keyword => scope.includes(keyword))
      );
      
      if (relatedCategory) {
        const estimateItems = estimateLineItems.filter(item => {
          const itemCat = (item.category || '').toLowerCase();
          return itemCat.includes(relatedCategory) || 
                 relatedCategory.includes(itemCat) ||
                 itemCat === mapCategoryName(relatedCategory);
        });
        
        if (estimateItems.length > 0) {
          const expertPercent = measurement.value;
          
          conflicts.push({
            type: 'percentage_scope',
            category: relatedCategory,
            expert_value: `${expertPercent}%`,
            expert_context: measurement.context,
            estimate_items: estimateItems.length,
            description: `Expert indicates ${expertPercent}% of ${measurement.scope}, but estimate has ${estimateItems.length} line items in this category`,
            severity: 'medium'
          });
        }
      }
    }
    
    if (measurement.type === 'square_feet' || measurement.type === 'linear_feet') {
      const context = measurement.context.toLowerCase();
      
      const relatedCategory = Object.keys(CATEGORY_KEYWORDS).find(cat =>
        CATEGORY_KEYWORDS[cat].some(keyword => context.includes(keyword))
      );
      
      if (relatedCategory) {
        const estimateItems = estimateLineItems.filter(item => {
          const itemCat = (item.category || '').toLowerCase();
          return itemCat.includes(relatedCategory);
        });
        
        const estimateTotal = estimateItems.reduce((sum, item) => {
          if (item.unit === 'SF' || item.unit === 'LF') {
            return sum + (item.quantity || 0);
          }
          return sum;
        }, 0);
        
        if (estimateTotal > 0) {
          const expertValue = parseFloat(measurement.value);
          const difference = Math.abs(expertValue - estimateTotal);
          const percentDiff = (difference / expertValue * 100).toFixed(1);
          
          if (difference > expertValue * 0.2) {
            conflicts.push({
              type: 'quantity_measurement',
              category: relatedCategory,
              expert_value: `${expertValue} ${measurement.unit}`,
              estimate_value: `${estimateTotal} ${measurement.unit}`,
              difference: difference,
              percent_difference: percentDiff,
              expert_context: measurement.context,
              severity: percentDiff > 50 ? 'high' : 'medium'
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

function identifyScopeConflicts(expertCategories, estimateCategories) {
  const conflicts = [];
  
  for (const expertCat of expertCategories) {
    const expertCatName = expertCat.category.toLowerCase();
    
    const matchingEstimateCat = estimateCategories.find(estCat => {
      const estCatName = estCat.category.toLowerCase();
      return estCatName.includes(expertCatName) || 
             expertCatName.includes(estCatName) ||
             estCatName === mapCategoryName(expertCatName);
    });
    
    if (matchingEstimateCat) {
      const hasFullReplacement = expertCat.quantities.some(q => 
        q.type === 'full_replacement' || 
        (q.type === 'percentage' && q.value >= 80)
      );
      
      if (hasFullReplacement && matchingEstimateCat.item_count < 3) {
        conflicts.push({
          type: 'scope_extent',
          category: expertCat.category,
          expert_scope: 'full replacement recommended',
          estimate_scope: `${matchingEstimateCat.item_count} line items`,
          expert_sentences: expertCat.sentences,
          severity: 'high',
          description: `Expert recommends full ${expertCat.category} replacement but estimate has minimal scope`
        });
      }
    }
  }
  
  return conflicts;
}

function mapExpertScopeToCategories(expertReport) {
  const recommendations = expertReport.extracted_recommendations || [];
  const conclusions = expertReport.extracted_conclusions || [];
  
  const scopeItems = [];
  
  for (const rec of recommendations) {
    const recText = rec.recommendation || rec.sentence;
    const lowerText = recText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matched = keywords.some(keyword => lowerText.includes(keyword));
      
      if (matched) {
        const quantities = extractQuantitiesFromSentence(recText);
        
        scopeItems.push({
          category: category,
          source: 'recommendation',
          text: recText,
          priority: rec.priority || 'medium',
          quantities: quantities
        });
      }
    }
  }
  
  for (const conclusion of conclusions) {
    const conclusionText = conclusion.sentence;
    const lowerText = conclusionText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matched = keywords.some(keyword => lowerText.includes(keyword));
      
      if (matched) {
        const quantities = extractQuantitiesFromSentence(conclusionText);
        
        scopeItems.push({
          category: category,
          source: 'conclusion',
          text: conclusionText,
          quantities: quantities
        });
      }
    }
  }
  
  return scopeItems;
}

function extractQuantitiesFromSentence(sentence) {
  const quantities = [];
  
  const percentagePattern = /(\d+(?:\.\d+)?)\s*%/g;
  const percentageMatches = [...sentence.matchAll(percentagePattern)];
  for (const match of percentageMatches) {
    quantities.push({
      type: 'percentage',
      value: parseFloat(match[1]),
      unit: '%',
      raw_text: match[0]
    });
  }
  
  const sfPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:SF|square feet|sq\.?\s*ft\.?)/gi;
  const sfMatches = [...sentence.matchAll(sfPattern)];
  for (const match of sfMatches) {
    quantities.push({
      type: 'square_feet',
      value: parseFloat(match[1].replace(/,/g, '')),
      unit: 'SF',
      raw_text: match[0]
    });
  }
  
  const lfPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:LF|linear feet|lin\.?\s*ft\.?)/gi;
  const lfMatches = [...sentence.matchAll(lfPattern)];
  for (const match of lfMatches) {
    quantities.push({
      type: 'linear_feet',
      value: parseFloat(match[1].replace(/,/g, '')),
      unit: 'LF',
      raw_text: match[0]
    });
  }
  
  const fullScopePattern = /\b(entire|full|complete|whole|total)\b/gi;
  if (fullScopePattern.test(sentence)) {
    quantities.push({
      type: 'full_replacement',
      value: 100,
      unit: '%',
      raw_text: 'full replacement'
    });
  }
  
  return quantities;
}

function compareExpertToEstimateScope(expertReport, contractorLineItems, carrierLineItems) {
  const expertScope = mapExpertScopeToCategories(expertReport);
  
  const contractorCrosswalk = crosswalkExpertToEstimate(
    { narrative_data: expertReport.narrative_data, extracted_recommendations: expertReport.extracted_recommendations, extracted_conclusions: expertReport.extracted_conclusions },
    contractorLineItems
  );
  
  const carrierCrosswalk = crosswalkExpertToEstimate(
    { narrative_data: expertReport.narrative_data, extracted_recommendations: expertReport.extracted_recommendations, extracted_conclusions: expertReport.extracted_conclusions },
    carrierLineItems
  );
  
  const expertSupportsContractor = analyzeAlignment(expertScope, contractorLineItems);
  const expertSupportsCarrier = analyzeAlignment(expertScope, carrierLineItems);
  
  return {
    expert_scope: expertScope,
    contractor_alignment: {
      crosswalk: contractorCrosswalk,
      alignment_score: expertSupportsContractor
    },
    carrier_alignment: {
      crosswalk: carrierCrosswalk,
      alignment_score: expertSupportsCarrier
    },
    alignment_summary: {
      favors: expertSupportsContractor > expertSupportsCarrier ? 'contractor' : 
              expertSupportsCarrier > expertSupportsContractor ? 'carrier' : 'neutral',
      contractor_score: expertSupportsContractor,
      carrier_score: expertSupportsCarrier
    }
  };
}

function analyzeAlignment(expertScope, estimateLineItems) {
  let alignmentScore = 0;
  let totalChecks = 0;
  
  for (const scopeItem of expertScope) {
    const category = scopeItem.category;
    
    const matchingItems = estimateLineItems.filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      return itemCat.includes(category) || category.includes(itemCat);
    });
    
    totalChecks++;
    
    if (matchingItems.length > 0) {
      alignmentScore++;
      
      if (scopeItem.quantities.length > 0) {
        const hasFullReplacement = scopeItem.quantities.some(q => 
          q.type === 'full_replacement' || (q.type === 'percentage' && q.value >= 80)
        );
        
        if (hasFullReplacement && matchingItems.length >= 3) {
          alignmentScore += 0.5;
        }
      }
    }
  }
  
  return totalChecks > 0 ? alignmentScore / totalChecks : 0;
}

module.exports = {
  crosswalkExpertToEstimate,
  extractCategoriesFromNarrative,
  mapExpertScopeToCategories,
  compareExpertToEstimateScope,
  identifyQuantityConflicts,
  identifyScopeConflicts
};
