import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exportAnalytics, generateDailyReport, generateRevenueReport } from '@/lib/export';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/export
 * Export analytics data as CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'daily';
    const format = (searchParams.get('format') as 'csv' | 'json') || 'csv';
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

    let data: any[] = [];
    let filename = `export-${new Date().toISOString().split('T')[0]}`;

    switch (reportType) {
      case 'daily':
        const { data: dailyData } = await supabase.rpc('get_admin_analytics', { p_days: days });
        data = generateDailyReport(dailyData || []);
        filename = `daily-analytics-${days}days`;
        break;

      case 'revenue':
        const { data: dailyAnalytics } = await supabase.rpc('get_admin_analytics', { p_days: days });
        const { data: subscriptions } = await supabase
          .from('stripe_subscriptions')
          .select('tier, amount, status')
          .eq('status', 'active');
        data = generateRevenueReport(dailyAnalytics || [], subscriptions || []).daily;
        filename = `revenue-report-${days}days`;
        break;

      case 'workflows':
        const { data: workflows } = await supabase.from('workflows').select('*');
        const { data: downloads } = await supabase.from('downloads').select('*');
        const { data: events } = await supabase.from('events').select('*').eq('event_type', 'workflow_view');

        // Generate workflow performance report
        data = workflows?.map(workflow => {
          const workflowDownloads = downloads?.filter((d: any) => d.workflow_id === workflow.id) || [];
          const workflowViews = events?.filter((e: any) =>
            e.properties?.workflow_id === workflow.id
          ) || [];

          return {
            workflowId: workflow.id,
            name: workflow.name,
            category: workflow.category,
            complexity: workflow.complexity,
            difficulty: workflow.difficulty,
            price: workflow.price,
            rating: workflow.rating,
            totalDownloads: workflowDownloads.length,
            totalViews: workflowViews.length,
            conversionRate: workflowViews.length > 0
              ? ((workflowDownloads.length / workflowViews.length) * 100).toFixed(2) + '%'
              : '0%',
            revenue: (workflowDownloads.length * workflow.price).toFixed(2),
          };
        }) || [];
        filename = `workflow-performance-${days}days`;
        break;

      case 'users':
        const { data: allUsers } = await supabase.from('users').select('*').limit(10000);
        const { data: userDownloads } = await supabase.from('downloads').select('*');
        const { data: userEvents } = await supabase.from('events').select('*');

        data = allUsers?.map(user => {
          const userDownloads = userDownloads?.filter((d: any) => d.user_id === user.id) || [];
          const userEventsList = userEvents?.filter((e: any) => e.user_id === user.id) || [];

          return {
            userId: user.id,
            email: user.email,
            subscriptionTier: user.subscription_tier,
            joinDate: user.created_at,
            totalDownloads: userDownloads.length,
            totalEvents: userEventsList.length,
            lastActivity: userEventsList.length > 0
              ? userEventsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
              : null,
          };
        }) || [];
        filename = `user-activity-${days}days`;
        break;

      case 'search':
        const { data: searches } = await supabase.rpc('get_popular_searches', {
          p_days: 7,
          p_limit: 1000
        });

        data = searches?.map(search => ({
          query: search.query,
          searchCount: search.search_count,
          avgResults: search.avg_results_count,
          clickRate: (search.click_rate * 100).toFixed(2) + '%',
        })) || [];
        filename = 'search-analytics';
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = data.map((row: any) =>
        Object.values(row)
          .map((v: any) => {
            if (v === null || v === undefined) return '';
            const str = String(v);
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ).join('\n');

      // Add headers
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        return new NextResponse(`${headers}\n${csv}`, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        });
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
