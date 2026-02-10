-- =========================================================
-- n8n Universe Database Schema (SUPABASE SAFE)
-- PostgreSQL 14+ | Supabase compatible
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- TABLES
-- =========================================================

-- -------------------------
-- Workflows
-- -------------------------
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  integrations TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  complexity TEXT NOT NULL DEFAULT 'simple',
  price NUMERIC DEFAULT 1 CHECK (price >= 0),
  popularity INTEGER DEFAULT 0 CHECK (popularity >= 0),
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0),
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  node_count INTEGER DEFAULT 0,
  connection_count INTEGER DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workflows_name_unique'
  ) THEN
    ALTER TABLE workflows
    ADD CONSTRAINT workflows_name_unique UNIQUE (name);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS workflows_category_idx ON workflows (category);
CREATE INDEX IF NOT EXISTS workflows_difficulty_idx ON workflows (difficulty);
CREATE INDEX IF NOT EXISTS workflows_tags_idx ON workflows USING gin (tags);
CREATE INDEX IF NOT EXISTS workflows_integrations_idx ON workflows USING gin (integrations);
CREATE INDEX IF NOT EXISTS workflows_triggers_idx ON workflows USING gin (triggers);
CREATE INDEX IF NOT EXISTS workflows_actions_idx ON workflows USING gin (actions);
CREATE INDEX IF NOT EXISTS workflows_popularity_idx ON workflows (popularity);
CREATE INDEX IF NOT EXISTS workflows_price_idx ON workflows (price);

-- -------------------------
-- Users
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  github_id TEXT,
  github_username TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_github_id_idx ON users (github_id);
CREATE INDEX IF NOT EXISTS users_subscription_tier_idx ON users (subscription_tier);

-- -------------------------
-- Downloads
-- -------------------------
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  price_paid NUMERIC NOT NULL CHECK (price_paid >= 0),
  download_count INTEGER DEFAULT 1 CHECK (download_count >= 1),
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'downloads_user_workflow_unique'
  ) THEN
    ALTER TABLE downloads
    ADD CONSTRAINT downloads_user_workflow_unique UNIQUE (user_id, workflow_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS downloads_user_id_idx ON downloads (user_id);
CREATE INDEX IF NOT EXISTS downloads_workflow_id_idx ON downloads (workflow_id);

-- -------------------------
-- Categories
-- -------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);

-- -------------------------
-- Stripe Subscriptions
-- -------------------------
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  tier TEXT NOT NULL,
  plan TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'usd',
  interval TEXT,
  interval_count INTEGER DEFAULT 0,
  trial_period_days INTEGER DEFAULT 0,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancel_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_subscriptions_user_id_idx ON stripe_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_status_idx ON stripe_subscriptions (status);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_tier_idx ON stripe_subscriptions (tier);

-- -------------------------
-- Pricing Tiers
-- -------------------------
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  price_id TEXT UNIQUE NOT NULL,
  monthly_price NUMERIC NOT NULL CHECK (monthly_price >= 0),
  yearly_price NUMERIC NOT NULL CHECK (yearly_price >= 0),
  currency TEXT DEFAULT 'usd',
  features JSONB DEFAULT '{}'::jsonb,
  download_limit INTEGER DEFAULT 0,
  api_access BOOLEAN DEFAULT FALSE,
  max_api_requests_per_month INTEGER DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  stripe_dashboard BOOLEAN DEFAULT FALSE,
  discount_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- FUNCTIONS
-- =========================================================

-- Cosine similarity (higher = better)
CREATE OR REPLACE FUNCTION cosine_similarity(v1 vector, v2 vector)
RETURNS double precision
LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN v1 IS NULL OR v2 IS NULL THEN NULL
    ELSE (1 - (v1 <=> v2))
  END;
$$;

-- Vector search
CREATE OR REPLACE FUNCTION search_similar_workflows(
  search_embedding vector(1536),
  category_filter TEXT DEFAULT NULL,
  complexity_filter TEXT DEFAULT NULL,
  difficulty_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  complexity TEXT,
  difficulty TEXT,
  price NUMERIC,
  popularity INTEGER,
  rating NUMERIC,
  similarity_score double precision
)
LANGUAGE SQL STABLE AS $$
  SELECT
    w.id,
    w.name,
    w.description,
    w.category,
    w.complexity,
    w.difficulty,
    w.price,
    w.popularity,
    w.rating,
    CASE
      WHEN search_embedding IS NOT NULL AND w.embedding IS NOT NULL
      THEN (1 - (w.embedding <=> search_embedding))
      ELSE NULL
    END AS similarity_score
  FROM workflows w
  WHERE
    (category_filter IS NULL OR w.category = category_filter)
    AND (complexity_filter IS NULL OR w.complexity = complexity_filter)
    AND (difficulty_filter IS NULL OR w.difficulty = difficulty_filter)
    AND (min_price IS NULL OR w.price >= min_price)
    AND (max_price IS NULL OR w.price <= max_price)
  ORDER BY
    (search_embedding IS NOT NULL) DESC,
    similarity_score DESC NULLS LAST,
    w.popularity DESC
  LIMIT limit_count;
$$;

-- Increment popularity
CREATE OR REPLACE FUNCTION track_workflow_view(workflow_id UUID)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE workflows
  SET popularity = popularity + 1,
      updated_at = NOW()
  WHERE id = workflow_id;
END;
$$;

-- Validation triggers
CREATE OR REPLACE FUNCTION validate_workflow()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'workflow name is required';
  END IF;
  IF NEW.file_path IS NULL OR TRIM(NEW.file_path) = '' THEN
    RAISE EXCEPTION 'workflow file_path is required';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflows_validate_insert ON workflows;
CREATE TRIGGER workflows_validate_insert
BEFORE INSERT OR UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION validate_workflow();

-- =========================================================
-- SAMPLE DATA
-- =========================================================

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Marketing', 'marketing', '??', 'Marketing automations', 1)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_tiers
(name, price_id, monthly_price, yearly_price, features, download_limit)
VALUES
('Free', 'price_free', 0, 0, '{"search":"basic"}', 10)
ON CONFLICT DO NOTHING;

INSERT INTO users (email)
VALUES ('test@example.com')
ON CONFLICT DO NOTHING;
