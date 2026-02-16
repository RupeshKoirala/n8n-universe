import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/workflows/metadata - Get all tags, integrations, triggers, and actions
export async function GET(request: NextRequest) {
  try {
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('tags, integrations, triggers, actions')

    if (error) {
      console.error('Supabase metadata error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 500 }
      )
    }

    // Aggregate all unique values
    const tagsSet = new Set<string>()
    const integrationsSet = new Set<string>()
    const triggersSet = new Set<string>()
    const actionsSet = new Set<string>()

    workflows?.forEach((workflow: any) => {
      if (workflow.tags) {
        workflow.tags.forEach((tag: string) => tagsSet.add(tag))
      }
      if (workflow.integrations) {
        workflow.integrations.forEach((integration: string) => integrationsSet.add(integration))
      }
      if (workflow.triggers) {
        workflow.triggers.forEach((trigger: string) => triggersSet.add(trigger))
      }
      if (workflow.actions) {
        workflow.actions.forEach((action: string) => actionsSet.add(action))
      }
    })

    // Sort arrays alphabetically
    const metadata = {
      tags: Array.from(tagsSet).sort(),
      integrations: Array.from(integrationsSet).sort(),
      triggers: Array.from(triggersSet).sort(),
      actions: Array.from(actionsSet).sort()
    }

    return NextResponse.json({
      ...metadata,
      counts: {
        tags: tagsSet.size,
        integrations: integrationsSet.size,
        triggers: triggersSet.size,
        actions: actionsSet.size
      }
    })
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
