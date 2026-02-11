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

// Price IDs - These should match your Stripe product prices
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

type SubscriptionRequest = {
  tier: 'basic' | 'pro' | 'enterprise';
  billing: 'monthly' | 'annual';
  userId: string;
};

type PurchaseRequest = {
  workflowId: string;
  userId: string;
};

// Helper: Get price ID based on tier and billing cycle
function getPriceId(tier: 'basic' | 'pro' | 'enterprise', billing: 'monthly' | 'annual'): string {
  const priceId = PRICE_IDS[tier]?.[billing];
  if (!priceId) {
    throw new Error(`Invalid tier or billing cycle: ${tier}/${billing}`);
  }
  return priceId;
}

// POST /api/checkout/subscribe - Create subscription checkout session
export async function POST_SUBSCRIBE(request: NextRequest) {
  try {
    const { tier, billing, userId } = await request.json() as SubscriptionRequest;

    // Validate input
    if (!tier || !billing || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billing, userId' },
        { status: 400 }
      );
    }

    // Validate tier and billing
    if (!['basic', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be basic, pro, or enterprise' },
        { status: 400 }
      );
    }

    if (!['monthly', 'annual'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or annual' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Get price ID
    const priceId = getPriceId(tier, billing);

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('stripe_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    let stripeSubscriptionId: string | undefined;

    if (existingSub?.stripe_subscription_id) {
      // Upgrade/downgrade existing subscription
      const subscription = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);

      // Update subscription to new price
      const updated = await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        proration_behavior: 'create_prorations',
      });

      stripeSubscriptionId = updated.id;
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        user_id: userId,
        price_id: priceId,
        tier: tier,
        billing: billing,
      },
      allow_promotion_codes: true,
    };

    // If updating existing subscription, set subscription ID
    if (stripeSubscriptionId) {
      sessionParams.subscription = stripeSubscriptionId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// POST /api/checkout/purchase - Create one-time purchase checkout session
export async function POST_PURCHASE(request: NextRequest) {
  try {
    const { workflowId, userId } = await request.json() as PurchaseRequest;

    // Validate input
    if (!workflowId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, userId' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, name, price')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      console.error('Workflow not found:', workflowError);
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: workflow.name,
              description: `n8n workflow: ${workflow.name}`,
            },
            unit_amount: Math.round(workflow.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workflows/${workflowId}`,
      metadata: {
        user_id: userId,
        workflow_id: workflowId,
        mode: 'payment',
      },
    });

    console.log('✅ Purchase checkout session created:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Purchase checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'subscribe';

  if (type === 'purchase') {
    return POST_PURCHASE(request);
  }

  return POST_SUBSCRIBE(request);
}
