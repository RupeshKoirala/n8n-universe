import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/search - Semantic search using embeddings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, category, complexity, limit = 20 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // If OpenAI is available, generate embedding for the query
    let embedding: number[] | null = null

    if (process.env.OPENAI_API_KEY) {
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
          embedding = data.data[0].embedding
        }
      } catch (error) {
        console.error('Error generating embedding:', error)
        // Fall back to text search if embedding fails
      }
    }

    // If we have embedding, use semantic search
    if (embedding) {
      const { data, error } = await supabase.rpc('search_workflows', {
        search_query: query,
        category_filter: category || null,
        complexity_filter: complexity || null,
        limit_count: limit
      })

      if (error) {
        console.error('Supabase search error:', error)
        // Fall back to text search
      } else {
        return NextResponse.json({
          workflows: data,
          search_type: 'semantic',
          count: data?.length || 0
        })
      }
    }

    // Fall back to text-based search
    let textQuery = supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (category) {
      textQuery = textQuery.eq('category', category)
    }

    if (complexity) {
      textQuery = textQuery.eq('complexity', complexity)
    }

    // Search in name, description, and tags
    textQuery = textQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    const { data, error } = await textQuery

    if (error) {
      console.error('Supabase text search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflows: data,
      search_type: 'text',
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error in search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/search - Simple keyword search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const complexity = searchParams.get('complexity')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    let dbQuery = supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    if (complexity) {
      dbQuery = dbQuery.eq('complexity', complexity)
    }

    // Search in name, description, and tags
    dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    const { data, error } = await dbQuery

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflows: data,
      search_type: 'text',
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error in search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
