import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Price IDs
const PRICE_IDS = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_BASIC_ANNUAL || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
  },
};

type ManageRequest = {
  action: 'cancel' | 'resume' | 'upgrade' | 'downgrade';
  userId: string;
  tier?: 'basic' | 'pro' | 'enterprise';
  billing?: 'monthly' | 'annual';
};

// Helper: Get price ID
function getPriceId(tier: 'basic' | 'pro' | 'enterprise', billing: 'monthly' | 'annual'): string {
  const priceId = PRICE_IDS[tier]?.[billing];
  if (!priceId) {
    throw new Error(`Invalid tier or billing cycle: ${tier}/${billing}`);
  }
  return priceId;
}

// GET /api/subscription/manage - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user subscription from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_tier, subscription_ends_at, stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get detailed subscription info from Stripe
    let stripeSubscription: any = null;

    if (user.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      } catch (error) {
        console.error('Failed to fetch Stripe subscription:', error);
      }
    }

    // Get subscription history
    const { data: history } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        tier: user.subscription_tier,
        subscriptionEndsAt: user.subscription_ends_at,
      },
      subscription: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        items: stripeSubscription.items.data.map((item: any) => ({
          priceId: item.price.id,
          amount: item.price.amount,
          currency: item.price.currency,
        })),
      } : null,
      history: history || [],
    });
  } catch (error) {
    console.error('❌ Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}

// POST /api/subscription/manage - Cancel, resume, upgrade, or downgrade subscription
export async function POST(request: NextRequest) {
  try {
    const { action, userId, tier, billing } = await request.json() as ManageRequest;

    // Validate input
    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId' },
        { status: 400 }
      );
    }

    // Get user's subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Retrieve Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

    let result;

    switch (action) {
      case 'cancel':
        // Cancel subscription at period end
        result = await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        console.log('✅ Subscription scheduled for cancellation:', result.id);

        return NextResponse.json({
          success: true,
          message: 'Subscription will be canceled at the end of the billing period',
          cancelAt: new Date(result.cancel_at! * 1000).toISOString(),
        });

      case 'resume':
        // Resume subscription (remove cancel_at_period_end)
        result = await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        console.log('✅ Subscription resumed:', result.id);

        return NextResponse.json({
          success: true,
          message: 'Subscription resumed successfully',
        });

      case 'upgrade':
      case 'downgrade':
        // Change subscription tier
        if (!tier || !billing) {
          return NextResponse.json(
            { error: 'tier and billing are required for upgrade/downgrade' },
            { status: 400 }
          );
        }

        const priceId = getPriceId(tier, billing);

        // Check if same price
        const currentPriceId = subscription.items.data[0]?.price.id;
        if (currentPriceId === priceId) {
          return NextResponse.json(
            { error: 'Already subscribed to this plan' },
            { status: 400 }
          );
        }

        // Update subscription to new price
        result = await stripe.subscriptions.update(user.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId,
          }],
          payment_behavior: 'default_incomplete',
          proration_behavior: action === 'upgrade' ? 'create_prorations' : 'none',
        });

        // Update user tier in database
        await supabase
          .from('users')
          .update({ subscription_tier: tier })
          .eq('id', userId);

        console.log(`✅ Subscription ${action}d to ${tier}:`, result.id);

        return NextResponse.json({
          success: true,
          message: `Subscription ${action}d successfully`,
          newTier: tier,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Manage subscription error:', error);
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 });
  }
}

// DELETE /api/subscription/manage - Immediately cancel subscription (for admin or force cancel)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user's subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel immediately
    await stripe.subscriptions.cancel(user.stripe_subscription_id);

    // Downgrade user to free tier
    await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_ends_at: null,
        stripe_subscription_id: null,
      })
      .eq('id', userId);

    // Update subscription record
    await supabase
      .from('stripe_subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', user.stripe_subscription_id);

    console.log('✅ Subscription immediately canceled:', user.stripe_subscription_id);

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled immediately',
    });
  } catch (error) {
    console.error('❌ Delete subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
