-- n8n Universe Database Schema
-- PostgreSQL 14+ with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- TABLES
-- ========================================

-- Workflows Table
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

-- Add constraints after table creation
ALTER TABLE workflows ADD CONSTRAINT IF NOT EXISTS workflows_name_unique UNIQUE (name);

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS workflows_name_idx ON workflows (name);
CREATE INDEX IF NOT EXISTS workflows_category_idx ON workflows (category);
CREATE INDEX IF NOT EXISTS workflows_difficulty_idx ON workflows (difficulty);
CREATE INDEX IF NOT EXISTS workflows_tags_idx ON workflows USING gin (tags);
CREATE INDEX IF NOT EXISTS workflows_integrations_idx ON workflows USING gin (integrations);
CREATE INDEX IF NOT EXISTS workflows_triggers_idx ON workflows USING gin (triggers);
CREATE INDEX IF NOT EXISTS workflows_actions_idx ON workflows USING gin (actions);
CREATE INDEX IF NOT EXISTS workflows_popularity_idx ON workflows (popularity);
CREATE INDEX IF NOT EXISTS workflows_price_idx ON workflows (price);

-- Users Table
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

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS users_github_id_idx ON users (github_id);
CREATE INDEX IF NOT EXISTS users_subscription_tier_idx ON users (subscription_tier);

-- Downloads Table (purchase history)
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  price_paid NUMERIC NOT NULL,
  download_count INTEGER DEFAULT 1,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS downloads_user_id_idx ON downloads (user_id);
CREATE INDEX IF NOT EXISTS downloads_workflow_id_idx ON downloads (workflow_id);
CREATE INDEX IF NOT EXISTS downloads_downloaded_at_idx ON downloads (downloaded_at);
CREATE INDEX IF NOT EXISTS downloads_created_at_idx ON downloads (created_at);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_display_order_idx ON categories (display_order);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);

-- Stripe Subscriptions Table (webhook data)
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  tier TEXT NOT NULL,
  plan TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  interval TEXT,
  interval_count INTEGER DEFAULT 0,
  trial_period_days INTEGER DEFAULT 0,
  cancel_at_period_end INTEGER DEFAULT 0,
  cancel_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS stripe_subscriptions_user_id_idx ON stripe_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_customer_id_idx ON stripe_subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_subscription_id_idx ON stripe_subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_status_idx ON stripe_subscriptions (status);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_tier_idx ON stripe_subscriptions (tier);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_created_at_idx ON stripe_subscriptions (created_at);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_updated_at_idx ON stripe_subscriptions (updated_at);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_current_period_end_idx ON stripe_subscriptions (current_period_end);

-- Pricing Tiers Table
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  price_id TEXT UNIQUE NOT NULL,
  monthly_price NUMERIC NOT NULL CHECK (monthly_price >= 0),
  yearly_price NUMERIC NOT NULL CHECK (yearly_price >= 0),
  currency TEXT DEFAULT 'usd',
  features JSONB DEFAULT '{}',
  download_limit INTEGER DEFAULT 0,
  api_access BOOLEAN DEFAULT FALSE,
  max_api_requests_per_month INTEGER DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  stripe_dashboard BOOLEAN DEFAULT FALSE,
  discount_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes after table creation
CREATE INDEX IF NOT EXISTS pricing_tiers_name_idx ON pricing_tiers (name);
CREATE INDEX IF NOT EXISTS pricing_tiers_price_id_idx ON pricing_tiers (price_id);
CREATE INDEX IF NOT EXISTS pricing_tiers_monthly_price_idx ON pricing_tiers (monthly_price);
CREATE INDEX IF NOT EXISTS pricing_tiers_yearly_price_idx ON pricing_tiers (yearly_price);
CREATE INDEX IF NOT EXISTS pricing_tiers_created_at_idx ON pricing_tiers (created_at);
CREATE INDEX IF NOT EXISTS pricing_tiers_updated_at_idx ON pricing_tiers (updated_at);
CREATE INDEX IF NOT EXISTS pricing_tiers_priority_support_idx ON pricing_tiers (priority_support);
CREATE INDEX IF NOT EXISTS pricing_tiers_stripe_dashboard_idx ON pricing_tiers (stripe_dashboard);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Cosine similarity function (returns float, lower is better)
CREATE OR REPLACE FUNCTION cosine_similarity(v1 vector, v2 vector)
RETURNS double precision AS $$
  SELECT CASE 
    WHEN v1 IS NULL OR v2 IS NULL THEN NULL
    ELSE (1 - (v1 <=> v2))  -- pgvector's cosine distance (lower = more similar)
  $$
  LANGUAGE SQL IMMUTABLE;

