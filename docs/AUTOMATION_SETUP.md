# Automation Setup Guide

**Created:** 2026-02-19
**Purpose:** Step-by-step guide to automate business operations

---

## Overview

This guide helps you automate critical business operations using n8n, cron jobs, and API integrations.

---

## 1. Email Reports Automation 📧

### Option A: n8n Workflow (Recommended)

#### Setup

1. **Create n8n Workflow**
   - Sign up at https://n8n.io
   - Create new workflow
   - Name: "Daily Analytics Report"

2. **Cron Trigger**
   ```
   Node: Schedule Trigger
   Mode: Cron
   Expression: 0 8 * * *  (8 AM daily)
   ```

3. **Fetch Analytics Data**
   ```
   Node: HTTP Request
   Method: GET
   URL: https://your-domain.com/api/analytics/admin
   Headers:
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
   ```

4. **Generate Report**
   ```
   Node: Function
   Name: Format Report
   Code:
   const analytics = $input.item.json.data;
   return {
     json: {
       subject: `Daily Analytics - ${new Date().toLocaleDateString()}`,
       html: `
         <h2>Daily Analytics Report</h2>
         <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
         <h3>Key Metrics</h3>
         <ul>
           <li>Total Revenue: $${analytics.total_revenue}</li>
           <li>Active Subscriptions: ${analytics.active_subscriptions}</li>
           <li>New Users: ${analytics.new_users}</li>
           <li>Downloads: ${analytics.downloads}</li>
         </ul>
       `
     }
   };
   ```

5. **Send Email**
   ```
   Node: Email Send
   To: your-email@example.com
   Subject: {{ $json.subject }}
   HTML: {{ $json.html }}
   SMTP: Your Gmail/Outlook settings
   ```

6. **Save and Activate**
   - Click "Save"
   - Click "Active" toggle
   - Workflow will run daily at 8 AM

#### Weekly/Monthly Reports

Duplicate the workflow and change:
- Cron: `0 8 * * 1` (every Monday at 8 AM for weekly)
- Cron: `0 8 1 * *` (1st of each month at 8 AM for monthly)

---

### Option B: Serverless Function

#### 1. Create Vercel Function

File: `api/cron/daily-report.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch analytics
    const analyticsRes = await fetch(
      'https://your-domain.com/api/analytics/admin'
    );
    const analytics = await analyticsRes.json();

    // Send email
    await resend.emails.send({
      from: 'Marketplace <noreply@your-domain.com>',
      to: 'your-email@example.com',
      subject: `Daily Analytics - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>Daily Analytics Report</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <h3>Key Metrics</h3>
        <ul>
          <li>Total Revenue: $${analytics.total_revenue}</li>
          <li>Active Subscriptions: ${analytics.active_subscriptions}</li>
          <li>New Users: ${analytics.new_users}</li>
          <li>Downloads: ${analytics.downloads}</li>
        </ul>
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2. Configure Cron Job

In Vercel Dashboard:
1. Go to Settings > Cron Jobs
2. Add cron job:
   - Pattern: `0 8 * * *` (8 AM daily)
   - URL: `/api/cron/daily-report`
   - Headers:
     - Authorization: `Bearer YOUR_CRON_SECRET`

---

### Option C: Shell Script + Cron

#### 1. Create Script

File: `scripts/send-daily-report.sh`

```bash
#!/bin/bash

# Send daily analytics report via email

API_URL="https://your-domain.com/api/analytics/admin"
API_KEY="YOUR_SERVICE_ROLE_KEY"
EMAIL="your-email@example.com"

# Fetch analytics
ANALYTICS=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL")

# Generate report
REPORT=$(cat <<EOF
Subject: Daily Analytics - $(date +%Y-%m-%d)

Daily Analytics Report
Date: $(date +%Y-%m-%d)

Key Metrics:
$(echo "$ANALYTICS" | jq -r '.data | to_entries[] | "\(.key): \(.value)"')
EOF
)

# Send email
echo "$REPORT" | mail -s "Daily Analytics - $(date +%Y-%m-%d)" "$EMAIL"
```

#### 2. Add to Crontab

```bash
# Edit crontab
crontab -e

# Add line (runs at 8 AM daily)
0 8 * * * /path/to/scripts/send-daily-report.sh
```

