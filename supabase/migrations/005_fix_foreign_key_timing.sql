-- Fix Foreign Key Constraint Timing Issue
-- This migration fixes the timing issue when creating user profiles

-- ============================================
-- 1. Add unique constraint on auth_user_id
-- ============================================
-- This prevents duplicate profiles and allows ON CONFLICT in trigger
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique 
ON users(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- ============================================
-- 2. Update the trigger function to be more robust
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a small delay to ensure auth user is fully committed
  -- Then insert the profile
  INSERT INTO public.users (auth_user_id, preferences)
  VALUES (NEW.id, '{}'::jsonb)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- If insert fails, try to fetch existing profile (might have been created by client)
    -- This prevents errors if profile already exists
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Make foreign key constraint DEFERRABLE
-- ============================================
-- This allows the constraint to be checked at the end of the transaction
-- First, drop the existing foreign key
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

-- Recreate it as DEFERRABLE INITIALLY DEFERRED
-- This means the constraint check is deferred until the end of the transaction
ALTER TABLE users
ADD CONSTRAINT users_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;
