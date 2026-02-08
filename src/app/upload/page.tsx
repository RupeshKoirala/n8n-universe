'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; workflow?: any } | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setResult({
        success: false,
        message: 'Please upload a JSON file'
      })
      return
    }

    setFile(file)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: 'Workflow uploaded successfully!',
          workflow: data.workflow
        })
        setFile(null)
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred during upload'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Upload Workflow
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Result Message */}
          {result && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{result.message}</span>
              </div>
              {result.success && result.workflow && (
                <div className="mt-3">
                  <a
                    href={`/workflows/${result.workflow.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View your workflow →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border-2 border-dashed transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".json"
              onChange={handleChange}
              disabled={uploading}
            />

            {!file ? (
              <>
                <Upload className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">
                  Drop your n8n workflow here
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  or click to browse for a JSON file
                </p>
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Select File
                </label>
              </>
            ) : (
              <div className="text-left">
                <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">{file.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Workflow'}
                </button>
                <button
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                  }}
                  disabled={uploading}
                  className="w-full mt-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-bold mb-4">How to prepare your workflow</h3>
            <ol className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Export your workflow from n8n as a JSON file</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Make sure the workflow is working correctly</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Give your workflow a descriptive name</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Upload the file above - we'll automatically extract metadata!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
