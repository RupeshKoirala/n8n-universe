import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/saved-searches - Get user's saved searches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includePublic = searchParams.get('public') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('saved_searches')
      .select('*')

    if (includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq('user_id', userId)
    }

    // Sort by usage count and created_at
    query = query.order('usage_count', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const { data: savedSearches, error } = await query

    if (error) {
      console.error('Supabase saved searches error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      saved_searches: savedSearches || [],
      count: savedSearches?.length || 0
    })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/saved-searches - Create a new saved search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      description,
      query,
      filters = {},
      sortBy = 'popularity',
      sortOrder = 'desc',
      isPublic = false
    } = body

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      )
    }

    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name,
        description,
        query,
        filters,
        sort_by: sortBy,
        sort_order: sortOrder,
        is_public: isPublic
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create saved search' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      saved_search: savedSearch,
      message: 'Saved search created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
