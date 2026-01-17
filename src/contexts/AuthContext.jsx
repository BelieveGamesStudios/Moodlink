import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createUserProfile, getOrCreateGuestUser } from '../lib/auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        // Check for guest user in localStorage
        const guestUserId = localStorage.getItem('guest_user_id')
        if (guestUserId) {
          loadGuestProfile(guestUserId)
        } else {
          setLoading(false)
        }
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // User signed in - clear guest mode
        setIsGuest(false)
        localStorage.removeItem('guest_user_id')
        await loadUserProfile(session.user.id)
      } else {
        // User signed out
        setProfile(null)
        setIsGuest(false)
        localStorage.removeItem('guest_user_id')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        console.error('Error loading profile:', error)
        setLoading(false)
        return
      }

      if (!data) {
        // Create profile if it doesn't exist
        const newProfile = await createUserProfile(authUserId)
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGuestProfile = async (guestUserId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', guestUserId)
        .is('auth_user_id', null)
        .single()

      if (error) {
        console.error('Error loading guest profile:', error)
        setLoading(false)
        return
      }

      if (data) {
        setProfile(data)
        setIsGuest(true)
      }
    } catch (error) {
      console.error('Error in loadGuestProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, username = null) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const newProfile = await createUserProfile(data.user.id, username)
        setProfile(newProfile)
        return { user: data.user, error: null }
      }

      return { user: null, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { user: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await loadUserProfile(data.user.id)
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { user: null, error }
    }
  }

  const signInWithMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Magic link error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)
      setIsGuest(false)
      localStorage.removeItem('guest_user_id')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const signInAsGuest = async () => {
    try {
      const guestProfile = await getOrCreateGuestUser()
      setProfile(guestProfile)
      setIsGuest(true)
      localStorage.setItem('guest_user_id', guestProfile.id)
      return { profile: guestProfile, error: null }
    } catch (error) {
      console.error('Guest sign in error:', error)
      return { profile: null, error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    isGuest,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    signInAsGuest,
    refreshProfile: () => {
      if (user) {
        loadUserProfile(user.id)
      } else if (isGuest && profile) {
        loadGuestProfile(profile.id)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
