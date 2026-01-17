import { Link, useNavigate } from 'react-router-dom'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function Landing() {
  const { signInAsGuest } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleGuestMode = async () => {
    try {
      const { profile, error } = await signInAsGuest()
      
      if (error) {
        console.error('Guest sign in error:', error)
        showToast('Failed to continue as guest. Please try again.', 'error')
        return
      }
      
      if (profile) {
        showToast('Welcome! You can now check in with your mood.', 'success')
        // Navigate to check-in page or dashboard
        navigate('/checkin')
      }
    } catch (error) {
      console.error('Error in handleGuestMode:', error)
      showToast('Something went wrong. Please try again.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-6xl md:text-8xl mb-4 inline-block">🌈</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Check in with your mood.
              <br />
              <span className="text-purple-600">Find support.</span>
              <br />
              Connect with others.
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              A safe, supportive space for emotional wellness. Track your daily mood, 
              receive personalized encouragement, and connect with a community that understands.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started
              </Link>
              <button
                onClick={handleGuestMode}
                className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-full font-semibold text-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              How Moodlink Helps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">🌈</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Daily Check-Ins</h3>
                <p className="text-gray-600">
                  Track your mood daily with emoji and intensity. See patterns over time and understand your emotional journey.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Support</h3>
                <p className="text-gray-600">
                  Receive personalized, warm messages and coping strategies based on how you're feeling. Always here when you need it.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">💝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Community Support</h3>
                <p className="text-gray-600">
                  Connect anonymously with others who understand. Send and receive encouragement in a safe, judgment-free space.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join a community that cares about emotional wellness. No judgment, just support.
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
