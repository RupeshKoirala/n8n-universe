import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured');
}

// Initialize Supabase client
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: {
      url: `${supabaseUrl}/storage/v1/object/public/workflows`
    }
  },
  global: {
    headers: {
      apikey: supabaseServiceRoleKey || ''
    }
  }
}) : null;

// Helper: Get user session from token
async function getUserFromToken(authHeader: string) {
  try {
    if (!supabase) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to get user from token:', error);
    return null;
  }
}

// Helper: Check if user can download based on subscription tier
async function canDownload(user: any): Promise<boolean> {
  if (!user) {
    return false;
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('subscription_tier, subscription_ends_at')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return false;
  }

  // Free tier: limited downloads per day
  if (userProfile.subscription_tier === 'free') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count today's downloads
    const { data: downloads, error: countError } = await supabase
      .from('downloads')
      .select('id')
      .gte('created_at', today.toISOString())
      .eq('user_id', user.id)
      .count('id', { distinct: true });

    if (countError) {
      console.error('Failed to count downloads:', countError);
      return false;
    }

    // Free tier: maximum 3 downloads per day
    return (downloads || 0) < 3;
  }

  // Active subscription (Basic, Pro, Enterprise)
  if (userProfile.subscription_ends_at) {
    const now = new Date();
    const endDate = new Date(userProfile.subscription_ends_at);
    return endDate >= now;
  }

  // Check if subscription tier allows downloads
  return ['basic', 'pro', 'enterprise'].includes(userProfile.subscription_tier);
}

// GET /api/workflows/[id]/download
export async function GET_DOWNLOAD(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const user = await getUserFromToken(authHeader || '');

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user can download
    const canDownloadNow = await canDownload(user);

    if (!canDownloadNow) {
      return NextResponse.json({ 
        error: 'Download limit reached or subscription expired',
        details: 'Free tier: maximum 3 downloads per day. Upgrade to Basic, Pro, or Enterprise for unlimited downloads.',
        upgrade_url: '/pricing'
      }, { status: 403 });
    }

    // Fetch workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Generate download URL from Supabase Storage
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/workflows/${workflow.file_path}`;

    return NextResponse.json({
      download_url: downloadUrl,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        file_size: workflow.file_size
      }
    });

  } catch (error: {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}

// POST /api/workflows/[id]/download
export async function POST_DOWNLOAD(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const user = await getUserFromToken(authHeader || '');

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user can download
    const canDownloadNow = await canDownload(user);

    if (!canDownloadNow) {
      return NextResponse.json({ 
        error: 'Download limit reached or subscription expired',
        details: 'Free tier: maximum 3 downloads per day. Upgrade to Basic, Pro, or Enterprise for unlimited downloads.',
        upgrade_url: '/pricing'
      }, { status: 403 });
    }

    // Fetch workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Record download
    const { data: download, error: downloadError } = await supabase
      .from('downloads')
      .insert({
        user_id: user.id,
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        workflow_price: workflow.price,
        downloaded_at: new Date().toISOString(),
        file_size: workflow.file_size
      })
      .select()
      .single();

    if (downloadError) {
      console.error('Failed to record download:', downloadError);
      // Don't block download if recording fails, just log it
    }

    // Increment download count
    const { error: incrementError } = await supabase
      .from('workflows')
      .update({
        download_count: (workflow.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', workflow.id);

    if (incrementError) {
      console.error('Failed to increment download count:', incrementError);
    }

    // Generate download URL from Supabase Storage
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/workflows/${workflow.file_path}`;

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        price: workflow.price
      },
      download: {
        id: download.id,
        downloaded_at: download.downloaded_at
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}

// GET /api/workflows/[id]/download-history
export async function GET_DOWNLOAD_HISTORY(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const user = await getUserFromToken(authHeader || '');

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user's download history
    const { data: downloads, error: downloadsError } = await supabase
      .from('downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false })
      .limit(100);

    if (downloadsError) {
      console.error('Failed to fetch download history:', downloadsError);
      return NextResponse.json({ error: 'Failed to fetch download history' }, { status: 500 });
    }

    return NextResponse.json({
      downloads: downloads || [],
      total: downloads.length
    });

  } catch (error) {
    console.error('Download history error:', error);
    return NextResponse.json({ error: 'Failed to fetch download history' }, { status: 500 });
  }
}
