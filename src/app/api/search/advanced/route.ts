import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/search/advanced - Advanced search with multiple filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Search query
    const query = searchParams.get('q') || ''

    // Filters
    const category = searchParams.get('category')
    const complexity = searchParams.get('complexity')
    const difficulty = searchParams.get('difficulty')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const tags = searchParams.get('tags')?.split(',') || []
    const integrations = searchParams.get('integrations')?.split(',') || []
    const triggers = searchParams.get('triggers')?.split(',') || []
    const actions = searchParams.get('actions')?.split(',') || []

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let dbQuery = supabase
      .from('workflows')
      .select('*', { count: 'exact' })

    // Apply search query (text-based)
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    if (complexity) {
      dbQuery = dbQuery.eq('complexity', complexity)
    }

    if (difficulty) {
      dbQuery = dbQuery.eq('difficulty', difficulty)
    }

    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice))
    }

    if (tags.length > 0) {
      dbQuery = dbQuery.contains('tags', tags)
    }

    if (integrations.length > 0) {
      dbQuery = dbQuery.contains('integrations', integrations)
    }

    if (triggers.length > 0) {
      dbQuery = dbQuery.contains('triggers', triggers)
    }

    if (actions.length > 0) {
      dbQuery = dbQuery.contains('actions', actions)
    }

    // Apply sorting
    const validSortFields = [
      'created_at',
      'updated_at',
      'popularity',
      'rating',
      'price',
      'download_count',
      'name'
    ]

    if (validSortFields.includes(sortBy)) {
      dbQuery = dbQuery.order(sortBy, {
        ascending: sortOrder === 'asc'
      })
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    // Execute query
    const { data: workflows, error, count } = await dbQuery

    if (error) {
      console.error('Supabase advanced search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflows: workflows || [],
      count: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('Error in advanced search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/search/advanced - Semantic search with advanced filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      category,
      complexity,
      difficulty,
      minPrice,
      maxPrice,
      tags,
      integrations,
      triggers,
      actions,
      sortBy = 'popularity',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
      useSemantic = true
    } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Try semantic search if OpenAI is available
    if (useSemantic && process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: query
          })
        })

        if (response.ok) {
          const data = await response.json()
          const embedding = data.data[0].embedding

          // Use vector search with filters
          const { data: workflows, error, count } = await supabase.rpc('search_similar_workflows', {
            search_embedding: embedding,
            category_filter: category || null,
            complexity_filter: complexity || null,
            difficulty_filter: difficulty || null,
            min_price: minPrice || null,
            max_price: maxPrice || null,
            limit_count: limit + offset
          })

          if (!error && workflows) {
            // Apply pagination manually
            const paginatedWorkflows = workflows.slice(offset, offset + limit)

            // Apply additional array filters (tags, integrations, etc.)
            let filteredWorkflows = paginatedWorkflows

            if (tags && tags.length > 0) {
              filteredWorkflows = filteredWorkflows.filter((w: any) =>
                w.tags && tags.some((t: string) => w.tags.includes(t))
              )
            }

            if (integrations && integrations.length > 0) {
              filteredWorkflows = filteredWorkflows.filter((w: any) =>
                w.integrations && integrations.some((i: string) => w.integrations.includes(i))
              )
            }

            if (triggers && triggers.length > 0) {
              filteredWorkflows = filteredWorkflows.filter((w: any) =>
                w.triggers && triggers.some((t: string) => w.triggers.includes(t))
              )
            }

            if (actions && actions.length > 0) {
              filteredWorkflows = filteredWorkflows.filter((w: any) =>
                w.actions && actions.some((a: string) => w.actions.includes(a))
              )
            }

            // Apply sorting (if not already sorted by similarity)
            if (sortBy !== 'similarity') {
              const validSortFields = ['created_at', 'updated_at', 'popularity', 'rating', 'price', 'download_count', 'name']
              if (validSortFields.includes(sortBy)) {
                filteredWorkflows.sort((a: any, b: any) => {
                  const aVal = a[sortBy]
                  const bVal = b[sortBy]
                  if (sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1
                  } else {
                    return aVal < bVal ? 1 : -1
                  }
                })
              }
            }

            return NextResponse.json({
              workflows: filteredWorkflows,
              count: filteredWorkflows.length,
              total: workflows.length,
              limit,
              offset,
              search_type: 'semantic',
              hasMore: workflows.length > offset + limit
            })
          }
        }
      } catch (error) {
        console.error('Error in semantic search:', error)
        // Fall back to text search
      }
    }

    // Fall back to text-based search
    let textQuery = supabase
      .from('workflows')
      .select('*', { count: 'exact' })

    // Apply search query
    textQuery = textQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    // Apply filters
    if (category) {
      textQuery = textQuery.eq('category', category)
    }

    if (complexity) {
      textQuery = textQuery.eq('complexity', complexity)
    }

    if (difficulty) {
      textQuery = textQuery.eq('difficulty', difficulty)
    }

    if (minPrice) {
      textQuery = textQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      textQuery = textQuery.lte('price', parseFloat(maxPrice))
    }

    if (tags && tags.length > 0) {
      textQuery = textQuery.contains('tags', tags)
    }

    if (integrations && integrations.length > 0) {
      textQuery = textQuery.contains('integrations', integrations)
    }

    if (triggers && triggers.length > 0) {
      textQuery = textQuery.contains('triggers', triggers)
    }

    if (actions && actions.length > 0) {
      textQuery = textQuery.contains('actions', actions)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'popularity', 'rating', 'price', 'download_count', 'name']
    if (validSortFields.includes(sortBy)) {
      textQuery = textQuery.order(sortBy, {
        ascending: sortOrder === 'asc'
      })
    }

    // Apply pagination
    textQuery = textQuery.range(offset, offset + limit - 1)

    // Execute query
    const { data: workflows, error, count } = await textQuery

    if (error) {
      console.error('Supabase text search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflows: workflows || [],
      count: count || 0,
      limit,
      offset,
      search_type: 'text',
      hasMore: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('Error in advanced search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
