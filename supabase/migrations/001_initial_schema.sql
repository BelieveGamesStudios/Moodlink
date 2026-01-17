-- Moodlink Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username_optional TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    -- Supabase Auth integration
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Index for username searches
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username_optional) WHERE username_optional IS NOT NULL;

-- ============================================
-- 2. MOOD CHECKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mood_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 10),
    emoji TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for mood_checkins
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_timestamp ON mood_checkins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_timestamp ON mood_checkins(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_mood_value ON mood_checkins(mood_value);

-- ============================================
-- 3. MOOD WALL POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mood_wall_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 10),
    message_optional TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encouragement_count INTEGER DEFAULT 0,
    emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for mood_wall_posts
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_user_id ON mood_wall_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_timestamp ON mood_wall_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_mood_value ON mood_wall_posts(mood_value);
CREATE INDEX IF NOT EXISTS idx_mood_wall_posts_encouragement_count ON mood_wall_posts(encouragement_count DESC);

-- ============================================
-- 4. ENCOURAGEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS encouragements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_post_id UUID NOT NULL REFERENCES mood_wall_posts(id) ON DELETE CASCADE,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate encouragements from same user to same post
    UNIQUE(from_user_id, to_post_id)
);

-- Indexes for encouragements
CREATE INDEX IF NOT EXISTS idx_encouragements_from_user_id ON encouragements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_to_post_id ON encouragements(to_post_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_timestamp ON encouragements(timestamp DESC);

-- ============================================
-- 5. AI RESPONSES TABLE (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mood_category TEXT NOT NULL, -- e.g., "happy", "sad", "anxious", "calm"
    mood_range_start INTEGER NOT NULL CHECK (mood_range_start >= 1 AND mood_range_start <= 10),
    mood_range_end INTEGER NOT NULL CHECK (mood_range_end >= 1 AND mood_range_end <= 10),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Index for mood category lookups
CREATE INDEX IF NOT EXISTS idx_ai_responses_mood_category ON ai_responses(mood_category);
CREATE INDEX IF NOT EXISTS idx_ai_responses_mood_range ON ai_responses(mood_range_start, mood_range_end);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update encouragement_count when encouragements are added/removed
CREATE OR REPLACE FUNCTION update_encouragement_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mood_wall_posts
        SET encouragement_count = encouragement_count + 1
        WHERE id = NEW.to_post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mood_wall_posts
        SET encouragement_count = GREATEST(encouragement_count - 1, 0)
        WHERE id = OLD.to_post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update encouragement_count
CREATE TRIGGER trigger_update_encouragement_count
    AFTER INSERT OR DELETE ON encouragements
    FOR EACH ROW
    EXECUTE FUNCTION update_encouragement_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_responses table
CREATE TRIGGER trigger_ai_responses_updated_at
    BEFORE UPDATE ON ai_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: Enable RLS on tables and configure policies based on your security requirements

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (customize based on your needs)

-- Users: Users can read their own profile, update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Mood Checkins: Users can manage their own checkins
CREATE POLICY "Users can view own checkins" ON mood_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND users.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own checkins" ON mood_checkins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND users.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own checkins" ON mood_checkins
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_checkins.user_id
            AND users.auth_user_id = auth.uid()
        )
    );

-- Mood Wall Posts: Anyone can view anonymous posts, users can manage their own
CREATE POLICY "Anyone can view mood wall posts" ON mood_wall_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own mood wall posts" ON mood_wall_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_wall_posts.user_id
            AND users.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own mood wall posts" ON mood_wall_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = mood_wall_posts.user_id
            AND users.auth_user_id = auth.uid()
        )
    );

-- Encouragements: Anyone can view, authenticated users can create
CREATE POLICY "Anyone can view encouragements" ON encouragements
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create encouragements" ON encouragements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = encouragements.from_user_id
            AND users.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own encouragements" ON encouragements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = encouragements.from_user_id
            AND users.auth_user_id = auth.uid()
        )
    );

-- AI Responses: Public read access (cached responses)
CREATE POLICY "Anyone can view AI responses" ON ai_responses
    FOR SELECT USING (true);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'User profiles with optional usernames and preferences';
COMMENT ON TABLE mood_checkins IS 'Daily mood check-ins from users';
COMMENT ON TABLE mood_wall_posts IS 'Anonymous mood posts visible on the mood wall';
COMMENT ON TABLE encouragements IS 'Peer-to-peer encouragement messages';
COMMENT ON TABLE ai_responses IS 'Cached AI-generated supportive messages by mood category';
