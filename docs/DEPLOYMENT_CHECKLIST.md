# Deployment Checklist - n8n Automation Marketplace

**Created:** 2026-02-19
**Purpose:** Complete checklist for production deployment

---

## Pre-Deployment Checklist

### 1. Code & Repository

- [ ] All code committed to `develop` branch
- [ ] No uncommitted changes in working directory
- [ ] Code reviewed and approved
- [ ] No TODO comments in critical paths
- [ ] All console.log statements removed (except debugging)
- [ ] Error handling in place for all API routes
- [ ] No hardcoded secrets in code

### 2. Environment Configuration

- [ ] `.env.local` created (NOT committed to Git)
- [ ] `.env.example` updated with all required variables
- [ ] Production environment variables configured
- [ ] No test/development values in production

```bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon-key
SUPABASE_SERVICE_ROLE_KEY=production-service-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxx

OPENAI_API_KEY=sk-prod-xxxxxx

NEXTAUTH_SECRET=random-64-char-string
NEXTAUTH_URL=https://your-domain.com

GITHUB_CLIENT_ID=prod-client-id
GITHUB_CLIENT_SECRET=prod-client-secret
```

### 3. Database

- [ ] All migrations applied to production database
- [ ] Sample data removed or replaced with real data
- [ ] RLS policies enabled
- [ ] Database indexes created
- [ ] PostgreSQL functions tested
- [ ] Materialized view created (`daily_analytics`)
- [ ] Database backups enabled

```bash
# Apply migrations
supabase migration up

# Verify tables
supabase db list

# Check row counts
supabase db execute "SELECT COUNT(*) FROM workflows;"
supabase db execute "SELECT COUNT(*) FROM users;"
```

### 4. Workflow Data

- [ ] All 25,000+ workflows indexed
- [ ] Embeddings generated for semantic search
- [ ] Workflows uploaded to Supabase
- [ ] Workflow categories verified
- [ ] Pricing applied correctly
- [ ] No duplicate workflows

### 5. Stripe Configuration

- [ ] Stripe account verified (KYC complete)
- [ ] Products created in Stripe:
  - Basic Monthly ($19)
  - Basic Annual ($190)
  - Pro Monthly ($49)
  - Pro Annual ($490)
  - Enterprise Monthly ($99)
  - Enterprise Annual ($990)
- [ ] Webhook endpoint configured:
  - URL: `https://your-domain.com/api/webhooks/stripe`
  - Events enabled:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
- [ ] Webhook secret generated and saved
- [ ] Test transactions successful

### 6. Domain & DNS

- [ ] Domain purchased and configured
- [ ] DNS records pointing to hosting provider
- [ ] SSL/TLS certificate configured (HTTPS only)
- [ ] www subdomain configured (redirects to non-www)
- [ ] DNS propagation complete

### 7. Hosting Setup

- [ ] Hosting provider configured (Vercel, Netlify, or VPS)
- [ ] Node.js version 18+ installed
- [ ] Build process tested
- [ ] Environment variables set in hosting dashboard
- [ ] File storage configured (Supabase Storage)
- [ ] CDN configured for static assets
- [ ] Server logs accessible

---

## Build & Deploy

### 8. Build Process

```bash
# Install dependencies
npm ci

# Run tests
npm run test  # If tests exist

# Build for production
npm run build

# Test production build locally
npm start

# Verify critical pages load:
# - http://localhost:3000
# - http://localhost:3000/workflows
# - http://localhost:3000/pricing
# - http://localhost:3000/dashboard
```

- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings (except allowed ones)
- [ ] Build size optimized
- [ ] Critical pages load locally

### 9. Deployment

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

- [ ] Vercel project created
- [ ] Git repository connected
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] Automatic deployments enabled (from develop branch)
- [ ] Production build successful

**Option B: VPS (Hostinger)**
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Clone repository
git clone https://github.com/your-username/n8n-universe.git
cd n8n-universe
git checkout develop

# Install dependencies
npm ci

# Build
npm run build

# Start with PM2
pm2 start npm --name "n8n-marketplace" -- start
pm2 save
pm2 startup

# Configure Nginx (reverse proxy)
sudo nano /etc/nginx/sites-available/n8n-marketplace

