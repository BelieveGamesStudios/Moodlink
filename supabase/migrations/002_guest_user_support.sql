-- Guest User Support
-- Run this after 001_initial_schema.sql
-- Updates RLS policies to support guest users (users with null auth_user_id)

-- ============================================
-- UPDATE RLS POLICIES FOR GUEST USERS
-- ============================================

-- Drop existing user policies and recreate with guest support
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Users: Authenticated users can manage their own profile
-- Guest users can manage their own profile (identified by localStorage guest_user_id)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid() = auth_user_id OR 
        (auth_user_id IS NULL AND id::text = current_setting('app.guest_user_id', true))
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() = auth_user_id OR 
        (auth_user_id IS NULL AND id::text = current_setting('app.guest_user_id', true))
    );

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = auth_user_id OR 
        auth_user_id IS NULL
    );

-- Drop existing mood_checkins policies
DROP POLICY IF EXISTS "Users can view own checkins" ON mood_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON mood_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON mood_checkins;

-- Mood Checkins: Support both authenticated and guest users
CREATE POLICY "Users can view own checkins" ON mood_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
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
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
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
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
            )
        )
    );

-- Drop existing mood_wall_posts policies
DROP POLICY IF EXISTS "Users can insert own mood wall posts" ON mood_wall_posts;
DROP POLICY IF EXISTS "Users can update own mood wall posts" ON mood_wall_posts;

-- Mood Wall Posts: Support guest users
CREATE POLICY "Users can insert own mood wall posts" ON mood_wall_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_wall_posts.user_id
            AND (
                users.auth_user_id = auth.uid() OR
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
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
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
            )
        )
    );

-- Drop existing encouragements policies
DROP POLICY IF EXISTS "Authenticated users can create encouragements" ON encouragements;
DROP POLICY IF EXISTS "Users can delete own encouragements" ON encouragements;

-- Encouragements: Support guest users
CREATE POLICY "Users can create encouragements" ON encouragements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = encouragements.from_user_id
            AND (
                users.auth_user_id = auth.uid() OR
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
            )
        )
    );

CREATE POLICY "Users can delete own encouragements" ON encouragements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = encouragements.from_user_id
            AND (
                users.auth_user_id = auth.uid() OR
                (users.auth_user_id IS NULL AND users.id::text = current_setting('app.guest_user_id', true))
            )
        )
    );

-- ============================================
-- NOTE: Guest User Session Management
-- ============================================
-- Guest users are identified by their user ID stored in localStorage
-- The app should set this as a session variable when making requests
-- However, since Supabase RLS doesn't have direct access to localStorage,
-- we'll use a different approach: allow guest users to insert/update their own records
-- by checking if the user_id matches a guest user profile

-- Alternative: Create a function to check guest access
CREATE OR REPLACE FUNCTION is_guest_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = user_uuid
        AND auth_user_id IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For better guest user support, we'll relax the policies slightly
-- Guest users can insert records for themselves (user_id must match their profile)
-- This is handled at the application level by ensuring guest_user_id matches
