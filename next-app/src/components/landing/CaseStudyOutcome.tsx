'use client'

import { ArrowRight } from 'lucide-react'

export default function CaseStudyOutcome() {
  return (
    <section className="bg-white">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          {/* Desktop: Two Column Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-8 items-center">
            {/* Before Column */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-sm p-8">
              <div className="mb-6">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Carrier's Position
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Claim type:</p>
                  <p className="font-semibold text-gray-900">Wind and hail damage, residential</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Carrier estimate:</p>
                  <p className="font-semibold text-gray-900">$18,400</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Carrier argument:</p>
                  <p className="font-semibold text-gray-900">"Normal wear and tear, not storm related"</p>
                </div>
                
                <div className="pt-4 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-1">Status:</p>
                  <p className="font-semibold text-red-600">Claim underpaid. Homeowner unsure how to respond.</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-12 h-12 text-primary-600" />
            </div>

            {/* After Column */}
            <div className="bg-primary-50 border-2 border-primary-600 rounded-sm p-8">
              <div className="mb-6">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
                  After Claim Command Pro
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Documentation produced:</p>
                  <p className="font-semibold text-gray-900">Scope gap report, line-item pricing comparison, proof of loss packet</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time to complete:</p>
                  <p className="font-semibold text-gray-900">40 minutes</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Final settlement:</p>
                  <p className="font-semibold text-gray-900 text-2xl">$39,000</p>
                </div>
                
                <div className="pt-4 border-t border-primary-300">
                  <p className="text-sm text-gray-600 mb-1">Status:</p>
                  <p className="font-semibold text-green-600">Claim reopened and resolved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Stacked Layout */}
          <div className="md:hidden space-y-6">
            {/* Before */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-sm p-6">
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Carrier's Position
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Claim type:</p>
                  <p className="font-semibold text-gray-900 text-sm">Wind and hail damage, residential</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Carrier estimate:</p>
                  <p className="font-semibold text-gray-900 text-sm">$18,400</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Carrier argument:</p>
                  <p className="font-semibold text-gray-900 text-sm">"Normal wear and tear, not storm related"</p>
                </div>
                
                <div className="pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-600 mb-1">Status:</p>
                  <p className="font-semibold text-red-600 text-sm">Claim underpaid. Homeowner unsure how to respond.</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-8 h-8 text-primary-600 rotate-90" />
            </div>

            {/* After */}
            <div className="bg-primary-50 border-2 border-primary-600 rounded-sm p-6">
              <div className="mb-4">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
                  After Claim Command Pro
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Documentation produced:</p>
                  <p className="font-semibold text-gray-900 text-sm">Scope gap report, line-item pricing comparison, proof of loss packet</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Time to complete:</p>
                  <p className="font-semibold text-gray-900 text-sm">40 minutes</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Final settlement:</p>
                  <p className="font-semibold text-gray-900 text-xl">$39,000</p>
                </div>
                
                <div className="pt-3 border-t border-primary-300">
                  <p className="text-xs text-gray-600 mb-1">Status:</p>
                  <p className="font-semibold text-green-600 text-sm">Claim reopened and resolved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-12 text-center">
            <p className="text-2xl font-bold text-red-600">
              The carrier's position didn't change. The documentation did.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
