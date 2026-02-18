# Email Reports - Setup Guide

This guide explains how to set up automated email reports for the n8n marketplace.

## Overview

Email reports can be sent to administrators on a daily, weekly, or monthly basis containing:
- Daily revenue and user metrics
- Workflow performance data
- User activity summaries
- Search analytics insights

## Implementation Options

### Option 1: Using n8n (Recommended)

Since this is an n8n automation marketplace, use n8n itself to send reports!

#### Setup Steps:

1. **Create Email Report Workflow in n8n:**

   Create an n8n workflow that:
   - Runs on a schedule (cron)
   - Calls the `/api/export` endpoint
   - Generates email with CSV attachment
   - Sends to admin email address

2. **Workflow Nodes:**

   ```
   Schedule Trigger
   ↓
   HTTP Request (GET /api/export?type=daily&format=csv)
   ↓
   Code (Format email body)
   ↓
   Send Email (with CSV attachment)
   ```

3. **Sample n8n JSON Workflow:**

   ```json
   {
     "nodes": [
       {
         "type": "n8n-nodes-base.scheduleTrigger",
         "parameters": {
           "rule": { "interval": [{ "field": "cronExpression", "expression": "0 9 * * *" }] }
         }
       },
       {
         "type": "n8n-nodes-base.httpRequest",
         "parameters": {
           "url": "https://yourdomain.com/api/export?type=daily&format=csv",
           "method": "GET",
           "headerParameters": {
             "parameters": [
               {
                 "name": "Authorization",
                 "value": "Bearer {{ $env.ADMIN_API_TOKEN }}"
               }
             ]
           }
         }
       },
       {
         "type": "n8n-nodes-base.code",
         "parameters": {
           "jsCode": "// Format email body with key metrics\nconst data = $input.all()[0].binary.data;\nconst rows = data.toString().split('\\n');\nconst metrics = rows[1].split(',');\n\nreturn {\n  json: {\n    subject: `Daily Report - ${new Date().toLocaleDateString()}`,\n    body: `Daily Analytics Report\\n\\n${metrics[2]} unique users\\n${metrics[4]} downloads\\n$${metrics[7]} revenue`\n  }\n};"
         }
       },
       {
         "type": "n8n-nodes-base.sendEmail",
         "parameters": {
           "fromEmail": "reports@yourdomain.com",
           "toEmail": "admin@yourdomain.com",
           "subject": "={{ $json.subject }}",
           "message": "={{ $json.body }}",
           "attachments": "={{ $binary.data }}"
         }
       }
     ]
   }
   ```

### Option 2: Using Node.js Script

Create a standalone script that runs via cron:

```javascript
// scripts/send-report.js
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReport() {
  // Fetch analytics data
  const { data: analytics } = await supabase
    .rpc('get_admin_analytics', { p_days: 1 });

  // Generate CSV
  const csv = generateCSV(analytics);

  // Send email
  await transporter.sendMail({
    from: 'reports@n8nuniverse.com',
    to: 'admin@n8nuniverse.com',
    subject: `Daily Report - ${new Date().toLocaleDateString()}`,
    html: `
      <h2>Daily Analytics Report</h2>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <ul>
        <li>Unique Users: ${analytics[0]?.unique_users || 0}</li>
        <li>Downloads: ${analytics[0]?.downloads || 0}</li>
        <li>Revenue: $${analytics[0]?.revenue || 0}</li>
      </ul>
    `,
    attachments: [
      {
        filename: `report-${new Date().toISOString().split('T')[0]}.csv`,
        content: csv,
      },
    ],
  });

  console.log('Report sent successfully!');
}

sendReport().catch(console.error);
```

**Cron setup:**
```bash
# Run daily at 9 AM
0 9 * * * /usr/bin/node /path/to/scripts/send-report.js
```

### Option 3: Using Serverless Function

Create a scheduled serverless function:

```typescript
// app/api/reports/daily/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch analytics
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: analytics } = await supabase
    .rpc('get_admin_analytics', { p_days: 1 });

  // Send email
  await resend.emails.send({
    from: 'reports@n8nuniverse.com',
    to: 'admin@n8nuniverse.com',
    subject: `Daily Report - ${new Date().toLocaleDateString()}`,
    html: `
      <h2>Daily Analytics Report</h2>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <ul>
        <li>Unique Users: ${analytics[0]?.unique_users || 0}</li>
        <li>Downloads: ${analytics[0]?.downloads || 0}</li>
        <li>Revenue: $${analytics[0]?.revenue || 0}</li>
      </ul>
    `,
  });

  return NextResponse.json({ success: true });
}
```

**Setup cron job:**
```bash
# Use curl to trigger the function
0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/reports/daily
```

## Report Types Available

### 1. Daily Analytics Report
- Unique users
- Page views
- Downloads
- Searches
- Signups
- Subscriptions
- Revenue

**Endpoint:** `/api/export?type=daily&format=csv`

### 2. Revenue Report
- Daily revenue breakdown
- Revenue by subscription tier
- Total revenue

**Endpoint:** `/api/export?type=revenue&format=csv`

### 3. Workflow Performance Report
- Download counts per workflow
- View counts per workflow
- Conversion rates
- Revenue per workflow

**Endpoint:** `/api/export?type=workflows&format=csv`

### 4. User Activity Report
- User signup dates
- Subscription tiers
- Download counts
- Last activity

**Endpoint:** `/api/export?type=users&format=csv`

### 5. Search Analytics Report
- Popular search queries
- Search counts
- Click-through rates

**Endpoint:** `/api/export?type=search&format=csv`

## Recommended Schedules

| Report Type | Frequency | Best Time |
|------------|-----------|-----------|
| Daily Analytics | Daily | 9 AM local time |
| Revenue | Weekly (Monday) | 9 AM local time |
| Workflow Performance | Weekly (Friday) | 9 AM local time |
| User Activity | Monthly (1st) | 9 AM local time |
| Search Analytics | Weekly (Wednesday) | 9 AM local time |

## Environment Variables Needed

```bash
# Email configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Or Resend (recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Cron secret for scheduled tasks
CRON_SECRET=your-random-secret-string

# Admin API token for exports
ADMIN_API_TOKEN=your-admin-token
```

## Security Notes

1. **Always use API tokens/keys** for authentication
2. **Never commit secrets to git**
3. **Use environment variables** for all sensitive data
4. **Set up rate limiting** on the export endpoints
5. **Verify cron secret** before processing scheduled tasks

## Testing

### Test email report locally:
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/export?type=daily&format=csv > report.csv
```

### Test scheduled function:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/reports/daily
```

## Next Steps

1. Choose implementation option (n8n recommended!)
2. Set up email service (Gmail, Resend, SendGrid, etc.)
3. Configure environment variables
4. Create n8n workflow or set up cron job
5. Test with small data set
6. Deploy to production
7. Monitor first few reports for accuracy

---

*For questions or issues, refer to the n8n documentation or contact the development team.*
