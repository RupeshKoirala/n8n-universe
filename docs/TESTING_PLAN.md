# Testing Plan - n8n Automation Marketplace

**Created:** 2026-02-19
**Purpose:** Comprehensive testing guide for all marketplace features

---

## Overview

This document outlines the complete testing strategy for the n8n Automation Marketplace, covering all features across Phases 1-4.

---

## Testing Environment Setup

### 1. Local Development Environment
```bash
# Ensure Node.js 18+ is installed
node --version  # Should be v18 or higher

# Install dependencies
cd /root/.openclaw/workspace/n8n-universe
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
# Visit: http://localhost:3000
```

### 2. Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (for testing only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-xxxxxx

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. Database Setup

```bash
# Apply all migrations in order
supabase migration up

# Verify tables exist
supabase db list

# Check sample data
supabase db execute "SELECT COUNT(*) FROM workflows;"
```

---

## Phase 1 Testing: Foundation

### 1.1 Database Schema

**Test Case 1.1.1: Tables Exist**
- [ ] `workflows` table exists with all columns
- [ ] `users` table exists with all columns
- [ ] `categories` table exists with sample data
- [ ] `pricing_tiers` table exists with 4 tiers
- [ ] `downloads` table exists
- [ ] All indexes are created
- [ ] RLS policies are enabled

**Test Case 1.1.2: PostgreSQL Functions**
```sql
-- Test cosine_similarity function
SELECT cosine_similarity(
  '[0.1, 0.2, 0.3]'::vector,
  '[0.1, 0.2, 0.3]'::vector
);
-- Expected: 1.0 (identical vectors)

-- Test search_similar_workflows
SELECT * FROM search_similar_workflows(
  '[0.1, 0.2, 0.3]'::vector,
  5
);

-- Test track_workflow_view
SELECT track_workflow_view_event(
  'user-id'::uuid,
  'workflow-id'::uuid
);
```

**Test Case 1.1.3: Sample Data**
- [ ] At least 7 workflows in database
- [ ] At least 2 users in database
- [ ] At least 4 categories
- [ ] At least 3 pricing tiers
- [ ] Workflows have tags and integrations

### 1.2 Frontend Pages

**Test Case 1.2.1: Home Page**
- [ ] Page loads at `/`
- [ ] Header displays correctly
- [ ] Footer displays correctly
- [ ] Navigation links work
- [ ] Responsive on mobile
- [ ] Hero section displays

**Test Case 1.2.2: Workflows Page**
- [ ] Page loads at `/workflows`
- [ ] Workflows display in grid
- [ ] Search bar functional
- [ ] Category filters work
- [ ] Pagination works
- [ ] Workflow cards show correct info

**Test Case 1.2.3: Categories Page**
- [ ] Page loads at `/categories`
- [ ] All categories display
- [ ] Category cards show workflow counts
- [ ] Clicking category filters workflows

**Test Case 1.2.4: Pricing Page**
- [ ] Page loads at `/pricing`
- [ ] All 4 tiers display correctly
- [ ] Features comparison accurate
- [ ] Monthly/annual toggle works
- [ ] CTA buttons functional

### 1.3 API Routes

**Test Case 1.3.1: Workflows API**
```bash
# Get all workflows
curl http://localhost:3000/api/workflows
# Expected: JSON array of workflows

# Get single workflow
curl http://localhost:3000/api/workflows/{id}
# Expected: Single workflow object

# Search workflows
curl "http://localhost:3000/api/workflows/search?q=automation"
# Expected: Filtered results
```

**Test Case 1.3.2: Categories API**
```bash
# Get all categories
curl http://localhost:3000/api/categories
# Expected: JSON array of categories
```

---

## Phase 2 Testing: Core Features

### 2.1 User Authentication

**Test Case 2.1.1: Sign Up**
- [ ] Sign up page loads
- [ ] Can create account with email/password
- [ ] Email validation works (if enabled)
- [ ] Password requirements enforced
- [ ] Redirect after successful signup
- [ ] User created in database
- [ ] Session established

**Test Case 2.1.2: Sign In**
- [ ] Sign in page loads
- [ ] Can login with valid credentials
- [ ] Error shown for invalid credentials
- [ ] Session established after login
- [ ] User redirected to dashboard

