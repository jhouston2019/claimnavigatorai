import { Metadata } from 'next'
import { AlertTriangle, DollarSign, FileText, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Example Claim Report | Claim Command Pro',
  description: 'See a real example of a Claim Command Pro analysis report',
}

export default function ExampleReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Claim Gap Analysis Report
              </h1>
              <p className="text-sm text-gray-600">
                Report ID: CCP-2026-03-8472 | Generated: March 12, 2026
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Severity Score</p>
              <p className="text-4xl font-bold text-red-600">8.4/10</p>
            </div>
          </div>

          {/* Claim Summary */}
          <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Property Address</p>
              <p className="font-semibold text-gray-900">4821 Oakwood Drive, Dallas, TX 75214</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Claim Type</p>
              <p className="font-semibold text-gray-900">Wind and Hail Damage - Residential Roof</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loss Date</p>
              <p className="font-semibold text-gray-900">February 18, 2026</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Insurance Carrier</p>
              <p className="font-semibold text-gray-900">State Farm</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-red-50 border-2 border-red-300 p-6 rounded-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Financial Summary</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-600 mb-1">Carrier's Estimate</p>
                <p className="text-2xl font-bold text-gray-900">$18,400</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Verified Repair Scope</p>
                <p className="text-2xl font-bold text-gray-900">$36,750</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Potential Gap</p>
                <p className="text-3xl font-bold text-red-600">$18,350</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carrier Arguments Detected */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Carrier Arguments Detected
          </h2>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Tactic 1: "Wear and Tear" Exclusion</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Carrier's statement:</strong> "Damage appears consistent with normal aging and deterioration of roofing materials."
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>What this means:</strong> State Farm is arguing the roof damage existed before the February 18 hailstorm and is therefore not covered under your policy.
              </p>
              <p className="text-sm text-gray-900 font-semibold">
                <strong>Counter-evidence required:</strong> Pre-loss roof inspection report, maintenance records, weather service confirmation of hail size (1.5"+ diameter), and photos showing impact marks consistent with acute storm damage.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Tactic 2: Scope Reduction</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Carrier's position:</strong> "Estimate includes roof shingles replacement only. Interior damage not verified."
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>What this means:</strong> The adjuster excluded roof decking, underlayment, ventilation, and interior water damage from the estimate.
              </p>
              <p className="text-sm text-gray-900 font-semibold">
                <strong>Counter-evidence required:</strong> Contractor inspection report documenting compromised decking (8 sheets), saturated insulation (450 sq ft), and interior ceiling damage (2 rooms).
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Tactic 3: Suppressed Labor Rates</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Carrier's pricing:</strong> $42/hour for roofing labor (Xactimate database)
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>What this means:</strong> Actual market rate for licensed roofing contractors in Dallas is $68-75/hour. The carrier is using outdated pricing data.
              </p>
              <p className="text-sm text-gray-900 font-semibold">
                <strong>Counter-evidence required:</strong> 3 written estimates from licensed contractors showing prevailing wage rates, plus local labor rate survey data.
              </p>
            </div>
          </div>
        </div>

        {/* Missing Scope Items */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Missing Scope Items
          </h2>
          
          <p className="text-sm text-gray-700 mb-6">
            The following items are required to complete repairs but were excluded from the carrier's estimate:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-900">Item Description</th>
                  <th className="text-right p-3 font-bold text-gray-900">Quantity</th>
                  <th className="text-right p-3 font-bold text-gray-900">Unit Cost</th>
                  <th className="text-right p-3 font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3">Roof decking replacement (OSB 7/16")</td>
                  <td className="text-right p-3">8 sheets</td>
                  <td className="text-right p-3">$48.00</td>
                  <td className="text-right p-3 font-semibold">$384.00</td>
                </tr>
                <tr>
                  <td className="p-3">Roof decking labor</td>
                  <td className="text-right p-3">12 hours</td>
                  <td className="text-right p-3">$68.00</td>
                  <td className="text-right p-3 font-semibold">$816.00</td>
                </tr>
                <tr>
                  <td className="p-3">Ice & water shield underlayment</td>
                  <td className="text-right p-3">6 rolls</td>
                  <td className="text-right p-3">$89.00</td>
                  <td className="text-right p-3 font-semibold">$534.00</td>
                </tr>
                <tr>
                  <td className="p-3">Synthetic underlayment (balance of roof)</td>
                  <td className="text-right p-3">18 squares</td>
                  <td className="text-right p-3">$42.00</td>
                  <td className="text-right p-3 font-semibold">$756.00</td>
                </tr>
                <tr>
                  <td className="p-3">Ridge vent replacement</td>
                  <td className="text-right p-3">48 LF</td>
                  <td className="text-right p-3">$12.50</td>
                  <td className="text-right p-3 font-semibold">$600.00</td>
                </tr>
                <tr>
                  <td className="p-3">Attic insulation replacement (R-38)</td>
                  <td className="text-right p-3">450 sq ft</td>
                  <td className="text-right p-3">$3.20</td>
                  <td className="text-right p-3 font-semibold">$1,440.00</td>
                </tr>
                <tr>
                  <td className="p-3">Interior ceiling repair (water damage)</td>
                  <td className="text-right p-3">2 rooms</td>
                  <td className="text-right p-3">$850.00</td>
                  <td className="text-right p-3 font-semibold">$1,700.00</td>
                </tr>
                <tr>
                  <td className="p-3">Interior paint (ceiling + walls)</td>
                  <td className="text-right p-3">2 rooms</td>
                  <td className="text-right p-3">$625.00</td>
                  <td className="text-right p-3 font-semibold">$1,250.00</td>
                </tr>
                <tr>
                  <td className="p-3">Gutter replacement (hail damaged)</td>
                  <td className="text-right p-3">64 LF</td>
                  <td className="text-right p-3">$18.00</td>
                  <td className="text-right p-3 font-semibold">$1,152.00</td>
                </tr>
                <tr>
                  <td className="p-3">Downspout replacement</td>
                  <td className="text-right p-3">3 units</td>
                  <td className="text-right p-3">$145.00</td>
                  <td className="text-right p-3 font-semibold">$435.00</td>
                </tr>
                <tr className="bg-red-50 font-bold">
                  <td className="p-3" colSpan={3}>TOTAL MISSING SCOPE</td>
                  <td className="text-right p-3 text-red-600 text-lg">$9,067.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Discrepancies */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-600" />
            Pricing Discrepancies
          </h2>
          
          <p className="text-sm text-gray-700 mb-6">
            Line items where carrier pricing is below market rate:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-900">Item</th>
                  <th className="text-right p-3 font-bold text-gray-900">Carrier Rate</th>
                  <th className="text-right p-3 font-bold text-gray-900">Market Rate</th>
                  <th className="text-right p-3 font-bold text-gray-900">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3">Roofing labor (per hour)</td>
                  <td className="text-right p-3">$42.00</td>
                  <td className="text-right p-3">$68.00</td>
                  <td className="text-right p-3 font-semibold text-red-600">+$26.00</td>
                </tr>
                <tr>
                  <td className="p-3">Total labor hours estimated</td>
                  <td className="text-right p-3" colSpan={3}>48 hours</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="p-3 font-bold">Labor rate gap impact</td>
                  <td className="text-right p-3" colSpan={2}></td>
                  <td className="text-right p-3 font-bold text-red-600">$1,248.00</td>
                </tr>
                <tr>
                  <td className="p-3">Architectural shingles (per square)</td>
                  <td className="text-right p-3">$89.00</td>
                  <td className="text-right p-3">$118.00</td>
                  <td className="text-right p-3 font-semibold text-red-600">+$29.00</td>
                </tr>
                <tr>
                  <td className="p-3">Total squares</td>
                  <td className="text-right p-3" colSpan={3}>22 squares</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="p-3 font-bold">Material pricing gap impact</td>
                  <td className="text-right p-3" colSpan={2}></td>
                  <td className="text-right p-3 font-bold text-red-600">$638.00</td>
                </tr>
                <tr>
                  <td className="p-3">Dumpster / waste removal</td>
                  <td className="text-right p-3">$425.00</td>
                  <td className="text-right p-3">$750.00</td>
                  <td className="text-right p-3 font-semibold text-red-600">+$325.00</td>
                </tr>
                <tr className="bg-red-100 font-bold">
                  <td className="p-3" colSpan={3}>TOTAL PRICING SUPPRESSION</td>
                  <td className="text-right p-3 text-red-600 text-lg">$2,211.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Excluded Coverage Items */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Excluded Coverage Items
          </h2>
          
          <p className="text-sm text-gray-700 mb-6">
            Items covered under your policy but excluded from the carrier's estimate:
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-primary-600 bg-primary-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Code Upgrade Requirements</h4>
              <p className="text-sm text-gray-700 mb-2">
                Dallas building code now requires enhanced roof-to-wall connections for wind resistance. Your policy includes "Ordinance or Law" coverage (Coverage A extension).
              </p>
              <p className="text-sm text-gray-900">
                <strong>Estimated cost:</strong> $2,850 | <strong>Policy coverage limit:</strong> 25% of Coverage A ($87,500) = $21,875 available
              </p>
            </div>

            <div className="border-l-4 border-primary-600 bg-primary-50 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Additional Living Expenses</h4>
              <p className="text-sm text-gray-700 mb-2">
                Interior water damage requires 4-6 days for drying and repairs. Your policy includes "Loss of Use" coverage (Coverage D).
              </p>
              <p className="text-sm text-gray-900">
                <strong>Estimated cost:</strong> $1,200 (hotel + meals) | <strong>Policy coverage limit:</strong> 30% of Coverage A = $26,250 available
              </p>
            </div>
          </div>

          <div className="mt-6 bg-red-50 border-2 border-red-300 p-4 rounded-sm">
            <p className="font-bold text-gray-900">
              TOTAL EXCLUDED COVERAGE: <span className="text-red-600 text-lg ml-2">$4,050.00</span>
            </p>
          </div>
        </div>

        {/* Gap Summary */}
        <div className="bg-gray-900 text-white border-2 border-gray-800 p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Total Claim Gap Breakdown</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span>Missing scope items</span>
              <span className="font-bold text-xl">$9,067.00</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span>Pricing suppression (labor + materials)</span>
              <span className="font-bold text-xl">$2,211.00</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span>Excluded coverage (code upgrade + ALE)</span>
              <span className="font-bold text-xl">$4,050.00</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-red-600">
              <span className="text-2xl font-bold">TOTAL POTENTIAL RECOVERY</span>
              <span className="text-4xl font-bold text-red-500">$15,328.00</span>
            </div>
          </div>

          <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm">
            <p className="text-sm text-red-200">
              <strong>Note:</strong> This represents the difference between the carrier's $18,400 estimate and the verified $33,728 repair scope. Additional depreciation holdback may apply depending on your policy's Actual Cash Value vs Replacement Cost provisions.
            </p>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Recommended Next Actions
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Request Supplemental Inspection</h4>
                <p className="text-sm text-gray-700">
                  Submit a written request to State Farm for a re-inspection to document the missing scope items identified above. Include your contractor's estimate showing the roof decking damage, interior water damage, and code upgrade requirements.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Deadline:</strong> Within 60 days of loss date (April 19, 2026)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Challenge "Wear and Tear" Argument</h4>
                <p className="text-sm text-gray-700">
                  Obtain a written statement from a licensed roofing contractor or engineer confirming that the damage pattern is consistent with acute hail impact, not gradual deterioration. Include National Weather Service data showing 1.75" hail reported in your area on February 18, 2026.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Required evidence:</strong> Contractor letter, NWS report, pre-loss maintenance records
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Submit Labor Rate Documentation</h4>
                <p className="text-sm text-gray-700">
                  Provide 2-3 written estimates from licensed roofing contractors showing prevailing wage rates of $68-75/hour in Dallas. Reference the Texas Department of Insurance bulletin on "reasonable and necessary" repair costs.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Impact:</strong> $1,248 additional labor cost recovery
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Invoke Ordinance or Law Coverage</h4>
                <p className="text-sm text-gray-700">
                  Submit a written request to apply your Ordinance or Law coverage (25% of Coverage A = $21,875 available) to cover the $2,850 in code-required roof upgrades. Attach the Dallas building permit requirements showing the enhanced connection standards.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Policy section:</strong> Coverage A - Ordinance or Law Extension
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">File Proof of Loss</h4>
                <p className="text-sm text-gray-700">
                  Complete and submit a formal Proof of Loss statement documenting the full $33,728 repair scope. This is a sworn statement that locks in your claim amount and starts the appraisal clock if State Farm continues to dispute.
                </p>
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  <strong>CRITICAL DEADLINE:</strong> Must be filed within 60 days of loss (April 19, 2026)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Risk */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Timeline Risk Assessment
          </h2>
          
          <div className="bg-red-50 border-2 border-red-400 p-6 rounded-sm mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-red-900 mb-2">HIGH RISK - Immediate Action Required</h4>
                <p className="text-sm text-red-800">
                  You are currently on Day 22 of your claim. You have <strong>38 days remaining</strong> until the Proof of Loss deadline (April 19, 2026). After this deadline, recovering the missing $15,328 becomes significantly more difficult.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 w-3 h-3 rounded-full"></div>
              <p className="text-sm text-gray-700">
                <strong>Days 1-21 (Current):</strong> Optimal window to supplement claim and challenge carrier arguments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 w-3 h-3 rounded-full"></div>
              <p className="text-sm text-gray-700">
                <strong>Days 22-45:</strong> Documentation gaps begin to lock in. Carrier position hardens.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-600 w-3 h-3 rounded-full"></div>
              <p className="text-sm text-gray-700">
                <strong>Days 46-60:</strong> Critical window. Proof of Loss must be filed or claim amount becomes fixed.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-600 w-3 h-3 rounded-full"></div>
              <p className="text-sm text-gray-700">
                <strong>After Day 60:</strong> Appraisal or litigation typically required to recover underpayment.
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Packet */}
        <div className="bg-white border-2 border-gray-300 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Documentation Packet Included
          </h2>
          
          <p className="text-sm text-gray-700 mb-6">
            The following documents are generated and ready to submit to State Farm:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Scope Gap Report (8 pages)</p>
                <p className="text-xs text-gray-600">Line-by-line comparison showing missing items with quantities and pricing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Carrier Argument Analysis (4 pages)</p>
                <p className="text-xs text-gray-600">Breakdown of "wear and tear" argument with required counter-evidence</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Proof of Loss Statement (3 pages)</p>
                <p className="text-xs text-gray-600">Sworn statement documenting $33,728 total loss with supporting schedules</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Supplement Request Letter (2 pages)</p>
                <p className="text-xs text-gray-600">Formal request for re-inspection with itemized missing scope list</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Evidence Checklist (1 page)</p>
                <p className="text-xs text-gray-600">Required documentation to support your supplement request</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-300 p-4 rounded-sm">
            <p className="text-sm text-blue-900">
              <strong>Total packet:</strong> 18 pages of structured documentation ready to submit to State Farm
            </p>
          </div>
        </div>

        {/* Policy Language Reference */}
        <div className="bg-white border-2 border-gray-300 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Relevant Policy Language
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 border-l-4 border-gray-600">
              <p className="text-xs text-gray-600 mb-2">YOUR POLICY - Section I, Coverage A, Exclusions</p>
              <p className="text-sm text-gray-900 font-mono leading-relaxed">
                "We do not cover loss to property described in Coverages A and B caused by: ... (c) wear and tear, marring, deterioration; ... (d) inherent vice, latent defect, mechanical breakdown; ... However, we do cover any ensuing loss unless another exclusion applies."
              </p>
              <p className="text-sm text-gray-900 mt-3">
                <strong>Key phrase:</strong> "we do cover any ensuing loss" — This means even if some deterioration existed, damage caused by the February 18 storm is still covered.
              </p>
            </div>

            <div className="bg-gray-50 p-4 border-l-4 border-gray-600">
              <p className="text-xs text-gray-600 mb-2">YOUR POLICY - Section I, Additional Coverages, Ordinance or Law</p>
              <p className="text-sm text-gray-900 font-mono leading-relaxed">
                "We will pay up to 25% of the limit of liability that applies to Coverage A for the increased costs you incur due to the enforcement of any ordinance or law which requires ... the construction, demolition, remodeling, renovation or repair of that part of a covered building or other structure damaged by a Peril Insured Against."
              </p>
              <p className="text-sm text-gray-900 mt-3">
                <strong>Application:</strong> The $2,850 in code-required roof upgrades are covered under this provision.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            This is an example report. Your actual report will be customized based on your specific claim documents.
          </p>
          <p>
            <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute legal advice. Consult with a licensed public adjuster or attorney for claims exceeding $50,000 or involving complex coverage disputes.
          </p>
        </div>
      </div>
    </div>
  )
}
