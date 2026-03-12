'use client'

import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'

export default function ThreeStepProcess() {
  return (
    <section className="bg-gray-50">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          {/* Example Report Link */}
          <div className="text-center mb-8">
            <Link 
              href="/example-report"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-sm transition-colors"
            >
              <FileText className="w-5 h-5" />
              See Example Report
            </Link>
            <p className="text-sm text-gray-600 mt-2">
              View a complete claim analysis with real line items and pricing
            </p>
          </div>
          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex items-start justify-between gap-6">
            {/* Step 1 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl mb-4 mx-auto">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                Upload your estimate or denial letter
              </h3>
              <p className="text-sm text-gray-600 text-center">
                PDF, image, or paste the text. Takes under 60 seconds.
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center pt-6">
              <ChevronRight className="w-8 h-8 text-gray-400" />
            </div>

            {/* Step 2 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl mb-4 mx-auto">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                See what the carrier argued — and what they left out
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Line-by-line analysis of scope gaps, pricing issues, and excluded coverage.
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center pt-6">
              <ChevronRight className="w-8 h-8 text-gray-400" />
            </div>

            {/* Step 3 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl mb-4 mx-auto">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                Get the proof packet that reopens claims
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Structured documentation built to the standard insurers require.
              </p>
            </div>
          </div>

          {/* Mobile: Vertical Layout */}
          <div className="md:hidden space-y-8">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl flex-shrink-0">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Upload your estimate or denial letter
                </h3>
              </div>
              <p className="text-sm text-gray-600 ml-16">
                PDF, image, or paste the text. Takes under 60 seconds.
              </p>
              <div className="flex justify-center my-4">
                <ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl flex-shrink-0">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  See what the carrier argued — and what they left out
                </h3>
              </div>
              <p className="text-sm text-gray-600 ml-16">
                Line-by-line analysis of scope gaps, pricing issues, and excluded coverage.
              </p>
              <div className="flex justify-center my-4">
                <ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full font-bold text-xl flex-shrink-0">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Get the proof packet that reopens claims
                </h3>
              </div>
              <p className="text-sm text-gray-600 ml-16">
                Structured documentation built to the standard insurers require.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
