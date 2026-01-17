-- Fix Guest User RLS Policy
-- This ensures guest users (with null auth_user_id) can be created

-- ============================================
-- Update INSERT policy to allow guest users
-- ============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create policy that allows:
-- 1. Authenticated users to insert their own profile (auth.uid() = auth_user_id)
-- 2. Guest users to insert profiles with null auth_user_id
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT 
    WITH CHECK (
        (auth.uid() = auth_user_id) OR
        (auth_user_id IS NULL)
    );

-- ============================================
-- Update SELECT policy to allow guest users
-- ============================================
-- Guest users need to be able to view their own profile
-- We'll use a session variable approach or allow viewing by ID
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid() = auth_user_id) OR
        (auth_user_id IS NULL)
    );

-- ============================================
-- Update UPDATE policy for guest users
-- ============================================
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid() = auth_user_id) OR
        (auth_user_id IS NULL)
    );