---

## 2. Customer Onboarding Automation 👋

### n8n Workflow: Welcome Sequence

#### Trigger: New User Signup

```javascript
// Trigger: Webhook or Database Polling
// Event: User created in users table
```

#### Email 1: Welcome (Immediate)

```
Subject: Welcome to n8n Automation Marketplace!

Hi {{ $json.name }},

Welcome to n8n Automation Marketplace! 🎉

You now have access to 25,000+ ready-to-use automation workflows.
Your account is active and ready to go.

Get Started:
1. Browse workflows: https://your-domain.com/workflows
2. Search for automations you need
3. Download up to 3 workflows per day (free tier)

Upgrade to unlock unlimited downloads:
- Basic: $19/mo - Unlimited downloads
- Pro: $49/mo - Priority support + exclusive workflows
- Enterprise: $99/mo - Everything + admin dashboard

Questions? Just reply to this email!

Cheers,
The n8n Marketplace Team
```

#### Email 2: Recommendations (Day 3)

```
Subject: Recommended workflows for you

Hi {{ $json.name }},

Since you signed up, here are some popular workflows you might like:

1. Email Automation Bundle
   - Auto-responders
   - Newsletter sequences
   - Email cleaning

2. Social Media Scheduler
   - Post to all platforms
   - Schedule in advance
   - Analytics tracking

3. Data Processing Tools
   - CSV imports/exports
   - Data transformation
   - API integrations

Browse these workflows: https://your-domain.com/workflows?category=productivity

Cheers,
The n8n Marketplace Team
```

#### Email 3: Activation Reminder (Day 7)

```
Subject: Have you tried a workflow yet?

Hi {{ $json.name }},

We noticed you haven't downloaded any workflows yet.

Are you looking for something specific? Reply to this email
and I'll personally help you find the right automation.

Or explore our categories:
- Social Media
- Email Marketing
- E-commerce
- Data Processing
- AI & Automation
- Productivity
- API Integration

https://your-domain.com/categories

Cheers,
The n8n Marketplace Team
```

---

## 3. Payment Recovery Automation 💳

### n8n Workflow: Invoice Retry

#### Trigger: Invoice Payment Failed

```javascript
// Trigger: Webhook from Stripe
// Event: invoice.payment_failed
```

#### Step 1: Update Database

```javascript
// Log failed payment
await supabase
  .from('payment_failures')
  .insert({
    user_id: invoice.customer,
    amount: invoice.amount,
    failure_reason: invoice.last_payment_error.message,
    retry_count: 0
  });
```

#### Step 2: Send Email (Day 0)

```
Subject: Payment failed - Action required

Hi {{ $json.name }},

We couldn't process your payment for n8n Marketplace.

Details:
- Amount: ${{ $json.amount }}
- Reason: {{ $json.failure_reason }}
- Date: {{ $json.date }}

What happened:
Your payment method was declined. This could be due to:
- Insufficient funds
- Expired card
- Bank declined transaction

Action required:
Update your payment method here:
https://your-domain.com/subscription

We'll automatically retry in 3 days.

Cheers,
The n8n Marketplace Team
```

#### Step 3: Retry (Day 3)

```javascript
// Wait 3 days
// Attempt payment retry via Stripe API
stripe.invoices.pay(invoice.id, {
  expand: ['payment_intent']
});
```

#### Step 4: Send Reminder (Day 5)

```
Subject: Final reminder: Update payment method

Hi {{ $json.name }},

Your payment still hasn't gone through.

If we can't process payment in 2 more days, your subscription
will be cancelled.

Update your payment method now:
https://your-domain.com/subscription

Don't want to lose access? Let us know if you need help.

Cheers,
The n8n Marketplace Team
```

---

## 4. Review Collection Automation ⭐

### n8n Workflow: Request Review

#### Trigger: 7 Days After Download

```javascript
// Trigger: Database polling or webhook
// Event: 7 days since workflow download
```

#### Email Template

```
Subject: How's the workflow working for you?

Hi {{ $json.name }},

You downloaded "{{ $json.workflow_name }}" 7 days ago.

How's it working for you?

We'd love to hear your feedback!
⭐⭐⭐⭐⭐

Rate this workflow:
https://your-domain.com/workflows/{{ $json.workflow_id }}#reviews

Your review helps others discover great automations.

As a thank you:
- Leave a review and get $2 off your next month!
- Leave 5 reviews and get 10% off for life!

Cheers,
The n8n Marketplace Team
```

