import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/categories - Get available categories with counts
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Count workflows per category
    const categoryCounts: Record<string, number> = {}
    data?.forEach(workflow => {
      const category = workflow.category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    // Convert to array and sort
    const categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        label: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
