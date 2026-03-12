import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const seedIssues = [
      {
        slug: 'missing-roof-decking',
        issue_name: 'Missing Roof Decking in Insurance Estimates',
        short_description: 'One of the most common reasons homeowners receive underpaid roof claims. Insurance adjusters often exclude damaged roof decking from estimates.',
        why_it_happens: 'Insurance adjusters typically conduct visual inspections from the ground or use drone footage. Damaged roof decking is hidden beneath shingles and cannot be seen without removing the roofing material. Many adjusters assume decking is intact unless there is obvious sagging or structural failure. This leads to estimates that only include shingle replacement, leaving homeowners to discover extensive decking damage once work begins.',
        cost_impact: 'Typical additional cost: $3,000 - $12,000 depending on the extent of damage. On a standard 2,000 sq ft roof, decking replacement can add $4-$6 per square foot. This often represents 20-30% of the total roof replacement cost that goes unbilled.',
        detection_method: 'Look for line items in your estimate related to roof decking, sheathing, or substrate replacement. If your estimate only mentions "shingle replacement" or "roofing material," decking may be excluded. Ask your contractor if they anticipate decking damage based on the age of your roof and type of damage sustained.',
        repair_example: 'Roof decking replacement: $4,500 - $8,000 for typical residential roof',
        seo_title: 'Missing Roof Decking in Insurance Estimates - Common Underpayment Issue',
        seo_description: 'Learn why insurance adjusters commonly exclude roof decking from estimates and how this can cost you $3,000-$12,000 in underpayment.',
        is_published: true,
      },
      {
        slug: 'interior-paint-omitted',
        issue_name: 'Interior Paint Omitted from Estimates',
        short_description: 'Insurance estimates frequently exclude interior paint despite visible damage or repairs that require repainting.',
        why_it_happens: 'Adjusters often argue that paint is cosmetic or that repairs can be "patched and matched" without full room repainting. They may also claim that only directly damaged areas need paint, ignoring the fact that patch work rarely matches existing paint. Insurance companies use this tactic to reduce claim payouts by thousands of dollars.',
        cost_impact: 'Typical additional cost: $2,000 - $6,000 for interior paint. Professional painters charge $2-$6 per square foot, and most repairs require painting entire rooms to achieve proper color matching. A typical claim involving 3-4 rooms can easily add $3,000-$5,000 to the true repair cost.',
        detection_method: 'Review your estimate for line items related to "interior paint" or "wall finish." If repairs involve drywall, water damage, or structural work, painting should be included. Check if the estimate only includes "touch-up" paint rather than full room painting.',
        repair_example: 'Interior painting (3 rooms): $2,500 - $4,500',
        seo_title: 'Interior Paint Omitted from Insurance Estimates - What You Need to Know',
        seo_description: 'Why insurance adjusters exclude interior paint from estimates and how this common tactic can cost you $2,000-$6,000 in underpayment.',
        is_published: true,
      },
      {
        slug: 'code-upgrade-omitted',
        issue_name: 'Code Upgrade Coverage Omitted',
        short_description: 'Building code upgrades required by law are frequently excluded from insurance estimates, leaving homeowners with unexpected costs.',
        why_it_happens: 'Insurance adjusters often interpret policies narrowly, claiming that code upgrades are "improvements" rather than necessary repairs. However, most policies include "ordinance or law" coverage that pays for mandatory code compliance. Adjusters may not be familiar with local building codes or may intentionally exclude these costs to reduce the claim payout.',
        cost_impact: 'Typical additional cost: $5,000 - $25,000 depending on the scope of required upgrades. Electrical panel upgrades, HVAC system replacements, and structural reinforcements to meet current codes can add significant costs. Some claims see 15-30% increases when code compliance is properly included.',
        detection_method: 'Check your policy for "ordinance or law" coverage or "building code upgrade" provisions. Ask your contractor what code upgrades are required for your repairs. Common upgrades include electrical systems, fire safety features, structural reinforcements, and energy efficiency requirements.',
        repair_example: 'Electrical panel upgrade to code: $3,000 - $8,000',
        seo_title: 'Code Upgrade Coverage Omitted from Insurance Estimates',
        seo_description: 'Building code upgrades are often excluded from insurance estimates. Learn how to identify this issue and recover $5,000-$25,000.',
        is_published: true,
      },
      {
        slug: 'labor-rate-suppression',
        issue_name: 'Labor Rate Suppression in Estimates',
        short_description: 'Insurance companies use artificially low labor rates that do not reflect actual market costs in your area.',
        why_it_happens: 'Insurance adjusters use software like Xactimate that contains labor rate databases. However, these rates are often outdated or based on regional averages that do not reflect local market conditions. Adjusters may also manually reduce labor rates to lower claim payouts. This practice is particularly common in high-cost areas where actual contractor rates far exceed database values.',
        cost_impact: 'Typical additional cost: $4,000 - $15,000 on a mid-size claim. Labor typically represents 40-60% of repair costs. If labor rates are suppressed by 20-30%, the total estimate can be thousands of dollars too low. On a $30,000 claim, labor rate suppression alone can create a $6,000-$9,000 gap.',
        detection_method: 'Compare the labor rates in your insurance estimate to quotes from local contractors. Look for hourly rates for carpenters, electricians, plumbers, and painters. Get 2-3 contractor quotes and compare their labor rates to what the insurance company is using. If there is a significant difference, document it.',
        repair_example: 'Labor rate difference on $20,000 in labor: $4,000 - $8,000 underpayment',
        seo_title: 'Labor Rate Suppression in Insurance Estimates - Hidden Underpayment',
        seo_description: 'Insurance companies use artificially low labor rates. Learn how to detect this tactic and recover $4,000-$15,000 in underpayment.',
        is_published: true,
      },
      {
        slug: 'missing-water-mitigation',
        issue_name: 'Missing Water Mitigation Costs',
        short_description: 'Emergency water mitigation services are often excluded from estimates despite being necessary to prevent further damage.',
        why_it_happens: 'Adjusters may claim that mitigation costs are not covered or that the homeowner should have prevented further damage. However, most policies require the insurer to pay for reasonable mitigation efforts. Adjusters may also argue that mitigation was excessive or unnecessary, even when industry standards support the work performed.',
        cost_impact: 'Typical additional cost: $2,000 - $8,000 for water mitigation services including extraction, drying equipment, dehumidifiers, and antimicrobial treatment. These costs are incurred immediately after water damage and are often paid out-of-pocket before the claim is settled.',
        detection_method: 'Review your estimate for line items related to "water extraction," "drying equipment," "dehumidification," or "emergency services." If you paid for these services, they should be included in your claim. Keep all invoices and documentation from mitigation companies.',
        repair_example: 'Water mitigation services: $2,500 - $6,000',
        seo_title: 'Missing Water Mitigation Costs in Insurance Estimates',
        seo_description: 'Emergency water mitigation is often excluded from insurance estimates. Learn how to recover $2,000-$8,000 in mitigation costs.',
        is_published: true,
      },
      {
        slug: 'hvac-duct-replacement-missing',
        issue_name: 'HVAC Duct Replacement Missing from Estimates',
        short_description: 'Damaged HVAC ductwork is frequently overlooked in insurance estimates, especially after fire or water damage.',
        why_it_happens: 'HVAC ducts are hidden in walls, attics, and crawl spaces, making them difficult to inspect during initial assessments. Adjusters may not have HVAC expertise and fail to recognize smoke damage, water intrusion, or structural damage affecting ductwork. They may also assume ducts are salvageable when replacement is actually necessary.',
        cost_impact: 'Typical additional cost: $3,500 - $12,000 for duct replacement. Full duct system replacement in a standard home costs $8-$15 per linear foot. Smoke-damaged or water-contaminated ducts cannot be cleaned and must be replaced to maintain air quality and system efficiency.',
        detection_method: 'Ask your HVAC contractor to inspect ductwork for damage. Look for line items in your estimate related to "ductwork," "HVAC system," or "air distribution." If your claim involves fire or water damage, duct replacement should be considered. Get a professional HVAC assessment.',
        repair_example: 'HVAC duct system replacement: $4,000 - $10,000',
        seo_title: 'HVAC Duct Replacement Missing from Insurance Estimates',
        seo_description: 'Damaged HVAC ducts are often overlooked in insurance estimates. Learn how to identify this issue and recover $3,500-$12,000.',
        is_published: true,
      },
      {
        slug: 'electrical-repair-omitted',
        issue_name: 'Electrical Repair Scope Omitted',
        short_description: 'Electrical repairs and upgrades are commonly excluded or underestimated in insurance claims.',
        why_it_happens: 'Adjusters may not recognize the full extent of electrical damage, especially when wiring is hidden in walls. They may also exclude necessary electrical upgrades required by code when repairs are made. Electrical work is expensive and adjusters often minimize this scope to reduce claim costs.',
        cost_impact: 'Typical additional cost: $2,500 - $15,000 depending on the scope of electrical work. Rewiring damaged circuits, replacing panels, and upgrading to code can add substantial costs. Electrical work requires licensed electricians and must meet strict code requirements.',
        detection_method: 'Review your estimate for electrical line items. If your claim involves structural damage, fire, or water intrusion near electrical systems, have a licensed electrician inspect the damage. Check if code upgrades are included when electrical repairs are made.',
        repair_example: 'Electrical rewiring and panel upgrade: $3,500 - $12,000',
        seo_title: 'Electrical Repair Scope Omitted from Insurance Estimates',
        seo_description: 'Electrical repairs are commonly underestimated in insurance claims. Learn how to detect this and recover $2,500-$15,000.',
        is_published: true,
      },
      {
        slug: 'drywall-scope-missing',
        issue_name: 'Drywall Scope Missing or Underestimated',
        short_description: 'Insurance estimates often include only directly damaged drywall, excluding areas that must be removed to access repairs.',
        why_it_happens: 'Adjusters measure only visible damage and exclude drywall that must be removed to repair plumbing, electrical, or structural damage. They may also use "patch and repair" pricing when full sheet replacement is necessary for proper finishing. This tactic significantly reduces the estimate while leaving homeowners with incomplete repairs.',
        cost_impact: 'Typical additional cost: $1,500 - $8,000 for proper drywall scope. Professional drywall installation costs $1.50-$3 per square foot including finishing. When access panels and repair areas are properly accounted for, drywall costs can double or triple initial estimates.',
        detection_method: 'Count the number of drywall sheets or square footage in your estimate. Ask your contractor how much drywall must be removed to complete repairs. Check if the estimate includes finishing, texture matching, and painting. Look for "patch repair" line items that should be full sheet replacements.',
        repair_example: 'Drywall replacement (3 rooms): $2,000 - $5,000',
        seo_title: 'Drywall Scope Missing from Insurance Estimates - Common Issue',
        seo_description: 'Insurance estimates often underestimate drywall scope. Learn how to identify missing drywall costs and recover $1,500-$8,000.',
        is_published: true,
      },
      {
        slug: 'xactimate-pricing-error',
        issue_name: 'Xactimate Pricing Errors and Discrepancies',
        short_description: 'Xactimate software used by adjusters contains pricing errors and outdated costs that undervalue repairs.',
        why_it_happens: 'Xactimate is the industry-standard estimating software, but its pricing database is not always accurate for local markets. Adjusters may use default settings, outdated price lists, or incorrect material specifications. The software also allows manual adjustments that adjusters use to reduce costs. Many homeowners do not realize they can challenge Xactimate pricing.',
        cost_impact: 'Typical additional cost: $3,000 - $20,000 depending on claim size. Xactimate pricing can be 15-40% below actual market costs in some areas. Material costs, labor rates, and specialty items are frequently underpriced. On a $40,000 estimate, pricing errors can create an $8,000-$12,000 gap.',
        detection_method: 'Compare Xactimate line items to actual contractor quotes. Look for material specifications that do not match what is actually needed. Check labor rates against local market rates. Get multiple contractor estimates and document any significant price differences.',
        repair_example: 'Pricing discrepancy on $30,000 estimate: $5,000 - $10,000 underpayment',
        seo_title: 'Xactimate Pricing Errors in Insurance Estimates - How to Challenge',
        seo_description: 'Xactimate software often underprices repairs by 15-40%. Learn how to identify pricing errors and recover $3,000-$20,000.',
        is_published: true,
      },
      {
        slug: 'storm-damage-misclassification',
        issue_name: 'Storm Damage Misclassified as Wear and Tear',
        short_description: 'Insurance adjusters commonly misclassify legitimate storm damage as pre-existing wear and tear to deny or reduce claims.',
        why_it_happens: 'This is one of the most common tactics used by insurance companies to reduce payouts. Adjusters may claim that roof damage, siding issues, or structural problems existed before the storm. They use subjective assessments of "age" or "condition" to deny coverage. This tactic is particularly common with roof claims where adjusters argue that shingles were "near end of life" regardless of actual storm damage.',
        cost_impact: 'Typical additional cost: $8,000 - $40,000 if damage is reclassified from wear and tear to storm damage. This can mean the difference between a denied claim and full roof replacement coverage. Many homeowners lose tens of thousands of dollars because they cannot prove the damage was storm-related.',
        detection_method: 'Obtain weather reports for the date of loss showing wind speeds, hail size, and storm severity. Get a contractor affidavit stating that damage is consistent with storm impact. Document the age and condition of your roof before the storm if possible. Compare damage patterns to known storm damage characteristics.',
        repair_example: 'Full roof replacement (storm damage vs wear and tear): $15,000 - $35,000 difference',
        seo_title: 'Storm Damage Misclassified as Wear and Tear - Insurance Tactic',
        seo_description: 'Insurance companies misclassify storm damage as wear and tear to deny claims. Learn how to challenge this and recover $8,000-$40,000.',
        is_published: true,
      },
    ]

    const { error } = await supabaseAdmin
      .from('estimate_issues')
      .insert(seedIssues)

    if (error) {
      // Check if issues already exist
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Issues already exist' })
      }
      throw error
    }

    return NextResponse.json({ message: 'Seed issues created successfully' })
  } catch (error) {
    console.error('Seed issues error:', error)
    return NextResponse.json(
      { error: 'Failed to create seed issues' },
      { status: 500 }
    )
  }
}
