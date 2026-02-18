import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/analytics/user
 * Get user-specific analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

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

    // Get user analytics
    const { data: userAnalytics, error: analyticsError } = await supabase
      .rpc('get_user_analytics', { p_user_id: userId, p_days: days });

    if (analyticsError) {
      console.error('Error fetching user analytics:', analyticsError);
    }

    // Get download history
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
      .limit(50);

    // Get favorite workflows
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorite_workflows')
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
      .order('created_at', { ascending: false });

    // Get saved searches
    const { data: savedSearches, error: searchesError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    // Get user's subscription status
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, subscription_ends_at')
      .eq('id', userId)
      .single();

    // Get daily download history for charts
    const { data: dailyDownloads, error: dailyError } = await supabase
      .from('events')
      .select('created_at')
      .eq('event_type', 'workflow_download')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    // Group downloads by date
    const downloadsByDate: Record<string, number> = {};
    dailyDownloads?.forEach((event: any) => {
      const date = event.created_at.split('T')[0];
      downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
    });

    // Get download count per category
    const { data: categoryDownloads, error: categoryError } = await supabase
      .from('workflows')
      .select('category')
      .in('id', downloads?.map((d: any) => d.workflow_id) || []);

    const categoryCounts: Record<string, number> = {};
    categoryDownloads?.forEach((workflow: any) => {
      categoryCounts[workflow.category] = (categoryCounts[workflow.category] || 0) + 1;
    });

    return NextResponse.json({
      user: userAnalytics?.[0] || {
        total_downloads: 0,
        total_searches: 0,
        total_page_views: 0,
        favorite_workflows_count: 0,
        saved_searches_count: 0,
        downloads_this_month: 0,
        avg_daily_downloads: 0,
      },
      subscription: userData || {
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_ends_at: null,
      },
      downloads: downloads || [],
      favorites: favorites || [],
      savedSearches: savedSearches || [],
      charts: {
        downloadsByDate: Object.entries(downloadsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        downloadsByCategory: Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      },
    });
  } catch (error) {
    console.error('Error in user analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
