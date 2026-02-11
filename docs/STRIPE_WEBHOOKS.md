# Stripe Webhooks - Testing Guide

This guide shows you how to test Stripe webhooks locally using Stripe CLI before deploying to production.

---

## 📋 Prerequisites

1. **Stripe Account** - Sign up at https://stripe.com if you haven't
2. **Stripe CLI** - Install the Stripe CLI
3. **Local Development Server** - Next.js dev server running on `localhost:3000`

---

## 🚀 Install Stripe CLI

### macOS (Homebrew)

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Download latest binary
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe-cli-linux-x86_64.tar.gz

# Extract and install
tar -xvzf stripe-cli-linux-x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Verify installation
stripe --version
```

### Windows

```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

---

## 🔑 Authenticate with Stripe

```bash
stripe login
```

This opens your browser. Log in to your Stripe account and authorize the CLI.

---

## 🧪 Test Webhooks Locally

### 1. Start Your Next.js Dev Server

```bash
cd /root/.openclaw/workspace/n8n-universe
npm run dev
```

Your app should be running at `http://localhost:3000`

### 2. Start Stripe CLI Webhook Forwarding

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Forward webhook events from Stripe to your local server
- Show a **webhook signing secret** (save this!)

You'll see output like:

```
> Ready! Your webhook signing secret is whsec_abc123def456... (^C to quit)
```

### 3. Copy the Webhook Secret

Copy the secret shown by Stripe CLI and update your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...
```

### 4. Test Events

#### Option A: Test with Stripe CLI

Trigger test events directly:

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger a subscription update
stripe trigger customer.subscription.updated

# Trigger a payment failure
stripe trigger invoice.payment_failed
```

#### Option B: Test with Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/events
2. Click "Send test webhook"
3. Select event type
4. Send to your webhook endpoint

---

## 📊 Monitor Webhook Events

### Stripe CLI

```bash
# Forward and show event details
stripe listen --forward-to localhost:3000/api/webhooks/stripe --events checkout.session.completed,customer.subscription.updated
```

### Your Server Logs

Check your Next.js logs to see webhook processing:

```
📩 Received event: checkout.session.completed
🎉 Checkout session completed: cs_test_...
✅ User abc123 upgraded to basic tier
```

---

## 🔍 Common Webhook Events

### New Subscription

```bash
stripe trigger checkout.session.completed \
  --add checkout.session:metadata.user_id=test_user_123 \
  --add checkout.session:metadata.price_id=price_basic_monthly \
  --add checkout.session:mode=subscription
```

### Subscription Update

```bash
stripe trigger customer.subscription.updated \
  --add customer.subscription:items[0].price.id=price_pro_monthly
```

### Subscription Cancelation

```bash
stripe trigger customer.subscription.deleted
```

### Payment Failed

```bash
stripe trigger invoice.payment_failed
```

---

## 🎯 End-to-End Test Flow

### Test 1: Free User → Basic Subscription

1. **Create a test user** in Supabase (via sign-up page)
2. **Trigger checkout session:**

```bash
stripe trigger checkout.session.completed \
  --add checkout.session:metadata.user_id=<user_id_from_supabase> \
  --add checkout.session:metadata.price_id=price_basic_monthly \
  --add checkout.session:mode=subscription \
  --add checkout.session:customer.id=cus_test_123
```

3. **Verify in Supabase:**
   - Check `users` table - `subscription_tier` should be `basic`
   - Check `stripe_subscriptions` table - new record created

### Test 2: Subscription Upgrade

```bash
stripe trigger customer.subscription.updated \
  --add customer.subscription:customer=cus_test_123 \
  --add customer.subscription:items[0].price.id=price_pro_monthly
```

**Verify:** User tier updated to `pro`

### Test 3: Subscription Cancelation

```bash
stripe trigger customer.subscription.deleted \
  --add customer.subscription:customer=cus_test_123
```

**Verify:** User tier reverted to `free`

### Test 4: One-Time Workflow Purchase

```bash
stripe trigger checkout.session.completed \
  --add checkout.session:metadata.user_id=<user_id> \
  --add checkout.session:metadata.workflow_id=<workflow_id> \
  --add checkout.session:mode=payment \
  --add checkout.session:amount_total=500 \
  --add checkout.session:customer.id=cus_test_456
```

**Verify:**
- `downloads` table has new record
- `workflows` table download count incremented

---

## 🐛 Debugging Tips

### Webhook Not Reaching Your Server?

1. **Check if Stripe CLI is running:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

2. **Check if Next.js is running:**
```bash
npm run dev
```

3. **Test the webhook endpoint:**
```bash
curl http://localhost:3000/api/webhooks/stripe
```

Expected response:
```json
{
  "status": "ok",
  "message": "Stripe webhook endpoint is ready"
}
```

### Signature Verification Failed?

Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the one shown by `stripe listen`.

### Database Errors?

Check your Supabase logs:

```bash
# View recent errors
supabase db dump
```

---

## 🚀 Deployment to Production

### 1. Deploy Your App

Deploy to Vercel/Netlify/your hosting.

### 2. Add Production Webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the webhook signing secret
7. Add to your production environment variables:
```bash
STRIPE_WEBHOOK_SECRET=whsec_production_secret...
```

### 3. Test in Production

Use the Stripe Dashboard to send test webhooks to production:

1. Go to https://dashboard.stripe.com/test/events
2. Click "Send test webhook"
3. Select your production endpoint
4. Trigger the event
5. Check your production logs

---

## 📝 Event Types Reference

| Event | Description | Handler |
|-------|-------------|---------|
| `checkout.session.completed` | Payment successful (subscription or one-time) | Creates/updates subscription, records download |
| `customer.subscription.updated` | Subscription changed (upgrade/downgrade) | Updates user tier and subscription record |
| `customer.subscription.deleted` | Subscription canceled | Downgrades user to free tier |
| `invoice.payment_succeeded` | Renewal payment successful | Updates subscription period |
| `invoice.payment_failed` | Payment failed | Logs error (TODO: send email) |

---

## 🛡️ Security Notes

### Development

- Stripe CLI bypasses signature verification if `STRIPE_WEBHOOK_SECRET` is not set
- This is **OK for local testing only**

### Production

- Always set `STRIPE_WEBHOOK_SECRET` in production
- Signature verification is **mandatory** for security
- Never expose your secret keys

---

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## ✅ Checklist Before Going Live

- [ ] Install Stripe CLI
- [ ] Test all webhook events locally
- [ ] Verify database updates in Supabase
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Add `STRIPE_WEBHOOK_SECRET` to production env
- [ ] Test webhooks in production
- [ ] Set up error logging/monitoring
- [ ] Test end-to-end checkout flow

---

*Last Updated: 2026-02-11*