**Test Case 2.1.3: GitHub OAuth**
- [ ] GitHub login button works
- [ ] Redirects to GitHub
- [ ] User authorizes app
- [ ] User created/linked in database
- [ ] Session established

**Test Case 2.1.4: Sign Out**
- [ ] Sign out button works
- [ ] Session destroyed
- [ ] Redirected to home
- [ ] Cannot access protected pages

### 2.2 User Profile & Settings

**Test Case 2.2.1: Profile Page**
- [ ] Profile page loads (`/profile`)
- [ ] Displays user info correctly
- [ ] Can edit username
- [ ] Can edit email (if allowed)
- [ ] Can upload avatar
- [ ] Changes save to database

**Test Case 2.2.2: Settings Page**
- [ ] Settings page loads (`/settings`)
- [ ] Display preferences work
- [ ] Notification preferences save
- [ ] Can delete account (with confirmation)

### 2.3 Download System

**Test Case 2.3.1: Download Limits (Free User)**
- [ ] Free user can download 3 workflows per day
- [ ] Counter resets after 24 hours
- [ ] Error shown after limit reached
- [ ] Download history updates

**Test Case 2.3.2: Download Limits (Basic/Pro/Enterprise)**
- [ ] Basic users have unlimited downloads
- [ ] Pro users have unlimited downloads
- [ ] Enterprise users have unlimited downloads

**Test Case 2.3.3: Download History**
- [ ] Download history page loads
- [ ] Shows all downloads
- [ ] Shows download date
- [ ] Shows workflow info
- [ ] Can filter by date

### 2.4 Shopping Cart

**Test Case 2.4.1: Add to Cart**
- [ ] Add button works on workflow page
- [ ] Cart count updates
- [ ] Multiple workflows can be added
- [ ] Cart persists across page refresh

**Test Case 2.4.2: Cart Page**
- [ ] Cart page loads (`/cart`)
- [ ] All items display
- [ ] Can remove items
- [ ] Total calculated correctly
- [ ] Empty cart state shown

**Test Case 2.4.3: Checkout Flow**
- [ ] Checkout button redirects correctly
- [ ] Stripe checkout session created
- [ ] Redirects to Stripe
- [ ] Returns on success/cancel

### 2.5 Stripe Payments

**Test Case 2.5.1: Subscription Checkout**
- [ ] Can select Basic tier ($19/mo)
- [ ] Can select Pro tier ($49/mo)
- [ ] Can select Enterprise tier ($99/mo)
- [ ] Monthly/annual toggle works
- [ ] Stripe checkout opens
- [ ] Test payment works
- [ ] User tier updates after payment
- [ ] Subscription recorded in database

**Test Case 2.5.2: One-Time Purchase**
- [ ] Can purchase single workflow
- [ ] Correct price charged
- [ ] Payment recorded in `downloads` table
- [ ] Download unlocked immediately

**Test Case 2.5.3: Webhook Handlers**
```bash
# Use Stripe CLI to test webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# Verify:
# - Database updated correctly
# - User tier changed
# - Email sent (if configured)
```

**Test Case 2.5.4: Checkout Success Page**
- [ ] Success page loads (`/checkout/success`)
- [ ] Order details displayed
- [ ] Shows subscription info
- [ ] Links to browse workflows

**Test Case 2.5.5: Checkout Cancel Page**
- [ ] Cancel page loads (`/checkout/cancel`)
- [ ] Shows cancellation message
- [ ] Links back to pricing

### 2.6 Subscription Management

**Test Case 2.6.1: Subscription Page**
- [ ] Page loads (`/subscription`)
- [ ] Current plan displayed
- [ ] Upgrade options shown
- [ ] Can cancel subscription
- [ ] Can resume canceled subscription

**Test Case 2.6.2: Billing History**
- [ ] Billing page loads (`/billing`)
- [ ] Shows all invoices
- [ ] Can download PDF
- [ ] Shows payment status

---

## Phase 3 Testing: Search & Filters

### 3.1 Advanced Search

**Test Case 3.1.1: Basic Search**
- [ ] Search bar responds to input
- [ ] Shows results as you type (300ms debounce)
- [ ] Results display correctly
- [ ] No results state shown

**Test Case 3.1.2: Advanced Filters**
- [ ] Category filter works
- [ ] Complexity filter works (simple/medium/complex)
- [ ] Difficulty filter works (beginner/intermediate/advanced)
- [ ] Price range filter works
- [ ] Tags filter works
- [ ] Integrations filter works
- [ ] Triggers filter works
- [ ] Actions filter works

