import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/workflows/trending - Get trending workflows
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const timeframe = searchParams.get('timeframe') || '7d' // 7d, 30d, 90d

    // Calculate date threshold based on timeframe
    const now = new Date()
    let daysToSubtract = 7
    if (timeframe === '30d') daysToSubtract = 30
    if (timeframe === '90d') daysToSubtract = 90

    const dateThreshold = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000).toISOString()

    // Get trending workflows (high download count + recent)
    const { data: trending, error } = await supabase
      .from('workflows')
      .select('*')
      .gte('created_at', dateThreshold)
      .gt('download_count', 0)
      .order('download_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase trending error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trending workflows' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      trending: trending || [],
      timeframe,
      count: trending?.length || 0
    })
  } catch (error) {
    console.error('Error fetching trending workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
