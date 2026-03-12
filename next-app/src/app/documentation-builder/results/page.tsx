'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, FileText } from 'lucide-react'

export default function DocumentationPacketResultsPage() {
  const searchParams = useSearchParams()
  const packetId = searchParams.get('id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (packetId) {
      setLoading(false)
    }
  }, [packetId])

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/documentation-packet/${packetId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claim-documentation-packet-${packetId}.pdf`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const downloadDOCX = async () => {
    try {
      const response = await fetch(`/api/documentation-packet/${packetId}/docx`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claim-documentation-packet-${packetId}.docx`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card">
            <FileText className="w-20 h-20 mx-auto mb-6 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Documentation Packet Ready
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your comprehensive claim documentation packet has been generated and is ready to download.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadPDF}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={downloadDOCX}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Word Document
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold mb-4">What's Included:</h3>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>Claim Summary</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>Scope Documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>Evidence Checklist</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>Dispute Letter Template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>Proof of Loss Structure</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
