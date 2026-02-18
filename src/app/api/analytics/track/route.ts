import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/analytics/track
 * Track events (page views, searches, downloads, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType,
      eventName,
      properties = {},
      sessionId,
      ipAddress,
      userAgent,
    } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    // Get user from session if available (optional, for anonymous events)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        // Continue without user ID
      }
    }

    // Insert event
    const { error: insertError } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_name: eventName,
        properties,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('Error inserting event:', insertError);
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }

    // Special handling for specific event types
    switch (eventType) {
      case 'page_view':
        if (properties.page_path) {
          await supabase.rpc('track_page_view', {
            p_user_id: userId,
            p_page_path: properties.page_path,
            p_page_title: properties.page_title || null,
            p_referrer: properties.referrer || null,
            p_session_id: sessionId || null,
            p_ip_address: ipAddress || null,
            p_user_agent: userAgent || null,
          });
        }
        break;

      case 'search':
        await supabase.rpc('track_search', {
          p_user_id: userId,
          p_query: properties.query || null,
          p_filters: properties.filters || {},
          p_results_count: properties.results_count || 0,
          p_search_type: properties.search_type || 'text',
          p_clicked_workflow_id: properties.clicked_workflow_id || null,
          p_session_id: sessionId || null,
          p_ip_address: ipAddress || null,
          p_user_agent: userAgent || null,
        });
        break;

      case 'workflow_view':
        if (properties.workflow_id) {
          await supabase.rpc('track_workflow_view_event', {
            p_user_id: userId,
            p_workflow_id: properties.workflow_id,
            p_session_id: sessionId || null,
            p_ip_address: ipAddress || null,
            p_user_agent: userAgent || null,
          });
        }
        break;

      case 'workflow_download':
        if (properties.workflow_id && userId) {
          await supabase.rpc('track_workflow_download_event', {
            p_user_id: userId,
            p_workflow_id: properties.workflow_id,
            p_price_paid: properties.price_paid || 0,
            p_session_id: sessionId || null,
            p_ip_address: ipAddress || null,
            p_user_agent: userAgent || null,
          });
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
