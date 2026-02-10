// Test Supabase Connection
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'N/A');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test basic query
    const { data, error } = await supabase
      .from('workflows')
      .select('id', 'name')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Sample workflows:', data.length);
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (!success) {
    process.exit(1);
  }
  process.exit(0);
});
