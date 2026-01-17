-- Add DELETE policy for users table
-- This allows users to delete their own profile

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Create policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE 
    USING (
        auth.uid() = auth_user_id OR
        (auth_user_id IS NULL AND id::text = current_setting('app.guest_user_id', true))
    );

-- Note: Due to CASCADE constraints in the schema, deleting a user will automatically delete:
-- - All mood_checkins
-- - All mood_wall_posts  
-- - All encouragements sent by the user
-- This is handled by the foreign key constraints with ON DELETE CASCADE