**Test Case 3.1.3: Sorting**
- [ ] Sort by popularity works
- [ ] Sort by rating works
- [ ] Sort by downloads works
- [ ] Sort by date works
- [ ] Sort by price works
- [ ] Sort by name works

**Test Case 3.1.4: Search Suggestions**
- [ ] Typeahead suggestions appear
- [ ] Shows workflow names
- [ ] Shows tags
- [ ] Shows integrations
- [ ] Click selects suggestion

### 3.2 Semantic Search

**Test Case 3.2.1: OpenAI Embeddings**
- [ ] Embeddings generated for workflows
- [ ] Vector search returns relevant results
- [ ] Hybrid search (text + semantic) works
- [ ] Falls back to text search if embeddings fail

**Test Case 3.2.2: Related Workflows**
- [ ] Related workflows display on workflow detail page
- [ ] Relevance scores shown
- [ ] Clicking related workflow navigates correctly

### 3.3 Trending Workflows

**Test Case 3.3.1: Trending API**
```bash
curl "http://localhost:3000/api/workflows/trending?days=7"
# Expected: Top 10 workflows by downloads + views
```

- [ ] 7-day trending works
- [ ] 30-day trending works
- [ ] 90-day trending works

### 3.4 Saved Searches

**Test Case 3.4.1: Save Search**
- [ ] Can save current search
- [ ] Saved search appears in list
- [ ] Can name saved search
- [ ] Can set public/private

**Test Case 3.4.2: Load Saved Search**
- [ ] Can load saved search
- [ ] Filters and sort restored
- [ ] Search executed

**Test Case 3.4.3: Manage Saved Searches**
- [ ] Can delete saved search
- [ ] Can edit saved search name
- [ ] Usage count increments

---

## Phase 4 Testing: Analytics & Dashboard

### 4.1 User Dashboard

**Test Case 4.1.1: Overview Tab**
- [ ] Page loads (`/dashboard`)
- [ ] Total downloads displays
- [ ] Downloads this month displays
- [ ] Favorites count displays
- [ ] Saved searches count displays
- [ ] Only shows current user's data

**Test Case 4.1.2: Downloads Tab**
- [ ] Download history displays
- [ ] Shows workflow name
- [ ] Shows category
- [ ] Shows rating
- [ ] Shows download date
- [ ] Can filter by date range

**Test Case 4.1.3: Favorites Tab**
- [ ] Favorites grid displays
- [ ] Can remove favorite
- [ ] Can add notes to favorite
- [ ] Empty state shown when no favorites

**Test Case 4.1.4: Saved Searches Tab**
- [ ] Saved searches list displays
- [ ] Shows usage count
- [ ] Can delete saved search
- [ ] Can load saved search

**Test Case 4.1.5: Usage Charts**
- [ ] Downloads by date chart displays
- [ ] Downloads by category chart displays
- [ ] Charts are responsive
- [ ] Charts update with data

### 4.2 Admin Dashboard

**Test Case 4.2.1: Access Control**
- [ ] Free users cannot access `/admin`
- [ ] Basic users cannot access `/admin`
- [ ] Pro users cannot access `/admin`
- [ ] Enterprise users CAN access `/admin`

**Test Case 4.2.2: Overview Tab**
- [ ] Total revenue displays
- [ ] MRR displays
- [ ] Active subscriptions displays
- [ ] Conversion rate displays
- [ ] Total users displays
- [ ] Total workflows displays
- [ ] Total downloads displays
- [ ] Churn rate displays
- [ ] Today's stats display

**Test Case 4.2.3: Revenue Tab**
- [ ] Revenue breakdown displays
- [ ] MRR breakdown by tier
- [ ] Revenue history table displays
- [ ] Can export revenue data

**Test Case 4.2.4: Users Tab**
- [ ] User growth metrics display
- [ ] Conversion rate tracking works
- [ ] Churn rate monitoring works
- [ ] Daily user analytics table displays

**Test Case 4.2.5: Workflows Tab**
- [ ] Total workflow stats display
- [ ] Trending workflows list displays
- [ ] Trend scores calculated correctly
- [ ] Performance metrics shown

