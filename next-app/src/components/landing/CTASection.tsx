import Link from 'next/link'
import { Upload } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="bg-primary-700 text-white">
      <div className="section-container py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Building Your Case Today
          </h2>
          
          <p className="text-xl mb-8 text-primary-100">
            Get your free policy analysis and see exactly what your insurance company requires you to prove.
          </p>
          
          <Link 
            href="/policy-analysis" 
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-semibold py-4 px-10 rounded-lg text-lg transition-colors duration-200"
          >
            <Upload className="w-5 h-5" />
            Get Free Policy Analysis
          </Link>
        </div>
      </div>
    </section>
  )
}
