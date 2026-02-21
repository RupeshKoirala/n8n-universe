import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/referrals/stats - Get referral statistics for user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral stats
    const { data: stats, error: statsError } = await supabase.rpc('get_referral_stats', {
      user_id: user.id,
    });

    if (statsError) {
      console.error('Error fetching referral stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
    }

    // Get referral code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Get referral history
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*, referee:users!referrals_referee_id_fkey(name, email), completed_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referral history:', referralsError);
    }

    // Get credit history
    const { data: credits, error: creditsError } = await supabase
      .from('referral_credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (creditsError) {
      console.error('Error fetching credit history:', creditsError);
    }

    return NextResponse.json({
      stats: stats && stats.length > 0 ? stats[0] : {
        total_referrals: 0,
        completed_referrals: 0,
        pending_referrals: 0,
        total_credits: 0,
        available_credits: 0,
      },
      referral_code: userData?.referral_code,
      referral_link: userData?.referral_code ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/?ref=${userData.referral_code}` : null,
      referrals: referrals || [],
      credit_history: credits || [],
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
