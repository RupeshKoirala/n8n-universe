import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GitHub OAuth Configuration
const githubClientId = process.env.NEXT_PUBLIC_GITHUB_ID || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured');
}

if (!githubClientId) {
  console.warn('GitHub OAuth is not configured');
}

// Initialize Supabase client
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: {
      url: `${supabaseUrl}/storage/v1/object/public/workflows`
    }
  },
  global: {
    headers: {
      apikey: supabaseServiceRoleKey || ''
    }
  }
}) : null;

// Auth types
type SignInData = {
  email: string;
  password: string;
};

type SignUpData = {
  email: string;
  password: string;
  username?: string;
};

type UserProfile = {
  id: string;
  email: string;
  github_id?: string;
  github_username?: string;
  avatar_url?: string;
  username?: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_ends_at: string | null;
  preferences?: {
    email_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
  };
};

// Helper: Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// GET /api/auth/session
export async function GET_SESSION(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authHeader) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    // Verify session with Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('Get user profile error:', userError);
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        github_id: user.github_id,
        github_username: user.github_username,
        avatar_url: user.avatar_url,
        username: user.username,
        subscription_tier: user.subscription_tier || 'free',
        subscription_ends_at: user.subscription_ends_at,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

// POST /api/auth/signin
export async function POST_SIGNIN(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { email, password } = await request.json() as SignInData;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: { user } } = data;

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    });
  } catch (error: {
    console.error('Sign in error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}

// POST /api/auth/signup
export async function POST_SIGNUP(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { email, password, username } = await request.json() as SignUpData;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: { user } } = data;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        username: username || email.split('@')[0],
        github_id: null,
        github_username: null,
        avatar_url: null,
        subscription_tier: 'free',
        subscription_ends_at: null,
        preferences: {
          email_notifications: true,
          marketing_emails: true,
          product_updates: true
        }
      })
      .select()
      .single();

    if (profileError) {
      console.error('Create profile error:', profileError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

// GET /api/auth/github
export async function GET_GITHUB(request: NextRequest) {
  try {
    if (!supabase || !githubClientId) {
      return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
    }

    // Generate OAuth URL with scopes
    const scopes = 'read:user,user:email';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/callback`;
    const state = generateId();

    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${githubClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}`;

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.json({ error: 'Failed to generate GitHub OAuth URL' }, { status: 500 });
  }
}

// GET /api/auth/github/callback
export async function GET_GITHUB_CALLBACK(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/error?missing_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: githubClientId,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/error?oauth_error`);
    }

    // Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const githubUser = await userResponse.json();

    // Sign in/upsert with Supabase using GitHub OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        scopes: 'read:user,user:email'
      },
      skipBrowserRedirect: true
    });

    if (error) {
      console.error('GitHub OAuth sign in error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/error?signin_error`);
    }

    const { data: { user } } = data;

    // Get or create user profile
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Create new profile
      await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: githubUser.login,
          github_id: githubUser.id.toString(),
          github_username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          subscription_tier: 'free',
          subscription_ends_at: null,
          preferences: {
            email_notifications: true,
            marketing_emails: true,
            product_updates: true
          }
        })
        .select()
        .single();
    } else {
      // Update existing profile with GitHub info
      await supabase
        .from('users')
        .update({
          github_id: githubUser.id.toString(),
          github_username: githubUser.login,
          avatar_url: githubUser.avatar_url
        })
        .eq('id', user.id)
        .select()
        .single();
    }

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/error?callback_error`);
  }
}

// POST /api/auth/signout
export async function POST_SIGNOUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}

// PUT /api/user/profile
export async function PUT_USER_PROFILE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authHeader) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const updates = await request.json() as Partial<UserProfile>;

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username: updates.username,
        avatar_url: updates.avatar_url,
        preferences: updates.preferences
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update profile error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
