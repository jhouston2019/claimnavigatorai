import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const INITIAL_TACTICS = [
  {
    slug: 'wear-and-tear-insurance-denial',
    tactic_name: 'Wear and Tear Insurance Denial',
    short_description: 'One of the most common denial phrases used to exclude storm damage by claiming it resulted from normal aging rather than a covered event.',
    seo_title: 'Wear and Tear Insurance Denial - How to Challenge This Tactic',
    seo_description: 'Learn what "wear and tear" means in insurance denials and how to prove your damage was caused by a covered storm event, not normal aging.',
    common_claim_types: ['Roof Claims', 'Siding Damage', 'Window Damage', 'Hail Damage'],
    is_published: true,
  },
  {
    slug: 'long-term-deterioration-insurance',
    tactic_name: 'Long-Term Deterioration',
    short_description: 'Insurers claim damage occurred gradually over time rather than from a sudden covered event, allowing them to deny coverage.',
    seo_title: 'Long-Term Deterioration Insurance Denial Explained',
    seo_description: 'Understand how insurers use "long-term deterioration" to deny claims and what evidence you need to prove sudden storm damage.',
    common_claim_types: ['Roof Claims', 'Foundation Issues', 'Water Damage', 'Structural Damage'],
    is_published: true,
  },
  {
    slug: 'maintenance-exclusion-insurance',
    tactic_name: 'Maintenance Exclusion',
    short_description: 'Adjusters claim the damage could have been prevented with proper maintenance, shifting responsibility from the insurer to the homeowner.',
    seo_title: 'Maintenance Exclusion in Insurance Claims - Challenge This Denial',
    seo_description: 'Learn how to fight maintenance exclusion denials by proving your home was properly maintained and damage was storm-related.',
    common_claim_types: ['Roof Claims', 'Plumbing Issues', 'HVAC Damage', 'Exterior Damage'],
    is_published: true,
  },
  {
    slug: 'not-storm-related-insurance-denial',
    tactic_name: 'Not Storm Related',
    short_description: 'Insurers deny claims by asserting the damage was not caused by the storm event, despite clear evidence of storm damage.',
    seo_title: 'Not Storm Related Insurance Denial - How to Prove Storm Damage',
    seo_description: 'Challenge "not storm related" denials with weather reports, expert opinions, and documentation proving your damage was storm-caused.',
    common_claim_types: ['Hail Damage', 'Wind Damage', 'Roof Claims', 'Siding Damage'],
    is_published: true,
  },
  {
    slug: 'pre-existing-damage-insurance',
    tactic_name: 'Pre-Existing Damage',
    short_description: 'Adjusters claim damage existed before the covered event, allowing them to deny or reduce your claim payout significantly.',
    seo_title: 'Pre-Existing Damage Insurance Denial - Prove New Storm Damage',
    seo_description: 'Learn how to challenge pre-existing damage denials with before photos, inspection reports, and expert documentation.',
    common_claim_types: ['Roof Claims', 'Water Damage', 'Structural Damage', 'Foundation Issues'],
    is_published: true,
  },
  {
    slug: 'faulty-installation-insurance-denial',
    tactic_name: 'Faulty Installation',
    short_description: 'Insurers blame poor workmanship or installation defects rather than storm damage, excluding coverage for the repairs.',
    seo_title: 'Faulty Installation Insurance Denial - Challenge Workmanship Claims',
    seo_description: 'Fight faulty installation denials by proving storm damage caused the failure, not installation defects.',
    common_claim_types: ['Roof Claims', 'Window Damage', 'Siding Damage', 'HVAC Issues'],
    is_published: true,
  },
  {
    slug: 'gradual-damage-insurance',
    tactic_name: 'Gradual Damage',
    short_description: 'Adjusters claim damage occurred slowly over time rather than suddenly, allowing them to deny coverage under policy exclusions.',
    seo_title: 'Gradual Damage Insurance Denial - Prove Sudden Storm Event',
    seo_description: 'Challenge gradual damage denials by documenting the sudden nature of storm damage with timestamps and expert analysis.',
    common_claim_types: ['Water Damage', 'Roof Leaks', 'Mold Claims', 'Foundation Issues'],
    is_published: true,
  },
  {
    slug: 'cosmetic-damage-insurance-denial',
    tactic_name: 'Cosmetic Damage Only',
    short_description: 'Insurers minimize storm damage as merely cosmetic, refusing to cover functional repairs that are actually necessary.',
    seo_title: 'Cosmetic Damage Insurance Denial - Prove Functional Impact',
    seo_description: 'Learn how to prove cosmetic damage affects functionality and weatherproofing, requiring full coverage under your policy.',
    common_claim_types: ['Hail Damage', 'Siding Damage', 'Roof Claims', 'Dent Damage'],
    is_published: true,
  },
  {
    slug: 'lack-of-maintenance-insurance',
    tactic_name: 'Lack of Maintenance',
    short_description: 'Adjusters claim inadequate maintenance contributed to damage, allowing them to reduce or deny your claim payout.',
    seo_title: 'Lack of Maintenance Insurance Denial - Prove Proper Care',
    seo_description: 'Challenge lack of maintenance denials with maintenance records, receipts, and expert testimony about proper upkeep.',
    common_claim_types: ['Roof Claims', 'HVAC Damage', 'Plumbing Issues', 'Exterior Damage'],
    is_published: true,
  },
  {
    slug: 'mechanical-breakdown-insurance',
    tactic_name: 'Mechanical Breakdown',
    short_description: 'Insurers claim equipment failed due to mechanical issues rather than storm damage, excluding coverage for replacements.',
    seo_title: 'Mechanical Breakdown Insurance Denial - Prove Storm Damage',
    seo_description: 'Fight mechanical breakdown denials by proving storm damage caused the failure, not normal wear or defects.',
    common_claim_types: ['HVAC Claims', 'Electrical Damage', 'Appliance Damage', 'Equipment Failure'],
    is_published: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    // Check if tactics already exist
    const { data: existing } = await supabaseAdmin
      .from('denial_tactics')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Tactics already exist' },
        { status: 400 }
      )
    }

    // Insert all tactics
    const { data, error } = await supabaseAdmin
      .from('denial_tactics')
      .insert(INITIAL_TACTICS)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      tactics: data,
    })
  } catch (error) {
    console.error('Seed denial tactics error:', error)
    return NextResponse.json(
      { error: 'Failed to seed denial tactics' },
      { status: 500 }
    )
  }
}
