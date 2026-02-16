'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface AdvancedFiltersProps {
  categories: any[]
  metadata: {
    tags: string[]
    integrations: string[]
    triggers: string[]
    actions: string[]
  }
  onFilterChange: (filters: FilterState) => void
  filters: FilterState
}

export interface FilterState {
  category: string
  complexity: string
  difficulty: string
  minPrice: number | null
  maxPrice: number | null
  tags: string[]
  integrations: string[]
  triggers: string[]
  actions: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const complexities = ['simple', 'medium', 'complex', 'expert']
const difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
const sortOptions = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'download_count', label: 'Most Downloaded' },
  { value: 'created_at', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'name', label: 'Name: A to Z' }
]

export function AdvancedFilters({ categories, metadata, onFilterChange, filters }: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    complexity: true,
    price: false,
    tags: false,
    integrations: false,
    triggers: false,
    actions: false,
    sort: true
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleArrayFilter = (field: keyof FilterState, value: string) => {
    const currentArray = filters[field] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    onFilterChange({ ...filters, [field]: newArray })
  }

  const handleClear = () => {
    onFilterChange({
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={handleClear}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
        >
          Category
          {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.category && (
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.category} value={cat.category}>
                {cat.label} ({cat.count})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Complexity */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('complexity')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
        >
          Complexity
          {expandedSections.complexity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.complexity && (
          <div className="space-y-2">
            <select
              value={filters.complexity}
              onChange={(e) => onFilterChange({ ...filters, complexity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              {complexities.map((comp) => (
                <option key={comp} value={comp}>
                  {comp.charAt(0).toUpperCase() + comp.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={filters.difficulty}
              onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
        >
          Price Range
          {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.price && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Min Price</label>
              <input
                type="number"
                min="0"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max Price</label>
              <input
                type="number"
                min="0"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {metadata.tags.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
          >
            Tags
            {expandedSections.tags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.tags && (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {metadata.tags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleArrayFilter('tags', tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Integrations */}
      {metadata.integrations.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('integrations')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
          >
            Integrations
            {expandedSections.integrations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.integrations && (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {metadata.integrations.slice(0, 15).map((integration) => (
                <button
                  key={integration}
                  onClick={() => handleArrayFilter('integrations', integration)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.integrations.includes(integration)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {integration}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sort */}
      <div>
        <button
          onClick={() => toggleSection('sort')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-2"
        >
          Sort By
          {expandedSections.sort ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.sort && (
          <div className="space-y-2">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                onFilterChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {sortOptions.map(option => (
                <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                  {option.label}
                </option>
              ))}
              <option value="price-asc">Price: High to Low</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm flex items-center gap-1">
                Category: {categories.find((c: any) => c.category === filters.category)?.label}
              </span>
            )}
            {filters.complexity && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm flex items-center gap-1">
                Complexity: {filters.complexity}
              </span>
            )}
            {filters.difficulty && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm flex items-center gap-1">
                Difficulty: {filters.difficulty}
              </span>
            )}
            {filters.minPrice !== null && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm">
                Min: ${filters.minPrice}
              </span>
            )}
            {filters.maxPrice !== null && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm">
                Max: ${filters.maxPrice}
              </span>
            )}
            {filters.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm">
                {tag}
              </span>
            ))}
            {filters.integrations.map(int => (
              <span key={int} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm">
                {int}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
