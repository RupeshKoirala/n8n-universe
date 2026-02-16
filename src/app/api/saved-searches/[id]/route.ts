import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/saved-searches/[id] - Get a specific saved search
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Increment usage count
    await supabase.rpc('increment_search_usage', { search_id: params.id })

    return NextResponse.json({ saved_search: savedSearch })
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/saved-searches/[id] - Update a saved search
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      query,
      filters,
      sortBy,
      sortOrder,
      isPublic
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (query !== undefined) updateData.query = query
    if (filters !== undefined) updateData.filters = filters
    if (sortBy !== undefined) updateData.sort_by = sortBy
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isPublic !== undefined) updateData.is_public = isPublic
    updateData.updated_at = new Date().toISOString()

    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { error: 'Failed to update saved search' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      saved_search: savedSearch,
      message: 'Saved search updated successfully'
    })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches/[id] - Delete a saved search
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
