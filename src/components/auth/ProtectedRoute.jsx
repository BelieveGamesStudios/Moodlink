import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children, requireAuth = false }) {
  const { user, profile, loading, isGuest } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If route requires authentication and user is not authenticated (not even guest)
  if (requireAuth && !user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  // If route requires authenticated user (not guest) and user is guest
  if (requireAuth && !user && isGuest) {
    return <Navigate to="/login" replace />
  }

  return children
}
