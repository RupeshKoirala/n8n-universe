-- n8n Universe Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    complexity TEXT NOT NULL CHECK (complexity IN ('beginner', 'intermediate', 'advanced', 'expert')),
    nodes_count INTEGER NOT NULL DEFAULT 0,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding vector(1536)
);

-- Users table (managed by Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    downloads_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads table
CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    price_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    UNIQUE(user_id, workflow_id)
);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL,
    downloads_per_month INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    stripe_price_id TEXT
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, price_monthly, downloads_per_month, features) VALUES
    ('free', 'Free', 0, 10, ['10 downloads/month', 'Community support']),
    ('basic', 'Basic', 9, 100, ['100 downloads/month', 'Email support', 'Basic search']),
    ('pro', 'Pro', 19, -1, ['Unlimited downloads', 'Priority support', 'Advanced search', 'API access']),
    ('enterprise', 'Enterprise', 99, -1, ['Everything in Pro', 'Dedicated support', 'Custom workflows', 'SLA guarantee']);

-- Create indexes for better performance
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_complexity ON workflows(complexity);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_embedding ON workflows USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_workflow_id ON downloads(workflow_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Public can read workflows
CREATE POLICY "Public read access to workflows" ON workflows
    FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can read their own downloads
CREATE POLICY "Users can read own downloads" ON downloads
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert downloads" ON downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle user creation from Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for semantic search using embeddings
CREATE OR REPLACE FUNCTION search_workflows(
    search_query TEXT,
    category_filter TEXT DEFAULT NULL,
    complexity_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    tags JSONB,
    complexity TEXT,
    price DECIMAL,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.name,
        w.description,
        w.category,
        w.tags,
        w.complexity,
        w.price,
        1 - (w.embedding <=> (SELECT embedding FROM workflows WHERE id = (
            SELECT id FROM workflows
            ORDER BY w.embedding <=> embedding
            LIMIT 1
        )))::FLOAT as similarity
    FROM workflows w
    WHERE
        (category_filter IS NULL OR w.category = category_filter)
        AND (complexity_filter IS NULL OR w.complexity = complexity_filter)
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- View for workflow statistics
CREATE OR REPLACE VIEW workflow_stats AS
SELECT
    category,
    complexity,
    COUNT(*) as count,
    AVG(price) as avg_price,
    AVG(download_count) as avg_downloads,
    AVG(rating) as avg_rating
FROM workflows
GROUP BY category, complexity
ORDER BY count DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