**Test Case 4.2.6: Search Analytics Tab**
- [ ] Popular searches list displays
- [ ] Search counts shown
- [ ] Average results shown
- [ ] Click rates calculated
- [ ] Color-coded indicators work

**Test Case 4.2.7: Timeframe Selection**
- [ ] 7-day timeframe works
- [ ] 30-day timeframe works
- [ ] 90-day timeframe works
- [ ] Default is 7 days

### 4.3 Real-Time Analytics

**Test Case 4.3.1: Live Counter**
- [ ] Live counter displays
- [ ] Updates every 30 seconds (configurable)
- [ ] Shows correct metrics

**Test Case 4.3.2: Revenue Ticker**
- [ ] Revenue ticker displays
- [ ] Updates in real-time
- [ ] Shows incremental revenue

### 4.4 Export & Reports

**Test Case 4.4.1: CSV Export**
```bash
# Test each export type
curl "http://localhost:3000/api/export?type=daily&format=csv" -o daily.csv
curl "http://localhost:3000/api/export?type=revenue&format=csv" -o revenue.csv
curl "http://localhost:3000/api/export?type=workflows&format=csv" -o workflows.csv
curl "http://localhost:3000/api/export?type=users&format=csv" -o users.csv
curl "http://localhost:3000/api/export?type=search&format=csv" -o search.csv
```

- [ ] Daily analytics export works
- [ ] Revenue export works
- [ ] Workflow performance export works
- [ ] User activity export works
- [ ] Search analytics export works

**Test Case 4.4.2: JSON Export**
```bash
curl "http://localhost:3000/api/export?type=daily&format=json" -o daily.json
```

- [ ] JSON format works for all report types

### 4.5 Event Tracking

**Test Case 4.5.1: Page View Tracking**
- [ ] Page views tracked automatically
- [ ] User ID associated (if logged in)
- [ ] Session ID tracked
- [ ] Referrer tracked

**Test Case 4.5.2: Workflow View Tracking**
- [ ] Workflow views tracked
- [ ] Popularity incremented
- [ ] Event logged in database

**Test Case 4.5.3: Search Tracking**
- [ ] Search queries tracked
- [ ] Filters logged
- [ ] Results count recorded
- [ ] Clicked workflow tracked

**Test Case 4.5.4: Download Tracking**
- [ ] Downloads tracked
- [ ] Workflow ID recorded
- [ ] Price paid logged
- [ ] User ID associated

---

## Integration Testing

### 5.1 End-to-End User Journey

**Test Case 5.1.1: Free User Journey**
1. User visits homepage
2. User browses workflows
3. User searches for workflows
4. User filters results
5. User views workflow detail
6. User downloads 3 workflows (limit reached)
7. User sees upgrade prompt
8. User signs up for account
9. User visits dashboard
10. User sees download history

**Test Case 5.1.2: Paid User Journey**
1. User visits pricing page
2. User selects Basic tier
3. User completes checkout
4. User redirected to success page
5. User tier updated to "basic"
6. User downloads unlimited workflows
7. User saves searches
8. User favorites workflows
9. User visits dashboard
10. User sees all activity

**Test Case 5.1.3: Enterprise User Journey**
1. User subscribes to Enterprise tier
2. User accesses admin dashboard
3. User views revenue analytics
4. User exports reports
5. User monitors search analytics
6. User sees trending workflows

### 5.2 Webhook Integration

**Test Case 5.2.1: Stripe Webhooks**
- [ ] `checkout.session.completed` creates subscription
- [ ] `customer.subscription.updated` updates tier
- [ ] `customer.subscription.deleted` downgrades to free
- [ ] `invoice.payment_succeeded` renews subscription
- [ ] `invoice.payment_failed` logs failure

---

## Performance Testing

### 6.1 Database Performance

**Test Case 6.1.1: Query Performance**
- [ ] Workflows query < 100ms
- [ ] Search query < 200ms
- [ ] Analytics query < 500ms
- [ ] Export query < 2s

**Test Case 6.1.2: Index Usage**
```sql
EXPLAIN ANALYZE SELECT * FROM workflows WHERE category = 'marketing';
-- Should use category index
```

### 6.2 API Response Time

**Test Case 6.2.1: Endpoints**
- [ ] `/api/workflows` < 200ms
- [ ] `/api/workflows/search` < 300ms
- [ ] `/api/analytics/user` < 200ms
- [ ] `/api/analytics/admin` < 500ms

