# Next.js Build Plan for n8n-universe

## 📋 OVERVIEW

**Platform:** Next.js 14 (App Router)
**Backend:** Supabase (PostgreSQL + Auth + Storage)
**Payments:** Stripe
**Search:** OpenAI Embeddings + pgvector
**Hosting:** Vercel or Hostinger VPS
**Timeline:** 2 months (8 weeks)

---

## 🎯 WEEK 1-2: FOUNDATION

### Week 1: Project Setup & Database

#### Tasks:
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Supabase project
- [ ] Create database schema:
  - `workflows` table (metadata, tags, content)
  - `users` table (auth, subscriptions)
  - `downloads` table (purchase history)
  - `categories` table
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure Supabase Auth (GitHub OAuth)
- [ ] Create workflow storage bucket (for JSON files)

#### Deliverables:
- ✅ Working Next.js project
- ✅ Supabase database with RLS
- ✅ Auth system connected

---

### Week 2: API & Indexer

#### Tasks:
- [ ] Build indexer script (enhanced from Python version)
- [ ] Create API routes:
  - `GET /api/workflows` - list with pagination
  - `GET /api/workflows/[id]` - workflow details
  - `GET /api/search?q=` - keyword search
  - `POST /api/similar` - find similar workflows
  - `GET /api/categories` - list categories
- [ ] Implement file upload for workflows
- [ ] Create workflow preview generator (visual graph)
- [ ] Add rate limiting to API

#### Deliverables:
- ✅ Enhanced indexer script
- ✅ Working API endpoints
- ✅ Workflow preview system

---

## 🎯 WEEK 3-4: FRONTEND PAGES

### Week 3: Core Pages

#### Tasks:
- [ ] Build landing page (hero section, value prop, CTA)
- [ ] Create search/discovery page
- [ ] Build workflow detail page
- [ ] Implement workflow preview (visual graph)
- [ ] Create category browsing pages
- [ ] Add "trending workflows" section
- [ ] Build user dashboard (manage downloads, subscriptions)

#### Deliverables:
- ✅ 5+ complete pages
- ✅ Working navigation

---

### Week 4: User Features

#### Tasks:
- [ ] Implement user authentication (GitHub OAuth)
- [ ] Create user profile page
- [ ] Build download history
- [ ] Add favorite/worklist feature
- [ ] Create review/rating system
- [ ] Implement user settings page

#### Deliverables:
- ✅ Complete auth flow
- ✅ User account features

---

## 🎯 WEEK 5-6: PAYMENTS & MONETIZATION

### Week 5: Stripe Integration

#### Tasks:
- [ ] Set up Stripe account
- [ ] Create Stripe checkout flow:
  - One-time purchase ($1-5)
  - Subscription ($19/mo Pro)
- [ ] Implement webhook handlers:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Build download protection (authenticated users only)
- [ ] Create admin dashboard (sales, subscribers)
- [ ] Add analytics tracking

#### Deliverables:
- ✅ Working Stripe payments
- ✅ Subscription management

---

### Week 6: Testing & Launch Prep

#### Tasks:
- [ ] Write end-to-end tests
- [ ] Test payment flow (test mode)
- [ ] Optimize performance (images, code splitting)
- [ ] Implement SEO (meta tags, sitemap)
- [ ] Add error tracking (Sentry)
- [ ] Create deployment checklist
- [ ] Write documentation (setup, API, contribution)

#### Deliverables:
- ✅ Tested application
- ✅ Ready for deployment

---

## 🎯 WEEK 7-8: SEARCH & EMBEDDINGS

### Week 7: Semantic Search

#### Tasks:
- [ ] Set up OpenAI API key
- [ ] Create embeddings generation script:
  - Batch process all workflows
  - Generate 1536-dimensional vectors
  - Store in pgvector column
- [ ] Implement vector similarity search API:
  - `POST /api/search-semantic`
  - `GET /api/similar/[id]`
- [ ] Add hybrid search (keyword + semantic)
- [ ] Cache popular search results

#### Deliverables:
- ✅ All workflows embedded
- ✅ Semantic search working

---

### Week 8: Polish & Launch

#### Tasks:
- [ ] Create 100 workflow previews (images, descriptions)
- [ ] Write compelling copy (hero, features)
- [ ] Add email capture (newsletter)
- [ ] Set up error monitoring
- [ ] Create FAQ page
- [ ] Deploy to Vercel (or VPS)
- [ ] Set up custom domain
- [ ] Create launch announcement
- [ ] Set up post-launch monitoring

#### Deliverables:
- ✅ Live marketplace
- ✅ Working payments
- ✅ Search functional
- ✅ Users can purchase

---

## 🗄️ DATABASE SCHEMA

### Workflows Table
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  tags TEXT[],
  node_count INTEGER,
  complexity TEXT, -- simple, medium, complex
  integrations TEXT[],
  triggers TEXT[],
  actions TEXT[],
  difficulty TEXT, -- beginner, intermediate, advanced
  price NUMERIC DEFAULT 1,
  popularity INTEGER DEFAULT 0,
  rating NUMERIC,
  download_count INTEGER DEFAULT 0,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  embedding vector(1536), -- OpenAI embeddings
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_category ON workflows(category_id);
CREATE INDEX idx_workflows_complexity ON workflows(complexity);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  github_id TEXT UNIQUE,
  github_username TEXT,
  subscription_tier TEXT, -- free, pro, enterprise
  subscription_id TEXT, -- Stripe customer ID
  subscription_status TEXT, -- active, cancelled, past_due
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Downloads Table
```sql
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  workflow_id UUID REFERENCES workflows(id),
  price_paid NUMERIC,
  download_count INTEGER DEFAULT 1,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 SECURITY

### Row Level Security (RLS)
- **Workflows:** Public read, admin write
- **Users:** Own data only
- **Downloads:** Own records only
- **Subscriptions:** Stripe webhooks only

### Authentication
- GitHub OAuth (primary)
- Email/password (future)
- Session management

---

## 🎨 DESIGN SYSTEM

### Tailwind CSS
- Dark mode default
- Color palette:
  - Primary: #FF6D5A (orange, n8n brand)
  - Secondary: #1F2937 (dark blue)
  - Accent: #10B981 (green)
  - Text: #F8FAFC (off-white)

### Components
- Card-based layout for workflows
- Grid for discovery
- Modal for preview
- Sidebar for navigation
- Toast notifications

---

## 📊 PRICING STRUCTURE

### Pay-per-Download
- Simple workflows: $1
- Medium: $2
- Complex: $3
- Premium/Bundles: $5-49

### Subscriptions
- **Free:** 10 downloads/mo, limited search
- **Basic ($9/mo):** 100 downloads/mo, full search
- **Pro ($19/mo):** Unlimited downloads, priority support, early access
- **Enterprise ($99/mo):** API access, custom builds, SLA

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] All workflows indexed and embedded
- [ ] Stripe account verified
- [ ] Domain configured
- [ ] Error monitoring set up
- [ ] Analytics (Google Analytics)
- [ ] Email notifications working

### Launch Day
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor first hour
- [ ] Fix any critical bugs
- [ ] Announce on social media

---

## 📈 SUCCESS METRICS

### Week 1-4
- Code quality metrics
- API performance (<200ms p95)
- Database query optimization

### Week 5-8
- Sign-up rate
- Search conversion
- Payment success rate
- User retention

### Post-Launch
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate
- NPS (Net Promoter Score)

---

*Last Updated: 2026-02-07*
*Status: Planning Phase - Awaiting Workflows Upload*
