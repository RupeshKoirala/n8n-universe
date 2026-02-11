import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/auth/session - Get current user session
export async function GET(request: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    // Get user profile from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        subscription_tier: user.subscription_tier || 'free',
        subscription_ends_at: user.subscription_ends_at,
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }
}
