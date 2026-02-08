import type { Workflow } from '@/types';

// Mock database for development (will be replaced with Supabase)
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
    actions: ['http-request', 'set', 'get', 'if-else'],
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

// Enhanced workflow indexer (will be used when user uploads 25k files)
export function extractWorkflowMetadata(fileContent: any) {
  try {
    const workflow = JSON.parse(fileContent);
    
    return {
      id: workflow.id || `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: workflow.name || 'Untitled Workflow',
      description: workflow.description || '',
      complexity: workflow.complexity || 'simple',
      category: workflow.category || 'general',
      tags: Array.isArray(workflow.tags) ? workflow.tags : [],
      triggers: Array.isArray(workflow.nodes) ? extractTriggers(workflow.nodes) : [],
      actions: Array.isArray(workflow.nodes) ? extractActions(workflow.nodes) : [],
      integrations: Array.isArray(workflow.nodes) ? extractIntegrations(workflow.nodes) : [],
      difficulty: workflow.difficulty || 'beginner',
      price: workflow.price || 1,
      popularity: 0,
      rating: null,
      file_path: `/workflows/${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`,
      file_size: fileContent.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting workflow metadata:', error);
    return null;
  }
}

function extractTriggers(nodes: any[]): string[] {
  const triggers = new Set<string>();
  
  if (Array.isArray(nodes)) {
    nodes.forEach(node => {
      if (node.type === 'n8n-nodes-base.webhookTrigger') {
        if (node.webhookId) triggers.add(node.webhookId);
      } else if (node.type === 'n8n-nodes-base.cronTrigger') {
        if (node.mode) triggers.add(`Cron: ${node.mode}`);
      } else if (node.type === 'n8n-nodes-base.manualTrigger') {
        triggers.add('Manual trigger');
      }
    });
  }
  
  return Array.from(triggers);
}

function extractActions(nodes: any[]): string[] {
  const actions = new Set<string>();
  
  if (Array.isArray(nodes)) {
    nodes.forEach(node => {
      if (node.type === 'n8n-nodes-base.httpRequest') {
        actions.add(`HTTP Request: ${node.method} ${node.url}`);
      } else if (node.type === 'n8n-nodes-base.set') {
        actions.add(`Set: ${node.name}`);
      } else if (node.type === 'n8n-nodes-base.if') {
        actions.add(`IF: ${node.conditions}`);
      } else if (node.type === 'n8n-nodes-base.switch') {
        actions.add(`Switch: ${node.name}`);
      } else if (node.type === 'n8n-nodes-base.code') {
        actions.add(`Code execution: ${node.language}`);
      } else if (node.type === 'n8n-nodes-base.function' || node.type === 'n8n-nodes-base.functionItem') {
        actions.add(`Function: ${node.name}`);
      }
    });
  }
  
  return Array.from(actions);
}

function extractIntegrations(nodes: any[]): string[] {
  const integrations = new Set<string>();
  
  if (Array.isArray(nodes)) {
    nodes.forEach(node => {
      if (node.type === 'n8n-nodes-base.httpRequest') {
        // n8n HTTP request nodes include integration name
        if (node.credentials && node.credentials.oauthToken) {
          integrations.add(node.credentials.oauthToken);
        } else if (node.credentials && node.credentials.apiKey) {
          integrations.add(node.credentials.apiKey);
        }
      } else if (node.type === 'n8n-nodes-base.set') {
        integrations.add(node.name);
      } else if (node.type === 'n8n-nodes-base.function') {
        // Function nodes with code
        if (node.parameters && node.parameters.service) {
          integrations.add(node.parameters.service);
        }
      } else if (node.type === 'n8n-nodes-base.workflow') {
        // Workflow references other integrations
        if (node.parameters) {
          Object.values(node.parameters).forEach(param => {
            if (param.service) {
              integrations.add(param.service);
            }
          });
        }
      }
    });
  }
  
  return Array.from(integrations);
}

// Calculate complexity based on nodes and connections
function calculateComplexity(nodes: any[]): 'simple' | 'medium' | 'complex' {
  if (!nodes || !Array.isArray(nodes)) return 'simple';
  
  const nodeCount = nodes.length;
  const connectionCount = nodes.filter(n => 
    n.type === 'n8n-nodes-base.httpRequest' || 
    n.type === 'n8n-nodes-base.set'
  ).length;
  
  const conditionalNodes = nodes.filter(n => 
    n.type === 'n8n-nodes-base.if' || 
    n.type === 'n8n-nodes-base.switch'
  ).length;
  
  if (nodeCount <= 5 && connectionCount === 0) return 'simple';
  if (nodeCount <= 10 && conditionalNodes <= 2) return 'simple';
  if (nodeCount <= 15 && conditionalNodes <= 5) return 'medium';
  if (nodeCount > 20 || connectionCount > 10) return 'complex';
  
  return 'medium';
}

// Parse workflow file and extract metadata
export function parseWorkflowFile(filePath: string): Workflow | null {
  try {
    const response = require('fs').readFileSync(filePath, 'utf-8');
    const workflow = extractWorkflowMetadata(response);
    return workflow;
  } catch (error) {
    console.error('Error parsing workflow file:', error);
    return null;
  }
}

// Batch process multiple workflow files
export function indexWorkflows(workflowDir: string): {
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(workflowDir)) {
    return { workflows: [], total: 0, errors: [] };
  }
  
  const files = fs.readdirSync(workflowDir);
  const workflows: Workflow[] = [];
  const errors: string[] = [];
  
  files.forEach(file => {
    if (!file.endsWith('.json')) return;
    
    const filePath = path.join(workflowDir, file);
    try {
      const workflow = parseWorkflowFile(filePath);
      if (workflow) {
        workflows.push(workflow);
      }
    } catch (error) {
      errors.push(`Failed to parse ${file}: ${error.message}`);
    }
  });
  
  return { workflows, total: workflows.length, errors };
}