# Enable HTTPS with Certbot
sudo certbot --nginx -d your-domain.com
```

- [ ] Node.js 18+ installed
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured (port 80, 443 open)
- [ ] Auto-restart on server reboot enabled
- [ ] Server logs monitored

---

## Post-Deployment Verification

### 10. Critical Functionality Tests

- [ ] Homepage loads (https://your-domain.com)
- [ ] HTTPS works (no mixed content warnings)
- [ ] All pages load without errors
- [ ] User sign up works
- [ ] User sign in works
- [ ] Browse workflows works
- [ ] Search workflows works
- [ ] Workflow detail page loads
- [ ] Download workflow works
- [ ] Pricing page loads
- [ ] Stripe checkout initiates
- [ ] Checkout completes successfully
- [ ] Webhooks receive events from Stripe
- [ ] User dashboard loads
- [ ] Admin dashboard loads (enterprise user)
- [ ] Export functionality works

### 11. Analytics & Monitoring

- [ ] Google Analytics configured (if using)
- [ ] Page view tracking works
- [ ] Search tracking works
- [ ] Download tracking works
- [ ] Event tracking works
- [ ] Error tracking configured (Sentry optional)
- [ ] Uptime monitoring configured (UptimeRobot, etc.)

### 12. Email Notifications

- [ ] Email service configured (Resend, SendGrid, etc.)
- [ ] Welcome email sends on signup
- [ ] Receipt email sends on purchase
- [ ] Invoice reminder sends (optional)
- [ ] Daily/weekly reports can send (optional)

### 13. Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Database queries optimized
- [ ] Images optimized (WebP format)
- [ ] Gzip compression enabled
- [ ] CDN caching configured

---

## Security Verification

### 14. Security Headers

- [ ] Content Security Policy (CSP) configured
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security: max-age=31536000; includeSubDomains
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### 15. Database Security

- [ ] Supabase Row Level Security enabled
- [ ] Service role key never exposed to client
- [ ] SQL injection prevention verified
- [ ] Database access restricted (IP whitelist)
- [ ] Regular backups scheduled
- [ ] Encrypted connections only (SSL)

### 16. API Security

- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] API authentication required for protected routes
- [ ] Webhook signature verification enabled
- [ ] Error messages don't expose sensitive info

---

## Monitoring & Maintenance

### 17. Monitoring Setup

- [ ] Server uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Performance monitoring (Vercel Analytics, New Relic)
- [ ] Database monitoring (Supabase dashboard)
- [ ] Stripe monitoring (Stripe Dashboard)
- [ ] Alert thresholds configured

### 18. Backup & Recovery

- [ ] Automated database backups enabled (daily)
- [ ] Backup retention policy set (30 days)
- [ ] Restore process tested
- [ ] Disaster recovery plan documented
- [ ] Offsite backup storage

### 19. Log Management

- [ ] Application logs configured
- [ ] Access logs enabled
- [ ] Error logs monitored
- [ ] Log rotation configured
- [ ] Logs retention policy (90 days)

---

## Documentation

### 20. Documentation

- [ ] README.md updated with production URL
- [ ] API documentation up to date
- [ ] Database schema documented
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Onboarding guide for new developers
- [ ] Contact info for support

---

## Launch Preparation

### 21. Marketing & SEO

- [ ] Meta tags configured (title, description, keywords)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags configured
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Google Search Console verified
- [ ] Google Analytics installed
- [ ] Social media accounts ready
- [ ] Launch announcement prepared

### 22. Legal & Compliance

- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Cookie consent banner (if in EU)
- [ ] GDPR compliance checklist
- [ ] CCPA compliance checklist
- [ ] Data retention policy documented

### 23. Support

- [ ] Support email configured
- [ ] Support channel set up (Discord, email, etc.)
- [ ] FAQ page created
- [ ] Contact page working
- [ ] Knowledge base ready
- [ ] Bug report process documented

---

## Final Checklist

### 24. Go-Live Verification

- [ ] All items in this checklist completed
- [ ] Final smoke test passed
- [ ] Team briefed on launch
- [ ] Rollback plan documented
- [ ] Emergency contact list updated
- [ ] Launch day schedule prepared

### 25. Post-Launch Tasks

- [ ] Monitor for 24 hours after launch
- [ ] Fix any critical bugs immediately
- [ ] Gather user feedback
- [ ] Analytics review after 1 week
- [ ] Performance optimization
- [ ] Feature prioritization for next release

---

## Rollback Plan

If critical issues arise after launch:

1. **Immediate Rollback Steps:**
   - [ ] Revert to previous stable version
   - [ ] Notify users of downtime
   - [ ] Document the issue
   - [ ] Investigate root cause

2. **Rollback Commands:**
   ```bash
   # Git rollback
   git revert HEAD
   git push origin develop

   # Database rollback (if needed)
   supabase db rollback <migration-hash>

   # Server restart (VPS)
   pm2 restart n8n-marketplace

   # Or redeploy previous version (Vercel)
   vercel --prod
   ```

3. **Verification:**
   - [ ] Site is back online
   - [ ] All features working
   - [ ] No data loss
   - [ ] Users notified

---

## Contacts & Resources

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Developer | Unbroken Artist | | |
| Hosting Provider | | | |
| Domain Provider | | | |
| Stripe Support | | | |
| Supabase Support | | | |

---

## Deployment Log

| Date | Time | Action | Performed By | Status |
|------|------|--------|--------------|--------|
| | | | | |
| | | | | |

---

## Sign-off

**Deployed by:** _________________________

**Date:** _________________________

**Approved by:** _________________________

**Environment:** [ ] Staging [ ] Production

**Status:** [ ] Ready for Production [ ] Needs Fixes

---

## Post-Deployment Notes

```
Any issues encountered during deployment:
```

```
Changes made after deployment:
```

```
Lessons learned:
```

---

*This checklist should be completed before every production deployment.*
