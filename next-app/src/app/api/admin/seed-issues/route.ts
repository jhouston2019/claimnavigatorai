import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const seedIssues = [
      // GENERAL UNDERPAYMENT ISSUES
      {
        slug: 'insurance-estimate-too-low',
        issue_name: 'Insurance Estimate Too Low',
        short_description: 'Your insurance estimate may be significantly lower than actual repair costs. Learn why this happens and how to challenge it.',
        seo_title: 'Insurance Estimate Too Low - Why & How to Challenge It',
        seo_description: 'Insurance estimates are often 20-40% below actual costs. Learn why adjusters underestimate repairs and how to get fair compensation.',
        is_published: true,
      },
      {
        slug: 'insurance-claim-underpaid',
        issue_name: 'Insurance Claim Underpaid',
        short_description: 'Underpaid insurance claims cost homeowners thousands. Discover the most common reasons claims are too low and what to do about it.',
        seo_title: 'Insurance Claim Underpaid - Common Causes & Solutions',
        seo_description: 'Most insurance claims are underpaid by $5,000-$20,000. Learn the tactics adjusters use and how to recover what you deserve.',
        is_published: true,
      },
      {
        slug: 'insurance-adjuster-estimate-wrong',
        issue_name: 'Insurance Adjuster Estimate Wrong',
        short_description: 'Insurance adjuster estimates contain frequent errors that cost homeowners money. Learn how to identify and correct these mistakes.',
        seo_title: 'Insurance Adjuster Estimate Wrong - How to Identify Errors',
        seo_description: 'Adjuster estimates contain errors in 60%+ of claims. Learn how to spot mistakes and challenge incorrect estimates.',
        is_published: true,
      },
      {
        slug: 'insurance-settlement-too-low',
        issue_name: 'Insurance Settlement Too Low',
        short_description: 'Insurance settlement offers are often too low to cover actual repairs. Understand your rights and how to negotiate a fair settlement.',
        seo_title: 'Insurance Settlement Too Low - How to Negotiate Higher',
        seo_description: 'Insurance companies offer low settlements to save money. Learn negotiation tactics to increase your settlement by $10,000+.',
        is_published: true,
      },
      {
        slug: 'dispute-insurance-estimate',
        issue_name: 'How to Dispute an Insurance Estimate',
        short_description: 'Disputing an insurance estimate requires documentation and strategy. Learn the step-by-step process to challenge a low estimate.',
        seo_title: 'How to Dispute an Insurance Estimate - Complete Guide',
        seo_description: 'Step-by-step guide to disputing insurance estimates. Learn what documentation you need and how to negotiate successfully.',
        is_published: true,
      },
      {
        slug: 'insurance-company-lowball-estimate',
        issue_name: 'Insurance Company Lowball Estimate',
        short_description: 'Insurance companies use lowball estimates to reduce payouts. Recognize these tactics and learn how to counter them effectively.',
        seo_title: 'Insurance Company Lowball Estimate - Tactics & Countermeasures',
        seo_description: 'Insurance companies lowball estimates by 30-50%. Learn the tactics they use and how to fight back for fair compensation.',
        is_published: true,
      },
      {
        slug: 'scope-of-loss-too-small',
        issue_name: 'Scope of Loss Too Small',
        short_description: 'Insurance adjusters often write scope of loss documents that exclude necessary repairs. Learn how to identify missing items.',
        seo_title: 'Scope of Loss Too Small - Missing Items in Insurance Claims',
        seo_description: 'Scope of loss documents often exclude 20-40% of necessary repairs. Learn how to identify and add missing items.',
        is_published: true,
      },

      // MISSING SCOPE ISSUES
      {
        slug: 'missing-roof-decking-insurance-estimate',
        issue_name: 'Missing Roof Decking in Insurance Estimates',
        short_description: 'Roof decking damage is hidden beneath shingles and frequently excluded from insurance estimates, costing homeowners $3,000-$12,000.',
        seo_title: 'Missing Roof Decking in Insurance Estimates - $3k-$12k Underpayment',
        seo_description: 'Insurance adjusters miss roof decking damage in 70% of claims. Learn how to detect this issue and recover $3,000-$12,000.',
        is_published: true,
      },
      {
        slug: 'missing-interior-paint-insurance-estimate',
        issue_name: 'Missing Interior Paint in Insurance Estimates',
        short_description: 'Interior paint is frequently excluded from estimates despite being necessary after repairs. This tactic costs homeowners $2,000-$6,000.',
        seo_title: 'Missing Interior Paint in Insurance Estimates - Common Exclusion',
        seo_description: 'Adjusters exclude interior paint to reduce costs. Learn why this happens and how to recover $2,000-$6,000 in paint costs.',
        is_published: true,
      },
      {
        slug: 'missing-drywall-repair-insurance-estimate',
        issue_name: 'Missing Drywall Repair in Insurance Estimates',
        short_description: 'Drywall scope is commonly underestimated, excluding access panels and areas needed for repairs. Typical underpayment: $1,500-$8,000.',
        seo_title: 'Missing Drywall Repair in Insurance Estimates - Scope Issues',
        seo_description: 'Insurance estimates miss 40-60% of necessary drywall work. Learn how to identify missing scope and recover $1,500-$8,000.',
        is_published: true,
      },
      {
        slug: 'missing-insulation-insurance-claim',
        issue_name: 'Missing Insulation in Insurance Claims',
        short_description: 'Insulation replacement is often excluded even when damaged by water, fire, or contamination. Typical cost impact: $2,000-$7,000.',
        seo_title: 'Missing Insulation in Insurance Claims - Hidden Cost',
        seo_description: 'Damaged insulation is frequently excluded from insurance estimates. Learn how to prove necessity and recover $2,000-$7,000.',
        is_published: true,
      },
      {
        slug: 'missing-flooring-replacement-insurance-estimate',
        issue_name: 'Missing Flooring Replacement in Insurance Estimates',
        short_description: 'Flooring damage is often minimized or excluded from estimates. Adjusters claim partial replacement is sufficient when full replacement is needed.',
        seo_title: 'Missing Flooring Replacement in Insurance Estimates',
        seo_description: 'Insurance adjusters underestimate flooring damage by 50%+. Learn how to prove full replacement is needed and recover costs.',
        is_published: true,
      },
      {
        slug: 'missing-siding-replacement-insurance-estimate',
        issue_name: 'Missing Siding Replacement in Insurance Estimates',
        short_description: 'Siding damage is frequently underestimated, with adjusters claiming partial repairs when full replacement is necessary.',
        seo_title: 'Missing Siding Replacement in Insurance Estimates',
        seo_description: 'Adjusters minimize siding damage to reduce costs. Learn how to document full damage and recover $5,000-$15,000.',
        is_published: true,
      },
      {
        slug: 'missing-trim-replacement-insurance-estimate',
        issue_name: 'Missing Trim Replacement in Insurance Estimates',
        short_description: 'Trim and molding replacement is commonly excluded from estimates despite being damaged or removed during repairs.',
        seo_title: 'Missing Trim Replacement in Insurance Estimates',
        seo_description: 'Trim replacement costs $1,500-$5,000 and is often excluded. Learn how to include this necessary work in your claim.',
        is_published: true,
      },
      {
        slug: 'missing-baseboard-replacement-insurance-estimate',
        issue_name: 'Missing Baseboard Replacement in Insurance Estimates',
        short_description: 'Baseboard replacement is frequently omitted even when damaged by water or removed for repairs.',
        seo_title: 'Missing Baseboard Replacement in Insurance Estimates',
        seo_description: 'Baseboard replacement costs $800-$3,000 and is commonly excluded. Learn how to recover these costs in your claim.',
        is_published: true,
      },

      // ROOFING CLAIM ISSUES
      {
        slug: 'roof-estimate-missing-items',
        issue_name: 'Roof Estimate Missing Items',
        short_description: 'Roof estimates commonly exclude critical items like decking, underlayment, ventilation, and flashing. Typical underpayment: $4,000-$15,000.',
        seo_title: 'Roof Estimate Missing Items - Common Exclusions',
        seo_description: 'Roof estimates miss decking, underlayment, and flashing in 60% of claims. Learn what to look for and recover $4,000-$15,000.',
        is_published: true,
      },
      {
        slug: 'roof-decking-replacement-insurance-claim',
        issue_name: 'Roof Decking Replacement Insurance Claim',
        short_description: 'Roof decking replacement is one of the most disputed items in insurance claims. Adjusters often deny or minimize this necessary repair.',
        seo_title: 'Roof Decking Replacement Insurance Claim - How to Win',
        seo_description: 'Roof decking claims are denied in 40% of cases. Learn how to prove necessity and recover $3,000-$12,000 in decking costs.',
        is_published: true,
      },
      {
        slug: 'roof-estimate-too-low',
        issue_name: 'Roof Estimate Too Low',
        short_description: 'Roof estimates are frequently 20-40% below actual replacement costs due to missing items, low pricing, and scope errors.',
        seo_title: 'Roof Estimate Too Low - Why & How to Challenge',
        seo_description: 'Roof estimates are too low in 70% of claims. Learn why adjusters underestimate and how to recover $5,000-$20,000.',
        is_published: true,
      },
      {
        slug: 'roofing-scope-missing-insurance-estimate',
        issue_name: 'Roofing Scope Missing from Insurance Estimate',
        short_description: 'Critical roofing scope items are systematically excluded from estimates to reduce claim costs.',
        seo_title: 'Roofing Scope Missing from Insurance Estimate',
        seo_description: 'Missing roofing scope costs homeowners $4,000-$18,000. Learn what adjusters exclude and how to add it back.',
        is_published: true,
      },
      {
        slug: 'adjuster-missed-roof-damage',
        issue_name: 'Adjuster Missed Roof Damage',
        short_description: 'Insurance adjusters commonly miss roof damage during inspections, especially hidden damage beneath shingles.',
        seo_title: 'Adjuster Missed Roof Damage - What to Do',
        seo_description: 'Adjusters miss 30-50% of roof damage in initial inspections. Learn how to document missed damage and reopen your claim.',
        is_published: true,
      },
      {
        slug: 'roof-replacement-denied-insurance',
        issue_name: 'Roof Replacement Denied by Insurance',
        short_description: 'Insurance companies deny roof replacement claims by arguing wear and tear or insufficient damage. Learn how to challenge these denials.',
        seo_title: 'Roof Replacement Denied by Insurance - How to Appeal',
        seo_description: 'Roof replacement claims are denied in 25% of cases. Learn the tactics insurers use and how to successfully appeal.',
        is_published: true,
      },
      {
        slug: 'roof-storm-damage-denied',
        issue_name: 'Roof Storm Damage Denied',
        short_description: 'Storm damage claims are frequently denied with adjusters claiming pre-existing conditions or insufficient evidence.',
        seo_title: 'Roof Storm Damage Denied - How to Prove Your Claim',
        seo_description: 'Storm damage claims are denied in 30% of cases. Learn how to prove storm causation and win your roof claim.',
        is_published: true,
      },

      // PRICING ISSUES
      {
        slug: 'xactimate-estimate-too-low',
        issue_name: 'Xactimate Estimate Too Low',
        short_description: 'Xactimate pricing is often 15-40% below actual market costs, especially in high-cost areas. This creates significant claim gaps.',
        seo_title: 'Xactimate Estimate Too Low - Pricing Discrepancies Explained',
        seo_description: 'Xactimate estimates are too low in 60% of claims. Learn how to challenge pricing and recover $5,000-$20,000.',
        is_published: true,
      },
      {
        slug: 'xactimate-pricing-error',
        issue_name: 'Xactimate Pricing Errors',
        short_description: 'Xactimate software contains pricing errors and outdated costs that systematically undervalue repairs.',
        seo_title: 'Xactimate Pricing Errors - Common Issues & Solutions',
        seo_description: 'Xactimate pricing errors cost homeowners $3,000-$20,000 per claim. Learn how to identify and correct these errors.',
        is_published: true,
      },
      {
        slug: 'adjuster-labor-rate-too-low',
        issue_name: 'Adjuster Labor Rate Too Low',
        short_description: 'Insurance adjusters use artificially low labor rates that do not reflect actual market costs in your area.',
        seo_title: 'Adjuster Labor Rate Too Low - Market Rate Comparison',
        seo_description: 'Adjuster labor rates are 20-40% below market in most areas. Learn how to prove actual rates and recover $4,000-$15,000.',
        is_published: true,
      },
      {
        slug: 'contractor-estimate-higher-than-insurance',
        issue_name: 'Contractor Estimate Higher Than Insurance',
        short_description: 'When contractor estimates exceed insurance estimates, homeowners face a coverage gap. Learn why this happens and how to close the gap.',
        seo_title: 'Contractor Estimate Higher Than Insurance - Closing the Gap',
        seo_description: 'Contractor estimates average 35% higher than insurance estimates. Learn why this gap exists and how to recover the difference.',
        is_published: true,
      },
      {
        slug: 'insurance-pricing-discrepancy',
        issue_name: 'Insurance Pricing Discrepancy',
        short_description: 'Pricing discrepancies between insurance estimates and actual costs create significant gaps. Learn how to document and challenge these differences.',
        seo_title: 'Insurance Pricing Discrepancy - How to Challenge Low Pricing',
        seo_description: 'Insurance pricing is 20-50% below market in many claims. Learn how to prove actual costs and recover thousands.',
        is_published: true,
      },

      // CODE UPGRADE ISSUES
      {
        slug: 'building-code-upgrade-insurance-claim',
        issue_name: 'Building Code Upgrade Insurance Claim',
        short_description: 'Building code upgrades required by law are frequently excluded from insurance claims. Most policies include ordinance or law coverage.',
        seo_title: 'Building Code Upgrade Insurance Claim - Coverage Explained',
        seo_description: 'Code upgrades cost $5,000-$25,000 and are often excluded. Learn how to use ordinance or law coverage to recover costs.',
        is_published: true,
      },
      {
        slug: 'ordinance-law-coverage-insurance',
        issue_name: 'Ordinance or Law Coverage Insurance',
        short_description: 'Ordinance or law coverage pays for mandatory code upgrades but is rarely explained by adjusters. Learn how to activate this coverage.',
        seo_title: 'Ordinance or Law Coverage Insurance - How to Use It',
        seo_description: 'Ordinance or law coverage can add $10,000-$30,000 to your claim. Learn how to trigger this hidden policy benefit.',
        is_published: true,
      },
      {
        slug: 'code-upgrade-missing-estimate',
        issue_name: 'Code Upgrade Missing from Estimate',
        short_description: 'Code upgrades are systematically excluded from estimates even when required by law. This creates major coverage gaps.',
        seo_title: 'Code Upgrade Missing from Estimate - How to Add It',
        seo_description: 'Code upgrades are excluded from 80% of estimates. Learn how to identify required upgrades and add $5,000-$25,000 to your claim.',
        is_published: true,
      },
      {
        slug: 'roof-code-upgrade-insurance',
        issue_name: 'Roof Code Upgrade Insurance Coverage',
        short_description: 'Roof code upgrades including ventilation, fire rating, and structural requirements are often excluded from insurance estimates.',
        seo_title: 'Roof Code Upgrade Insurance Coverage - What You Need to Know',
        seo_description: 'Roof code upgrades cost $3,000-$12,000 and are commonly excluded. Learn how to use ordinance coverage to recover costs.',
        is_published: true,
      },

      // WATER DAMAGE CLAIMS
      {
        slug: 'water-damage-claim-underpaid',
        issue_name: 'Water Damage Claim Underpaid',
        short_description: 'Water damage claims are underpaid by 40-60% on average due to missing mitigation costs, hidden damage, and scope errors.',
        seo_title: 'Water Damage Claim Underpaid - Common Reasons Why',
        seo_description: 'Water damage claims are underpaid by $5,000-$20,000 on average. Learn why and how to recover full compensation.',
        is_published: true,
      },
      {
        slug: 'water-mitigation-missing-insurance-estimate',
        issue_name: 'Water Mitigation Missing from Insurance Estimate',
        short_description: 'Emergency water mitigation costs are frequently excluded from estimates despite being necessary to prevent further damage.',
        seo_title: 'Water Mitigation Missing from Insurance Estimate',
        seo_description: 'Water mitigation costs $2,000-$8,000 and is often excluded. Learn how to recover emergency mitigation expenses.',
        is_published: true,
      },
      {
        slug: 'adjuster-missed-water-damage',
        issue_name: 'Adjuster Missed Water Damage',
        short_description: 'Insurance adjusters miss hidden water damage in walls, ceilings, and subfloors during initial inspections.',
        seo_title: 'Adjuster Missed Water Damage - How to Document Hidden Damage',
        seo_description: 'Adjusters miss 50% of water damage in initial inspections. Learn how to document hidden damage and reopen your claim.',
        is_published: true,
      },
      {
        slug: 'mold-remediation-missing-estimate',
        issue_name: 'Mold Remediation Missing from Estimate',
        short_description: 'Mold remediation is frequently excluded from water damage estimates despite being necessary for health and safety.',
        seo_title: 'Mold Remediation Missing from Estimate - Coverage Issues',
        seo_description: 'Mold remediation costs $2,000-$10,000 and is often excluded. Learn how to prove necessity and recover costs.',
        is_published: true,
      },

      // ADJUSTER ERRORS
      {
        slug: 'adjuster-missed-damage',
        issue_name: 'Adjuster Missed Damage',
        short_description: 'Insurance adjusters miss 30-50% of damage during initial inspections due to time constraints and limited expertise.',
        seo_title: 'Adjuster Missed Damage - How to Document and Reopen Claims',
        seo_description: 'Adjusters miss damage in 40% of claims. Learn how to document missed damage and reopen your claim for more money.',
        is_published: true,
      },
      {
        slug: 'adjuster-underestimated-repair-cost',
        issue_name: 'Adjuster Underestimated Repair Cost',
        short_description: 'Repair costs are systematically underestimated using outdated pricing, low labor rates, and incorrect material specifications.',
        seo_title: 'Adjuster Underestimated Repair Cost - Pricing Tactics',
        seo_description: 'Adjusters underestimate costs by 25-45%. Learn how to prove actual repair costs and recover the difference.',
        is_published: true,
      },
      {
        slug: 'estimate-missing-items',
        issue_name: 'Estimate Missing Items',
        short_description: 'Insurance estimates commonly exclude 20-40% of necessary repair items to reduce claim payouts.',
        seo_title: 'Estimate Missing Items - Complete Checklist',
        seo_description: 'Missing items cost homeowners $5,000-$25,000 per claim. Learn what adjusters exclude and how to add it back.',
        is_published: true,
      },
      {
        slug: 'insurance-adjuster-dispute',
        issue_name: 'How to Dispute an Insurance Adjuster',
        short_description: 'Disputing an insurance adjuster requires documentation, contractor support, and knowledge of policy language.',
        seo_title: 'How to Dispute an Insurance Adjuster - Step-by-Step Guide',
        seo_description: 'Learn the exact process to dispute an adjuster including documentation needed, timeline, and negotiation tactics.',
        is_published: true,
      },

      // DENIAL TACTICS
      {
        slug: 'wear-and-tear-insurance-denial',
        issue_name: 'Wear and Tear Insurance Denial',
        short_description: 'Insurance companies deny claims by arguing damage is wear and tear rather than covered loss. This is one of the most common denial tactics.',
        seo_title: 'Wear and Tear Insurance Denial - How to Challenge It',
        seo_description: 'Wear and tear denials cost homeowners $10,000-$40,000. Learn how to prove storm damage and overturn denials.',
        is_published: true,
      },
      {
        slug: 'long-term-deterioration-insurance-claim',
        issue_name: 'Long-Term Deterioration Insurance Claim Denial',
        short_description: 'Adjusters claim damage is from long-term deterioration to deny coverage. Learn how to prove sudden and accidental loss.',
        seo_title: 'Long-Term Deterioration Insurance Claim Denial - How to Fight',
        seo_description: 'Long-term deterioration denials are used in 20% of claims. Learn how to prove covered loss and overturn denials.',
        is_published: true,
      },
      {
        slug: 'maintenance-exclusion-insurance',
        issue_name: 'Maintenance Exclusion in Insurance Claims',
        short_description: 'Insurance companies use maintenance exclusions to deny legitimate claims. Understand the difference between maintenance and covered damage.',
        seo_title: 'Maintenance Exclusion in Insurance Claims - What\'s Covered',
        seo_description: 'Maintenance exclusions are misused to deny claims. Learn the legal definition and how to prove covered damage.',
        is_published: true,
      },
      {
        slug: 'pre-existing-damage-denial',
        issue_name: 'Pre-Existing Damage Denial',
        short_description: 'Adjusters claim damage existed before the loss to deny or reduce claims. Learn how to prove damage is new and covered.',
        seo_title: 'Pre-Existing Damage Denial - How to Prove New Damage',
        seo_description: 'Pre-existing damage denials reduce claims by $8,000-$30,000. Learn how to prove damage is new and covered.',
        is_published: true,
      },
      {
        slug: 'not-storm-related-denial',
        issue_name: 'Not Storm Related Denial',
        short_description: 'Insurance companies deny storm damage claims by arguing damage is not storm-related. Learn how to prove causation.',
        seo_title: 'Not Storm Related Denial - How to Prove Storm Damage',
        seo_description: 'Storm damage denials cost homeowners $15,000-$50,000. Learn how to prove storm causation and overturn denials.',
        is_published: true,
      },

      // DOCUMENTATION ISSUES
      {
        slug: 'insurance-claim-documentation-checklist',
        issue_name: 'Insurance Claim Documentation Checklist',
        short_description: 'Proper documentation is critical for successful insurance claims. Use this comprehensive checklist to ensure you have everything needed.',
        seo_title: 'Insurance Claim Documentation Checklist - Complete Guide',
        seo_description: 'Complete documentation checklist for insurance claims. Learn what evidence you need to maximize your settlement.',
        is_published: true,
      },
      {
        slug: 'proof-of-loss-insurance',
        issue_name: 'Proof of Loss Insurance Requirements',
        short_description: 'Proof of loss documents must be accurate and complete. Learn what to include and common mistakes to avoid.',
        seo_title: 'Proof of Loss Insurance Requirements - What You Need',
        seo_description: 'Proof of loss mistakes can reduce claims by thousands. Learn what to include and how to maximize your settlement.',
        is_published: true,
      },
      {
        slug: 'how-to-document-insurance-damage',
        issue_name: 'How to Document Insurance Damage',
        short_description: 'Proper damage documentation can increase your settlement by 30-50%. Learn professional techniques for photos, notes, and evidence.',
        seo_title: 'How to Document Insurance Damage - Professional Techniques',
        seo_description: 'Learn professional damage documentation techniques that increase settlements by $5,000-$15,000 on average.',
        is_published: true,
      },
      {
        slug: 'dispute-insurance-denial',
        issue_name: 'How to Dispute an Insurance Denial',
        short_description: 'Insurance denials can be overturned with proper documentation and appeal strategy. Learn the step-by-step process.',
        seo_title: 'How to Dispute an Insurance Denial - Appeal Process',
        seo_description: 'Insurance denials are overturned in 40-60% of appeals. Learn the exact process to challenge and win your appeal.',
        is_published: true,
      },
      {
        slug: 'challenge-insurance-claim-decision',
        issue_name: 'How to Challenge an Insurance Claim Decision',
        short_description: 'Challenging insurance claim decisions requires understanding policy language, documentation requirements, and negotiation tactics.',
        seo_title: 'How to Challenge an Insurance Claim Decision - Complete Guide',
        seo_description: 'Learn how to challenge low settlements and denials. Step-by-step guide to negotiating higher insurance payouts.',
        is_published: true,
      },
      {
        slug: 'insurance-claim-evidence-checklist',
        issue_name: 'Insurance Claim Evidence Checklist',
        short_description: 'Strong evidence is the key to winning insurance disputes. Use this checklist to gather everything you need.',
        seo_title: 'Insurance Claim Evidence Checklist - What You Need to Win',
        seo_description: 'Complete evidence checklist for insurance claims. Learn what documentation wins disputes and increases settlements.',
        is_published: true,
      },

      // ADDITIONAL HIGH-VALUE ISSUES
      {
        slug: 'missing-hvac-duct-replacement',
        issue_name: 'Missing HVAC Duct Replacement',
        short_description: 'HVAC ductwork damaged by fire or water is frequently excluded from estimates despite requiring full replacement.',
        seo_title: 'Missing HVAC Duct Replacement in Insurance Estimates',
        seo_description: 'HVAC duct replacement costs $3,500-$12,000 and is often excluded. Learn how to prove necessity and recover costs.',
        is_published: true,
      },
      {
        slug: 'electrical-repair-omitted-estimate',
        issue_name: 'Electrical Repair Omitted from Estimate',
        short_description: 'Electrical repairs and code upgrades are commonly excluded from estimates, creating dangerous gaps in coverage.',
        seo_title: 'Electrical Repair Omitted from Estimate - Safety & Cost Issues',
        seo_description: 'Electrical repairs cost $2,500-$15,000 and are often excluded. Learn how to include necessary electrical work.',
        is_published: true,
      },
      {
        slug: 'plumbing-repair-missing-estimate',
        issue_name: 'Plumbing Repair Missing from Estimate',
        short_description: 'Plumbing repairs are frequently underestimated or excluded, especially when damage is hidden in walls or under slabs.',
        seo_title: 'Plumbing Repair Missing from Estimate - Hidden Costs',
        seo_description: 'Plumbing repairs cost $2,000-$10,000 and are often minimized. Learn how to document full scope and recover costs.',
        is_published: true,
      },
      {
        slug: 'structural-repair-excluded',
        issue_name: 'Structural Repair Excluded from Estimate',
        short_description: 'Structural repairs are often denied or minimized by adjusters claiming damage is cosmetic or pre-existing.',
        seo_title: 'Structural Repair Excluded from Estimate - How to Prove Necessity',
        seo_description: 'Structural repairs cost $5,000-$30,000 and are frequently denied. Learn how to prove necessity and recover costs.',
        is_published: true,
      },
      {
        slug: 'cabinet-replacement-missing',
        issue_name: 'Cabinet Replacement Missing from Estimate',
        short_description: 'Kitchen and bathroom cabinets damaged by water or fire are often excluded, with adjusters claiming refinishing is sufficient.',
        seo_title: 'Cabinet Replacement Missing from Estimate - Refinish vs Replace',
        seo_description: 'Cabinet replacement costs $5,000-$20,000. Learn when replacement is necessary and how to challenge refinish-only estimates.',
        is_published: true,
      },
      {
        slug: 'countertop-replacement-excluded',
        issue_name: 'Countertop Replacement Excluded',
        short_description: 'Countertop replacement is frequently excluded even when damaged or when cabinets require replacement.',
        seo_title: 'Countertop Replacement Excluded from Insurance Estimate',
        seo_description: 'Countertop replacement costs $2,000-$8,000. Learn how to prove necessity and include in your claim.',
        is_published: true,
      },
      {
        slug: 'window-replacement-denied',
        issue_name: 'Window Replacement Denied',
        short_description: 'Window replacement claims are often denied with adjusters arguing repair is sufficient or damage is pre-existing.',
        seo_title: 'Window Replacement Denied - How to Win Your Claim',
        seo_description: 'Window replacement costs $3,000-$15,000. Learn how to prove replacement is necessary and overturn denials.',
        is_published: true,
      },
      {
        slug: 'door-replacement-missing',
        issue_name: 'Door Replacement Missing from Estimate',
        short_description: 'Exterior and interior door replacement is commonly excluded, with adjusters claiming repair is sufficient.',
        seo_title: 'Door Replacement Missing from Estimate - Repair vs Replace',
        seo_description: 'Door replacement costs $1,500-$8,000. Learn when replacement is necessary and how to include in your estimate.',
        is_published: true,
      },
      {
        slug: 'garage-door-replacement-excluded',
        issue_name: 'Garage Door Replacement Excluded',
        short_description: 'Garage door damage is frequently minimized or excluded from estimates despite safety and functionality issues.',
        seo_title: 'Garage Door Replacement Excluded from Insurance Estimate',
        seo_description: 'Garage door replacement costs $1,000-$4,000. Learn how to prove damage and include in your claim.',
        is_published: true,
      },
      {
        slug: 'fence-replacement-denied',
        issue_name: 'Fence Replacement Denied',
        short_description: 'Fence damage claims are often denied or minimized, with adjusters arguing partial repair is sufficient.',
        seo_title: 'Fence Replacement Denied - How to Prove Storm Damage',
        seo_description: 'Fence replacement costs $2,000-$10,000. Learn how to prove storm damage and win your fence claim.',
        is_published: true,
      },
      {
        slug: 'deck-replacement-excluded',
        issue_name: 'Deck Replacement Excluded from Estimate',
        short_description: 'Deck damage is frequently minimized with adjusters claiming repair is sufficient when replacement is necessary.',
        seo_title: 'Deck Replacement Excluded from Estimate - Structural Issues',
        seo_description: 'Deck replacement costs $3,000-$15,000. Learn how to prove structural necessity and include in your claim.',
        is_published: true,
      },
      {
        slug: 'gutter-replacement-missing',
        issue_name: 'Gutter Replacement Missing from Estimate',
        short_description: 'Gutter and downspout replacement is commonly excluded from estimates despite storm damage.',
        seo_title: 'Gutter Replacement Missing from Estimate - Storm Damage',
        seo_description: 'Gutter replacement costs $1,500-$5,000. Learn how to document damage and include in your claim.',
        is_published: true,
      },
      {
        slug: 'soffit-fascia-repair-excluded',
        issue_name: 'Soffit and Fascia Repair Excluded',
        short_description: 'Soffit and fascia damage is frequently overlooked or excluded from estimates despite being visible storm damage.',
        seo_title: 'Soffit and Fascia Repair Excluded from Estimate',
        seo_description: 'Soffit and fascia repair costs $2,000-$8,000. Learn how to document damage and include in your estimate.',
        is_published: true,
      },
      {
        slug: 'skylight-replacement-denied',
        issue_name: 'Skylight Replacement Denied',
        short_description: 'Skylight damage claims are often denied or minimized despite leaks and structural issues.',
        seo_title: 'Skylight Replacement Denied - Leak and Damage Claims',
        seo_description: 'Skylight replacement costs $1,500-$5,000. Learn how to prove damage and win your skylight claim.',
        is_published: true,
      },
      {
        slug: 'chimney-repair-excluded',
        issue_name: 'Chimney Repair Excluded from Estimate',
        short_description: 'Chimney damage from storms or settling is frequently excluded with adjusters claiming pre-existing conditions.',
        seo_title: 'Chimney Repair Excluded from Estimate - Storm Damage Claims',
        seo_description: 'Chimney repair costs $2,000-$10,000. Learn how to prove storm damage and include in your claim.',
        is_published: true,
      },
      {
        slug: 'foundation-repair-denied',
        issue_name: 'Foundation Repair Denied',
        short_description: 'Foundation damage claims are commonly denied with adjusters arguing settling or pre-existing conditions.',
        seo_title: 'Foundation Repair Denied - How to Prove Covered Damage',
        seo_description: 'Foundation repair costs $5,000-$30,000. Learn how to prove sudden damage and overturn foundation denials.',
        is_published: true,
      },
      {
        slug: 'concrete-slab-repair-excluded',
        issue_name: 'Concrete Slab Repair Excluded',
        short_description: 'Concrete slab damage is frequently excluded from estimates despite cracking and settling from covered events.',
        seo_title: 'Concrete Slab Repair Excluded from Estimate',
        seo_description: 'Concrete slab repair costs $3,000-$15,000. Learn how to prove damage is covered and include in your claim.',
        is_published: true,
      },
      {
        slug: 'landscaping-damage-excluded',
        issue_name: 'Landscaping Damage Excluded',
        short_description: 'Landscaping damage from storms or repairs is often excluded despite being covered under most policies.',
        seo_title: 'Landscaping Damage Excluded from Insurance Estimate',
        seo_description: 'Landscaping damage costs $2,000-$10,000. Learn what\'s covered and how to include in your claim.',
        is_published: true,
      },
      {
        slug: 'tree-removal-not-covered',
        issue_name: 'Tree Removal Not Covered',
        short_description: 'Tree removal costs are frequently disputed, with adjusters claiming trees didn\'t damage structures.',
        seo_title: 'Tree Removal Not Covered - Insurance Coverage Rules',
        seo_description: 'Tree removal costs $500-$5,000. Learn when it\'s covered and how to prove necessity in your claim.',
        is_published: true,
      },
      {
        slug: 'debris-removal-missing',
        issue_name: 'Debris Removal Missing from Estimate',
        short_description: 'Debris removal costs are often excluded or underestimated despite being necessary and covered.',
        seo_title: 'Debris Removal Missing from Estimate - Coverage Explained',
        seo_description: 'Debris removal costs $1,000-$5,000. Learn how to include full removal costs in your insurance claim.',
        is_published: true,
      },
      {
        slug: 'temporary-housing-claim-denied',
        issue_name: 'Temporary Housing Claim Denied',
        short_description: 'Additional living expenses and temporary housing claims are frequently denied or limited despite policy coverage.',
        seo_title: 'Temporary Housing Claim Denied - ALE Coverage Explained',
        seo_description: 'Temporary housing costs $3,000-$15,000. Learn how to prove necessity and recover additional living expenses.',
        is_published: true,
      },
      {
        slug: 'contents-claim-undervalued',
        issue_name: 'Contents Claim Undervalued',
        short_description: 'Personal property claims are systematically undervalued using depreciation and low replacement cost estimates.',
        seo_title: 'Contents Claim Undervalued - How to Maximize Personal Property Claims',
        seo_description: 'Contents claims are undervalued by 40-60%. Learn how to document and value personal property for maximum recovery.',
        is_published: true,
      },
    ]

    // Check if issues already exist
    const { data: existing } = await supabaseAdmin
      .from('estimate_issues')
      .select('slug')
      .in('slug', seedIssues.map(i => i.slug))

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        message: `${existing.length} issues already exist. Skipping duplicates.`,
        existing: existing.length,
        new: seedIssues.length - existing.length
      })
    }

    const { error } = await supabaseAdmin
      .from('estimate_issues')
      .insert(seedIssues)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: 'Seed issues created successfully',
      count: seedIssues.length
    })
  } catch (error) {
    console.error('Seed issues error:', error)
    return NextResponse.json(
      { error: 'Failed to create seed issues' },
      { status: 500 }
    )
  }
}