-- Search similar workflows function
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
) AS $$
  RETURN QUERY
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
      THEN (1 - (w.embedding <=> search_embedding))  -- Convert distance to similarity score (1-0)
      ELSE NULL 
    END as similarity_score
  FROM workflows w
  WHERE 
    (category_filter IS NULL OR w.category = category_filter)
    AND (complexity_filter IS NULL OR w.complexity = complexity_filter)
    AND (difficulty_filter IS NULL OR w.difficulty = difficulty_filter)
    AND (min_price IS NULL OR w.price >= min_price)
    AND (max_price IS NULL OR w.price <= max_price)
  ORDER BY 
    CASE WHEN search_embedding IS NOT NULL THEN similarity_score ELSE NULL END DESC,
    w.popularity DESC
  LIMIT limit_count;
  $$
  LANGUAGE SQL STABLE;

-- Generate embedding function (placeholder - returns NULL vector)
CREATE OR REPLACE FUNCTION generate_embedding(text TEXT)
RETURNS vector(1536) AS $$
  BEGIN
    RETURN NULL; -- Placeholder until OpenAI integration
  END;
  $$ LANGUAGE SQL IMMUTABLE;

-- Function to increment popularity (callable by app)
CREATE OR REPLACE FUNCTION track_workflow_view(workflow_id UUID)
RETURNS void AS $$
  UPDATE workflows 
  SET popularity = COALESCE(popularity, 0) + 1,
      updated_at = NOW()
  WHERE id = workflow_id;
  $$
  LANGUAGE plpgsql;

-- Function to validate workflow schema
CREATE OR REPLACE FUNCTION validate_workflow_schema(workflow_jsonb JSONB)
RETURNS boolean AS $$
  BEGIN
    RETURN (workflow_jsonb ? 'id' OR workflow_jsonb ? 'name') AND (workflow_jsonb ? 'description' OR workflow_jsonb ? 'description' = '');
  END;
  $$ LANGUAGE SQL IMMUTABLE;

-- Trigger functions (properly typed)
CREATE OR REPLACE FUNCTION increment_popularity()
RETURNS trigger AS $$
  BEGIN
    NEW.popularity := COALESCE(OLD.popularity, 0) + 1;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_workflow_insert()
RETURNS trigger AS $$
  BEGIN
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
      RAISE EXCEPTION 'workflow name is required';
    END IF;
    IF NEW.file_path IS NULL OR TRIM(NEW.file_path) = '' THEN
      RAISE EXCEPTION 'workflow file_path is required';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_workflow_update()
RETURNS trigger AS $$
  BEGIN
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
      RAISE EXCEPTION 'workflow name is required';
    END IF;
    IF NEW.file_path IS NULL OR TRIM(NEW.file_path) = '' THEN
      RAISE EXCEPTION 'workflow file_path is required';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Auto-increment popularity on insert
CREATE TRIGGER increment_popularity 
  AFTER INSERT ON workflows 
  FOR EACH ROW 
  EXECUTE FUNCTION increment_popularity();

-- Validate workflow on insert
CREATE TRIGGER validate_workflow_on_insert 
  BEFORE INSERT ON workflows 
  FOR EACH ROW 
  EXECUTE FUNCTION validate_workflow_insert();

-- Validate workflow on update
CREATE TRIGGER validate_workflow_on_update 
  BEFORE UPDATE ON workflows 
  FOR EACH ROW 
  EXECUTE FUNCTION validate_workflow_update();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample categories
INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Marketing', 'marketing', '📢', 'Social media, content creation, email campaigns', 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('E-Commerce', 'ecommerce', '🛍', 'Online stores, order processing, inventory management', 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Productivity', 'productivity', '📊', 'Task management, time tracking, automation', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Customer Support', 'customer-support', '💬', 'Help desk, chatbots, support ticket systems', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('AI & Automation', 'ai', '🤖', 'AI-powered workflows, machine learning, data processing', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Data & Analytics', 'data', '📈', 'Data visualization, analytics dashboards, reporting', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Finance', 'finance', '💰', 'Accounting, financial workflows, expense tracking', 7)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Communication', 'communication', '💬', 'Email, Slack, Discord, Telegram bots', 8)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Social Media', 'social', '📱', 'Social media posting, content scheduling', 9)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Development', 'dev', '👨‍💻', 'Code, API integrations, tools, libraries', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert sample pricing tiers
INSERT INTO pricing_tiers (name, price_id, monthly_price, yearly_price, currency, features, download_limit, api_access, max_api_requests_per_month, priority_support, stripe_dashboard, discount_percentage) VALUES
('Free', 'price_free', 0, 0, 'usd', '{"free_downloads": 10, "search": "basic", "support": "email"}', 10, FALSE, 1000, FALSE, FALSE, 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pricing_tiers (name, price_id, monthly_price, yearly_price, currency, features, download_limit, api_access, max_api_requests_per_month, priority_support, stripe_dashboard, discount_percentage) VALUES
('Basic', 'price_basic', 10, 100, 'usd', '{"free_downloads": 100, "search": "advanced", "support": "email_48h", "download_history": true}', 100, FALSE, 1000, FALSE, FALSE, 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pricing_tiers (name, price_id, monthly_price, yearly_price, currency, features, download_limit, api_access, max_api_requests_per_month, priority_support, stripe_dashboard, discount_percentage) VALUES
('Pro', 'price_pro', 25, 250, 'usd', '{"free_downloads": "unlimited", "search": "advanced+semantic", "support": "priority_24h", "download_history": true}', 0, TRUE, 10000, FALSE, FALSE, 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pricing_tiers (name, price_id, monthly_price, yearly_price, currency, features, download_limit, api_access, max_api_requests_per_month, priority_support, stripe_dashboard, discount_percentage) VALUES
('Enterprise', 'price_enterprise', 100, 1000, 'usd', '{"free_downloads": "unlimited", "search": "advanced+semantic", "support": "priority_4h", "download_history": true}', 0, TRUE, 100000, TRUE, TRUE, 0)
ON CONFLICT (name) DO NOTHING;

-- Insert sample workflows
INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('Social Media Content Scheduler', 'Automate posting content across social media platforms', 'marketing', 'medium', 'intermediate', 5, ARRAY['social-media', 'content', 'automation', 'marketing'], ARRAY['cron'], ARRAY['http-request', 'set'], ARRAY['twitter', 'facebook', 'instagram', 'linkedin'], 5, 4, 250, 4.5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('E-commerce Order Processing', 'Process orders from multiple e-commerce platforms and update inventory', 'ecommerce', 'complex', 'advanced', 15, ARRAY['webhook'], ARRAY['http-request', 'set', 'get', 'if-else'], ARRAY['shopify', 'woocommerce', 'stripe'], 10, 8, 320, 4.6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('Email List Cleaning & Categorization', 'Automatically clean and categorize email inbox', 'productivity', 'medium', 'intermediate', 3, ARRAY['email-trigger'], ARRAY['http-request', 'set', 'get'], ARRAY['gmail', 'outlook'], 6, 4, 150, 4.8)
ON CONFLICT (name) DO NOTHING;

INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('Customer Support AI Chatbot', 'AI-powered chatbot for customer support queries', 'customer-support', 'complex', 'advanced', 20, ARRAY['webhook'], ARRAY['http-request', 'set', 'post'], ARRAY['openai', 'anthropic'], 8, 6, 450, 4.7)
ON CONFLICT (name) DO NOTHING;

INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('Daily Sales Report Generator', 'Generate comprehensive daily sales reports', 'productivity', 'complex', 'advanced', 12, ARRAY['cron'], ARRAY['http-request', 'set', 'get', 'transform'], ARRAY['shopify', 'stripe', 'google-sheets'], 7, 5, 280, 4.4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample user
INSERT INTO users (email, subscription_tier, subscription_status) VALUES
('test@example.com', 'free', 'active')
ON CONFLICT (email) DO NOTHING;
