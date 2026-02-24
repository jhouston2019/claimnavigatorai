/**
 * Contradiction Detection Engine
 * Compares multiple expert reports for conflicting statements
 * Deterministic conflict detection based on extracted data
 */

function detectContradictions(expertReports) {
  if (expertReports.length < 2) {
    return {
      contradictions: [],
      report_count: expertReports.length,
      has_conflicts: false
    };
  }
  
  const contradictions = [];
  
  for (let i = 0; i < expertReports.length; i++) {
    for (let j = i + 1; j < expertReports.length; j++) {
      const report1 = expertReports[i];
      const report2 = expertReports[j];
      
      const causationConflicts = detectCausationConflicts(report1, report2);
      contradictions.push(...causationConflicts);
      
      const measurementConflicts = detectMeasurementConflicts(report1, report2);
      contradictions.push(...measurementConflicts);
      
      const scopeConflicts = detectScopeConflicts(report1, report2);
      contradictions.push(...scopeConflicts);
      
      const timelineConflicts = detectTimelineConflicts(report1, report2);
      contradictions.push(...timelineConflicts);
    }
  }
  
  return {
    contradictions: contradictions,
    report_count: expertReports.length,
    has_conflicts: contradictions.length > 0,
    conflict_count: contradictions.length,
    critical_conflicts: contradictions.filter(c => c.severity === 'critical').length
  };
}

function detectCausationConflicts(report1, report2) {
  const conflicts = [];
  
  const opinion1 = report1.causation_opinion;
  const opinion2 = report2.causation_opinion;
  
  if (opinion1 === 'not_stated' || opinion2 === 'not_stated') {
    return conflicts;
  }
  
  if ((opinion1 === 'covered' && opinion2 === 'not_covered') ||
      (opinion1 === 'not_covered' && opinion2 === 'covered')) {
    
    const statement1 = getCausationStatement(report1);
    const statement2 = getCausationStatement(report2);
    
    conflicts.push({
      contradiction_type: 'causation_conflict',
      severity: 'critical',
      report_1_id: report1.id,
      report_1_type: report1.report_type,
      report_1_expert: report1.expert_name,
      report_1_opinion: opinion1,
      report_1_statement: statement1,
      report_2_id: report2.id,
      report_2_type: report2.report_type,
      report_2_expert: report2.expert_name,
      report_2_opinion: opinion2,
      report_2_statement: statement2,
      conflict_description: `${report1.expert_name || 'Expert 1'} concludes ${opinion1}, but ${report2.expert_name || 'Expert 2'} concludes ${opinion2}`
    });
  }
  
  return conflicts;
}

function getCausationStatement(report) {
  const causationStatements = report.causation_statements || [];
  
  if (causationStatements.length === 0) {
    return 'No explicit causation statement';
  }
  
  const primaryStatement = causationStatements.find(s => s.opinion === report.causation_opinion);
  
  if (primaryStatement) {
    return primaryStatement.sentence;
  }
  
  return causationStatements[0].sentence;
}

