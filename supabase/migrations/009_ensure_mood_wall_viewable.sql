-- Ensure Mood Wall Posts Are Viewable by Everyone
-- This migration ensures the RLS policy allows all users to view all mood wall posts

-- ============================================
-- Ensure SELECT policy allows viewing all posts
-- ============================================
DROP POLICY IF EXISTS "Anyone can view mood wall posts" ON mood_wall_posts;

-- Create policy that allows anyone (authenticated or not) to view all mood wall posts
CREATE POLICY "Anyone can view mood wall posts" ON mood_wall_posts
    FOR SELECT USING (true);

-- ============================================
-- Verify INSERT policy works for authenticated users
-- ============================================
-- The INSERT policy should already be set by migration 008, but let's make sure it's correct
DROP POLICY IF EXISTS "Users can insert own mood wall posts" ON mood_wall_posts;

CREATE POLICY "Users can insert own mood wall posts" ON mood_wall_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_wall_posts.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );
