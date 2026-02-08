import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/stats - Get marketplace statistics
export async function GET(request: NextRequest) {
  try {
    // Get total workflows
    const { count: totalWorkflows, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get total downloads
    const { data: downloadsData, error: downloadsError } = await supabase
      .from('workflows')
      .select('download_count')

    if (downloadsError) throw downloadsError

    const totalDownloads = downloadsData?.reduce((sum, wf) => sum + (wf.download_count || 0), 0) || 0

    // Get average rating
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('workflows')
      .select('rating')

    if (ratingsError) throw ratingsError

    const averageRating = ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((sum, wf) => sum + (wf.rating || 0), 0) / ratingsData.length
      : 0

    // Get category breakdown
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('workflows')
      .select('category')

    if (categoriesError) throw categoriesError

    const categoryBreakdown: Record<string, number> = {}
    categoriesData?.forEach(wf => {
      categoryBreakdown[wf.category] = (categoryBreakdown[wf.category] || 0) + 1
    })

    // Get complexity breakdown
    const { data: complexityData, error: complexityError } = await supabase
      .from('workflows')
      .select('complexity')

    if (complexityError) throw complexityError

    const complexityBreakdown: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    }

    complexityData?.forEach(wf => {
      const comp = wf.complexity
      if (comp && complexityBreakdown.hasOwnProperty(comp)) {
        complexityBreakdown[comp]++
      }
    })

    return NextResponse.json({
      total_workflows: totalWorkflows || 0,
      total_downloads: totalDownloads,
      average_rating: Math.round(averageRating * 100) / 100,
      categories: Object.entries(categoryBreakdown)
        .map(([category, count]) => ({
          category,
          count,
          label: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }))
        .sort((a, b) => b.count - a.count),
      complexity: complexityBreakdown
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
