import { supabase } from './supabase'
import { getMoodCategory } from './moods'

/**
 * Get AI-generated supportive message for a mood
 * First tries to get from cache, then generates new one if needed
 */
export const getAISupportMessage = async (moodValue, moodEmoji) => {
  try {
    const moodCategory = getMoodCategory(moodValue)

    // Try to get cached response
    const { data: cached, error: cacheError } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('mood_category', moodCategory)
      .gte('mood_range_start', moodValue)
      .lte('mood_range_end', moodValue)
      .order('usage_count', { ascending: true })
      .limit(1)
      .single()

    if (!cacheError && cached) {
      // Update usage count
      await supabase
        .from('ai_responses')
        .update({ usage_count: cached.usage_count + 1 })
        .eq('id', cached.id)

      return { message: cached.message, error: null }
    }

    // If no cached response, generate one based on mood
    const message = generateSupportMessage(moodValue, moodEmoji, moodCategory)
    return { message, error: null }
  } catch (error) {
    console.error('Error getting AI support message:', error)
    // Fallback to generated message
    const moodCategory = getMoodCategory(moodValue)
    const message = generateSupportMessage(moodValue, moodEmoji, moodCategory)
    return { message, error: null }
  }
}

/**
 * Generate a supportive message based on mood
 * In production, this would call an AI API
 */
const generateSupportMessage = (moodValue, moodEmoji, moodCategory) => {
  const messages = {
    very_low: [
      `I see you're going through a really tough time right now ${moodEmoji}. Your feelings are completely valid, and it takes courage to acknowledge them. Remember, you're not alone in this. Even though it might not feel like it right now, these difficult moments will pass. Consider reaching out to someone you trust, or try some gentle self-care like taking a warm bath, listening to calming music, or spending a few minutes in nature. Be patient and kind with yourself - healing isn't linear, and every small step forward matters.`,
      `It sounds like things are feeling really heavy for you today ${moodEmoji}. I want you to know that your emotions are important and deserve to be felt. Sometimes the hardest part is just getting through the day, and you're doing it. That's something to acknowledge. When you're ready, try some grounding techniques: take three deep breaths, notice five things you can see, four you can touch, three you can hear. These small moments of presence can help. Remember, there are people who care about you, and professional support is always available if you need it.`,
    ],
    low: [
      `I hear that you're feeling down today ${moodEmoji}. These feelings are real and valid. It's okay to not be okay sometimes. Consider what might help you feel even a tiny bit better - maybe a favorite song, a walk outside, or connecting with someone you care about. Remember that your mood can shift, and this feeling won't last forever. Be gentle with yourself and know that it's okay to take things one moment at a time.`,
      `You're navigating through some difficult feelings right now ${moodEmoji}. That takes strength. Sometimes acknowledging what we're feeling is the first step toward feeling better. Consider doing something kind for yourself today, even if it's small - maybe making yourself a warm drink, wrapping up in a cozy blanket, or writing down what you're grateful for. Small acts of self-care can make a difference.`,
    ],
    neutral: [
      `You're in a balanced space today ${moodEmoji}. That's a gift. This can be a good time for reflection, trying something new, or simply appreciating the calm. Consider what might bring you a bit of joy or connection - maybe reaching out to a friend, starting a small project, or doing something creative. These balanced moments are perfect for nurturing yourself.`,
      `A steady day can feel like a breath of fresh air ${moodEmoji}. You're in a calm space, which might be a good time to check in with yourself about what you need. Whether that's rest, connection, creativity, or movement - listen to what your body and mind are asking for. This is a perfect moment to be present and kind to yourself.`,
    ],
    positive: [
      `It's wonderful to see you're feeling good today ${moodEmoji}! This positive energy is something to celebrate. Consider sharing this positive feeling with others or doing something that brings you joy. Maybe try something creative, spend time in nature, or connect with people you care about. These good moments are worth savoring and can help build resilience for tougher days.`,
      `Your positive mood is shining through ${moodEmoji}! This is a beautiful moment. Consider what's contributing to this feeling and how you can nurture it. Whether it's a hobby, connection with others, or simply being present - these positive experiences are valuable. They remind us that good days are possible, even after difficult ones.`,
    ],
    very_positive: [
      `You're radiating positivity today ${moodEmoji}! This is amazing to see. Celebrate this moment and consider what made it special. This is a perfect time to spread some of that joy - maybe reach out to someone who might need support, do something creative, or simply be fully present in this good feeling. These moments of joy are precious and can be anchors during harder times.`,
      `What an incredible feeling ${moodEmoji}! You're on top of the world, and that's beautiful. This is a perfect time to connect with others, pursue something meaningful, or simply soak in this positive energy. Remember this feeling - it's a reminder that good days exist and that you're capable of experiencing joy. Let this energy fuel you and maybe even share it with someone who could use a lift.`,
    ],
  }

  const categoryMessages = messages[moodCategory] || messages.neutral
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)]
}
