'use client'

export default function CommandCenterWalkthrough() {
  return (
    <section className="bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3">
            Inside The Command Center
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            See the actual tools and interface you'll use to analyze and recover your claim
          </p>

          {/* Screen 1: Dashboard */}
          <div className="mb-16">
            <div className="bg-white border-2 border-gray-300 rounded-sm shadow-xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                  claimcommandpro.com/dashboard
                </div>
              </div>

              {/* Dashboard UI */}
              <div className="p-6 bg-gradient-to-br from-primary-900 to-primary-800">
                <h3 className="text-2xl font-bold text-white mb-2">Claim Command Center</h3>
                <p className="text-primary-200 text-sm mb-6">Welcome back, John</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded p-4 border border-white/20">
                    <p className="text-xs text-primary-200 mb-1">Active Claims</p>
                    <p className="text-3xl font-bold text-white">2</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded p-4 border border-white/20">
                    <p className="text-xs text-primary-200 mb-1">Total Gap Detected</p>
                    <p className="text-3xl font-bold text-green-400">$23,450</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded p-4 border border-white/20">
                    <p className="text-xs text-primary-200 mb-1">Days Until Deadline</p>
                    <p className="text-3xl font-bold text-yellow-400">38</p>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm">Claim #1: Roof Hail Damage</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>Carrier: State Farm</p>
                      <p>Gap: <span className="text-red-600 font-bold">$18,350</span></p>
                      <p className="text-yellow-600 font-semibold">⚠️ Action required: Submit supplement</p>
                    </div>
                  </div>
                  <div className="bg-white rounded p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm">Claim #2: Water Damage</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>Carrier: Allstate</p>
                      <p>Gap: <span className="text-red-600 font-bold">$5,100</span></p>
                      <p className="text-green-600 font-semibold">✓ Supplement submitted</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              <strong>Step 1:</strong> Your dashboard shows all active claims, detected gaps, and upcoming deadlines
            </p>
          </div>

          {/* Screen 2: Gap Analysis */}
          <div className="mb-16">
            <div className="bg-white border-2 border-gray-300 rounded-sm shadow-xl overflow-hidden">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                  claimcommandpro.com/analysis/roof-claim
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gap Analysis Report</h3>
                
                <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Carrier</p>
                      <p className="font-bold text-gray-900">$18,400</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">True Scope</p>
                      <p className="font-bold text-gray-900">$36,750</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Gap</p>
                      <p className="font-bold text-red-600 text-lg">$18,350</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Missing: Roof decking (8 sheets)</p>
                    <p className="text-xs text-gray-600">$384 + $816 labor = <span className="font-bold">$1,200</span></p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Missing: Attic insulation (450 sq ft)</p>
                    <p className="text-xs text-gray-600">$3.20/sq ft = <span className="font-bold">$1,440</span></p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">Labor rate gap: $42/hr vs $68/hr</p>
                    <p className="text-xs text-gray-600">48 hours = <span className="font-bold">$1,248</span></p>
                  </div>
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500 italic">+ 7 more items...</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              <strong>Step 2:</strong> Line-by-line breakdown showing every missing item with quantities and costs
            </p>
          </div>

          {/* Screen 3: Documentation Builder */}
          <div className="mb-16">
            <div className="bg-white border-2 border-gray-300 rounded-sm shadow-xl overflow-hidden">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                  claimcommandpro.com/documentation-builder
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Documentation Builder</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Scope Gap Report</p>
                      <p className="text-xs text-gray-600">8 pages • Ready to download</p>
                    </div>
                    <button className="text-xs bg-primary-600 text-white px-3 py-1 rounded font-semibold">Download PDF</button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Proof of Loss Statement</p>
                      <p className="text-xs text-gray-600">3 pages • Ready to download</p>
                    </div>
                    <button className="text-xs bg-primary-600 text-white px-3 py-1 rounded font-semibold">Download PDF</button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Supplement Request Letter</p>
                      <p className="text-xs text-gray-600">2 pages • Ready to download</p>
                    </div>
                    <button className="text-xs bg-primary-600 text-white px-3 py-1 rounded font-semibold">Download PDF</button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Evidence Checklist</p>
                      <p className="text-xs text-gray-600">1 page • Ready to download</p>
                    </div>
                    <button className="text-xs bg-primary-600 text-white px-3 py-1 rounded font-semibold">Download PDF</button>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-300 rounded p-3">
                  <p className="text-xs text-blue-900">
                    <strong>All documents customized</strong> with your claim data, carrier name, policy details, and specific gap amounts
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              <strong>Step 3:</strong> Download professional documents pre-filled with your claim data
            </p>
          </div>

          {/* Screen 4: Submission Tracker */}
          <div className="mb-8">
            <div className="bg-white border-2 border-gray-300 rounded-sm shadow-xl overflow-hidden">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                  claimcommandpro.com/timeline-tracker
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Deadline Tracker</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-green-50 border-l-4 border-green-600">
                    <div className="text-green-600 font-bold text-sm">Day 22</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">✓ Initial estimate received</p>
                      <p className="text-xs text-gray-600">Completed Mar 5, 2026</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-yellow-50 border-l-4 border-yellow-600">
                    <div className="text-yellow-600 font-bold text-sm">Day 30</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">⚠️ Submit supplement request</p>
                      <p className="text-xs text-gray-600">Due: Mar 20, 2026 (8 days)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-red-50 border-l-4 border-red-600">
                    <div className="text-red-600 font-bold text-sm">Day 60</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">🔴 Proof of Loss deadline</p>
                      <p className="text-xs text-gray-600">Due: Apr 19, 2026 (38 days)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 border-l-4 border-gray-400">
                    <div className="text-gray-600 font-bold text-sm">Day 90</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Settlement window closes</p>
                      <p className="text-xs text-gray-600">Apr 29, 2026 (48 days)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              <strong>Step 4:</strong> Track critical deadlines and know exactly when to submit each document
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
