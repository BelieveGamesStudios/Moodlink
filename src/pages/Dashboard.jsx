import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { getMoodCheckins, getCheckinStreak, hasCheckedInToday } from '../lib/moods'
import { format, subDays } from 'date-fns'

export default function Dashboard() {
  const [checkins, setCheckins] = useState([])
  const [streak, setStreak] = useState(0)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    setLoading(true)
    
    const [checkinsData, streakCount, todayStatus] = await Promise.all([
      getMoodCheckins(profile.id, 30),
      getCheckinStreak(profile.id),
      hasCheckedInToday(profile.id),
    ])

    if (checkinsData.data) {
      setCheckins(checkinsData.data)
      setTotalCheckins(checkinsData.data.length)
    }
    setStreak(streakCount)
    setCheckedInToday(todayStatus)
    setLoading(false)
  }

  // Prepare data for chart (last 7 days)
  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'MMM d'),
        dateKey: format(date, 'yyyy-MM-dd'),
        value: null,
      }
    })

    checkins.forEach((checkin) => {
      const checkinDate = format(new Date(checkin.timestamp), 'yyyy-MM-dd')
      const dayData = last7Days.find((d) => d.dateKey === checkinDate)
      if (dayData) {
        dayData.value = checkin.mood_value
      }
    })

    return last7Days
  }

  const chartData = getChartData()
  const maxValue = 10

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">My Dashboard</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">{streak}</div>
                  <div className="text-gray-600">Day Streak</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">{totalCheckins}</div>
                  <div className="text-gray-600">Total Check-ins</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-3xl mb-2">{checkedInToday ? '✅' : '⏰'}</div>
                  <div className="text-xl font-bold text-gray-800 mb-1">
                    {checkedInToday ? 'Checked In Today' : 'Not Checked In'}
                  </div>
                  {!checkedInToday && (
                    <button
                      onClick={() => navigate('/checkin')}
                      className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Check in now →
                    </button>
                  )}
                </div>
              </div>

              {/* Check In Button */}
              {!checkedInToday && (
                <div className="mb-8 text-center">
                  <button
                    onClick={() => navigate('/checkin')}
                    className="px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Check In Now
                  </button>
                </div>
              )}

              {/* Mood History Chart */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mood History (Last 7 Days)</h2>
                {chartData.some((d) => d.value !== null) ? (
                  <div className="space-y-4">
                    {chartData.map((day) => (
                      <div key={day.dateKey} className="flex items-center space-x-4">
                        <div className="w-20 text-sm text-gray-600">{day.date}</div>
                        <div className="flex-1 relative h-8 bg-gray-100 rounded-full overflow-hidden">
                          {day.value !== null ? (
                            <>
                              <div
                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-end pr-2 transition-all"
                                style={{ width: `${(day.value / maxValue) * 100}%` }}
                              >
                                <span className="text-xs font-semibold text-white">
                                  {day.value}/10
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-xs text-gray-400">No data</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No check-ins in the last 7 days</p>
                    <button
                      onClick={() => navigate('/checkin')}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Start tracking your mood →
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Check-ins */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recent Check-ins</h2>
                {checkins.length > 0 ? (
                  <div className="space-y-4">
                    {checkins.slice(0, 10).map((checkin) => (
                      <div
                        key={checkin.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{checkin.emoji}</div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {format(new Date(checkin.timestamp), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(checkin.timestamp), 'h:mm a')}
                            </div>
                            {checkin.notes && (
                              <div className="text-sm text-gray-600 mt-1">{checkin.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                            <span>{checkin.mood_value}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No check-ins yet</p>
                    <button
                      onClick={() => navigate('/checkin')}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Start your first check-in →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
