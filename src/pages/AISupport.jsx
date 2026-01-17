import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { getAISupportMessage } from '../lib/ai'

export default function AISupport() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const moodData = location.state || {
    moodEmoji: '😊',
    moodValue: 5,
    moodLabel: 'Happy',
  }

  useEffect(() => {
    loadMessage()
  }, [])

  const loadMessage = async () => {
    setLoading(true)
    const { message: supportMessage, error } = await getAISupportMessage(
      moodData.moodValue,
      moodData.moodEmoji
    )

    if (error) {
      showToast('Failed to load support message', 'error')
    } else {
      setMessage(supportMessage)
    }
    setLoading(false)
  }

  const handleGenerateAnother = async () => {
    setGenerating(true)
    const { message: newMessage, error } = await getAISupportMessage(
      moodData.moodValue,
      moodData.moodEmoji
    )

    if (error) {
      showToast('Failed to generate new message', 'error')
    } else {
      setMessage(newMessage)
      showToast('New message generated', 'success')
    }
    setGenerating(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Mood Display */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{moodData.moodEmoji}</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {moodData.moodLabel}
            </h2>
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
              <span className="font-medium">Intensity: {moodData.moodValue}/10</span>
            </div>
          </div>

          {/* Support Message */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your support message...</p>
            </div>
          ) : (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 border border-purple-100">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGenerateAnother}
              disabled={generating || loading}
              className="flex-1 py-3 px-6 bg-white border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Another Message'}
            </button>
            <button
              onClick={() => navigate('/moodwall')}
              className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-all transform hover:scale-105"
            >
              Continue to Mood Wall
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              View My Dashboard →
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
