import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { getMoodWallPosts, sendEncouragement } from '../lib/moods'
import { MOOD_EMOJIS } from '../lib/moods'

const MOOD_FILTERS = [
  { id: 'all', label: 'All Moods' },
  { id: 'happy', label: 'Happy' },
  { id: 'excited', label: 'Excited' },
  { id: 'calm', label: 'Calm' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'tired', label: 'Tired' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
]

export default function MoodWall() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sendingSupport, setSendingSupport] = useState(null)
  const { profile } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    loadPosts()
  }, [selectedFilter])

  const loadPosts = async () => {
    setLoading(true)
    const { data, error } = await getMoodWallPosts(selectedFilter)
    
    if (error) {
      showToast('Failed to load mood wall', 'error')
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  const handleSendSupport = async (postId) => {
    if (!profile) {
      showToast('Please sign in to send support', 'error')
      return
    }

    setSendingSupport(postId)
    const { error } = await sendEncouragement(profile.id, postId)

    if (error) {
      showToast(error.message || 'Failed to send support', 'error')
    } else {
      showToast('Support sent! 💜', 'success')
      // Reload posts to update counts
      loadPosts()
    }
    setSendingSupport(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Mood Wall
          </h1>
          <p className="text-center text-gray-600 mb-8">
            See how others are feeling and send support
          </p>

          {/* Filters */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {MOOD_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg p-8">
              <div className="text-6xl mb-4">🌱</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Be the first to share today
              </h2>
              <p className="text-gray-600">
                Your mood check-in can help others feel less alone
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{post.emoji}</div>
                    <div className="text-xs text-gray-500">{post.timeAgo}</div>
                  </div>

                  <div className="mb-4">
                    <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mb-3">
                      <span>Intensity: {post.mood_value}/10</span>
                    </div>
                    {post.message_optional && (
                      <p className="text-gray-700 mt-2">{post.message_optional}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSendSupport(post.id)}
                    disabled={sendingSupport === post.id || !profile}
                    className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>💝</span>
                    <span>
                      {sendingSupport === post.id
                        ? 'Sending...'
                        : `Send Support (${post.encouragement_count || 0})`}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
