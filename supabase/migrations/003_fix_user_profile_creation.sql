-- Fix User Profile Creation RLS Issue
-- This migration fixes the RLS policy to allow users to create their own profile

-- ============================================
-- DROP AND RECREATE INSERT POLICY
-- ============================================
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a more permissive policy that allows users to insert their own profile
-- This works because auth.uid() will match the auth_user_id being inserted
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT 
    WITH CHECK (
        auth.uid() = auth_user_id OR
        auth_user_id IS NULL
    );

-- ============================================
-- OPTIONAL: Auto-create profile via trigger
-- ============================================
-- This is a better long-term solution - automatically create profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, preferences)
  VALUES (NEW.id, '{}'::jsonb)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
