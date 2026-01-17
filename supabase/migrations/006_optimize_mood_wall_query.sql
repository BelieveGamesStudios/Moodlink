-- Optimize Mood Wall Query Performance
-- This migration adds indexes and optimizes queries for the mood wall

-- ============================================
-- 1. Ensure indexes exist for mood_wall_posts
-- ============================================
-- These should already exist from 001_initial_schema.sql, but let's make sure
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_timestamp_desc ON mood_wall_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_mood_value ON mood_wall_posts(mood_value);
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_user_id ON mood_wall_posts(user_id);

-- ============================================
-- 2. Optimize encouragement count query
-- ============================================
-- Ensure index exists for encouragements
CREATE INDEX IF NOT EXISTS idx_encouragements_to_post_id ON encouragements(to_post_id);

-- ============================================
-- 3. Create a materialized view or function for faster counts
-- ============================================
-- Create a function to get encouragement count (optional optimization)
CREATE OR REPLACE FUNCTION get_encouragement_count(post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM encouragements
    WHERE to_post_id = post_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. Update RLS to ensure all posts are visible
-- ============================================
-- Make sure the policy allows viewing all mood wall posts
DROP POLICY IF EXISTS "Anyone can view mood wall posts" ON mood_wall_posts;
CREATE POLICY "Anyone can view mood wall posts" ON mood_wall_posts
    FOR SELECT USING (true);

-- ============================================
-- 5. Add composite index for filtered queries
-- ============================================
-- This helps with mood value filtering
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_mood_timestamp 
ON mood_wall_posts(mood_value, timestamp DESC);
