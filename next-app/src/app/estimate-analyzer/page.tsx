'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Lock } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'

export default function EstimateAnalyzerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [carrierFile, setCarrierFile] = useState<File | null>(null)
  const [contractorFile, setContractorFile] = useState<File | null>(null)
  const [claimId, setClaimId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/estimate-analyzer')
      return
    }

    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid')
      .eq('id', user.id)
      .single()

    setIsPaid(profile?.is_paid || false)
  }

  const carrierDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => setCarrierFile(files[0]),
  })

  const contractorDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => setContractorFile(files[0]),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPaid) {
      router.push('/pricing')
      return
    }

    if (!carrierFile) {
      setError('Please upload carrier estimate')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('carrierFile', carrierFile)
      if (contractorFile) {
        formData.append('contractorFile', contractorFile)
      }
      if (claimId) {
        formData.append('claimId', claimId)
      }

      const response = await fetch('/api/estimate-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      router.push(`/estimate-analyzer/results?id=${data.analysisId}`)
    } catch (err) {
      setError('Failed to analyze estimates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Upgrade to Claim Command Pro to access the estimate analyzer and claim gap report generator.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="btn-primary"
          >
            Upgrade Now - $299
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Insurance Estimate Analyzer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your carrier estimate and optional contractor estimate to identify gaps and discrepancies.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Carrier Estimate */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Carrier Estimate (Required)</h2>
              <div
                {...carrierDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                  carrierDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                }`}
              >
                <input {...carrierDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {carrierFile ? (
                  <p className="font-medium">{carrierFile.name}</p>
                ) : (
                  <p>Drop carrier estimate PDF or click to browse</p>
                )}
              </div>
            </div>

            {/* Contractor Estimate */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Contractor Estimate (Optional)</h2>
              <div
                {...contractorDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                  contractorDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                }`}
              >
                <input {...contractorDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {contractorFile ? (
                  <p className="font-medium">{contractorFile.name}</p>
                ) : (
                  <p>Drop contractor estimate PDF or click to browse</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Estimates...
                </>
              ) : (
                'Generate Claim Gap Report'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
