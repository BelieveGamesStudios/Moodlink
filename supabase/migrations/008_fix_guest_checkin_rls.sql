-- Fix Guest User Check-in RLS
-- This migration simplifies the RLS policies to allow guest users to create check-ins
-- without requiring session variables

-- ============================================
-- Drop and recreate mood_checkins policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own checkins" ON mood_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON mood_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON mood_checkins;

-- Simplified policy: Allow if user exists and either:
-- 1. User is authenticated (auth_user_id = auth.uid())
-- 2. User is a guest (auth_user_id IS NULL)
-- This works because we verify the user_id matches an existing user in the users table
CREATE POLICY "Users can view own checkins" ON mood_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );

CREATE POLICY "Users can insert own checkins" ON mood_checkins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );

CREATE POLICY "Users can update own checkins" ON mood_checkins
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );

-- ============================================
-- Drop and recreate mood_wall_posts policies
-- ============================================
DROP POLICY IF EXISTS "Users can insert own mood wall posts" ON mood_wall_posts;
DROP POLICY IF EXISTS "Users can update own mood wall posts" ON mood_wall_posts;

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

CREATE POLICY "Users can update own mood wall posts" ON mood_wall_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_wall_posts.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );

-- ============================================
-- Drop and recreate encouragements policies
-- ============================================
DROP POLICY IF EXISTS "Users can create encouragements" ON encouragements;
DROP POLICY IF EXISTS "Authenticated users can create encouragements" ON encouragements;

CREATE POLICY "Users can create encouragements" ON encouragements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = encouragements.from_user_id
            AND (
                users.auth_user_id = auth.uid() OR
                users.auth_user_id IS NULL
            )
        )
    );
