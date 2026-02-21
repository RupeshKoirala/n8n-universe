import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/referrals/code - Get user's referral code
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // If user doesn't have a referral code, generate one
    if (!userData.referral_code) {
      const { data: newCode, error: generateError } = await supabase.rpc('generate_referral_code');

      if (generateError) {
        return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to save referral code' }, { status: 500 });
      }

      return NextResponse.json({ referral_code: newCode });
    }

    return NextResponse.json({ referral_code: userData.referral_code });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/referrals/code - Generate new referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new referral code
    const { data: newCode, error: generateError } = await supabase.rpc('generate_referral_code');

    if (generateError) {
      return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
    }

    // Update user with new code
    const { error: updateError } = await supabase
      .from('users')
      .update({ referral_code: newCode })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save referral code' }, { status: 500 });
    }

    return NextResponse.json({ referral_code: newCode });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