---

## 5. Content Marketing Automation 📝

### n8n Workflow: Social Media Posting

#### Trigger: Daily Schedule

```
Node: Schedule Trigger
Expression: 0 9,12,15 * * *  (9 AM, 12 PM, 3 PM daily)
```

#### Twitter/X Post Template

```
Node: Function
Code:
const workflows = [
  {
    name: "Email Automation Bundle",
    category: "email-marketing",
    benefit: "Save 10+ hours/week on email"
  },
  {
    name: "Social Media Scheduler",
    category: "social-media",
    benefit: "Post to all platforms in one click"
  },
  {
    name: "Data Import Wizard",
    category: "data-processing",
    benefit: "Import data from any source"
  }
];

const workflow = workflows[Math.floor(Math.random() * workflows.length)];

return {
  json: {
    text: `🚀 New workflow: ${workflow.name}\n\n${workflow.benefit}\n\nAutomation made easy! 💪\n\n#n8n #automation #noCode`,
    url: `https://your-domain.com/workflows?category=${workflow.category}`
  }
};
```

#### Post to Twitter/X

```
Node: Twitter
Action: Post Tweet
Text: {{ $json.text }}
```

#### Post to LinkedIn

```
Node: LinkedIn
Action: Create Post
Text: |
  {{ $json.text }}

  {{ $json.url }}

  #Automation #Productivity #NoCode
```

---

## 6. Analytics Alerts Automation 📊

### n8n Workflow: Revenue Alert

#### Trigger: Daily

```
Node: Schedule Trigger
Expression: 0 18 * * *  (6 PM daily)
```

#### Compare Yesterday vs Previous Day

```javascript
const analytics = await fetchAnalytics();

const yesterdayRevenue = analytics.revenue['2026-02-19'] || 0;
const previousDayRevenue = analytics.revenue['2026-02-18'] || 0;
const percentChange = ((yesterdayRevenue - previousDayRevenue) / previousDayRevenue) * 100;

if (percentChange < -20) {
  // Revenue dropped more than 20%
  await sendAlert({
    subject: `⚠️ Revenue Alert: ${percentChange.toFixed(1)}% drop`,
    message: `
      Revenue dropped ${percentChange.toFixed(1)}% today.

      Yesterday: $${yesterdayRevenue}
      Previous: $${previousDayRevenue}
    `
  });
} else if (percentChange > 20) {
  // Revenue increased more than 20%
  await sendAlert({
    subject: `📈 Revenue Up: +${percentChange.toFixed(1)}%`,
    message: `
      Revenue is up ${percentChange.toFixed(1)}% today!

      Yesterday: $${yesterdayRevenue}
      Previous: $${previousDayRevenue}
    `
  });
}
```

---

## 7. Tax & Accounting Automation 💰

### n8n Workflow: Monthly Financial Report

#### Trigger: 1st of Each Month

```
Node: Schedule Trigger
Expression: 0 9 1 * *  (9 AM on 1st of month)
```

#### Generate Report

```javascript
const month = new Date().getMonth();
const year = new Date().getFullYear();

// Fetch all transactions from Stripe
const transactions = await stripe.transactions.list({
  created: {
    gte: Math.floor(new Date(year, month, 1).getTime() / 1000),
    lt: Math.floor(new Date(year, month + 1, 1).getTime() / 1000)
  }
});

// Calculate totals
const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
const netRevenue = totalRevenue - totalFees;

// Generate CSV
const csv = `
Date,Description,Amount,Fee,Net
${transactions.map(t =>
  `${new Date(t.created * 1000).toISOString()},${t.description},${t.amount/100},${t.fee/100},${(t.amount - t.fee)/100}`
).join('\n')}
`;