---

## Security Testing

### 7.1 Authentication & Authorization

**Test Case 7.1.1: Protected Routes**
- [ ] `/profile` requires auth
- [ ] `/settings` requires auth
- [ ] `/dashboard` requires auth
- [ ] `/admin` requires enterprise tier
- [ ] Redirects to login if not authenticated

**Test Case 7.1.2: RLS Policies**
- [ ] Users can only see their own favorites
- [ ] Users can only see their own downloads
- [ ] Users can only see their own searches
- [ ] Admins can see all analytics

**Test Case 7.1.3: API Security**
- [ ] Service role key not exposed to client
- [ ] Anon key used for client operations
- [ ] Webhook signature verified
- [ ] SQL injection prevented

### 7.2 Data Privacy

**Test Case 7.2.1: User Data**
- [ ] Passwords hashed (if applicable)
- [ ] Email not exposed to other users
- [ ] Private searches stay private
- [ ] Anon users tracked without PII

---

## Browser Compatibility

### 8.1 Supported Browsers

**Test Case 8.1.1: Desktop**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Case 8.1.2: Mobile**
- [ ] iOS Safari (latest)
- [ ] Android Chrome (latest)
- [ ] Mobile responsive design
- [ ] Touch gestures work

---

## Accessibility Testing

### 9.1 WCAG 2.1 AA

**Test Case 9.1.1: Keyboard Navigation**
- [ ] All features accessible via keyboard
- [ ] Tab order logical
- [ ] Focus indicators visible

**Test Case 9.1.2: Screen Readers**
- [ ] ARIA labels present
- [ ] Alt text for images
- [ ] Semantic HTML

---

## Load Testing

### 10.1 Concurrent Users

**Test Case 10.1.1: Traffic Simulation**
```bash
# Using k6 or similar tool
# Simulate 100 concurrent users
# 1000 requests over 5 minutes
# Monitor response times and errors
```

- [ ] 50 concurrent users: < 200ms avg
- [ ] 100 concurrent users: < 500ms avg
- [ ] 500 concurrent users: < 1s avg
- [ ] Error rate < 1%

---

## Regression Testing

### 11.1 Previous Features

**Test Case 11.1.1: Phase 1**
- [ ] All Phase 1 features still work

**Test Case 11.1.2: Phase 2**
- [ ] All Phase 2 features still work

**Test Case 11.1.3: Phase 3**
- [ ] All Phase 3 features still work

---

## Deployment Testing

### 12.1 Production Environment

**Test Case 12.1.1: Environment Variables**
- [ ] All production vars set
- [ ] No debug mode enabled
- [ ] Correct API endpoints

**Test Case 12.1.2: Database**
- [ ] All migrations applied
- [ ] RLS policies enabled
- [ ] Indexes created

**Test Case 12.1.3: Build & Deploy**
```bash
# Build for production
npm run build

# Test production build
npm start
```

- [ ] Build succeeds
- [ ] No runtime errors
- [ ] Production server starts

---

## Manual Testing Checklist

### Quick Smoke Test (5 minutes)
- [ ] Homepage loads
- [ ] Can browse workflows
- [ ] Can search workflows
- [ ] Can view workflow detail
- [ ] Pricing page loads
- [ ] Can sign up
- [ ] Can sign in

### Full Feature Test (30 minutes)
- [ ] Complete free user journey
- [ ] Complete paid user journey
- [ ] Test admin dashboard (enterprise user)
- [ ] Test export functionality
- [ ] Test mobile responsiveness

---

## Automated Testing

### Test Scripts

**Unit Tests** (to be implemented):
```bash
npm run test
```

**E2E Tests** (to be implemented):
```bash
npm run test:e2e
```

---

## Bug Report Template

When bugs are found, document with:

```
Bug Report:
- Description:
- Steps to Reproduce:
- Expected Behavior:
- Actual Behavior:
- Environment:
- Screenshots/Logs:
```

---

## Test Execution Log

| Date | Tester | Phase | Result | Notes |
|------|--------|-------|--------|-------|
| | | | | |

---

## Sign-off

**Testing Complete:** [Date]
**Tester:** [Name]
**Status:** [Ready for Production / Needs Fixes]

---

*This testing plan should be executed before any production deployment.*
