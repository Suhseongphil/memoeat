import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut } from '../services/auth'
import DarkModeToggle from '../components/common/DarkModeToggle'
import { showErrorToast, showSuccessToast } from '../lib/toast.jsx'

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { user: currentUser, isApproved, error } = await getCurrentUser()

    if (error || !currentUser || !isApproved) {
      showErrorToast('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    setUser(currentUser)
    setLoading(false)
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      showErrorToast('로그아웃 중 오류가 발생했습니다.')
      return
    }
    showSuccessToast('로그아웃 되었습니다.')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DarkModeToggle />

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            대시보드
          </h1>

          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300">
              <strong>환영합니다!</strong> 로그인에 성공했습니다.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
              사용자 정보
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p><strong>이메일:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>가입일:</strong> {new Date(user?.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>안내:</strong> 이 페이지는 인증 테스트를 위한 임시 대시보드입니다.
              실제 메모 기능은 Phase 2에서 구현될 예정입니다.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
