'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Star, Tag, Zap, Layers, DollarSign } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  nodes_count: number
  price: number
  download_count: number
  rating: number
  created_at: string
  updated_at: string
}

export default function WorkflowDetailPage() {
  const params = useParams()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchWorkflow(params.id as string)
    }
  }, [params.id])

  const fetchWorkflow = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workflows/${id}`)
      const data = await response.json()

      if (response.ok) {
        setWorkflow(data.workflow)
      } else {
        setError(data.error || 'Failed to fetch workflow')
      }
    } catch (error) {
      setError('An error occurred while fetching the workflow')
      console.error('Error fetching workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!workflow) return

    try {
      // In a real implementation, this would:
      // 1. Check if user is authenticated
      // 2. Check if user has permission to download
      // 3. Process payment if needed
      // 4. Return the workflow JSON file

      alert('Download functionality coming soon!')
    } catch (error) {
      console.error('Error downloading workflow:', error)
      alert('Failed to download workflow')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-300">{error || 'Workflow not found'}</p>
          <Link
            href="/workflows"
            className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Workflows
          </Link>
        </div>
      </div>
    )
  }

  const complexityColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    advanced: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const categoryLabel = workflow.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${complexityColors[workflow.complexity]}`}>
                    {workflow.complexity.charAt(0).toUpperCase() + workflow.complexity.slice(1)}
                  </span>
                  <h1 className="text-3xl font-bold mt-2">{workflow.name}</h1>
                </div>
                {workflow.price > 0 && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">
                      ${workflow.price}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      one-time purchase
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                {workflow.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {workflow.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Workflow Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Workflow Details
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
                  <div className="font-semibold">{categoryLabel}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nodes</div>
                  <div className="font-semibold">{workflow.nodes_count}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Rating
                  </div>
                  <div className="font-semibold">{workflow.rating.toFixed(1)} / 5.0</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Downloads
                  </div>
                  <div className="font-semibold">{workflow.download_count}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                  <div className="font-semibold">
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                  <div className="font-semibold">
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white sticky top-4">
              {workflow.price > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="text-sm opacity-80">Price</div>
                    <div className="text-4xl font-bold">${workflow.price}</div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors mb-3"
                  >
                    Purchase & Download
                  </button>
                  <div className="text-center text-sm opacity-80">
                    Instant access after purchase
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-sm opacity-80">Free</div>
                    <div className="text-4xl font-bold">$0</div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors mb-3"
                  >
                    Download Now
                  </button>
                  <div className="text-center text-sm opacity-80">
                    Free for personal use
                  </div>
                </>
              )}
            </div>

            {/* Features Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Features
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Ready to import into n8n</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Fully customizable nodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Clear documentation included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Community support available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
