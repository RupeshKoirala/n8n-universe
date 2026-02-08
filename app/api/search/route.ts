import type { Workflow, CreateWorkflowRequest } from '../types';

// Mock database for workflow search
const workflowsDatabase: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Social Media Content Scheduler',
    description: 'Automate posting content across social media platforms',
    complexity: 'medium',
    category: 'marketing',
    tags: ['social-media', 'content', 'automation', 'marketing'],
    triggers: ['cron'],
    actions: ['http-request', 'set'],
    integrations: ['twitter', 'facebook', 'instagram', 'linkedin'],
    difficulty: 'intermediate',
    price: 5,
    popularity: 250,
    rating: 4.5,
    file_path: '/workflows/social-media-scheduler.json',
    file_size: 2048,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'wf-2',
    name: 'E-commerce Order Processing',
    description: 'Process orders from multiple e-commerce platforms and update inventory',
    complexity: 'complex',
    category: 'e-commerce',
    tags: ['e-commerce', 'automation', 'order-processing', 'inventory'],
    triggers: ['webhook'],
    actions: ['http-request', 'set', 'if-else', 'get'],
    integrations: ['shopify', 'woocommerce', 'magento', 'stripe'],
    difficulty: 'advanced',
    price: 15,
    popularity: 400,
    rating: 4.2,
    file_path: '/workflows/e-commerce-order-processing.json',
    file_size: 8192,
    created_at: '2026-01-10T14:30:00.000Z',
    updated_at: '2026-01-10T14:30:00.000Z'
  },
  {
    id: 'wf-3',
    name: 'Email List Cleaning & Categorization',
    description: 'Automatically clean and categorize email inbox, detect spam, prioritize important emails',
    complexity: 'medium',
    category: 'productivity',
    tags: ['email', 'productivity', 'automation', 'cleaning'],
    triggers: ['email-trigger'],
    actions: ['http-request', 'set', 'get', 'delete', 'if-else'],
    integrations: ['gmail', 'outlook'],
    difficulty: 'intermediate',
    price: 3,
    popularity: 150,
    rating: 4.8,
    file_path: '/workflows/email-cleaner.json',
    file_size: 1024,
    created_at: '2026-01-05T09:15:00.000Z',
    updated_at: '2026-01-05T09:15:00.000Z'
  },
  {
    id: 'wf-4',
    name: 'Customer Support AI Chatbot',
    description: 'AI-powered chatbot that handles customer support queries, provides answers, and escalates to human agents',
    complexity: 'complex',
    category: 'customer-support',
    tags: ['ai', 'chatbot', 'customer-support', 'automation', 'nlp'],
    triggers: ['webhook'],
    actions: ['http-request', 'set', 'get', 'post', 'if-else'],
    integrations: ['openai', 'anthropic', 'n8n', 'supabase'],
    difficulty: 'advanced',
    price: 20,
    popularity: 600,
    rating: 4.6,
    file_path: '/workflows/ai-support-chatbot.json',
    file_size: 6144,
    created_at: '2026-01-08T16:45:00.000Z',
    updated_at: '2026-01-08T16:45:00.000Z'
  },
  {
    id: 'wf-5',
    name: 'Newsletter Subscription Manager',
    description: 'Manage newsletter subscriptions, handle unsubscribes, and track engagement metrics',
    complexity: 'medium',
    category: 'marketing',
    tags: ['email', 'newsletter', 'marketing', 'automation', 'subscriptions'],
    triggers: ['webhook', 'email-trigger'],
    actions: ['http-request', 'set', 'get', 'post', 'delete'],
    integrations: ['mailchimp', 'sendgrid', 'convertkit'],
    difficulty: 'intermediate',
    price: 7,
    popularity: 200,
    rating: 4.1,
    file_path: '/workflows/newsletter-manager.json',
    file_size: 1536,
    created_at: '2026-01-12T11:20:00.000Z',
    updated_at: '2026-01-12T11:20:00.000Z'
  },
  {
    id: 'wf-6',
    name: 'Website Performance Monitor',
    description: 'Monitor website uptime, page load times, and user engagement metrics',
    complexity: 'simple',
    category: 'productivity',
    tags: ['web', 'monitoring', 'analytics', 'productivity', 'uptime'],
    triggers: ['cron'],
    actions: ['http-request', 'get', 'set', 'if-else'],
    integrations: ['uptime-robot', 'pingdom', 'google-analytics', 'sentry'],
    difficulty: 'beginner',
    price: 2,
    popularity: 120,
    rating: 4.9,
    file_path: '/workflows/website-monitor.json',
    file_size: 512,
    created_at: '2026-01-02T08:45:00.000Z',
    updated_at: '2026-01-02T08:45:00.000Z'
  },
  {
    id: 'wf-7',
    name: 'Daily Sales Report Generator',
    description: 'Generate comprehensive daily sales reports across all platforms and channels',
    complexity: 'complex',
    category: 'productivity',
    tags: ['reporting', 'analytics', 'sales', 'automation', 'data'],
    triggers: ['cron'],
    actions: ['http-request', 'set', 'get', 'transform', 'if-else'],
    integrations: ['shopify', 'stripe', 'google-sheets', 'notion'],
    difficulty: 'advanced',
    price: 12,
    popularity: 320,
    rating: 4.7,
    file_path: '/workflows/daily-sales-report.json',
    file_size: 2560,
    created_at: '2026-01-18T13:30:00.000Z',
    updated_at: '2026-01-18T13:30:00.000Z'
  }
];

