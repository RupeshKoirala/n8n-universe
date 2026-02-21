# n8n Automation Workflows

This directory contains ready-to-use n8n workflows for automating your business operations.

---

## 📧 Daily Analytics Report

**File:** `daily-analytics-report.n8n.json`
**Purpose:** Send daily analytics report via email at 8 AM
**Setup Time:** 10 minutes

### Setup Instructions

1. **Import the Workflow**
   - Open your n8n instance (https://your-n8n-instance.com)
   - Click "Import from File"
   - Select `daily-analytics-report.n8n.json`
   - Click "Import"

2. **Configure Credentials**

   **Service Role Key (for API access):**
   - Click on "Fetch Analytics Data" node
   - Go to "Credentials" section
   - Create or select "HTTP Header Auth" credential
   - Set "Name" to "Authorization"
   - Set "Value" to your Supabase Service Role Key
   - Save

   **SMTP Email (for sending emails):**
   - Click on "Send Email" node
   - Go to "Credentials" section
   - Create or select "SMTP" credential
   - Configure your SMTP settings (Gmail, Outlook, or custom)
   - Save

3. **Update URLs and Emails**

   In the "Fetch Analytics Data" node:
   - Replace `https://your-domain.com/api/analytics/admin` with your actual domain

   In the "Send Email" node:
   - Replace `your-email@example.com` with your actual email address
   - Replace `noreply@your-domain.com` with your sender email

4. **Activate the Workflow**
   - Click "Save"
   - Toggle "Active" to ON
   - The workflow will now run daily at 8 AM

### Customization

**Change the time:**
- Click on "Schedule Trigger - Daily 8 AM" node
- Change the cron expression (e.g., `0 9 * * *` for 9 AM, `0 20 * * *` for 8 PM)
- Save

**Change to weekly:**
- Change cron expression to `0 8 * * 1` (every Monday at 8 AM)

**Change to monthly:**
- Change cron expression to `0 8 1 * *` (1st of each month at 8 AM)

### What You'll Receive

The email includes:
- 📊 Total Revenue and MRR
- 👥 Active Subscriptions and New Users
- 📦 Workflow Downloads
- 🎯 Conversion Rate and Churn Rate
- 📈 Growth trends (vs last period)
- Direct link to admin dashboard

### Troubleshooting

**Workflow not running:**
- Check if "Active" toggle is ON
- Verify the schedule expression is correct
- Check n8n server logs for errors

**Not receiving emails:**
- Verify SMTP credentials are correct
- Check email spam folder
- Verify "toEmail" is correct
- Test SMTP connection manually

**API errors:**
- Verify Service Role Key is correct
- Check if admin API route is deployed
- Verify the domain URL is correct
- Check Supabase logs

---

## 🔔 Payment Recovery Automation

**File:** `payment-recovery.n8n.json` (Coming Soon)
**Purpose:** Automatically recover failed payments
**Revenue Impact:** 10-15% revenue recovery (~$400-$1,500/mo)

---

## 📧 Welcome Email Sequence

**File:** `welcome-sequence.n8n.json` (Coming Soon)
**Purpose:** Onboard new customers with automated email sequence
**Setup Time:** 2 hours
**Impact:** 15-25% conversion increase

---

## ⭐ Review Collection Automation

**File:** `review-collection.n8n.json` (Coming Soon)
**Purpose:** Automatically request reviews from customers
**Setup Time:** 2 hours
**Impact:** More reviews, social proof, higher conversions

---

## 🏥 System Health Monitoring

**File:** `health-monitor.n8n.json` (Coming Soon)
**Purpose:** Monitor system health and alert on issues
**Setup Time:** 1 hour
**Impact:** Early detection of problems, reduced downtime

---

## 📊 Weekly/Monthly Reports

Variations of the daily report can be created by changing the cron expression:

- **Weekly:** `0 8 * * 1` (every Monday at 8 AM)
- **Monthly:** `0 8 1 * *` (1st of each month at 8 AM)
- **Bi-weekly:** `0 8 * * 1,15` (1st and 15th of each month)

---

## 💡 Tips

1. **Test before activating:** Click "Test Workflow" to verify it works
2. **Monitor logs:** Check n8n execution logs for any errors
3. **Schedule wisely:** Avoid sending emails during off-hours for your timezone
4. **Keep credentials secure:** Use environment variables for sensitive data in production
5. **Version control:** Keep workflow JSON files in git for backup

---

## 📚 Resources

- n8n Documentation: https://docs.n8n.io
- Cron Expressions: https://crontab.guru
- SMTP Setup: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/

---

**Need Help?**
Check the main AUTOMATION_SETUP.md file for detailed implementation guides and alternative approaches (cron jobs, serverless functions).
