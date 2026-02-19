#!/usr/bin/env node

/**
 * Automated Workflow Upload Script
 *
 * Purpose: Automatically index and upload all workflow JSON files to Supabase
 * Usage: node workflows/upload-workflows.js
 *
 * Features:
 * - Scans all workflow JSON files
 * - Extracts metadata automatically
 * - Generates embeddings for semantic search
 * - Uploads to Supabase database
 * - Progress tracking and error handling
 * - Batch processing (100 workflows at a time)
 * - Resumable (can continue after interruption)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { openai } = require('../src/lib/openai');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WORKFLOWS_DIR = path.join(__dirname, './all-workflows/N8N-universe');
const BATCH_SIZE = 100; // Upload in batches of 100
const MAX_RETRIES = 3;

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Category detection based on workflow content
function detectCategory(workflow) {
  const content = JSON.stringify(workflow).toLowerCase();
  const name = workflow.name?.toLowerCase() || '';

  if (content.includes('social') || name.includes('social') ||
      content.includes('twitter') || name.includes('twitter') ||
      content.includes('linkedin') || name.includes('linkedin') ||
      content.includes('facebook') || name.includes('facebook')) {
    return 'social-media';
  }

  if (content.includes('email') || name.includes('email') ||
      content.includes('newsletter') || name.includes('newsletter') ||
      content.includes('mail') || name.includes('mail')) {
    return 'email-marketing';
  }

  if (content.includes('ecommerce') || name.includes('ecommerce') ||
      content.includes('shopify') || name.includes('shopify') ||
      content.includes('woocommerce') || name.includes('woocommerce') ||
      content.includes('order') || name.includes('order')) {
    return 'ecommerce';
  }

  if (content.includes('data') || name.includes('data') ||
      content.includes('csv') || name.includes('csv') ||
      content.includes('excel') || name.includes('excel') ||
      content.includes('spreadsheet') || name.includes('spreadsheet')) {
    return 'data-processing';
  }

  if (content.includes('ai') || name.includes('ai') ||
      content.includes('gpt') || name.includes('gpt') ||
      content.includes('chat') || name.includes('chat') ||
      content.includes('openai') || name.includes('openai')) {
    return 'ai-automation';
  }

  if (content.includes('schedule') || name.includes('schedule') ||
      content.includes('calendar') || name.includes('calendar') ||
      content.includes('reminder') || name.includes('reminder')) {
    return 'productivity';
  }

  if (content.includes('api') || name.includes('api') ||
      content.includes('webhook') || name.includes('webhook') ||
      content.includes('http') || name.includes('http')) {
    return 'api-integration';
  }

  return 'general';
}

// Detect integrations from workflow nodes
function detectIntegrations(workflow) {
  const integrations = new Set();
  const platforms = [
    'slack', 'discord', 'teams', 'telegram', 'whatsapp',
    'google', 'gmail', 'drive', 'sheets', 'calendar',
    'microsoft', 'outlook', 'excel', 'onedrive',
    'salesforce', 'hubspot', 'zendesk', 'intercom',
    'shopify', 'woocommerce', 'stripe', 'paypal',
    'twitter', 'linkedin', 'facebook', 'instagram',
    'notion', 'airtable', 'trello', 'asana',
    'github', 'gitlab', 'jira', 'confluence',
    'mailchimp', 'sendgrid', 'aws', 'azure',
    'openai', 'anthropic', 'huggingface',
    'zapier', 'make', 'ifttt'
  ];

  const content = JSON.stringify(workflow).toLowerCase();
  const name = workflow.name?.toLowerCase() || '';

  platforms.forEach(platform => {
    if (content.includes(platform) || name.includes(platform)) {
      integrations.add(platform);
    }
  });

  return Array.from(integrations);
}

// Detect triggers from workflow nodes
function detectTriggers(workflow) {
  const triggers = new Set();

  if (workflow.nodes) {
    workflow.nodes.forEach(node => {
      if (node.type?.toLowerCase().includes('trigger')) {
        const triggerType = node.type
          .toLowerCase()
          .replace('n8n-nodes-base.', '')
          .replace('trigger', '')
          .trim();
        triggers.add(triggerType);
      }
    });
  }

  // Common triggers to detect
  const commonTriggers = ['webhook', 'schedule', 'email', 'manual', 'http'];

  const content = JSON.stringify(workflow).toLowerCase();
  commonTriggers.forEach(trigger => {
    if (content.includes(trigger)) {
      triggers.add(trigger);
    }
  });

  return Array.from(triggers);
}

// Detect actions from workflow nodes
function detectActions(workflow) {
  const actions = new Set();

  if (workflow.nodes) {
    workflow.nodes.forEach(node => {
      if (node.type) {
        const actionType = node.type
          .toLowerCase()
          .replace('n8n-nodes-base.', '')
          .trim();

        // Skip triggers
        if (!actionType.includes('trigger')) {
          actions.add(actionType);
        }
      }
    });
  }

  return Array.from(actions);
}

// Generate tags based on content
function generateTags(workflow, category, integrations) {
  const tags = new Set();

  // Add category as a tag
  tags.add(category);

  // Add integrations as tags
  integrations.forEach(integration => {
    tags.add(integration);
  });

  // Detect common automation keywords
  const keywords = [
    'automation', 'workflow', 'integration', 'api', 'webhook',
    'email', 'notification', 'data', 'sync', 'backup', 'import',
    'export', 'filter', 'transform', 'schedule', 'trigger',
    'monitor', 'report', 'analytics', 'ai', 'machine learning',
    'chatbot', 'scraping', 'parsing', 'validation', 'testing'
  ];

  const content = JSON.stringify(workflow).toLowerCase();
  const name = workflow.name?.toLowerCase() || '';
  const combinedText = content + ' ' + name;

  keywords.forEach(keyword => {
    if (combinedText.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags);
}

// Calculate complexity
function calculateComplexity(workflow) {
  let score = 0;

  // Node count
  const nodeCount = workflow.nodes?.length || 0;
  score += nodeCount * 2;

  // Connection count
  const connectionCount = workflow.connections ? Object.keys(workflow.connections).length : 0;
  score += connectionCount;

  // Different node types
  const nodeTypes = new Set();
  if (workflow.nodes) {
    workflow.nodes.forEach(node => {
      if (node.type) {
        nodeTypes.add(node.type);
      }
    });
  }
  score += nodeTypes.size * 5;

  // Determine complexity level
  if (score <= 20) return 'simple';
  if (score <= 50) return 'medium';
  return 'complex';
}

// Calculate difficulty
function calculateDifficulty(workflow, complexity) {
  const hasCustomCode = JSON.stringify(workflow).includes('code') ||
                         JSON.stringify(workflow).includes('function');

  const hasWebhooks = JSON.stringify(workflow).includes('webhook');

  const hasApiCalls = JSON.stringify(workflow).includes('http') ||
                      JSON.stringify(workflow).includes('request');

  let score = 0;

  // Complexity base
  if (complexity === 'simple') score += 1;
  if (complexity === 'medium') score += 2;
  if (complexity === 'complex') score += 3;

  // Additional complexity factors
  if (hasCustomCode) score += 2;
  if (hasWebhooks) score += 1;
  if (hasApiCalls) score += 1;

  // Determine difficulty
  if (score <= 2) return 'beginner';
  if (score <= 4) return 'intermediate';
  return 'advanced';
}

// Estimate price
function estimatePrice(workflow, complexity, difficulty) {
  let basePrice = 1;

  // Complexity pricing
  if (complexity === 'simple') basePrice += 1;
  if (complexity === 'medium') basePrice += 3;
  if (complexity === 'complex') basePrice += 7;

  // Difficulty pricing
  if (difficulty === 'intermediate') basePrice += 2;
  if (difficulty === 'advanced') basePrice += 5;

  // Node count
  const nodeCount = workflow.nodes?.length || 0;
  basePrice += Math.floor(nodeCount / 5) * 1;

  // Cap at $50
  return Math.min(basePrice, 50);
}

// Generate embedding using OpenAI
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Read all workflow files
function getAllWorkflowFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      getAllWorkflowFiles(fullPath, files);
    } else if (item.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Upload workflow to Supabase
async function uploadWorkflow(workflow, retryCount = 0) {
  try {
    // Check if workflow already exists
    const { data: existing } = await supabase
      .from('workflows')
      .select('id')
      .eq('name', workflow.name)
      .single();

    if (existing) {
      console.log(`✓ Skipping (already exists): ${workflow.name}`);
      return { success: true, skipped: true };
    }

    // Upload to Supabase
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select()
      .single();

    if (error) throw error;

    console.log(`✓ Uploaded: ${workflow.name}`);
    return { success: true, data };
  } catch (error) {
    console.error(`✗ Error uploading ${workflow.name}:`, error.message);

    if (retryCount < MAX_RETRIES) {
      console.log(`  Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return uploadWorkflow(workflow, retryCount + 1);
    }

    return { success: false, error };
  }
}

// Process a single workflow file
async function processWorkflow(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const workflowData = JSON.parse(fileContent);

    // Extract metadata
    const name = workflowData.name || path.basename(filePath, '.json');
    const description = workflowData.description ||
                        `Automated workflow: ${name}`;

    const category = detectCategory(workflowData);
    const integrations = detectIntegrations(workflowData);
    const triggers = detectTriggers(workflowData);
    const actions = detectActions(workflowData);
    const tags = generateTags(workflowData, category, integrations);
    const complexity = calculateComplexity(workflowData);
    const difficulty = calculateDifficulty(workflowData, complexity);
    const price = estimatePrice(workflowData, complexity, difficulty);

    // Generate embedding
    const embeddingText = `${name} ${description} ${category} ${tags.join(' ')}`;
    const embedding = await generateEmbedding(embeddingText);

    if (!embedding) {
      console.error(`Failed to generate embedding for ${name}`);
      return { success: false };
    }

    // Prepare workflow for upload
    const workflow = {
      name,
      description,
      category,
      complexity,
      difficulty,
      price,
      tags,
      integrations,
      triggers,
      actions,
      workflow_json: workflowData,
      embedding,
      popularity: 0,
      downloads: 0,
      rating: 0,
      rating_count: 0,
      is_featured: false,
      file_size: fileContent.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await uploadWorkflow(workflow);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return { success: false };
  }
}

// Main upload function
async function uploadAllWorkflows() {
  console.log('🚀 Starting workflow upload...\n');

  // Get all workflow files
  console.log('📁 Scanning for workflow files...');
  const workflowFiles = getAllWorkflowFiles(WORKFLOWS_DIR);
  console.log(`Found ${workflowFiles.length} workflow files\n`);

  // Upload in batches
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < workflowFiles.length; i += BATCH_SIZE) {
    const batch = workflowFiles.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(workflowFiles.length / BATCH_SIZE)}`);

    for (const filePath of batch) {
      const result = await processWorkflow(filePath);

      if (result.success) {
        if (result.skipped) {
          skipped++;
        } else {
          uploaded++;
        }
      } else {
        failed++;
      }
    }

    console.log(`\nProgress: ${uploaded + skipped + failed}/${workflowFiles.length} files processed`);
    console.log(`  Uploaded: ${uploaded}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Failed: ${failed}`);

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < workflowFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Upload Complete!');
  console.log('='.repeat(60));
  console.log(`Total files:     ${workflowFiles.length}`);
  console.log(`Uploaded:        ${uploaded}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Failed:          ${failed}`);
  console.log('='.repeat(60));
}

// Resume upload (skip already uploaded workflows)
async function resumeUpload() {
  console.log('🔄 Resuming upload from last position...\n');

  // Get existing workflow names from database
  const { data: existingWorkflows } = await supabase
    .from('workflows')
    .select('name');

  const existingNames = new Set(
    existingWorkflows?.map(w => w.name) || []
  );

  console.log(`Found ${existingNames.size} existing workflows in database\n`);

  // Get all workflow files
  const workflowFiles = getAllWorkflowFiles(WORKFLOWS_DIR);
  const filesToUpload = workflowFiles.filter(filePath => {
    const fileName = path.basename(filePath, '.json');
    return !existingNames.has(fileName);
  });

  console.log(`Found ${filesToUpload.length} new workflows to upload\n`);

  // Upload new workflows
  let uploaded = 0;
  let failed = 0;

  for (const filePath of filesToUpload) {
    const result = await processWorkflow(filePath);

    if (result.success && !result.skipped) {
      uploaded++;
    } else if (!result.success) {
      failed++;
    }

    if (uploaded % BATCH_SIZE === 0) {
      console.log(`Progress: ${uploaded}/${filesToUpload.length} uploaded`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Resume Upload Complete!');
  console.log('='.repeat(60));
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));
}

// CLI interface
const command = process.argv[2];

if (command === 'resume') {
  resumeUpload().catch(console.error);
} else {
  uploadAllWorkflows().catch(console.error);
}

module.exports = { uploadAllWorkflows, resumeUpload };
