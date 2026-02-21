import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// POST /api/referrals/apply-credits - Apply referral credits to subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { discount_amount } = body;

    if (!discount_amount || discount_amount < 0) {
      return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply credits
    const { data: success, error: applyError } = await supabase.rpc(
      'apply_referral_credits_to_subscription',
      {
        user_id: user.id,
        discount_amount: discount_amount,
      }
    );

    if (applyError) {
      console.error('Error applying credits:', applyError);
      return NextResponse.json({ error: 'Failed to apply credits' }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Get updated credit balance
    const { data: stats, error: statsError } = await supabase.rpc('get_referral_stats', {
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      applied: discount_amount,
      remaining_balance: stats && stats.length > 0 ? stats[0].available_credits : 0,
    });
  } catch (error) {
    console.error('Error applying credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
