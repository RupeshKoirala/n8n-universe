import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Stripe Configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.warn('Stripe secret key is not configured');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Pricing Tiers
export const pricingTiers = {
  free: {
    id: 'price_free_tier',
    name: 'Free Tier',
    price: 0,
    downloadsPerDay: 3,
    features: [
      '3 downloads per day',
      'Basic workflow search',
      'Community support'
    ]
  },
  basic: {
    id: 'price_basic_monthly',
    name: 'Basic Plan',
    price: 900, // $9.00
    interval: 'month',
    downloadsPerDay: 0, // unlimited
    features: [
      'Unlimited downloads',
      'Advanced workflow search',
      'Email support',
      'Priority workflow reviews'
    ]
  },
  pro: {
    id: 'price_pro_monthly',
    name: 'Pro Plan',
    price: 1900, // $19.00
    interval: 'month',
    downloadsPerDay: 0, // unlimited
    features: [
      'Unlimited downloads',
      'AI-powered workflow recommendations',
      'Priority support',
      'Early access to new workflows',
      'Workflow analytics dashboard'
    ]
  },
  enterprise: {
    id: 'price_enterprise_monthly',
    name: 'Enterprise Plan',
    price: 9900, // $99.00
    interval: 'month',
    downloadsPerDay: 0, // unlimited
    features: [
      'Everything in Pro',
      'Custom workflow development',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label marketplace option'
    ]
  }
} as const;

// Helper: Generate Stripe checkout session
async function createCheckoutSession(
  userId: string,
  workflowIds: string[],
  tier: 'basic' | 'pro' | 'enterprise'
) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const pricing = pricingTiers[tier];

  // Calculate total
  let totalPrice = pricing.price;

  // If purchasing workflows, add their prices
  if (workflowIds.length > 0 && supabase) {
    const { data: workflows } = await supabase
      .from('workflows')
      .select('price')
      .in('id', workflowIds)
      .order('price');

    if (workflows) {
      totalPrice = workflows.reduce((sum, workflow) => sum + (workflow.price || 0), totalPrice);
    }
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tier === 'enterprise' ? 'Enterprise Subscription' : 'Marketplace Plan',
            description: pricing.features.join(', ')
          },
          unit_amount: pricing.price,
          recurring: pricing.interval ? {
            interval: pricing.interval as 'month'
          } : undefined
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
    metadata: {
      user_id: userId,
      tier: tier,
      workflow_ids: workflowIds.length > 0 ? workflowIds.join(',') : 'subscription'
    },
    customer_email: '', // Will be populated from Supabase
    allow_promotion_codes: true
  });

  return session;
}

// Helper: Create Stripe customer for user
async function getOrCreateCustomer(userId: string) {
  if (!stripe || !supabase) {
    throw new Error('Stripe or Supabase not configured');
  }

  // Get user from Supabase
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Create Stripe customer if not exists
  let stripeCustomerId = user.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: userId
      }
    });

    stripeCustomerId = customer.id;

    // Update user with Stripe customer ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: stripeCustomerId
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user with Stripe customer ID:', updateError);
    }
  }

  return stripeCustomerId;
}

// GET /api/pricing - Get pricing plans
export async function GET_PRICING() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get Stripe prices
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    // Filter and format prices
    const formattedPrices = Object.entries(pricingTiers).map(([key, tier]) => {
      const stripePrice = prices.data.find(p => p.id === tier.id);

      return {
        id: tier.id,
        name: tier.name,
        price: tier.price / 100, // Convert to dollars
        interval: tier.interval,
        features: tier.features,
        downloadsPerDay: tier.downloadsPerDay,
        stripePriceId: tier.id !== 'price_free_tier' ? stripePrice?.id : null
      };
    });

    return NextResponse.json({
      pricing: formattedPrices,
      currency: 'USD'
    });

  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// POST /api/checkout/create - Create checkout session
