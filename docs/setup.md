# Setup Guide for n8n-universe

## Step 1: Create GitHub Repository

**YOU MUST DO THIS FIRST!**

1. Go to https://github.com/new
2. Repository name: `n8n-universe`
3. Set to **Private** (recommended - security)
4. ✅ DO NOT initialize with README, .gitignore, or license
5. Click "Create repository"

**Why private?** Protects your 25,000 workflows and business logic.

## Step 2: Connect Local to GitHub

(OpenClaw AI will do this automatically once repo exists)

```bash
cd /root/.openclaw/workspace/n8n-universe
git push -u origin main
git checkout -b develop
git push -u origin develop
```

## Step 3: Set Up Branch Protection (You do this)

After first push, go to GitHub repo → Settings → Branches:

**Add rule for `main` branch:**
- Branch name pattern: `main`
- ✅ Require pull request before merging
- ✅ Require approvals: 1 (you must review)
- ✅ Require status checks: None (for now)
- ✅ Do not allow bypass
- ✅ Include administrators

**This prevents accidental pushes to production!**

## Step 4: Prepare Workflows

When you have 25,000 n8n JSON files:
1. Upload to `/workflows/` directory
2. Run indexer: `python3 scripts/indexer.py`
3. Index will be saved to `/src/workflow_index.json`

## Step 5: Test Indexer

```bash
# Place a sample workflow in workflows/
mkdir -p workflows
cp /path/to/sample.json workflows/sample.json

# Run indexer
python3 scripts/indexer.py
```

## 📋 GitHub Token Info

**Your token is stored securely:**
- Location: `/root/.openclaw/agents/main/agent/auth-profiles.json`
- Scope: `repo` (full control)
- Purpose: Push commits, create PRs

**Never share this token publicly!**

## Next Steps

After setup, OpenClaw AI will:
1. Work on feature branches (feature/*)
2. Create PRs for review
3. Never push to main directly
4. Send nightly reports of work done

## Required Files to Add

Before first indexer run, create:
- `workflows/` - Directory with all 25k JSON files
- `.env` - Configuration (if needed)

---

*Status: Waiting for repo creation at GitHub*
*Current: Local project ready, push blocked until repo exists*
