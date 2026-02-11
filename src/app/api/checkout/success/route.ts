import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// GET /api/checkout/success?session_id=xxx - Retrieve checkout session
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log('✅ Checkout session retrieved:', session.id);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        amount_total: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        payment_status: session.payment_status,
        customer_email: session.customer_email || session.customer_details?.email,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error('❌ Retrieve session error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
