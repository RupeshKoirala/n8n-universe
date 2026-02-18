-- Analytics Tables for n8n Marketplace
-- Phase 4: Analytics & Dashboard
-- Migration: 20261707000000_analytics_tables.sql

-- =========================================================
-- FAVORITE WORKFLOWS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS favorite_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorite_workflows_user_workflow_unique
  ON favorite_workflows (user_id, workflow_id);

CREATE INDEX IF NOT EXISTS favorite_workflows_user_id_idx
  ON favorite_workflows (user_id);

CREATE INDEX IF NOT EXISTS favorite_workflows_workflow_id_idx
  ON favorite_workflows (workflow_id);

-- =========================================================
-- SEARCH ANALYTICS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  search_type TEXT DEFAULT 'text', -- 'text', 'semantic', 'hybrid'
  clicked_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_analytics_user_id_idx
  ON search_analytics (user_id);

CREATE INDEX IF NOT EXISTS search_analytics_query_idx
  ON search_analytics (query);

CREATE INDEX IF NOT EXISTS search_analytics_created_at_idx
  ON search_analytics (created_at DESC);

CREATE INDEX IF NOT EXISTS search_analytics_clicked_workflow_id_idx
  ON search_analytics (clicked_workflow_id);

-- =========================================================
-- PAGE VIEWS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS page_views_user_id_idx
  ON page_views (user_id);

CREATE INDEX IF NOT EXISTS page_views_page_path_idx
  ON page_views (page_path);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx
  ON page_views (created_at DESC);

-- =========================================================
-- EVENT TRACKING TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'workflow_view', 'workflow_download', 'search', 'signup', 'subscription_start', etc.
  event_name TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_user_id_idx
  ON events (user_id);

CREATE INDEX IF NOT EXISTS events_event_type_idx
  ON events (event_type);

CREATE INDEX IF NOT EXISTS events_created_at_idx
  ON events (created_at DESC);

CREATE INDEX IF NOT EXISTS events_properties_idx
  ON events USING gin (properties);

-- =========================================================
-- DAILY ANALYTICS TABLE (Materialized View)
-- =========================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics AS
SELECT
  DATE(created_at) AS date,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) FILTER (WHERE event_type = 'workflow_view') AS page_views,
  COUNT(*) FILTER (WHERE event_type = 'workflow_download') AS downloads,
  COUNT(*) FILTER (WHERE event_type = 'search') AS searches,
  COUNT(*) FILTER (WHERE event_type = 'signup') AS signups,
  COUNT(*) FILTER (WHERE event_type = 'subscription_start') AS subscription_starts,
  SUM(CASE WHEN event_type = 'checkout_completed' THEN (properties->>'amount')::numeric ELSE 0 END) AS revenue
FROM events
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS daily_analytics_date_unique
  ON daily_analytics (date);

CREATE INDEX IF NOT EXISTS daily_analytics_date_idx
  ON daily_analytics (date DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW daily_analytics;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Favorite Workflows
ALTER TABLE favorite_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON favorite_workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON favorite_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorite_workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Events (users can only see their own events)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow anonymous events

-- Search Analytics (users can only see their own searches)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own searches"
  ON search_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create searches"
  ON search_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Page Views (users can only see their own views)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own page views"
  ON page_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create page views"
  ON page_views FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Daily Analytics (admin only)
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view daily analytics"
  ON daily_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND subscription_tier = 'enterprise'
    )
  );

-- =========================================================
-- FUNCTIONS
-- =========================================================

