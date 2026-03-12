export default function CarrierPhrasesSection() {
  const phrases = [
    'Wear and tear',
    'Long-term deterioration',
    'Not storm related',
    'Pre-existing condition',
    'Under investigation',
    'Estimate is correct',
    'Maintenance related',
    'Excluded peril',
  ]

  return (
    <section className="bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
            Has Your Insurance Company Said Any Of These?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {phrases.map((phrase, index) => (
              <div 
                key={index}
                className="bg-white border-2 border-red-200 rounded-lg p-4 text-center hover:border-red-400 transition-colors"
              >
                <p className="text-sm md:text-base font-medium text-gray-800">
                  "{phrase}"
                </p>
              </div>
            ))}
          </div>
          
          <p className="text-xl font-semibold text-gray-900">
            If you've heard any of these, your claim is being disputed — not declined.
          </p>
          <p className="text-xl font-semibold text-primary-600 mt-2">
            The difference is money.
          </p>
        </div>
      </div>
    </section>
  )
}
