import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/referrals/leaderboard - Get top referrers
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_referral_leaderboard',
      { limit }
    );

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    return NextResponse.json({ leaderboard: leaderboard || [] });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