export async function POST_CHECKOUT_CREATE(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify session with Supabase
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(authHeader);

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, workflow_ids } = body;

    if (!tier) {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateCustomer(user.id);

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      user.id,
      workflow_ids || [],
      tier
    );

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// POST /api/checkout/subscribe - Create subscription checkout
export async function POST_CHECKOUT_SUBSCRIBE(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify session with Supabase
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(authHeader);

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || tier === 'free') {
      return NextResponse.json({ error: 'Valid tier is required' }, { status: 400 });
    }

    const pricing = pricingTiers[tier];

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateCustomer(user.id);

    // Create checkout session with subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: pricing.id,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
      customer: stripeCustomerId,
      metadata: {
        user_id: user.id,
        tier: tier
      },
      customer_email: '', // Will be populated from Supabase
      subscription_data: {
        metadata: {
          tier: tier
        }
      },
      allow_promotion_codes: true
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// POST /api/checkout/webhook - Stripe webhook handler
export async function POST_CHECKOUT_WEBHOOK(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 500 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Stripe webhook secret is not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { user_id, tier, workflow_ids } = session.metadata;

        if (user_id) {
          if (tier) {
            // Update user subscription tier
            await supabase?.from('users').update({
              subscription_tier: tier,
              subscription_ends_at: null,
              subscribed_at: new Date().toISOString()
            }).eq('id', user_id);

            // Log subscription
            await supabase?.from('subscriptions').insert({
              user_id,
              tier,
              status: 'active',
              stripe_subscription_id: session.subscription,
              started_at: new Date().toISOString()
            });
          }

          if (workflow_ids) {
            // Record workflow purchases
            const ids = workflow_ids.split(',');

            for (const workflowId of ids) {
              await supabase?.from('downloads').insert({
                user_id,
                workflow_id,
                workflow_name: `Workflow ${workflowId}`, // Will be populated
                workflow_price: 0, // Will be populated
                downloaded_at: new Date().toISOString(),
                file_size: 0 // Will be populated
              });
            }
          }

          console.log(`Checkout completed for user ${user_id}, tier: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { user_id, tier } = subscription.metadata;

        if (user_id) {
          const status = subscription.status;

          if (status === 'active') {
            // Subscription renewed
            await supabase?.from('users').update({
              subscription_tier: tier,
              subscription_ends_at: null,
              renewed_at: new Date().toISOString()
            }).eq('id', user_id);

            await supabase?.from('subscriptions').update({
              status: 'active',
              renewed_at: new Date().toISOString()
            }).eq('stripe_subscription_id', subscription.id);
          } else if (status === 'cancelled' || status === 'past_due' && !subscription.cancel_at) {
            // Subscription cancelled
            await supabase?.from('users').update({
              subscription_tier: 'free',
              subscription_ends_at: subscription.cancel_at || subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString(),
              cancelled_at: new Date().toISOString()
            }).eq('id', user_id);

            await supabase?.from('subscriptions').update({
              status: 'cancelled',
              ended_at: new Date().toISOString()
            }).eq('stripe_subscription_id', subscription.id);
          }

          console.log(`Subscription updated for user ${user_id}, status: ${status}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const { user_id, tier } = invoice.subscription_metadata || {};

        if (user_id && tier) {
          // Subscription payment successful
          await supabase?.from('subscriptions').upsert({
            user_id,
            tier,
            status: 'active',
            stripe_subscription_id: invoice.subscription,
            paid_at: new Date().toISOString(),
            amount_paid: invoice.amount_paid / 100 // Convert cents to dollars
          });
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// GET /api/checkout/success - Success page
export async function GET_CHECKOUT_SUCCESS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.redirect('/checkout/error');
    }

    if (!stripe) {
      return NextResponse.redirect('/checkout/error');
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        amount_total: session.amount_total / 100,
        currency: session.currency,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email || session.customer_email || ''
      }
    });

  } catch (error) {
    console.error('Success page error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
