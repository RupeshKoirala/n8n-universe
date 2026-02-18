import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/favorites
 * Get user's favorite workflows
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

    // Get favorite workflows with details
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

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error('Error in favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/favorites
 * Add a workflow to favorites
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow_id, notes } = body;

    if (!workflow_id) {
      return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 });
    }

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

    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from('favorite_workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('workflow_id', workflow_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    }

    // Add to favorites
    const { data: favorite, error: insertError } = await supabase
      .from('favorite_workflows')
      .insert({
        user_id: userId,
        workflow_id,
        notes,
      })
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
      .single();

    if (insertError) {
      console.error('Error adding favorite:', insertError);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Error in favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