// Semantic similarity using OpenAI embeddings (will be replaced with actual implementation)
function calculateSimilarity(workflow: Workflow, searchQuery: string): number {
  if (!searchQuery) return 0;
  
  const queryLower = searchQuery.toLowerCase();
  const nameScore = workflow.name.toLowerCase().includes(queryLower) ? 0.3 : 0;
  const descScore = workflow.description.toLowerCase().includes(queryLower) ? 0.2 : 0;
  
  // Tag matching (higher weight)
  let tagScore = 0;
  if (searchQuery) {
    tagScore = workflow.tags.some(tag => tag.toLowerCase().includes(queryLower)) ? 0.4 : 0;
  }
  
  // Integration matching (higher weight)
  let integrationScore = 0;
  if (searchQuery) {
    integrationScore = workflow.integrations.some(integ => integ.toLowerCase().includes(queryLower)) ? 0.3 : 0;
  }
  
  return nameScore + descScore + tagScore + integrationScore;
}

export type SearchFilters = {
  category?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  integration?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
};

export type SearchResult = {
  workflow: Workflow;
  similarity_score: number;
  matches: {
    name?: boolean;
    description?: boolean;
    tags?: boolean;
    category?: boolean;
    integrations?: string[];
  };
}

export async function POST(request: Request) {
  const { searchParams } = await request.json() as { search: string; filters?: SearchFilters };
  
  if (!searchParams.search && !searchParams.filters) {
    return Response.json({
      workflows: [],
      error: 'Search query or filters required'
    }, { status: 400 });
  }

  const searchTerm = searchParams.search.toLowerCase();
  
  // Filter workflows
  let filtered = workflowsDatabase.filter(workflow => {
    // Keyword search
    if (searchParams.search) {
      const searchLower = searchParams.search.toLowerCase();
      return (
        workflow.name.toLowerCase().includes(searchLower) ||
        workflow.description.toLowerCase().includes(searchLower) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        workflow.integrations.some(integ => integ.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (searchParams.filters?.category) {
      return workflow.category.toLowerCase() === searchParams.filters.category.toLowerCase();
    }

    // Complexity filter
    if (searchParams.filters?.complexity) {
      return workflow.complexity === searchParams.filters.complexity;
    }

    // Difficulty filter
    if (searchParams.filters?.difficulty) {
      return workflow.difficulty === searchParams.filters.difficulty;
    }

    // Integration filter
    if (searchParams.filters?.integration) {
      return workflow.integrations.includes(searchParams.filters.integration);
    }

    // Price filters
    if (searchParams.filters?.min_price !== undefined) {
      return workflow.price !== undefined && workflow.price >= searchParams.filters.min_price;
    }

    if (searchParams.filters?.max_price !== undefined) {
      return workflow.price !== undefined && workflow.price <= searchParams.filters.max_price;
    }

    // Tags filter (any tag matches)
    if (searchParams.filters?.tags && searchParams.filters.tags.length > 0) {
      return searchParams.filters.tags.some(tag => workflow.tags.includes(tag));
    }
  });

  // Calculate similarity scores for search results
  const resultsWithSimilarity = filtered.map(workflow => ({
    workflow,
    similarity_score: calculateSimilarity(workflow, searchTerm),
    matches: {
      name: workflow.name.toLowerCase().includes(searchTerm),
      description: workflow.description.toLowerCase().includes(searchTerm),
      tags: workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm)),
      category: searchTerm ? workflow.category.toLowerCase() === searchTerm : undefined,
      integrations: searchTerm ? workflow.integrations.filter(integ => integ.toLowerCase().includes(searchTerm)) : undefined
    }
  }));

  // Sort by similarity score (descending) and then by popularity
  resultsWithSimilarity.sort((a, b) => {
    if (b.similarity_score !== a.similarity_score) return b.similarity_score - a.similarity_score;
    return a.workflow.popularity - b.workflow.popularity;
  });

  return Response.json({
    workflows: resultsWithSimilarity,
    total: resultsWithSimilarity.length,
    search_term: searchTerm
    filters_applied: searchParams.filters
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url).searchParams;
  
  // Check for workflow ID
  if (searchParams.id) {
    const workflow = workflowsDatabase.find(w => w.id === searchParams.id);
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    return Response.json({
      workflow,
      similar_workflows: workflowsDatabase
        .filter(w => {
          // Same category
          w.category === workflow.category ||
          // Has overlapping integrations
          w.integrations.some(i => workflow.integrations.includes(i)) ||
          // Similar complexity
          w.complexity === workflow.complexity ||
          // Similar tags
          w.tags.some(t => workflow.tags.includes(t))
        })
        .filter(w => w.id !== workflow.id)
        .map(w => ({
          workflow: w,
          similarity_score: 0.5, // Base similarity for related workflows
          matches: {
            category: w.category === workflow.category,
            integrations: w.integrations.filter(i => workflow.integrations.includes(i))
          }
        }))
        .slice(0, 5) // Top 5 similar
    });
  }

  return Response.json({
    workflows: workflowsDatabase,
    total: workflowsDatabase.length,
    message: searchParams.id ? 'Workflow found' : 'Search endpoint ready'
  });
}
