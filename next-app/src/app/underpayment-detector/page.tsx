'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, AlertTriangle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'

export default function UnderpaymentDetectorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [carrierEstimate, setCarrierEstimate] = useState<File | null>(null)
  const [contractorEstimate, setContractorEstimate] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [policy, setPolicy] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/underpayment-detector')
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
    onDrop: (files) => setCarrierEstimate(files[0]),
  })

  const contractorDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => setContractorEstimate(files[0]),
  })

  const policyDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => setPolicy(files[0]),
  })

  const photosDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 10,
    onDrop: (files) => setPhotos([...photos, ...files]),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPaid) {
      router.push('/pricing')
      return
    }

    if (!carrierEstimate) {
      setError('Carrier estimate is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('carrierEstimate', carrierEstimate)
      if (contractorEstimate) formData.append('contractorEstimate', contractorEstimate)
      if (policy) formData.append('policy', policy)
      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo)
      })

      const response = await fetch('/api/underpayment-detector', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      router.push(`/underpayment-detector/results?id=${data.detectionId}`)
    } catch (err) {
      setError('Failed to analyze claim. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            The Underpayment Detector is available with Claim Command Pro.
          </p>
          <button onClick={() => router.push('/pricing')} className="btn-primary">
            Upgrade Now - $299
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Insurance Claim Underpayment Detector
            </h1>
            <p className="text-xl text-gray-600">
              Upload your claim documents and get a comprehensive underpayment analysis with recommended actions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Carrier Estimate */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Carrier Estimate (Required)
              </h2>
              <div
                {...carrierDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  carrierDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...carrierDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {carrierEstimate ? (
                  <div>
                    <p className="font-medium text-gray-900">{carrierEstimate.name}</p>
                    <p className="text-sm text-gray-500">{(carrierEstimate.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Drop carrier estimate PDF or click to browse</p>
                )}
              </div>
            </div>

            {/* Contractor Estimate */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                Contractor Estimate (Recommended)
              </h2>
              <div
                {...contractorDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  contractorDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...contractorDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {contractorEstimate ? (
                  <div>
                    <p className="font-medium text-gray-900">{contractorEstimate.name}</p>
                    <p className="text-sm text-gray-500">{(contractorEstimate.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Drop contractor estimate PDF or click to browse</p>
                )}
              </div>
            </div>

            {/* Photos */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Damage Photos (Optional)
              </h2>
              <div
                {...photosDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  photosDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...photosDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {photos.length > 0 ? (
                  <div>
                    <p className="font-medium text-gray-900">{photos.length} photos selected</p>
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {photos.slice(0, 5).map((photo, index) => (
                        <div key={index} className="text-xs text-gray-600 truncate">
                          {photo.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Drop damage photos or click to browse (up to 10)</p>
                )}
              </div>
            </div>

            {/* Policy */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                Insurance Policy (Optional)
              </h2>
              <div
                {...policyDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  policyDropzone.isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...policyDropzone.getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                {policy ? (
                  <div>
                    <p className="font-medium text-gray-900">{policy.name}</p>
                    <p className="text-sm text-gray-500">{(policy.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Drop insurance policy PDF or click to browse</p>
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
              className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Your Claim...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Detect Underpayment
                </>
              )}
            </button>
          </form>

          <div className="mt-8 card bg-blue-50 border-2 border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">What We Analyze:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Missing scope items in carrier estimate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Labor rate suppression and pricing discrepancies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Coverage trigger alignment with policy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Documentation gaps that could weaken your claim</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Recommended actions to maximize settlement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