// Send email
await sendEmail({
  to: 'accounting@example.com',
  subject: `Financial Report - ${month}/${year}`,
  attachments: [
    {
      filename: `financials_${year}_${month}.csv`,
      content: csv
    }
  ]
});
```

---

## 8. Customer Churn Prevention 🔄

### n8n Workflow: At-Risk Customer Detection

#### Trigger: Weekly

```
Node: Schedule Trigger
Expression: 0 9 * * 1  (9 AM every Monday)
```

#### Identify At-Risk Customers

```javascript
// Find users who haven't downloaded in 30 days
const { data: inactiveUsers } = await supabase
  .from('users')
  .select(`
    id,
    name,
    email,
    downloads(last_downloaded_at)
  `)
  .eq('subscription_tier', 'paid')
  .lt('downloads.last_downloaded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

// Send win-back email
for (const user of inactiveUsers) {
  await sendEmail({
    to: user.email,
    subject: "We miss you! 🥺",
    body: `
      Hi ${user.name},

      It's been a while since you downloaded a workflow.

      Is there something we can help you with?

      Here's a special offer just for you:
      Get 50% off your next month when you download a workflow today!

      Use code: WELCOME_BACK50

      https://your-domain.com/workflows

      We'd love to see you back!

      Cheers,
      The n8n Marketplace Team
    `
  });
}
```

---

## 9. System Health Monitoring 🖥️

### n8n Workflow: Uptime Check

#### Trigger: Every 5 Minutes

```
Node: Schedule Trigger
Expression: */5 * * * *
```

#### Check API Health

```javascript
try {
  const response = await fetch('https://your-domain.com/api/health');

  if (response.status !== 200) {
    await sendAlert({
      subject: '⚠️ API Down!',
      message: `API returned status ${response.status}`
    });
  }
} catch (error) {
  await sendAlert({
    subject: '🚨 API Unreachable!',
    message: `Error: ${error.message}`
  });
}
```

---

## 10. Automated Testing 🧪

### n8n Workflow: Daily Smoke Tests

#### Trigger: Daily

```
Node: Schedule Trigger
Expression: 0 6 * * *  (6 AM daily)
```

#### Test Critical Endpoints

```javascript
const tests = [
  { name: 'Homepage', url: 'https://your-domain.com' },
  { name: 'Workflows API', url: 'https://your-domain.com/api/workflows' },
  { name: 'Search API', url: 'https://your-domain.com/api/workflows/search?q=test' },
  { name: 'Pricing Page', url: 'https://your-domain.com/pricing' }
];

const results = [];

for (const test of tests) {
  const start = Date.now();
  try {
    const response = await fetch(test.url);
    const duration = Date.now() - start;
    results.push({
      name: test.name,
      status: response.status === 200 ? 'PASS' : 'FAIL',
      duration: `${duration}ms`
    });
  } catch (error) {
    results.push({
      name: test.name,
      status: 'FAIL',
      error: error.message
    });
  }
}

const failedTests = results.filter(r => r.status === 'FAIL');

if (failedTests.length > 0) {
  await sendAlert({
    subject: '❌ Smoke Test Failed',
    message: `
      Failed tests:
      ${failedTests.map(t => `- ${t.name}: ${t.error || t.duration}`).join('\n')}
    `
  });
}
```

---

## Quick Start Checklist

### Week 1: Essential Automations
- [ ] Daily analytics report email
- [ ] Welcome email sequence (3 emails)
- [ ] Review collection automation
- [ ] System health monitoring

### Week 2: Growth Automations
- [ ] Payment recovery automation
- [ ] Social media posting
- [ ] Customer churn prevention
- [ ] Revenue alerts

### Week 3: Operational Automations
- [ ] Monthly financial report
- [ ] Daily smoke tests
- [ ] Customer support routing
- [ ] NPS survey automation

### Week 4: Optimization
- [ ] Review all automation performance
- [ ] Optimize slow workflows
- [ ] Add error handling
- [ ] Document all workflows

---

## Best Practices

1. **Error Handling**: Always add error handling nodes
2. **Logging**: Log all actions for debugging
3. **Testing**: Test workflows in development first
4. **Backups**: Keep backups of important workflows
5. **Documentation**: Document workflow logic
6. **Monitoring**: Monitor automation health
7. **Security**: Use environment variables for secrets
8. **Version Control**: Keep workflows in Git

---

## Next Steps

1. Set up n8n instance (or use n8n.cloud)
2. Create first automation (daily report)
3. Test thoroughly
4. Deploy to production
5. Monitor and iterate

---

*Automate everything you can. Your time is worth $500+/hour. Don't waste it on repetitive tasks.*
