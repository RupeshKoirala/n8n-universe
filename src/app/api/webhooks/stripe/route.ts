import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Helper functions
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout session completed:', session.id);

  const userId = session.metadata?.user_id;
  const priceId = session.metadata?.price_id;
  const mode = session.mode; // 'subscription' or 'payment'

  if (!userId) {
    console.error('❌ No user_id in session metadata');
    return;
  }

  if (mode === 'subscription') {
    // Subscription created
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    console.log('📦 New subscription:', subscriptionId);

    // Fetch subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Determine tier from price ID or metadata
    let tier: 'free' | 'basic' | 'pro' | 'enterprise' = 'free';

    // Map price IDs to tiers (you'll need to configure these in Stripe)
    if (priceId?.includes('basic')) tier = 'basic';
    else if (priceId?.includes('pro')) tier = 'pro';
    else if (priceId?.includes('enterprise')) tier = 'enterprise';

    // Update user in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_ends_at: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError);
      throw updateError;
    }

    // Record subscription in stripe_subscriptions table
    const { error: subError } = await supabase
      .from('stripe_subscriptions')
      .insert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || '',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        tier: tier,
        created_at: new Date().toISOString()
      });

    if (subError) {
      console.error('❌ Error recording subscription:', subError);
    }

    console.log(`✅ User ${userId} upgraded to ${tier} tier`);
  } else if (mode === 'payment') {
    // One-time payment (single workflow purchase)
    const workflowId = session.metadata?.workflow_id;

    if (workflowId) {
      console.log('💳 One-time payment for workflow:', workflowId);

      // Record the download as paid
      const { error: downloadError } = await supabase
        .from('downloads')
        .insert({
          user_id: userId,
          workflow_id: workflowId,
          price_paid: session.amount_total ? session.amount_total / 100 : 0,
          downloaded_at: new Date().toISOString()
        });

      if (downloadError) {
        console.error('❌ Error recording download:', downloadError);
      }

      // Increment workflow download count
      const { error: updateError } = await supabase
        .from('workflows')
        .update({
          download_count: supabase.rpc('increment', { row_id: workflowId })
        })
        .eq('id', workflowId);

      if (updateError) {
        console.error('❌ Error updating download count:', updateError);
      }

      console.log(`✅ Workflow ${workflowId} purchased by user ${userId}`);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  // Determine new tier based on status
  let tier: 'free' | 'basic' | 'pro' | 'enterprise' = 'free';

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const priceId = subscription.items.data[0]?.price.id;

    if (priceId?.includes('basic')) tier = 'basic';
    else if (priceId?.includes('pro')) tier = 'pro';
    else if (priceId?.includes('enterprise')) tier = 'enterprise';
  }

  // Update user
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_ends_at: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating user:', updateError);
    throw updateError;
  }

  // Update subscription record
  const { error: subError } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      tier: tier,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    console.error('❌ Error updating subscription record:', subError);
  }

  console.log(`✅ User ${user.id} subscription updated to ${tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  // Update user to free tier
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_ends_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating user:', updateError);
    throw updateError;
  }

  // Update subscription record
  const { error: subError } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    console.error('❌ Error updating subscription record:', subError);
  }

  console.log(`✅ User ${user.id} subscription canceled`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💳 Invoice payment succeeded:', invoice.id);

  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  // Update subscription period
  const customerId = invoice.customer as string;

  const { error: updateError } = await supabase
    .from('stripe_subscriptions')
    .update({
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('❌ Error updating subscription period:', updateError);
  }

  console.log(`✅ Subscription ${subscription.id} renewed`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);

  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  const customerId = invoice.customer as string;

  // Find user by customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  // TODO: Send email notification about failed payment
  console.log(`⚠️ Payment failed for user ${user.id} (${user.email}). Invoice: ${invoice.id}`);
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text();

    // Get signature
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // For testing without webhook secret (development only)
      console.warn('⚠️ No webhook secret configured, skipping verification');
      event = JSON.parse(body);
    }

    console.log(`📩 Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is ready',
    events: [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ]
  });
}
