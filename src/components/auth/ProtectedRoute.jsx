import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../../services/auth'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, isApproved: approved, error } = await getCurrentUser()

        if (error || !user) {
          setIsAuthenticated(false)
          setIsApproved(false)
        } else {
          setIsAuthenticated(true)
          setIsApproved(approved)
        }
      } catch (error) {
        console.error('인증 확인 오류:', error)
        setIsAuthenticated(false)
        setIsApproved(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 dark:border-[#569cd6] border-t-transparent"></div>
          <p className="mt-4 text-gray-700 dark:text-[#cccccc]">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e1e1e] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#252526] rounded-2xl shadow-xl border border-gray-200 dark:border-[#3e3e42] p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-[#cccccc] mb-4">
            승인 대기 중
          </h2>
          <p className="text-gray-600 dark:text-[#9d9d9d] mb-6">
            관리자의 승인이 필요합니다. 승인 후 다시 로그인해주세요.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 dark:bg-[#569cd6] dark:hover:bg-[#4a8cc5] text-white font-medium rounded-lg transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
