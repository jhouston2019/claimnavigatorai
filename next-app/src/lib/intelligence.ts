import { supabaseAdmin } from './supabase'

interface ClaimIntelligenceData {
  carrierName?: string
  state?: string
  city?: string
  claimType?: string
  propertyType?: string
  carrierEstimateValue?: number
  contractorEstimateValue?: number
  predictedScopeValue?: number
  potentialGapValue?: number
  missingScopeItems?: string[]
  detectedCarrierTactics?: Array<{ tactic: string; explanation: string }>
  severityScore?: number
}

export async function captureClaimIntelligence(data: ClaimIntelligenceData) {
  try {
    // Ensure data is anonymized - no user info
    const intelligenceRecord = {
      carrier_name: data.carrierName || null,
      state: data.state || null,
      city: data.city || null,
      claim_type: data.claimType || null,
      property_type: data.propertyType || null,
      carrier_estimate_value: data.carrierEstimateValue || null,
      contractor_estimate_value: data.contractorEstimateValue || null,
      predicted_scope_value: data.predictedScopeValue || null,
      potential_gap_value: data.potentialGapValue || null,
      missing_scope_items: data.missingScopeItems || null,
      detected_carrier_tactics: data.detectedCarrierTactics || null,
      severity_score: data.severityScore || null,
    }

    const { error } = await supabaseAdmin
      .from('claim_intelligence')
      .insert(intelligenceRecord)

    if (error) {
      console.error('Failed to capture intelligence:', error)
    }
  } catch (error) {
    console.error('Intelligence capture error:', error)
  }
}

