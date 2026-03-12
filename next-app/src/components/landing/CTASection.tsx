import Link from 'next/link'
import { FileSearch } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="bg-primary-700 text-white">
      <div className="section-container py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don't Leave Money on the Table
          </h2>
          
          <p className="text-xl mb-8 text-primary-100">
            Upload your insurance estimate and find out if you're being underpaid in 60 seconds.
          </p>
          
          <Link 
            href="/estimate-scan" 
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-10 rounded-lg text-lg transition-colors duration-200 shadow-xl"
          >
            <FileSearch className="w-6 h-6" />
            Analyze My Claim - Free
          </Link>
          
          <p className="mt-6 text-sm text-primary-200">
            No credit card required • Results in 60 seconds
          </p>
        </div>
      </div>
    </section>
  )
}
