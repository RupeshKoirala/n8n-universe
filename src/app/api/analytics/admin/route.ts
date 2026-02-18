import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/analytics/admin
 * Get comprehensive admin analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Verify user is admin (enterprise tier)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/enterprise tier
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (userDataError || userData?.subscription_tier !== 'enterprise') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get daily analytics
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('get_admin_analytics', { p_days: days });

    if (dailyError) {
      console.error('Error fetching daily analytics:', dailyError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get current stats (today)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats, error: todayError } = await supabase
      .from('daily_analytics')
      .select('*')
      .eq('date', today)
      .single();

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total workflows
    const { count: totalWorkflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    // Get total downloads
    const { count: totalDownloads, error: downloadsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'workflow_download');

    // Get active subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('stripe_subscriptions')
      .select('tier, amount, status')
      .eq('status', 'active');

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions?.reduce((sum, sub) => {
      if (sub.interval === 'year') {
        return sum + (sub.amount / 12);
      }
      return sum + sub.amount;
    }, 0) || 0;

    // Get popular searches
    const { data: popularSearches, error: searchesError } = await supabase
      .rpc('get_popular_searches', { p_days: 7, p_limit: 20 });

    // Get trending workflows
    const { data: trendingWorkflows, error: trendingError } = await supabase
      .rpc('get_trending_workflows', { p_days: 7, p_limit: 10 });

    // Calculate conversion rate (signups -> subscriptions)
    const totalSignups = dailyData?.reduce((sum: number, day: any) => sum + (day.signups || 0), 0) || 0;
    const totalSubStarts = dailyData?.reduce((sum: number, day: any) => sum + (day.subscription_starts || 0), 0) || 0;
    const conversionRate = totalSignups > 0 ? (totalSubStarts / totalSignups) * 100 : 0;

    // Calculate churn (simplified: cancelled / started)
    const { count: cancelledSubs } = await supabase
      .from('stripe_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled');

    const churnRate = totalSubStarts > 0 ? ((cancelledSubs || 0) / totalSubStarts) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalWorkflows: totalWorkflows || 0,
        totalDownloads: totalDownloads || 0,
        totalRevenue: dailyData?.reduce((sum: number, day: any) => sum + (parseFloat(day.revenue) || 0), 0) || 0,
        mrr: mrr,
        activeSubscriptions: subscriptions?.length || 0,
        conversionRate: conversionRate.toFixed(2),
        churnRate: churnRate.toFixed(2),
      },
      today: todayStats || {
        unique_users: 0,
        page_views: 0,
        downloads: 0,
        searches: 0,
        signups: 0,
        subscription_starts: 0,
        revenue: 0,
      },
      dailyAnalytics: dailyData || [],
      popularSearches: popularSearches || [],
      trendingWorkflows: trendingWorkflows || [],
    });
  } catch (error) {
    console.error('Error in admin analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