-- Track page view
CREATE OR REPLACE FUNCTION track_page_view(
  p_user_id UUID DEFAULT NULL,
  p_page_path TEXT,
  p_page_title TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO page_views (
    user_id,
    page_path,
    page_title,
    referrer,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_page_path,
    p_page_title,
    p_referrer,
    p_session_id,
    p_ip_address,
    p_user_agent
  );

  -- Also track as event
  INSERT INTO events (
    user_id,
    event_type,
    event_name,
    properties,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'page_view',
    p_page_path,
    jsonb_build_object(
      'page_title', p_page_title,
      'referrer', p_referrer
    ),
    p_session_id,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Track search
CREATE OR REPLACE FUNCTION track_search(
  p_user_id UUID DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_results_count INTEGER DEFAULT 0,
  p_search_type TEXT DEFAULT 'text',
  p_clicked_workflow_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (
    user_id,
    query,
    filters,
    results_count,
    search_type,
    clicked_workflow_id,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_query,
    p_filters,
    p_results_count,
    p_search_type,
    p_clicked_workflow_id,
    p_session_id,
    p_ip_address,
    p_user_agent
  );

  -- Also track as event
  INSERT INTO events (
    user_id,
    event_type,
    event_name,
    properties,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'search',
    COALESCE(p_query, 'empty'),
    jsonb_build_object(
      'filters', p_filters,
      'results_count', p_results_count,
      'search_type', p_search_type,
      'clicked_workflow_id', p_clicked_workflow_id
    ),
    p_session_id,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Track workflow view
CREATE OR REPLACE FUNCTION track_workflow_view_event(
  p_user_id UUID DEFAULT NULL,
  p_workflow_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Increment workflow popularity
  UPDATE workflows
  SET popularity = popularity + 1,
      updated_at = NOW()
  WHERE id = p_workflow_id;

  -- Track event
  INSERT INTO events (
    user_id,
    event_type,
    event_name,
    properties,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'workflow_view',
    p_workflow_id::text,
    jsonb_build_object('workflow_id', p_workflow_id),
    p_session_id,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Track workflow download
CREATE OR REPLACE FUNCTION track_workflow_download_event(
  p_user_id UUID,
  p_workflow_id UUID,
  p_price_paid NUMERIC,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Increment workflow download count (popularity)
  UPDATE workflows
  SET popularity = popularity + 1,
      updated_at = NOW()
  WHERE id = p_workflow_id;

  -- Track event
  INSERT INTO events (
    user_id,
    event_type,
    event_name,
    properties,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'workflow_download',
    p_workflow_id::text,
    jsonb_build_object(
      'workflow_id', p_workflow_id,
      'price_paid', p_price_paid
    ),
    p_session_id,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_downloads BIGINT,
  total_searches BIGINT,
  total_page_views BIGINT,
  favorite_workflows_count BIGINT,
  saved_searches_count BIGINT,
  downloads_this_month BIGINT,
  avg_daily_downloads NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'workflow_download') AS total_downloads,
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'search') AS total_searches,
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'page_view') AS total_page_views,
    COUNT(DISTINCT f.id) AS favorite_workflows_count,
    COUNT(DISTINCT s.id) AS saved_searches_count,
    COUNT(DISTINCT e.id) FILTER (
      WHERE e.event_type = 'workflow_download'
      AND e.created_at >= DATE_TRUNC('month', NOW())
    ) AS downloads_this_month,
    COUNT(DISTINCT e.id) FILTER (
      WHERE e.event_type = 'workflow_download'
      AND e.created_at >= NOW() - INTERVAL '1 day'
    )::numeric AS avg_daily_downloads
  FROM events e
  LEFT JOIN favorite_workflows f ON f.user_id = e.user_id
  LEFT JOIN saved_searches s ON s.user_id = e.user_id
  WHERE e.user_id = p_user_id
  AND e.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY e.user_id;
END;
$$ LANGUAGE plpgsql;

-- Get admin analytics
CREATE OR REPLACE FUNCTION get_admin_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date TEXT,
  unique_users BIGINT,
  page_views BIGINT,
  downloads BIGINT,
  searches BIGINT,
  signups BIGINT,
  subscription_starts BIGINT,
  revenue NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date::text,
    unique_users,
    page_views,
    downloads,
    searches,
    signups,
    subscription_starts,
    revenue
  FROM daily_analytics
  WHERE date >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT,
  avg_results_count NUMERIC,
  click_rate NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    query,
    COUNT(*) AS search_count,
    AVG(results_count) AS avg_results_count,
    (
      COUNT(clicked_workflow_id)::numeric / NULLIF(COUNT(*), 0)
    ) AS click_rate
  FROM search_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
  AND query IS NOT NULL
  AND TRIM(query) != ''
  GROUP BY query
  HAVING COUNT(*) >= 2
  ORDER BY search_count DESC, click_rate DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get trending workflows (based on recent downloads and views)
CREATE OR REPLACE FUNCTION get_trending_workflows(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  workflow_id UUID,
  name TEXT,
  category TEXT,
  download_count BIGINT,
  view_count BIGINT,
  trend_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id AS workflow_id,
    w.name,
    w.category,
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'workflow_download') AS download_count,
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'workflow_view') AS view_count,
    (
      COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'workflow_download') * 3.0 +
      COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'workflow_view')
    ) AS trend_score
  FROM workflows w
  LEFT JOIN events e ON e.properties->>'workflow_id' = w.id::text
  WHERE e.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY w.id, w.name, w.category
  HAVING COUNT(DISTINCT e.id) > 0
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Auto-update updated_at for favorite_workflows
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_favorite_workflows_updated_at ON favorite_workflows;
CREATE TRIGGER update_favorite_workflows_updated_at
  BEFORE UPDATE ON favorite_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
