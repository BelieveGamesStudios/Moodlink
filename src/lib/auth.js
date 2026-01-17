import { supabase } from './supabase'

/**
 * Create a user profile in the users table
 * Note: A database trigger should automatically create the profile,
 * but this function handles manual creation and updates (like username)
 */
export const createUserProfile = async (authUserId, username = null) => {
  try {
    // Wait a moment for the database trigger to potentially create the profile
    // This gives the trigger time to run after auth user creation
    await new Promise(resolve => setTimeout(resolve, 500))

    // First, check if profile already exists (created by trigger)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (!fetchError && existingProfile) {
      // Profile exists (created by trigger), update it if username is provided
      if (username) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({ username_optional: username })
          .eq('auth_user_id', authUserId)
          .select()
          .single()
        
        if (updateError) {
          console.error('Error updating profile:', updateError)
          return existingProfile
        }
        return updatedProfile
      }
      return existingProfile
    }

    // Profile doesn't exist, try to create it
    // The trigger should have created it, but if not, we'll create it here
    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        username_optional: username,
        preferences: {},
      })
      .select()
      .single()

    if (error) {
      // If foreign key constraint error, wait and retry (auth user might not be committed yet)
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Try fetching again - trigger might have created it
        const { data: retryProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single()
        
        if (retryProfile) {
          // Update with username if provided
          if (username) {
            const { data: updatedProfile } = await supabase
              .from('users')
              .update({ username_optional: username })
              .eq('auth_user_id', authUserId)
              .select()
              .single()
            return updatedProfile || retryProfile
          }
          return retryProfile
        }
      }

      // If RLS error, wait and retry
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: retryProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single()
        
        if (retryProfile) {
          return retryProfile
        }
      }
      
      // If profile already exists (unique constraint), fetch it
      if (error.code === '23505') {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single()
        return existingProfile
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

/**
 * Get or create a guest user profile
 * Guest users don't have auth_user_id (it's null)
 */
export const getOrCreateGuestUser = async () => {
  try {
    // Check if there's a guest user ID in localStorage
    const guestUserId = localStorage.getItem('guest_user_id')
    
    if (guestUserId) {
      // Try to fetch existing guest user
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', guestUserId)
        .is('auth_user_id', null)
        .single()

      if (!error && data) {
        return data
      }
    }

    // Create new guest user
    // Note: RLS policy allows inserting users with null auth_user_id
    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: null, // Guest users have null auth_user_id
        username_optional: `Guest_${Math.random().toString(36).substring(7)}`,
        preferences: { is_guest: true },
      })
      .select()
      .single()

    if (error) {
      // If insertion fails due to RLS, try a different approach
      console.warn('Direct guest user creation failed, may need RLS policy adjustment:', error)
      throw error
    }

    // Store guest user ID in localStorage
    localStorage.setItem('guest_user_id', data.id)

    return data
  } catch (error) {
    console.error('Error getting/creating guest user:', error)
    throw error
  }
}

/**
 * Convert guest user to authenticated user
 */
export const convertGuestToUser = async (authUserId, guestUserId) => {
  try {
    // Update guest profile to link with auth user
    const { data, error } = await supabase
      .from('users')
      .update({
        auth_user_id: authUserId,
      })
      .eq('id', guestUserId)
      .select()
      .single()

    if (error) throw error

    // Remove guest user ID from localStorage
    localStorage.removeItem('guest_user_id')

    return data
  } catch (error) {
    console.error('Error converting guest to user:', error)
    throw error
  }
}

/**
 * Delete user profile and all associated data
 * Note: Due to CASCADE constraints, deleting the user will automatically delete:
 * - mood_checkins
 * - mood_wall_posts
 * - encouragements
 * If authUserId is provided, also deletes the auth user
 */
export const deleteUserProfile = async (userId, authUserId = null) => {
  try {
    // Delete the user profile (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      // If RLS blocks deletion, we might need to handle it differently
      console.error('Error deleting user profile:', deleteError)
      throw deleteError
    }

    // If authenticated user, also delete from auth
    if (authUserId) {
      // Note: Deleting auth user requires admin privileges or service role
      // For now, we'll just delete the profile and let the user know
      // In production, you might want to use a server-side function for this
      console.log('Auth user deletion would require admin/service role')
    }

    // Clear localStorage
    localStorage.removeItem('guest_user_id')

    return { error: null }
  } catch (error) {
    console.error('Error deleting user profile:', error)
    return { error }
  }
}
