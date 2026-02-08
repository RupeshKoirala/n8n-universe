import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/workflows/[id] - Get a single workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({ workflow: data })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    const allowedFields = ['name', 'description', 'category', 'tags', 'complexity', 'nodes_count', 'price']

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflow: data,
      message: 'Workflow updated successfully'
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Workflow deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
