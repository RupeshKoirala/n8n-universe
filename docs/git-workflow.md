# Git Workflow for n8n Marketplace

## Branch Strategy

```
main (protected)
  ↑
develop
  ↑
feature/*
  ↑
bugfix/*
```

## Workflow Rules

**FOR DEVELOPER (OpenClaw AI):**
1. Create feature branch from `develop`
2. Make changes and test locally
3. Create PR using `pr-templates/feature.md`
4. NEVER push to `main`
5. NEVER merge own PRs

**FOR HUMAN (Unbroken Artist):**
1. Review PR changes
2. Test locally
3. Approve and merge to `develop`
4. Test `develop` branch
5. When stable, merge `develop` → `main`

## Branch Naming

- `feature/feature-name`
- `feature/search-implementation`
- `feature/indexer-v2`
- `bugfix/email-bug`

## Commit Messages

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactor
- `test`: Add tests
- `chore`: Maintenance

Examples:
```
feat: add workflow JSON indexer

Parses n8n workflow files and extracts metadata including
triggers, actions, complexity, and tags.

Closes #1
```

## Creating a PR

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add my feature"

# 3. Push to remote
git push -u origin feature/my-feature

# 4. Create PR (will be automated by OpenClaw)
```

## Safety Rules

**NEVER:**
- ❌ Push directly to `main`
- ❌ Merge own PRs
- ❌ Commit without testing
- ❌ Delete branches without asking

**ALWAYS:**
- ✅ Create PRs for all changes
- ✅ Use feature branches
- ✅ Test before committing
- ✅ Document changes

---

*Remember: Human reviews all PRs before merging to production!*
