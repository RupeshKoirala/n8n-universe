'use client'

import { useState, useEffect } from 'react'
import { WorkflowCard } from '@/components/workflow-card'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  price: number
  download_count: number
  rating: number
}

interface Category {
  category: string
  count: number
  label: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const complexities = ['beginner', 'intermediate', 'advanced', 'expert']

  useEffect(() => {
    fetchWorkflows()
    fetchCategories()
  }, [selectedCategory, selectedComplexity, searchQuery])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      let url = '/api/workflows?'

      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`
      if (selectedCategory) url += `category=${selectedCategory}&`
      if (selectedComplexity) url += `complexity=${selectedComplexity}&`

      const response = await fetch(url)
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWorkflows()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Browse Workflows
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Complexity Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Complexity
                </label>
                <select
                  value={selectedComplexity}
                  onChange={(e) => setSelectedComplexity(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  {complexities.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp.charAt(0).toUpperCase() + comp.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedComplexity('')
                  setSearchQuery('')
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
              Loading workflows...
            </div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No workflows found</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-gray-600 dark:text-gray-300">
              Found {workflows.length} workflows
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard key={workflow.id} {...workflow} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