function detectMeasurementConflicts(report1, report2) {
  const conflicts = [];
  
  const measurements1 = report1.extracted_measurements || [];
  const measurements2 = report2.extracted_measurements || [];
  
  for (const m1 of measurements1) {
    for (const m2 of measurements2) {
      if (m1.type === m2.type && m1.unit === m2.unit) {
        const contextSimilarity = calculateContextSimilarity(m1.context, m2.context);
        
        if (contextSimilarity > 0.5) {
          const value1 = parseFloat(m1.value);
          const value2 = parseFloat(m2.value);
          
          const difference = Math.abs(value1 - value2);
          const percentDiff = value1 > 0 ? (difference / value1 * 100) : 0;
          
          if (percentDiff > 25) {
            conflicts.push({
              contradiction_type: 'measurement_conflict',
              severity: percentDiff > 50 ? 'high' : 'medium',
              report_1_id: report1.id,
              report_1_expert: report1.expert_name,
              report_1_statement: `${value1} ${m1.unit} - ${m1.context}`,
              report_2_id: report2.id,
              report_2_expert: report2.expert_name,
              report_2_statement: `${value2} ${m2.unit} - ${m2.context}`,
              measurement_type: m1.type,
              value_1: value1,
              value_2: value2,
              difference: difference,
              percent_difference: percentDiff.toFixed(1),
              conflict_description: `Measurement conflict: ${value1} ${m1.unit} vs ${value2} ${m2.unit} (${percentDiff.toFixed(1)}% difference)`
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

function calculateContextSimilarity(context1, context2) {
  if (!context1 || !context2) {
    return 0;
  }
  
  const words1 = context1.toLowerCase().split(/\s+/);
  const words2 = context2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function detectScopeConflicts(report1, report2) {
  const conflicts = [];
  
  const recommendations1 = report1.extracted_recommendations || [];
  const recommendations2 = report2.extracted_recommendations || [];
  
  const scope1 = extractScopeKeywords(recommendations1);
  const scope2 = extractScopeKeywords(recommendations2);
  
  for (const [category, data1] of Object.entries(scope1)) {
    if (scope2[category]) {
      const data2 = scope2[category];
      
      const hasFullReplacement1 = data1.keywords.some(k => 
        /full|complete|entire|total|replace|replacement/i.test(k)
      );
      const hasFullReplacement2 = data2.keywords.some(k => 
        /full|complete|entire|total|replace|replacement/i.test(k)
      );
      
      const hasRepair1 = data1.keywords.some(k => 
        /repair|patch|fix|restore/i.test(k)
      );
      const hasRepair2 = data2.keywords.some(k => 
        /repair|patch|fix|restore/i.test(k)
      );
      
      if ((hasFullReplacement1 && hasRepair2) || (hasRepair1 && hasFullReplacement2)) {
        conflicts.push({
          contradiction_type: 'recommendation_conflict',
          severity: 'high',
          report_1_id: report1.id,
          report_1_expert: report1.expert_name,
          report_1_statement: data1.sentences[0],
          report_2_id: report2.id,
          report_2_expert: report2.expert_name,
          report_2_statement: data2.sentences[0],
          category: category,
          conflict_description: `Scope conflict for ${category}: one expert recommends replacement, other recommends repair`
        });
      }
    }
  }
  
  return conflicts;
}

function extractScopeKeywords(recommendations) {
  const scopeByCategory = {};
  
  for (const rec of recommendations) {
    const recText = rec.recommendation || rec.sentence || '';
    const lowerText = recText.toLowerCase();
    
    for (const category of ['roofing', 'siding', 'drywall', 'flooring', 'hvac', 'electrical', 'plumbing', 'foundation']) {
      if (lowerText.includes(category) || lowerText.includes(category.replace('ing', ''))) {
        if (!scopeByCategory[category]) {
          scopeByCategory[category] = {
            keywords: [],
            sentences: []
          };
        }
        
        const words = recText.split(/\s+/);
        scopeByCategory[category].keywords.push(...words);
        scopeByCategory[category].sentences.push(recText);
      }
    }
  }
  
  return scopeByCategory;
}

function detectTimelineConflicts(report1, report2) {
  const conflicts = [];
  
  const date1 = report1.inspection_date;
  const date2 = report2.inspection_date;
  
  if (!date1 || !date2) {
    return conflicts;
  }
  
  const measurements1 = report1.extracted_measurements || [];
  const measurements2 = report2.extracted_measurements || [];
  
  const moisture1 = measurements1.filter(m => m.type === 'moisture_content');
  const moisture2 = measurements2.filter(m => m.type === 'moisture_content');
  
  if (moisture1.length > 0 && moisture2.length > 0) {
    const avgMoisture1 = moisture1.reduce((sum, m) => sum + parseFloat(m.value), 0) / moisture1.length;
    const avgMoisture2 = moisture2.reduce((sum, m) => sum + parseFloat(m.value), 0) / moisture2.length;
    
    const difference = Math.abs(avgMoisture1 - avgMoisture2);
    
    if (difference > 10) {
      conflicts.push({
        contradiction_type: 'timeline_conflict',
        severity: 'medium',
        report_1_id: report1.id,
        report_1_expert: report1.expert_name,
        report_1_statement: `Average moisture content: ${avgMoisture1.toFixed(1)}% on ${date1}`,
        report_2_id: report2.id,
        report_2_expert: report2.expert_name,
        report_2_statement: `Average moisture content: ${avgMoisture2.toFixed(1)}% on ${date2}`,
        conflict_description: `Moisture content differs by ${difference.toFixed(1)}% between inspection dates`
      });
    }
  }
  
  return conflicts;
}

function compareExpertReports(claimId, expertReports) {
  const contradictionResult = detectContradictions(expertReports);
  
  const causationConsensus = analyzeCausationConsensus(expertReports);
  
  const scopeConsensus = analyzeScopeConsensus(expertReports);
  
  return {
    claim_id: claimId,
    report_count: expertReports.length,
    contradictions: contradictionResult.contradictions,
    has_conflicts: contradictionResult.has_conflicts,
    causation_consensus: causationConsensus,
    scope_consensus: scopeConsensus,
    analysis_summary: {
      total_conflicts: contradictionResult.conflict_count,
      critical_conflicts: contradictionResult.critical_conflicts,
      consensus_reached: !contradictionResult.has_conflicts || contradictionResult.critical_conflicts === 0
    }
  };
}

function analyzeCausationConsensus(expertReports) {
  const opinions = expertReports
    .filter(r => r.causation_opinion && r.causation_opinion !== 'not_stated')
    .map(r => r.causation_opinion);
  
  if (opinions.length === 0) {
    return {
      consensus: 'none',
      agreement: false,
      opinion_distribution: {}
    };
  }
  
  const distribution = {};
  for (const opinion of opinions) {
    distribution[opinion] = (distribution[opinion] || 0) + 1;
  }
  
  const sortedOpinions = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const majorityOpinion = sortedOpinions[0];
  const majorityCount = majorityOpinion[1];
  
  const agreement = majorityCount === opinions.length;
  
  return {
    consensus: majorityOpinion[0],
    agreement: agreement,
    agreement_percent: (majorityCount / opinions.length * 100).toFixed(1),
    opinion_distribution: distribution,
    total_reports: opinions.length
  };
}

function analyzeScopeConsensus(expertReports) {
  const allCategories = {};
  
  for (const report of expertReports) {
    const recommendations = report.extracted_recommendations || [];
    
    for (const rec of recommendations) {
      const recText = (rec.recommendation || rec.sentence || '').toLowerCase();
      
      for (const category of ['roofing', 'siding', 'drywall', 'flooring', 'hvac', 'electrical', 'plumbing', 'foundation', 'mold']) {
        if (recText.includes(category)) {
          if (!allCategories[category]) {
            allCategories[category] = {
              mention_count: 0,
              reports: []
            };
          }
          
          allCategories[category].mention_count++;
          if (!allCategories[category].reports.includes(report.id)) {
            allCategories[category].reports.push(report.id);
          }
        }
      }
    }
  }
  
  const consensusCategories = Object.entries(allCategories)
    .filter(([cat, data]) => data.reports.length >= expertReports.length * 0.5)
    .map(([cat, data]) => ({
      category: cat,
      report_count: data.reports.length,
      mention_count: data.mention_count,
      consensus_percent: (data.reports.length / expertReports.length * 100).toFixed(1)
    }));
  
  return {
    consensus_categories: consensusCategories,
    total_categories: Object.keys(allCategories).length,
    strong_consensus_count: consensusCategories.filter(c => parseFloat(c.consensus_percent) >= 75).length
  };
}

module.exports = {
  detectContradictions,
  detectCausationConflicts,
  detectMeasurementConflicts,
  detectScopeConflicts,
  compareExpertReports,
  analyzeCausationConsensus,
  analyzeScopeConsensus
};
