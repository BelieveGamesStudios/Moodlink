import { supabase } from './supabase'
import { formatDistanceToNow } from 'date-fns'

export const MOOD_EMOJIS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'calm', emoji: '😌', label: 'Calm', color: 'bg-blue-100 text-blue-800' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-orange-100 text-orange-800' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-800' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-pink-100 text-pink-800' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-800' },
  { id: 'overwhelmed', emoji: '😵', label: 'Overwhelmed', color: 'bg-purple-100 text-purple-800' },
]

export const getMoodEmoji = (moodId) => {
  return MOOD_EMOJIS.find(m => m.id === moodId) || MOOD_EMOJIS[0]
}

export const getMoodCategory = (moodValue) => {
  if (moodValue >= 8) return 'very_positive'
  if (moodValue >= 6) return 'positive'
  if (moodValue >= 4) return 'neutral'
  if (moodValue >= 2) return 'low'
  return 'very_low'
}

export const createMoodCheckin = async (userId, moodData) => {
  try {
    const { moodEmoji, moodValue, notes, isAnonymous } = moodData

    // Create mood check-in
    const { data: checkin, error: checkinError } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: userId,
        mood_value: moodValue,
        emoji: moodEmoji,
        notes: notes || null,
        is_anonymous: isAnonymous,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (checkinError) {
      console.error('Check-in error details:', checkinError)
      // Provide more specific error message
      if (checkinError.code === '42501' || checkinError.message?.includes('row-level security')) {
        throw new Error('Permission denied. Please make sure you are signed in or using guest mode.')
      }
      throw checkinError
    }

    // If anonymous, also create mood wall post
    if (isAnonymous) {
      const { error: wallError } = await supabase
        .from('mood_wall_posts')
        .insert({
          user_id: userId,
          mood_value: moodValue,
          emoji: moodEmoji,
          message_optional: notes || null,
          timestamp: new Date().toISOString(),
        })

      if (wallError) {
        console.error('Error creating mood wall post:', wallError)
        // Don't throw - check-in was successful
      }
    }

    return { checkin, error: null }
  } catch (error) {
    console.error('Error creating mood check-in:', error)
    return { checkin: null, error }
  }
}

export const getMoodCheckins = async (userId, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching mood check-ins:', error)
    return { data: null, error }
  }
}

export const getMoodWallPosts = async (filter = 'all', limit = 100) => {
  try {
    // Use the encouragement_count column that's auto-updated by the trigger
    // This is much faster than counting manually
    let query = supabase
      .from('mood_wall_posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    // Apply mood filter if not 'all'
    if (filter !== 'all') {
      const moodMap = {
        happy: { min: 8, max: 10 },
        excited: { min: 8, max: 10 },
        calm: { min: 6, max: 7 },
        neutral: { min: 5, max: 7 },
        anxious: { min: 3, max: 5 },
        sad: { min: 1, max: 4 },
        angry: { min: 1, max: 4 },
        tired: { min: 3, max: 5 },
        overwhelmed: { min: 1, max: 4 },
      }

      const range = moodMap[filter]
      if (range) {
        query = query.gte('mood_value', range.min).lte('mood_value', range.max)
      }
    }

    const { data, error } = await query

    if (error) throw error

    // Format the data - use the encouragement_count from the database (updated by trigger)
    const formatted = (data || []).map(post => ({
      ...post,
      encouragement_count: post.encouragement_count || 0,
      timeAgo: formatDistanceToNow(new Date(post.timestamp), { addSuffix: true }),
    }))

    return { data: formatted, error: null }
  } catch (error) {
    console.error('Error fetching mood wall posts:', error)
    return { data: null, error }
  }
}

export const sendEncouragement = async (fromUserId, toPostId, message = null) => {
  try {
    const { data, error } = await supabase
      .from('encouragements')
      .insert({
        from_user_id: fromUserId,
        to_post_id: toPostId,
        message: message || null,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // If already exists (unique constraint), that's okay
      if (error.code === '23505') {
        return { data: null, error: { message: 'You already sent support to this post' } }
      }
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error sending encouragement:', error)
    return { data: null, error }
  }
}

export const getCheckinStreak = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('mood_checkins')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) throw error

    if (!data || data.length === 0) return 0

    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < data.length; i++) {
      const checkinDate = new Date(data[i].timestamp)
      checkinDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today - checkinDate) / (1000 * 60 * 60 * 24))

      if (daysDiff === streak) {
        streak++
        today.setDate(today.getDate() - 1)
      } else if (daysDiff > streak) {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}

export const hasCheckedInToday = async (userId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('mood_checkins')
      .select('id')
      .eq('user_id', userId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Error checking today check-in:', error)
    return false
  }
}
