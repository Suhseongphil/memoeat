import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { initializeTheme } from '../../config/theme'

function ProtectedRoute({ children }) {
  const { user, isApproved, loading, fetchUser } = useAuthStore()

  useEffect(() => {
    // 초기 테마 적용 (빠른 적용을 위해)
    initializeTheme()

    // 사용자 정보 로드 (테마 포함)
    // fetchUser는 Zustand 액션이므로 안정적이며, 초기 마운트 시에만 호출
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 로딩 중
  if (loading) {
    // 테마를 고려한 로딩 화면 (Tailwind dark 모드 사용)
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 dark:border-[#569cd6] border-t-transparent"></div>
          <p className="mt-4 text-gray-700 dark:text-[#cccccc]">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않음
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 승인되지 않음
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