export async function getCarrierPatterns(carrierName?: string) {
  try {
    let query = supabaseAdmin
      .from('carrier_statistics')
      .select('*')
      .order('claim_count', { ascending: false })

    if (carrierName) {
      query = query.eq('carrier_name', carrierName)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Failed to get carrier patterns:', error)
    return []
  }
}

export async function getRegionalPricing(state?: string, city?: string, claimType?: string) {
  try {
    let query = supabaseAdmin
      .from('regional_statistics')
      .select('*')

    if (state) query = query.eq('state', state)
    if (city) query = query.eq('city', city)
    if (claimType) query = query.eq('claim_type', claimType)

    const { data, error } = await query
      .order('claim_count', { ascending: false })
      .limit(100)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Failed to get regional pricing:', error)
    return []
  }
}

export async function getTacticFrequency() {
  try {
    const { data, error } = await supabaseAdmin
      .from('claim_intelligence')
      .select('detected_carrier_tactics')
      .not('detected_carrier_tactics', 'is', null)

    if (error) throw error

    const tacticCounts: Record<string, number> = {}
    let totalClaims = 0

    data?.forEach((record) => {
      if (record.detected_carrier_tactics) {
        totalClaims++
        const tactics = record.detected_carrier_tactics as Array<{ tactic: string }>
        tactics.forEach((t) => {
          const tactic = t.tactic.toLowerCase()
          tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1
        })
      }
    })

    const tacticStats = Object.entries(tacticCounts).map(([tactic, count]) => ({
      tactic,
      frequency: count,
      percentage: totalClaims > 0 ? ((count / totalClaims) * 100).toFixed(1) : '0',
    }))

    return tacticStats.sort((a, b) => b.frequency - a.frequency)
  } catch (error) {
    console.error('Failed to get tactic frequency:', error)
    return []
  }
}

export async function getMissingScopeAnalytics() {
  try {
    const { data, error } = await supabaseAdmin
      .from('claim_intelligence')
      .select('missing_scope_items')
      .not('missing_scope_items', 'is', null)

    if (error) throw error

    const itemCounts: Record<string, number> = {}
    let totalClaims = 0

    data?.forEach((record) => {
      if (record.missing_scope_items) {
        totalClaims++
        const items = record.missing_scope_items as string[]
        items.forEach((item) => {
          const normalizedItem = item.toLowerCase()
          itemCounts[normalizedItem] = (itemCounts[normalizedItem] || 0) + 1
        })
      }
    })

    const scopeStats = Object.entries(itemCounts).map(([item, count]) => ({
      item,
      frequency: count,
      percentage: totalClaims > 0 ? ((count / totalClaims) * 100).toFixed(1) : '0',
    }))

    return scopeStats.sort((a, b) => b.frequency - a.frequency).slice(0, 20)
  } catch (error) {
    console.error('Failed to get missing scope analytics:', error)
    return []
  }
}

export async function getIndustryBenchmarks() {
  try {
    const { data, error } = await supabaseAdmin
      .from('claim_intelligence')
      .select('carrier_estimate_value, predicted_scope_value, potential_gap_value, severity_score')
      .not('carrier_estimate_value', 'is', null)

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        totalClaims: 0,
        averageClaimGap: 0,
        averageCarrierEstimate: 0,
        averageTrueScope: 0,
        averageUnderpaymentPercentage: 0,
        averageSeverityScore: 0,
      }
    }

    const totalClaims = data.length
    const sumGap = data.reduce((sum, r) => sum + (r.potential_gap_value || 0), 0)
    const sumCarrier = data.reduce((sum, r) => sum + (r.carrier_estimate_value || 0), 0)
    const sumScope = data.reduce((sum, r) => sum + (r.predicted_scope_value || 0), 0)
    const sumSeverity = data.reduce((sum, r) => sum + (r.severity_score || 0), 0)

    const avgCarrier = sumCarrier / totalClaims
    const avgScope = sumScope / totalClaims
    const avgGap = sumGap / totalClaims
    const avgUnderpaymentPct = avgCarrier > 0 ? (avgGap / avgCarrier) * 100 : 0

    return {
      totalClaims,
      averageClaimGap: Math.round(avgGap),
      averageCarrierEstimate: Math.round(avgCarrier),
      averageTrueScope: Math.round(avgScope),
      averageUnderpaymentPercentage: Math.round(avgUnderpaymentPct * 10) / 10,
      averageSeverityScore: Math.round(sumSeverity / totalClaims),
    }
  } catch (error) {
    console.error('Failed to get industry benchmarks:', error)
    return {
      totalClaims: 0,
      averageClaimGap: 0,
      averageCarrierEstimate: 0,
      averageTrueScope: 0,
      averageUnderpaymentPercentage: 0,
      averageSeverityScore: 0,
    }
  }
}

export async function getClaimInsight(params: {
  claimType?: string
  state?: string
  carrierName?: string
}): Promise<string | null> {
  try {
    let query = supabaseAdmin
      .from('claim_intelligence')
      .select('potential_gap_value')

    if (params.claimType) query = query.eq('claim_type', params.claimType)
    if (params.state) query = query.eq('state', params.state)
    if (params.carrierName) query = query.eq('carrier_name', params.carrierName)

    const { data, error } = await query

    if (error || !data || data.length < 5) return null

    const avgGap = data.reduce((sum, r) => sum + (r.potential_gap_value || 0), 0) / data.length

    let insight = ''
    if (params.claimType && params.state) {
      insight = `${params.claimType} claims in ${params.state} are underpaid by an average of $${Math.round(avgGap).toLocaleString()}.`
    } else if (params.carrierName) {
      insight = `${params.carrierName} estimates are typically $${Math.round(avgGap).toLocaleString()} below actual repair costs.`
    } else if (params.claimType) {
      insight = `${params.claimType} claims are underpaid by an average of $${Math.round(avgGap).toLocaleString()}.`
    } else {
      insight = `Based on industry data, claims are underpaid by an average of $${Math.round(avgGap).toLocaleString()}.`
    }

    return insight
  } catch (error) {
    console.error('Failed to get claim insight:', error)
    return null
  }
}
