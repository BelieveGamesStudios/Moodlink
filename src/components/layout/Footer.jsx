import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-purple-50 to-pink-50 border-t border-purple-100 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">About Moodlink</h3>
            <p className="text-sm text-gray-600 mb-4">
              A safe space for emotional wellness. Check in with your mood, find support, and connect with others.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/guidelines" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://www.crisistextline.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Crisis Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Crisis Help */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Need Immediate Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you're in crisis, please reach out to professionals who can help.
            </p>
            <a
              href="https://www.crisistextline.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Get Help Now
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-purple-200 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Moodlink. Made with 💜 for emotional wellness.</p>
        </div>
      </div>
    </footer>
  )
}
