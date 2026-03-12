'use client'

export default function CarrierTacticsCards() {
  const tactics = [
    {
      phrase: "Wear and tear",
      counter: "Used to reduce scope. We generate the documentation that disputes it line by line."
    },
    {
      phrase: "Long-term deterioration",
      counter: "A delay tactic. We show you the evidence standard that overrides it."
    },
    {
      phrase: "Not storm related",
      counter: "The most common denial argument. We identify the proof requirements and build the response."
    },
    {
      phrase: "Pre-existing damage",
      counter: "Requires a specific burden of proof the carrier must meet. We show you whether they met it."
    },
    {
      phrase: "Estimate is correct",
      counter: "We compare their estimate against independent pricing databases line by line."
    },
    {
      phrase: "Under investigation",
      counter: "This extends the window. We track the deadlines that protect your rights."
    }
  ]

  return (
    <section className="bg-white">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              If your insurance company said any of these, your claim is being disputed — not declined.
            </h2>
            <p className="text-xl text-gray-700">
              There's a difference and the difference is money.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tactics.map((tactic, index) => (
              <div 
                key={index}
                className="bg-gray-50 border-2 border-gray-200 rounded-sm p-6 hover:border-primary-600 transition-colors"
              >
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-500 italic">
                    "{tactic.phrase}"
                  </p>
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {tactic.counter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
