import { supabase } from './supabase'

/**
 * Create a user profile in the users table
 * Note: A database trigger should automatically create the profile,
 * but this function handles manual creation and updates (like username)
 */
export const createUserProfile = async (authUserId, username = null) => {
  try {
    // First, check if profile already exists (created by trigger)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (!fetchError && existingProfile) {
      // Profile exists, update it if username is provided
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
    // This should work with the updated RLS policy
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
      // If still fails, wait a moment and try fetching again (trigger might be processing)
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
