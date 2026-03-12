import { supabase } from '@/lib/supabase'

async function getCaseStudies() {
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching case studies:', error)
    return []
  }

  return data || []
}

export default async function CaseStudiesSection() {
  const caseStudies = await getCaseStudies()

  if (caseStudies.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">
            Real Results from Real Claims
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {caseStudies.map((study) => {
              const increase = study.final_settlement - study.carrier_offer
              const percentIncrease = ((increase / study.carrier_offer) * 100).toFixed(0)
              
              return (
                <div key={study.id} className="card hover:shadow-xl transition-shadow">
                  <div className="mb-4">
                    <span className="inline-block bg-primary-100 text-primary-800 text-sm font-semibold px-3 py-1 rounded">
                      {study.property_type}
                    </span>
                    <span className="inline-block bg-gray-200 text-gray-800 text-sm font-semibold px-3 py-1 rounded ml-2">
                      {study.claim_type}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Carrier Offer</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${study.carrier_offer.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Final Settlement</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${study.final_settlement.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Increase</p>
                      <p className="text-xl font-bold text-primary-600">
                        +${increase.toLocaleString()} ({percentIncrease}%)
                      </p>
                    </div>
                  </div>
                  
                  {study.timeline_days && (
                    <p className="text-sm text-gray-600 mb-3">
                      Timeline: {study.timeline_days} days
                    </p>
                  )}
                  
                  <p className="text-gray-700 text-sm">
                    {study.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
