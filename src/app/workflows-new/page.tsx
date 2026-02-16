'use client'

import { useState, useEffect } from 'react'
import { WorkflowCard } from '@/components/workflow-card'
import { SearchSuggestions } from '@/components/search-suggestions'
import { AdvancedFilters, FilterState } from '@/components/advanced-filters'
import { Search, Grid3X3, List, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

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
  created_at: string
}

interface Category {
  category: string
  count: number
  label: string
}

interface Metadata {
  tags: string[]
  integrations: string[]
  triggers: string[]
  actions: string[]
}

interface TrendingWorkflow extends Workflow {
  reason: string
}

export default function EnhancedWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [metadata, setMetadata] = useState<Metadata>({
    tags: [],
    integrations: [],
    triggers: [],
    actions: []
  })
  const [trendingWorkflows, setTrendingWorkflows] = useState<TrendingWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    complexity: '',
    difficulty: '',
    minPrice: null,
    maxPrice: null,
    tags: [],
    integrations: [],
    triggers: [],
    actions: [],
    sortBy: 'popularity',
    sortOrder: 'desc' as const
  })

  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    fetchCategories()
    fetchMetadata()
    fetchTrendingWorkflows()
  }, [])

  useEffect(() => {
    if (filters.category || filters.complexity || filters.difficulty ||
        filters.minPrice !== null || filters.maxPrice !== null ||
        filters.tags.length > 0 || filters.integrations.length > 0 ||
        filters.triggers.length > 0 || filters.actions.length > 0) {
      fetchWorkflows()
    }
  }, [filters])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchMetadata = async () => {
    try {
      const response = await fetch('/api/workflows/metadata')
      const data = await response.json()
      setMetadata(data)
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  const fetchTrendingWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/trending?limit=6')
      const data = await response.json()
      setTrendingWorkflows(data.trending?.map((w: Workflow) => ({
        ...w,
        reason: 'Trending this week'
      })) || [])
    } catch (error) {
      console.error('Error fetching trending workflows:', error)
    }
  }

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * itemsPerPage

      const requestBody = {
        query: '',
        category: filters.category || undefined,
        complexity: filters.complexity || undefined,
        difficulty: filters.difficulty || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        integrations: filters.integrations.length > 0 ? filters.integrations : undefined,
        triggers: filters.triggers.length > 0 ? filters.triggers : undefined,
        actions: filters.actions.length > 0 ? filters.actions : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: itemsPerPage,
        offset,
        useSemantic: true
      }

      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      setWorkflows(data.workflows || [])
      setTotalCount(data.count || 0)
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setCurrentPage(1)
    fetchWorkflows()
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setCurrentPage(1)
    setFilters(newFilters)
  }

  const hasActiveFilters = () => {
    return filters.category ||
           filters.complexity ||
           filters.difficulty ||
           filters.minPrice !== null ||
           filters.maxPrice !== null ||
           filters.tags.length > 0 ||
           filters.integrations.length > 0 ||
           filters.triggers.length > 0 ||
           filters.actions.length > 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Hero Section with Search */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Discover Automation Workflows
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Browse thousands of ready-to-use n8n automations to supercharge your productivity
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <SearchSuggestions
              onSearch={handleSearch}
              placeholder="Search workflows by name, tag, or integration..."
            />
          </div>

          {/* Trending Workflows */}
          {trendingWorkflows.length > 0 && !hasActiveFilters() && (
            <div className="max-w-7xl mx-auto mt-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trending This Week
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingWorkflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} {...workflow} />
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/workflows"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  View All Workflows
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <AdvancedFilters
              categories={categories}
              metadata={metadata}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
          </aside>

          {/* Workflows Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hasActiveFilters() ? 'Filtered Results' : 'All Workflows'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {loading ? 'Loading...' : `${totalCount} workflows found`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Filters
                </button>

                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${
                      viewMode === 'grid'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${
                      viewMode === 'list'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-6">
                <AdvancedFilters
                  categories={categories}
                  metadata={metadata}
                  onFilterChange={handleFilterChange}
                  filters={filters}
                />
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading workflows...</p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  No workflows found
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your search or filters
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={() => handleFilterChange({
                      category: '',
                      complexity: '',
                      difficulty: '',
                      minPrice: null,
                      maxPrice: null,
                      tags: [],
                      integrations: [],
                      triggers: [],
                      actions: [],
                      sortBy: 'popularity',
                      sortOrder: 'desc'
                    })}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Workflow Cards */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {workflows.map((workflow) => (
                    <WorkflowCard key={workflow.id} {...workflow} />
                  ))}
                </div>

                {/* Pagination */}
                {totalCount > itemsPerPage && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
