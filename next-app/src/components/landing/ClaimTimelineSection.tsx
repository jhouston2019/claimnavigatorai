export default function ClaimTimelineSection() {
  const timeline = [
    {
      days: 'Day 1–14',
      title: 'Carrier Inspection',
      description: 'Carrier inspection and documentation.',
    },
    {
      days: 'Day 15–30',
      title: 'Estimate or Denial',
      description: 'Estimate or denial issued.',
    },
    {
      days: 'Day 31–60',
      title: 'Documentation Deadlines',
      description: 'Documentation deadlines begin.',
    },
    {
      days: 'Day 61–90',
      title: 'Settlement Window',
      description: 'Settlement window closes.',
    },
  ]

  return (
    <section className="bg-white">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-900">
            What the Next 90 Days of Your Claim Actually Looks Like
          </h2>
          
          <div className="relative mt-12">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200 md:left-1/2 md:transform md:-translate-x-1/2" />
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div 
                  key={index}
                  className={`relative flex items-start md:items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 w-4 h-4 bg-primary-600 rounded-full md:left-1/2 md:transform md:-translate-x-1/2" />
                  
                  {/* Content */}
                  <div className={`ml-16 md:ml-0 md:w-5/12 ${
                    index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'
                  }`}>
                    <div className="bg-gray-50 rounded-lg p-6 shadow-md">
                      <p className="text-primary-600 font-bold text-lg mb-2">
                        {item.days}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-xl font-semibold text-gray-900 max-w-3xl mx-auto">
              Most underpaid claims stay underpaid because proof wasn't structured in time.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
