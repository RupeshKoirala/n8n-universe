'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface WorkflowCardProps {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  price: number
  download_count?: number
  rating?: number
}

export function WorkflowCard({
  id,
  name,
  description,
  category,
  tags,
  complexity,
  price,
  download_count = 0,
  rating = 0
}: WorkflowCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const complexityColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    advanced: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const categoryLabel = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        isHovered ? 'transform scale-105 shadow-2xl' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview Area */}
      <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center relative">
        <div className="text-white text-center p-4">
          <div className="text-6xl mb-2">⚡</div>
          <div className="font-semibold">{categoryLabel}</div>
        </div>
        {price > 0 && (
          <div className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full font-bold shadow">
            ${price}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold mb-2 line-clamp-1">{name}</h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
            {categoryLabel}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${complexityColors[complexity]}`}>
            {complexity}
          </span>
          {tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs">
              {tag.replace(/-/g, ' ')}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📥</span>
            <span>{download_count}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/workflows/${id}`}
          className="block w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
