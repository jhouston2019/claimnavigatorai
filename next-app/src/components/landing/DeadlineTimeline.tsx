'use client'

export default function DeadlineTimeline() {
  const milestones = [
    {
      day: 1,
      label: "Carrier adjuster inspects your property",
      description: "They are building their position, not yours.",
      isRed: false
    },
    {
      day: 14,
      label: "Initial estimate or denial arrives",
      description: "Most homeowners accept this without knowing what to challenge.",
      isRed: false
    },
    {
      day: 30,
      label: "Documentation gaps begin locking in",
      description: "Scope that wasn't documented doesn't get paid, even if covered.",
      isRed: false
    },
    {
      day: 60,
      label: "Proof of Loss deadline",
      description: "Most policies require structured proof of loss within 60 days. This is where underpaid claims become permanent.",
      isRed: true
    },
    {
      day: 90,
      label: "Settlement window closes",
      description: "Most claims are not reopened after this point.",
      isRed: false
    }
  ]

  return (
    <section className="bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-300"></div>
              
              {/* Milestones */}
              <div className="relative flex justify-between">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex flex-col items-center" style={{ width: '18%' }}>
                    {/* Day Marker */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white z-10 ${
                      milestone.isRed ? 'bg-red-600' : 'bg-primary-600'
                    }`}>
                      Day {milestone.day}
                    </div>
                    
                    {/* Content */}
                    <div className="mt-6 text-center">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm">
                        {milestone.label}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Callout */}
            <div className="mt-12 bg-yellow-50 border-2 border-yellow-400 rounded-sm p-6 text-center">
              <p className="text-lg font-semibold text-gray-900">
                Most homeowners don't start building their documentation until after Day 30.
              </p>
              <p className="text-lg font-semibold text-primary-600 mt-2">
                Claim Command Pro is designed to be used on Day 1.
              </p>
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300"></div>
              
              {/* Milestones */}
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative flex items-start gap-6">
                    {/* Day Marker */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white z-10 flex-shrink-0 ${
                      milestone.isRed ? 'bg-red-600' : 'bg-primary-600'
                    }`}>
                      <span className="text-xs">Day {milestone.day}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <h4 className="font-bold text-gray-900 mb-2">
                        {milestone.label}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Callout */}
            <div className="mt-8 bg-yellow-50 border-2 border-yellow-400 rounded-sm p-6">
              <p className="font-semibold text-gray-900 mb-2">
                Most homeowners don't start building their documentation until after Day 30.
              </p>
              <p className="font-semibold text-primary-600">
                Claim Command Pro is designed to be used on Day 1.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
