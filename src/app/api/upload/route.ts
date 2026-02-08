import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/upload - Upload and index a workflow JSON file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check if it's a JSON file
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Only JSON files are allowed' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    let workflowJson

    try {
      workflowJson = JSON.parse(content)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON file' },
        { status: 400 }
      )
    }

    // Validate it's an n8n workflow
    if (!workflowJson.nodes || !Array.isArray(workflowJson.nodes)) {
      return NextResponse.json(
        { error: 'Invalid n8n workflow format' },
        { status: 400 }
      )
    }

    // Extract metadata
    const name = workflowJson.name || file.name.replace('.json', '')
    const nodes = workflowJson.nodes
    const nodeCount = nodes.length

    // Generate description
    const description = generateDescription(workflowJson)

    // Determine category
    const category = determineCategory(workflowJson)

    // Calculate complexity
    const complexity = calculateComplexity(nodes)

    // Generate tags
    const tags = generateTags(workflowJson)

    // Calculate price
    const price = calculatePrice(complexity, nodeCount)

    // Generate embedding (if OpenAI is available)
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
            input: `${name}. ${description}. Tags: ${tags.join(', ')}`
          })
        })

        if (response.ok) {
          const data = await response.json()
          embedding = data.data[0].embedding
        }
      } catch (error) {
        console.error('Error generating embedding:', error)
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        name,
        description,
        category,
        tags,
        complexity,
        nodes_count: nodeCount,
        file_path: file.name,
        file_size: content.length,
        price,
        embedding
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflow: data,
      message: 'Workflow uploaded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateDescription(workflow: any): string {
  const nodes = workflow.nodes || []
  const triggers = nodes.filter((n: any) =>
    n.type?.includes('trigger') || n.type?.includes('Trigger')
  )

  if (triggers.length === 0) {
    return `${nodes.length}-node workflow for general automation`
  }

  const triggerNames = triggers.map((t: any) =>
    t.type.split('.').pop().replace('Trigger', '')
  )

  return `${nodes.length}-node workflow triggered by ${triggerNames.join(', ')}`
}

function determineCategory(workflow: any): string {
  const nodeTypes = (workflow.nodes || [])
    .map((n: any) => n.type?.toLowerCase() || '')
    .join(' ')

  const categoryMap: Record<string, string[]> = {
    'email-automation': ['email', 'gmail', 'outlook', 'mailgun', 'sendgrid'],
    'communication': ['slack', 'discord', 'telegram', 'whatsapp', 'teams'],
    'data-management': ['sheets', 'airtable', 'notion', 'mysql', 'postgres', 'mongodb'],
    'e-commerce': ['shopify', 'woocommerce', 'stripe', 'square', 'magento'],
    'ai-automation': ['openai', 'chatgpt', 'gpt', 'anthropic', 'claude', 'huggingface'],
    'social-media': ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'],
    'crm': ['hubspot', 'salesforce', 'pipedrive', 'zoho'],
    'productivity': ['todoist', 'trello', 'asana', 'notion', 'monday']
  }

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => nodeTypes.includes(kw))) {
      return category
    }
  }

  return 'general-automation'
}

function calculateComplexity(nodes: any[]): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const nodeCount = nodes.length
  const uniqueTypes = new Set(nodes.map(n => n.type)).size

  if (nodeCount <= 3 && uniqueTypes <= 3) return 'beginner'
  if (nodeCount <= 10 && uniqueTypes <= 7) return 'intermediate'
  if (nodeCount <= 25) return 'advanced'
  return 'expert'
}

function calculatePrice(complexity: string, nodeCount: number): number {
  const basePrices = {
    beginner: 1.0,
    intermediate: 2.0,
    advanced: 3.5,
    expert: 5.0
  }

  let price = basePrices[complexity as keyof typeof basePrices] || 2.0

  // Discount for very simple workflows
  if (nodeCount <= 3) {
    price = Math.min(price, 1.0)
  }

  return Math.round(price * 100) / 100
}

function generateTags(workflow: any): string[] {
  const tags = new Set<string>()
  const nodeTypes = (workflow.nodes || []).map((n: any) => n.type?.toLowerCase() || '')

  // Category tag
  tags.add(determineCategory(workflow))

  // Integration tags
  const integrations = ['slack', 'gmail', 'notion', 'google', 'openai', 'airtable', 'trello', 'hubspot', 'shopify', 'stripe', 'salesforce', 'todoist', 'asana', 'twitter', 'linkedin', 'mailgun', 'sendgrid']
  integrations.forEach(integration => {
    if (nodeTypes.some((t: string) => t.includes(integration))) {
      tags.add(`${integration}-automation`)
    }
  })

  // Complexity tag
  const complexity = calculateComplexity(workflow.nodes || [])
  tags.add(`${complexity}-difficulty`)

  return Array.from(tags).sort()
}
