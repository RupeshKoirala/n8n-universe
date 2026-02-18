import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/downloads/history
 * Get user's download history
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get download history with workflow details
    const { data: downloads, error: downloadsError } = await supabase
      .from('downloads')
      .select(`
        *,
        workflows:workflow_id (
          id,
          name,
          description,
          category,
          complexity,
          difficulty,
          price,
          rating,
          popularity
        )
      `)
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
      .limit(100);

    if (downloadsError) {
      console.error('Error fetching download history:', downloadsError);
      return NextResponse.json({ error: 'Failed to fetch downloads' }, { status: 500 });
    }

    return NextResponse.json({ downloads: downloads || [] });
  } catch (error) {
    console.error('Error in downloads history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
