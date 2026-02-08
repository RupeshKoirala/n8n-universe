-- n8n Universe Database Schema
-- PostgreSQL 14+ with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

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
  embedding vector(1536), -- OpenAI embeddings for semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT workflows_name_unique UNIQUE (name)
  GIN INDEX workflows_name_trgm ON workflows USING gin (name)
  GIN INDEX workflows_category ON workflows USING gin (category)
  GIN INDEX workflows_difficulty ON workflows USING gin (difficulty)
  GIN INDEX workflows_tags ON workflows USING gin (tags)
  GIN INDEX workflows_integrations ON workflows USING gin (integrations)
  GIN INDEX workflows_triggers ON workflows USING gin (triggers)
  GIN INDEX workflows_actions ON workflows USING gin (actions)
  GIN INDEX workflows_popularity ON workflows (popularity)
  GIN INDEX workflows_price ON workflows (price)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  github_id TEXT,
  github_username TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, basic, pro, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, cancelled, past_due
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
  -- Indexes
  CONSTRAINT users_email_unique UNIQUE (email)
  GIN INDEX users_github_id ON users USING btree (github_id)
  GIN INDEX users_subscription_tier ON users USING btree (subscription_tier)
);

-- Downloads Table (purchase history)
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  price_paid NUMERIC NOT NULL,
  download_count INTEGER DEFAULT 1,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT downloads_user_id_idx ON downloads (user_id)
  GIN INDEX downloads_workflow_id_idx ON downloads (workflow_id)
  GIN INDEX downloads_downloaded_at_idx ON downloads (downloaded_at)
  GIN INDEX downloads_created_at_idx ON downloads (created_at)
);

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT categories_name_unique UNIQUE (name)
  GIN INDEX categories_slug_unique UNIQUE (slug)
  GIN INDEX categories_display_order_idx ON categories (display_order)
  GIN INDEX categories_parent_id_idx ON categories (parent_id)
);

-- Stripe Subscriptions Table (webhook data)
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- active, cancelled, past_due, trial_ending, trialing
  tier TEXT NOT NULL, -- free, basic, pro, enterprise
  plan TEXT, -- price_id
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  interval TEXT, -- month, year
  interval_count INTEGER DEFAULT 0,
  trial_period_days INTEGER DEFAULT 0,
  cancel_at_period_end INTEGER DEFAULT 0,
  cancel_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT stripe_subscriptions_user_id_idx ON stripe_subscriptions (user_id)
  CONSTRAINT stripe_subscriptions_customer_id_idx ON stripe_subscriptions (stripe_customer_id)
  CONSTRAINT stripe_subscriptions_subscription_id_idx ON stripe_subscriptions (stripe_subscription_id)
  CONSTRAINT stripe_subscriptions_status_idx ON stripe_subscriptions (status)
  GIN INDEX stripe_subscriptions_tier_idx ON stripe_subscriptions (tier)
  GIN INDEX stripe_subscriptions_created_at_idx ON stripe_subscriptions (created_at)
  GIN INDEX stripe_subscriptions_updated_at_idx ON stripe_subscriptions (updated_at)
  GIN INDEX stripe_subscriptions_current_period_end_idx ON stripe_subscriptions (current_period_end);

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT pricing_tiers_name_unique UNIQUE (name)
  CONSTRAINT pricing_tiers_price_id_idx ON pricing_tiers (price_id)
  GIN INDEX pricing_tiers_monthly_price_idx ON pricing_tiers (monthly_price)
  GIN INDEX pricing_tiers_yearly_price_idx ON pricing_tiers (yearly_price)
  GIN INDEX pricing_tiers_created_at_idx ON pricing_tiers (created_at)
  GIN INDEX pricing_tiers_updated_at_idx ON pricing_tiers (updated_at)
  GIN INDEX pricing_tiers_priority_support_idx ON pricing_tiers (priority_support)
  GIN INDEX pricing_tiers_stripe_dashboard_idx ON pricing_tiers (stripe_dashboard);

