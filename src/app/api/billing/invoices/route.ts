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

// GET /api/billing/invoices - Get user's invoices
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_customer_id) {
      // No invoices yet
      return NextResponse.json({ invoices: [] });
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 100,
    });

    console.log(`✅ Fetched ${invoices.data.length} invoices for user ${userId}`);

    return NextResponse.json({
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid || invoice.total,
        currency: invoice.currency,
        created: invoice.created,
        pdf_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      })),
      hasMore: invoices.has_more,
    });
  } catch (error) {
    console.error('❌ Fetch invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
