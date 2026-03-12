'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, FileText } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export default function EstimateScanPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        setError('')
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please upload an estimate document')
      return
    }
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', email)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/estimate-scan', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      router.push(`/estimate-scan/results?id=${data.scanId}`)
    } catch (err) {
      setError('Failed to analyze estimate. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Claim Command Pro</h1>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <FileText className="w-4 h-4" />
              Free Estimate Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Scan Your Insurance Estimate For Hidden Underpayments
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Upload your insurance estimate and see if your claim may be underpaid.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Free Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Results in 60 Seconds</span>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <div className="card max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Estimate Document
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50 scale-105'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  {file ? (
                    <div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {!loading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFile(null)
                          }}
                          className="text-sm text-red-600 hover:text-red-700 mt-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your insurance estimate here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, DOC, DOCX • Up to 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Analyzing estimate...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Scanning Estimate...
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6" />
                    Scan Estimate - Free
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">🔒</span>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">⚡</span>
                  <span>60 Second Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Trusted by homeowners nationwide
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <span>🔒 Bank-level encryption</span>
              <span>•</span>
              <span>📊 AI-powered analysis</span>
              <span>•</span>
              <span>⚡ Instant results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
