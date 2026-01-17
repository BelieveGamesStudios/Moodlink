import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
  const { user, profile, isGuest, loading, signInAsGuest, signOut } = useAuth()
  const navigate = useNavigate()

  const handleGuestMode = async () => {
    const { error } = await signInAsGuest()
    if (!error) {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-purple-600 mb-4">
              Moodlink
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your daily mood check-in and support app
            </p>
          </div>

          {/* Auth Status */}
          {user || isGuest ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Welcome{profile?.username_optional ? `, ${profile.username_optional}` : ''}!
                  </h2>
                  <p className="text-gray-600">
                    {isGuest ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                        Guest Mode
                      </span>
                    ) : (
                      <span className="text-gray-500">{user?.email}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {isGuest && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You're using guest mode. <Link to="/signup" className="font-medium underline">Sign up</Link> to save your mood history and access all features.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-purple-50 rounded-xl">
                  <div className="text-3xl mb-2">🌈</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Mood Check-in</h3>
                  <p className="text-sm text-gray-600">Track your daily mood</p>
                </div>
                <div className="p-6 bg-pink-50 rounded-xl">
                  <div className="text-3xl mb-2">🧱</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Mood Wall</h3>
                  <p className="text-sm text-gray-600">See how others are feeling</p>
                </div>
                <div className="p-6 bg-indigo-50 rounded-xl">
                  <div className="text-3xl mb-2">💝</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Support</h3>
                  <p className="text-sm text-gray-600">Get encouragement</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Get Started
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in to track your mood, or continue as a guest to explore
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                >
                  Sign Up
                </Link>
                <button
                  onClick={handleGuestMode}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">🌈 Daily Check-ins</h3>
              <p className="text-gray-600">
                Track your mood daily with emoji or slider. See your mood patterns over time.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">🧱 Anonymous Mood Wall</h3>
              <p className="text-gray-600">
                Share your mood anonymously and see how others are feeling. You're not alone.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">🤖 AI Support</h3>
              <p className="text-gray-600">
                Get personalized supportive messages and tips based on your mood.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">💝 Peer Encouragement</h3>
              <p className="text-gray-600">
                Send and receive encouragement from others. No chat needed, just support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
