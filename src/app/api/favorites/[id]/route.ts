import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * DELETE /api/favorites/[id]
 * Remove a workflow from favorites
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const favoriteId = params.id;

    // Verify the favorite belongs to the user
    const { data: favorite, error: checkError } = await supabase
      .from('favorite_workflows')
      .select('*')
      .eq('id', favoriteId)
      .eq('user_id', userId)
      .single();

    if (checkError || !favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Delete the favorite
    const { error: deleteError } = await supabase
      .from('favorite_workflows')
      .delete()
      .eq('id', favoriteId);

    if (deleteError) {
      console.error('Error removing favorite:', deleteError);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
