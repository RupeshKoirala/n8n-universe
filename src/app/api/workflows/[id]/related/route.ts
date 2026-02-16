import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/workflows/[id]/related - Get related/similar workflows
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '6')

    // Get the original workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Find related workflows using multiple strategies
    let relatedWorkflows: any[] = []

    // Strategy 1: Same category
    const { data: sameCategory } = await supabase
      .from('workflows')
      .select('*')
      .eq('category', workflow.category)
      .neq('id', workflowId)
      .limit(limit)

    if (sameCategory) {
      sameCategory.forEach(w => {
        w.relevanceScore = 0.5
        w.reason = 'Same category'
      })
      relatedWorkflows.push(...sameCategory)
    }

    // Strategy 2: Same tags
    if (workflow.tags && workflow.tags.length > 0) {
      const { data: sameTags } = await supabase
        .from('workflows')
        .select('*')
        .contains('tags', workflow.tags.slice(0, 2)) // Use first 2 tags
        .neq('id', workflowId)
        .limit(limit)

      if (sameTags) {
        sameTags.forEach((w: any) => {
          const existing = relatedWorkflows.find(rw => rw.id === w.id)
          if (existing) {
            existing.relevanceScore += 0.3
            existing.reason = 'Same category + tags'
          } else {
            w.relevanceScore = 0.4
            w.reason = 'Same tags'
            relatedWorkflows.push(w)
          }
        })
      }
    }

    // Strategy 3: Same integrations
    if (workflow.integrations && workflow.integrations.length > 0) {
      const { data: sameIntegrations } = await supabase
        .from('workflows')
        .select('*')
        .contains('integrations', workflow.integrations.slice(0, 2))
        .neq('id', workflowId)
        .limit(limit)

      if (sameIntegrations) {
        sameIntegrations.forEach((w: any) => {
          const existing = relatedWorkflows.find(rw => rw.id === w.id)
          if (existing) {
            existing.relevanceScore += 0.3
          } else {
            w.relevanceScore = 0.3
            w.reason = 'Same integrations'
            relatedWorkflows.push(w)
          }
        })
      }
    }

    // Strategy 4: Semantic search (if embeddings are available)
    if (workflow.embedding && process.env.OPENAI_API_KEY) {
      const { data: semantic } = await supabase.rpc('search_similar_workflows', {
        search_embedding: workflow.embedding,
        category_filter: null,
        complexity_filter: null,
        difficulty_filter: null,
        min_price: null,
        max_price: null,
        limit_count: limit + 5
      })

      if (semantic) {
        semantic.forEach((w: any) => {
          if (w.id !== workflowId) {
            const existing = relatedWorkflows.find(rw => rw.id === w.id)
            if (existing) {
              existing.relevanceScore += 0.4
            } else {
              w.relevanceScore = 0.6
              w.reason = 'Similar content'
              relatedWorkflows.push(w)
            }
          }
        })
      }
    }

    // Strategy 5: Same complexity and difficulty
    const { data: sameComplexity } = await supabase
      .from('workflows')
      .select('*')
      .eq('complexity', workflow.complexity)
      .eq('difficulty', workflow.difficulty)
      .neq('id', workflowId)
      .limit(limit)

    if (sameComplexity) {
      sameComplexity.forEach((w: any) => {
        const existing = relatedWorkflows.find(rw => rw.id === w.id)
        if (existing) {
          existing.relevanceScore += 0.1
        } else {
          w.relevanceScore = 0.2
          w.reason = 'Similar complexity'
          relatedWorkflows.push(w)
        }
      })
    }

    // Remove duplicates (keep highest relevance score)
    const workflowMap = new Map<string, any>()
    relatedWorkflows.forEach(w => {
      const existing = workflowMap.get(w.id)
      if (!existing || w.relevanceScore > existing.relevanceScore) {
        workflowMap.set(w.id, w)
      }
    })

    // Sort by relevance score and limit
    const finalRelated = Array.from(workflowMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return NextResponse.json({
      related: finalRelated,
      original: {
        id: workflow.id,
        name: workflow.name,
        category: workflow.category
      }
    })
  } catch (error) {
    console.error('Error fetching related workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
