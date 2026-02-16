'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchSuggestionsProps {
  onSearch: (query: string) => void
  placeholder?: string
}

interface Suggestion {
  type: 'workflow' | 'tag' | 'integration'
  value: string
  id?: string
  category?: string
}

export function SearchSuggestions({ onSearch, placeholder = "Search workflows..." }: SearchSuggestionsProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.value)
    setShowSuggestions(false)
    onSearch(suggestion.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    onSearch(query)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setShowSuggestions(false)
              onSearch('')
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
              Loading suggestions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
              No suggestions found
            </div>
          ) : (
            <>
              {suggestions
                .filter(s => s.type === 'workflow')
                .slice(0, 3)
                .map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">{suggestion.value}</span>
                      {suggestion.category && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </span>
                  </button>
                ))}

              {suggestions
                .filter(s => s.type === 'tag')
                .slice(0, 3)
                .map((suggestion) => (
                  <button
                    key={suggestion.value}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                        Tag
                      </span>
                      <span className="text-gray-900 dark:text-white">{suggestion.value}</span>
                    </div>
                    <span className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Search
                    </span>
                  </button>
                ))}

              {suggestions
                .filter(s => s.type === 'integration')
                .slice(0, 3)
                .map((suggestion) => (
                  <button
                    key={suggestion.value}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                        Integration
                      </span>
                      <span className="text-gray-900 dark:text-white">{suggestion.value}</span>
                    </div>
                    <span className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Search
                    </span>
                  </button>
                ))}

              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                <button
                  onClick={() => {
                    setShowSuggestions(false)
                    onSearch(query)
                  }}
                  className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-center"
                >
                  Search for "{query}"
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
