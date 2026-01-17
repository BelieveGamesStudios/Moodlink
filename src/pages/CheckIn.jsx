import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { MOOD_EMOJIS } from '../lib/moods'
import { createMoodCheckin, getCheckinStreak, hasCheckedInToday } from '../lib/moods'

export default function CheckIn() {
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodValue, setMoodValue] = useState(5)
  const [notes, setNotes] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(false)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  const { profile, isGuest } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      loadStreak()
      checkTodayStatus()
    }
  }, [profile])

  const loadStreak = async () => {
    if (profile) {
      const streakCount = await getCheckinStreak(profile.id)
      setStreak(streakCount)
    }
  }

  const checkTodayStatus = async () => {
    if (profile) {
      const checkedIn = await hasCheckedInToday(profile.id)
      setAlreadyCheckedIn(checkedIn)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedMood) {
      showToast('Please select how you\'re feeling', 'error')
      return
    }

    if (!profile) {
      showToast('Please sign in or continue as guest', 'error')
      return
    }

    setLoading(true)

    const { checkin, error } = await createMoodCheckin(profile.id, {
      moodEmoji: selectedMood.emoji,
      moodValue,
      notes: notes.trim() || null,
      isAnonymous,
    })

    if (error) {
      showToast('Failed to save check-in. Please try again.', 'error')
      setLoading(false)
      return
    }

    showToast('Check-in saved!', 'success')
    
    // Navigate to AI response page with mood data
    navigate('/support', {
      state: {
        moodEmoji: selectedMood.emoji,
        moodValue,
        moodLabel: selectedMood.label,
      },
    })
  }

  if (!profile && !isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in or continue as guest to check in</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        {/* Streak Counter */}
        {streak > 0 && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
              <span className="text-xl">🔥</span>
              <span className="font-semibold">{streak} day streak</span>
            </div>
          </div>
        )}

        {/* Already Checked In Notice */}
        {alreadyCheckedIn && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
            You've already checked in today. You can check in again if you'd like to update your mood.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
            How are you feeling today?
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Mood Emoji Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Select an emotion
              </label>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                {MOOD_EMOJIS.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`p-4 rounded-xl transition-all transform hover:scale-110 ${
                      selectedMood?.id === mood.id
                        ? `${mood.color} ring-4 ring-purple-300 scale-110`
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-4xl mb-2">{mood.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Intensity Slider */}
            {selectedMood && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 text-center">
                  Intensity: {moodValue}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodValue}
                  onChange={(e) => setMoodValue(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            {selectedMood && (
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Want to share what's on your mind? (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setNotes(e.target.value)
                    }
                  }}
                  rows={3}
                  maxLength={100}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {notes.length}/100
                </div>
              </div>
            )}

            {/* Anonymous Toggle */}
            {selectedMood && (
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
                    Post anonymously to mood wall
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Share your mood with the community (no identifying information)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            )}

            {/* Submit Button */}
            {selectedMood && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Saving...' : 'Check In'}
              </button>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
