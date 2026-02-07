# n8n Automation Marketplace

A marketplace for selling n8n automation workflows.

## Project Overview

**Assets:** 25,000 n8n workflows
**Revenue Model:**
- Subscription: $19/mo unlimited access
- Pay-per-download: $1-5 per workflow
- Bundles: $29-49 for themed collections

**Tech Stack (Phase 1 - Quick Launch):**
- WordPress + WooCommerce
- Stripe for payments
- Algolia for search
- Custom indexer in Python

**Tech Stack (Phase 2 - Custom Build):**
- Next.js
- Stripe
- Supabase
- OpenAI embeddings for semantic search

## Project Structure

```
n8n-marketplace/
├── src/              # Source code
├── scripts/           # Automation scripts
├── pr-templates/      # PR templates
└── docs/             # Documentation
```

## Current Status

- [x] Project initialized
- [ ] JSON indexer
- [ ] Search functionality
- [ ] Marketplace platform
- [ ] Payment integration
- [ ] Preview system

## Git Workflow

**Branch Strategy:**
- `main` - Production (protected)
- `develop` - Development
- `feature/*` - Feature branches
- `bugfix/*` - Bug fixes

**PR Process:**
1. Create feature branch from develop
2. Build and test locally
3. Create PR with:
   - Description of changes
   - Testing instructions
   - Screenshots (if applicable)
4. Wait for review
5. User tests and commits to develop
6. User merges to main when ready

## Getting Started

See `docs/setup.md` for setup instructions.

---

*Status: ACTIVE - Building Phase 1*
