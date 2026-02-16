import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/search/suggestions - Get search suggestions for autocomplete
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '8')

    if (query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        count: 0
      })
    }

    // Get workflow name suggestions
    const { data: nameSuggestions, error: nameError } = await supabase
      .from('workflows')
      .select('name, id, category')
      .ilike('name', `%${query}%`)
      .limit(limit)

    // Get tag suggestions
    const { data: workflows, error: tagError } = await supabase
      .from('workflows')
      .select('tags')
      .contains('tags', [query])

    // Extract unique tag suggestions
    const tagsSet = new Set<string>()
    workflows?.forEach((workflow: any) => {
      if (workflow.tags) {
        workflow.tags
          .filter((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
          .forEach((tag: string) => tagsSet.add(tag))
      }
    })

    const tagSuggestions = Array.from(tagsSet)
      .slice(0, limit)
      .map(tag => ({ type: 'tag', value: tag }))

    // Get integration suggestions
    const { data: intWorkflows, error: intError } = await supabase
      .from('workflows')
      .select('integrations')
      .contains('integrations', [query])

    const integrationsSet = new Set<string>()
    intWorkflows?.forEach((workflow: any) => {
      if (workflow.integrations) {
        workflow.integrations
          .filter((int: string) => int.toLowerCase().includes(query.toLowerCase()))
          .forEach((int: string) => integrationsSet.add(int))
      }
    })

    const integrationSuggestions = Array.from(integrationsSet)
      .slice(0, limit)
      .map(integration => ({ type: 'integration', value: integration }))

    // Build final suggestions array
    const suggestions = [
      ...nameSuggestions?.map(w => ({
        type: 'workflow',
        value: w.name,
        id: w.id,
        category: w.category
      })) || [],
      ...tagSuggestions,
      ...integrationSuggestions
    ]

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit * 2),
      counts: {
        workflows: nameSuggestions?.length || 0,
        tags: tagsSet.size,
        integrations: integrationsSet.size
      }
    })
  } catch (error) {
    console.error('Error in search suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
