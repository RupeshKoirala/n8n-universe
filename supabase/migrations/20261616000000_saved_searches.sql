-- Saved Searches Table
-- Allows users to save their search filters and queries

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  sort_by TEXT DEFAULT 'popularity',
  sort_order TEXT DEFAULT 'desc',
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx ON saved_searches (user_id);
CREATE INDEX IF NOT EXISTS saved_searches_is_public_idx ON saved_searches (is_public);
CREATE INDEX IF NOT EXISTS saved_searches_usage_count_idx ON saved_searches (usage_count DESC);

-- RLS Policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update usage count
CREATE OR REPLACE FUNCTION increment_search_usage(search_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE saved_searches
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;
