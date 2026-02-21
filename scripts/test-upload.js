/**
 * Quick Workflow Upload Test
 * 
 * Simple script to test uploading a few workflows to Supabase
 * before running the full 15,106 workflow upload.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
const envContent = await fs.readFile(path.join(process.cwd(), '../.env.local'), 'utf8');
const envLines = envContent.split('\n');
const env = {};

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('💡 Please add these to .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_project_url');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.error('   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// Sample workflow to test upload
const sampleWorkflow = {
  id: 'test-workflow-001',
  name: 'Test Workflow for Upload',
  description: 'Sample workflow to test upload functionality',
  category: 'Productivity',
  complexity: 'simple',
  difficulty: 'beginner',
  tags: ['test', 'upload', 'productivity'],
  integrations: ['Notion'],
  triggers: ['Manual'],
  actions: ['Create page', 'Update database'],
  price: 0,
  file_path: 'test-workflows/test-workflow.json',
  node_types: [
    {
      type: 'n8n-nodes-base.start',
      position: [250, 300],
      parameters: {}
    },
    {
      type: 'notion',
      position: [500, 300],
      parameters: {
        pageId: 'test-page-001'
      }
    }
  ],
  downloads: 0,
  rating: 5.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function main() {
  console.log('🚀 Starting Workflow Upload Test...\n');

  try {
    // Test 1: Insert sample workflow
    console.log('📝 Test 1: Inserting sample workflow...');
    const { error: insertError } = await supabase
      .from('workflows')
      .insert(sampleWorkflow);

    if (insertError) {
      throw new Error(`Failed to insert workflow: ${insertError.message}`);
    }
    console.log('✅ Sample workflow inserted');

    // Test 2: Query workflow back
    console.log('📝 Test 2: Querying workflow back...');
    const { data: workflow, error: queryError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', sampleWorkflow.id)
      .single();

    if (queryError) {
      throw new Error(`Failed to query workflow: ${queryError.message}`);
    }
    console.log('✅ Workflow queried successfully:');
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Category: ${workflow.category}`);
    console.log(`   Integrations: ${workflow.integrations}`);

    // Test 3: Test full scan
    console.log('📝 Test 3: Testing full workflow scan...');
    const { data: allWorkflows, error: scanError } = await supabase
      .from('workflows')
      .select('id', 'name', 'category')
      .limit(10);

    if (scanError) {
      throw new Error(`Failed to scan workflows: ${scanError.message}`);
    }
    console.log(`✅ Scan successful. Found ${allWorkflows.length} workflows`);

    console.log('\n🎉 All upload tests passed successfully!\n');
    console.log('📋 You can now run the full upload script:');
    console.log('   node workflows/upload-workflows.js');
    console.log('\n📊 Test Summary:');
    console.log('   Database connection: ✅ Working');
    console.log('   Insert test: ✅ Passed');
    console.log('   Query test: ✅ Passed');
    console.log('   Scan test: ✅ Passed');

  } catch (error) {
    console.error('\n❌ Upload test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check Supabase credentials in .env.local');
    console.error('   2. Verify Supabase project is active');
    console.error('   3. Check internet connection');
    process.exit(1);
  }
}

main();
