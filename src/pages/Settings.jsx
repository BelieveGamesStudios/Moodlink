import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { deleteUserProfile } from '../lib/auth'

export default function Settings() {
  const { user, profile, isGuest, signOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteProfile = async () => {
    if (confirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    setDeleteLoading(true)
    
    try {
      const { error } = await deleteUserProfile(profile.id, user?.id)
      
      if (error) {
        showToast('Failed to delete profile. Please try again.', 'error')
        setDeleteLoading(false)
        return
      }

      showToast('Profile deleted successfully', 'success')
      
      // Sign out and redirect
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error deleting profile:', error)
      showToast('An error occurred. Please try again.', 'error')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Settings</h1>

          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="text-gray-800">
                  {profile?.username_optional || 'Not set'}
                </div>
              </div>

              {user && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="text-gray-800">
                    {user.email}
                  </div>
                </div>
              )}

              {isGuest && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You're using guest mode. <Link to="/signup" className="font-medium underline">Sign up</Link> to create a permanent account and save your data.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <div className="text-gray-800">
                  {isGuest ? 'Guest Account' : 'Registered Account'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="text-gray-800">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {!isGuest && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-100">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">Danger Zone</h2>
              
              {!showDeleteConfirm ? (
                <div>
                  <p className="text-gray-700 mb-4">
                    Once you delete your account, there is no going back. This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                    <li>Your profile and account information</li>
                    <li>All your mood check-ins</li>
                    <li>All your mood wall posts</li>
                    <li>All encouragements you've sent</li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold mb-2">
                      ⚠️ This action cannot be undone
                    </p>
                    <p className="text-red-700 text-sm">
                      Are you absolutely sure you want to delete your account? This will permanently remove all your data.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE here"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleDeleteProfile}
                      disabled={deleteLoading || confirmText !== 'DELETE'}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setConfirmText('')
                      }}
                      disabled={deleteLoading}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest Account Notice */}
          {isGuest && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Management</h2>
              <p className="text-gray-700 mb-4">
                As a guest user, your data is stored locally. To permanently delete your guest account, simply clear your browser's localStorage or sign out.
              </p>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Clear Guest Data
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