-- Row Level Security (RLS) Policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read workflows" ON workflows FOR SELECT USING (SELECT true);
CREATE POLICY "Users can insert workflows" ON workflows FOR INSERT WITH CHECK (auth.uid() = current_uid());
CREATE POLICY "Users can update workflows" ON workflows FOR UPDATE WITH CHECK (auth.uid() = current_uid());
CREATE POLICY "Admins can do anything" ON workflows FOR ALL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON users FOR SELECT USING (SELECT true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE WITH CHECK (auth.uid() = current_uid());

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own downloads" ON downloads FOR SELECT USING (auth.uid() = current_uid());
CREATE POLICY "Users can insert own downloads" ON downloads FOR INSERT WITH CHECK (auth.uid() = current_uid());

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON stripe_subscriptions FOR SELECT USING (auth.uid() = current_uid());
CREATE POLICY "Users can insert own subscriptions" ON stripe_subscriptions FOR INSERT WITH CHECK (auth.uid() = current_uid());

-- Functions for similarity search (HNSW - HNSWLIB)
-- cosine similarity calculation for semantic search
CREATE OR REPLACE FUNCTION cosine_similarity(v1 vector(1536), v2 vector(1536))
RETURNS float AS $$
DECLARE
    norm1 float;
    norm2 float;
BEGIN
    -- Calculate norms
    norm1 := sqrt(sum((v1 * v1)::float8));
    norm2 := sqrt(sum((v2 * v2)::float8));
    
    -- Handle zero norms
    IF norm1 = 0 OR norm2 = 0 THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate dot product and divide by product of norms
    RETURN (sum((v1 * v2)::float8) / (norm1 * norm2))::float;
END;

-- Function to search similar workflows
CREATE OR REPLACE FUNCTION search_similar_workflows(
    search_query TEXT,
    category_filter TEXT,
    complexity_filter TEXT,
    integration_filter TEXT,
    min_price NUMERIC,
    max_price NUMERIC,
    limit INTEGER DEFAULT 20
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
    similarity_score NUMERIC
    matches JSONB
)
AS $$
BEGIN
    -- Build dynamic query based on filters
    SELECT 
        workflows.id,
        workflows.name,
        workflows.description,
        workflows.category,
        workflows.complexity,
        workflows.difficulty,
        workflows.price,
        workflows.popularity,
        workflows.rating,
        
        -- Calculate similarity if search query provided
        CASE 
            WHEN $1 = true THEN
                cosine_similarity(workflows.embedding, generate_embedding($1))
                * 0.5 + 0.5 5 -- Popularity boost
            ELSE
                0.0
        
        -- Apply filters
        WHERE CASE 
                WHEN $2 IS NOT NULL THEN TRUE
                WHEN $3 = 'general' THEN TRUE
                WHEN $4 = category THEN workflows.category = $4
                ELSE TRUE
            AND
                CASE 
                    WHEN $6 IS NOT NULL THEN TRUE
                    WHEN $7 = 'simple' THEN workflows.complexity = 'simple'
                    WHEN $7 = 'medium' THEN workflows.complexity = 'medium'
                    WHEN $7 = 'complex' THEN workflows.complexity = 'complex'
                    ELSE TRUE
                AND
                    CASE 
                        WHEN $8 IS NULL THEN TRUE
                        WHEN $9 = 'beginner' THEN workflows.difficulty = 'beginner'
                        WHEN $9 = 'intermediate' THEN workflows.difficulty = 'intermediate'
                        WHEN $9 = 'advanced' THEN workflows.difficulty = 'advanced'
                        ELSE TRUE
                    AND
                        CASE 
                            WHEN $10 IS NULL THEN TRUE
                                WHEN workflows.price >= $11 THEN workflows.price >= $11
                                ELSE workflows.price >= $11
                            END
                        ELSE TRUE
            ORDER BY 
                CASE WHEN $1 = true THEN similarity_score DESC, workflows.popularity DESC
                ELSE workflows.popularity DESC
            LIMIT $11;
END;

-- Function to generate embeddings (will use OpenAI in application)
CREATE OR REPLACE FUNCTION generate_embedding(text TEXT)
RETURNS vector(1536) AS $$
BEGIN
    RETURN NULL; -- Placeholder until OpenAI integration
END;

-- Function to track workflow views
CREATE OR REPLACE FUNCTION track_workflow_view(workflow_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE workflows 
    SET popularity = popularity + 1 
    WHERE id = $1;
END;

-- Function to validate workflow schema
CREATE OR REPLACE FUNCTION validate_workflow_schema(workflow JSONB)
RETURNS valid BOOLEAN AS $$
BEGIN
    RETURN (workflow ? 'id' : TRUE) 
           AND (workflow ? 'name' : TRUE)
           AND (workflow ? 'description' OR workflow ? 'description' = '' : TRUE);
END;

-- Trigger to update popularity automatically
CREATE TRIGGER update_popularity AFTER INSERT ON workflows
FOR EACH ROW
EXECUTE FUNCTION track_workflow_view(NEW.id);

-- Trigger to validate schema on insert/update
CREATE TRIGGER validate_workflow_schema BEFORE INSERT OR UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION validate_workflow_schema(NEW);

-- Insert sample categories
INSERT INTO categories (name, slug, icon, description, display_order) VALUES
('Marketing', 'marketing', '📢', 'Social media, content creation, email campaigns', 1),
('E-Commerce', 'ecommerce', '🛍', 'Online stores, order processing, inventory management, payment integrations', 2),
('Productivity', 'productivity', '📊', 'Task management, time tracking, automation, document workflows, file organization', 3),
('Customer Support', 'customer-support', '💬', 'Help desk, chatbots, support ticket systems, FAQ management', 4),
('AI & Automation', 'ai', '🤖', 'AI-powered workflows, machine learning, data processing, automation', 5),
('Data & Analytics', 'data', '📈', 'Data visualization, analytics dashboards, reporting systems, data transformation', 6),
('Finance', 'finance', '💰', 'Accounting, financial workflows, expense tracking, invoice processing, budget automation', 7),
('Communication', 'communication', '💬', 'Email, Slack, Discord, Telegram bots, messaging systems', 8),
('Social Media', 'social', '📱', 'Social media posting, content scheduling, comment management, analytics', 9),
('Development', 'dev', '👨‍💻', 'Code, API, integrations, tools, libraries', 10);

-- Insert sample pricing tiers
INSERT INTO pricing_tiers (name, price_id, monthly_price, yearly_price, currency, features, download_limit, api_access, max_api_requests_per_month, priority_support, stripe_dashboard, discount_percentage) VALUES
('Free', 'free', 0, 0, 0, 'usd', '{"free_downloads": 10, "search": "basic", "support": "email"}', 10, FALSE, FALSE, 1000, FALSE, FALSE, FALSE, 0, NOW()),
('Basic', 'basic', 1, 1, 10, 'usd', '{"free_downloads": 100, "search": "advanced", "support": "email_48h", "download_history": true, "community": true, "analytics": "basic"}', 100, FALSE, FALSE, 1000, FALSE, FALSE, FALSE, 0, NOW()),
('Pro', 'pro', 2, 2, 25, 'usd', '{"free_downloads": "unlimited", "search": "advanced+semantic", "support": "priority_24h", "download_history": true, "community": true, "analytics": "advanced", "api_access": true}', 100, 10000, TRUE, FALSE, FALSE, FALSE, 0, NOW()),
('Enterprise', 'enterprise', 3, 3, 100, 'usd', '{"free_downloads": "unlimited", "search": "advanced+semantic", "support": "priority_4h", "download_history": true, "community": true, "analytics": "advanced", "api_access": true, "stripe_dashboard": true, "custom_workflows": true, "white_labeling": true}', 100, 100000, TRUE, TRUE, FALSE, FALSE, 0, NOW());

-- Insert sample workflows
INSERT INTO workflows (name, description, category, complexity, difficulty, price, tags, triggers, actions, integrations, node_count, connection_count, popularity, rating) VALUES
('Social Media Content Scheduler', 'Automate posting content across social media platforms', 'marketing', 'medium', 'intermediate', 5, ARRAY['social-media', 'content', 'automation', 'marketing', 'twitter', 'facebook', 'instagram', 'linkedin'], ARRAY['cron'], ARRAY['http-request', 'set'], 3, 3, 250, 4.5),
('E-commerce Order Processing', 'Process orders from multiple e-commerce platforms and update inventory', 'ecommerce', 'complex', 'advanced', 15, ARRAY['webhook'], ARRAY['http-request', 'set', 'get', 'if-else'], 6, 6, 400, 4.2, ARRAY['shopify', 'woocommerce', 'magento', 'stripe'], 2, 2, 320, 4.6),
('Email List Cleaning & Categorization', 'Automatically clean and categorize email inbox, detect spam, prioritize important emails', 'productivity', 'medium', 'intermediate', 3, ARRAY['email-trigger'], ARRAY['http-request', 'set', 'get', 'delete', 'if-else'], 2, 2, 150, 4.8, ARRAY['gmail', 'outlook'], 2, 2, 150, 4.8),
('Customer Support AI Chatbot', 'AI-powered chatbot that handles customer support queries, provides answers, and escalates to human agents', 'customer-support', 'complex', 'advanced', 20, ARRAY['webhook'], ARRAY['http-request', 'set', 'get', 'post', 'if-else'], 6, 6, 600, 4.6, ARRAY['openai', 'anthropic', 'n8n', 'supabase'], 2, 2, 150, 4.6),
('Newsletter Subscription Manager', 'Manage newsletter subscriptions, handle unsubscribes, and track engagement metrics', 'marketing', 'medium', 'intermediate', 7, ARRAY['webhook', 'email-trigger'], ARRAY['http-request', 'set', 'get', 'post', 'delete'], 2, 2, 200, 4.1, ARRAY['mailchimp', 'sendgrid', 'convertkit'], 2, 2, 200, 4.1),
('Website Performance Monitor', 'Monitor website uptime, page load times, and user engagement metrics', 'productivity', 'simple', 'beginner', 2, ARRAY['cron'], ARRAY['http-request', 'set', 'get', 'if-else'], 2, 2, 120, 4.9, ARRAY['uptime-robot', 'pingdom', 'google-analytics', 'sentry'], 2, 2, 120, 4.9),
('Daily Sales Report Generator', 'Generate comprehensive daily sales reports across all platforms and channels', 'productivity', 'complex', 'advanced', 12, ARRAY['cron'], ARRAY['http-request', 'set', 'get', 'transform', 'if-else'], ARRAY['shopify', 'stripe', 'google-sheets', 'notion'], 2, 2, 320, 4.7);

-- Insert sample user
INSERT INTO users (email, github_id, github_username, avatar_url, subscription_tier, subscription_status) VALUES
('test@example.com', NULL, NULL, NULL, NULL, 'free', 'active', NOW(), NOW());

COMMIT;