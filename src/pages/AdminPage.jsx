import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin'
import { getPendingApprovals, getApprovedUsers, approveUser, rejectUser, signOut } from '../services/auth'
import DarkModeToggle from '../components/common/DarkModeToggle'
import logoLight from '../assets/images/memoeat_logo_dark.svg'
import logoDark from '../assets/images/memoeat_logo_amber_bg_white_text.svg'
import { showErrorToast, showSuccessToast } from '../lib/toast.jsx'

function AdminPage() {
  const navigate = useNavigate()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'approved'
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showErrorToast('관리자만 접근 가능합니다.')
      navigate('/dashboard')
    }
  }, [isAdmin, adminLoading, navigate])

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const [pending, approved] = await Promise.all([
        getPendingApprovals(),
        getApprovedUsers()
      ])

      if (pending.error) throw new Error(pending.error)
      if (approved.error) throw new Error(approved.error)

      setPendingUsers(pending.users)
      setApprovedUsers(approved.users)
    } catch (err) {
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    if (!confirm('이 사용자를 승인하시겠습니까?')) return

    const { success, error } = await approveUser(userId)

    if (success) {
      showSuccessToast('사용자가 승인되었습니다.')
      loadUsers() // 목록 새로고침
    } else {
      showErrorToast(`승인 실패: ${error}`)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('이 사용자를 거절하시겠습니까? 승인 요청이 삭제됩니다.')) return

    const { success, error } = await rejectUser(userId)

    if (success) {
      showSuccessToast('사용자가 거절되었습니다.')
      loadUsers() // 목록 새로고침
    } else {
      showErrorToast(`거절 실패: ${error}`)
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/')
    }
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-gray-700 dark:text-[#cccccc]">로딩 중...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1e1e1e]">
      <DarkModeToggle />

      {/* 헤더 */}
      <header className="bg-white dark:bg-[#252526] shadow-md border-b border-gray-200 dark:border-[#3e3e42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src={logoLight} alt="MemoEat Logo" className="h-10 dark:hidden" />
            <img src={logoDark} alt="MemoEat Logo" className="h-10 hidden dark:block" />
          </Link>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-[#9d9d9d]">관리자 페이지</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-[#cccccc] mb-6">사용자 승인 관리</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* 탭 */}
        <div className="mb-6 flex space-x-2 border-b border-gray-300 dark:border-[#3e3e42]">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-blue-600 dark:text-[#569cd6] border-b-2 border-blue-600 dark:border-[#569cd6]'
                : 'text-gray-600 dark:text-[#9d9d9d] hover:text-gray-800 dark:hover:text-[#cccccc]'
            }`}
          >
            승인 대기 ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'approved'
                ? 'text-blue-600 dark:text-[#569cd6] border-b-2 border-blue-600 dark:border-[#569cd6]'
                : 'text-gray-600 dark:text-[#9d9d9d] hover:text-gray-800 dark:hover:text-[#cccccc]'
            }`}
          >
            승인 완료 ({approvedUsers.length})
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12 text-gray-600 dark:text-[#9d9d9d]">
            사용자 목록을 불러오는 중...
          </div>
        )}

        {/* 승인 대기 탭 */}
        {!loading && activeTab === 'pending' && (
          <div className="bg-white dark:bg-[#252526] rounded-xl shadow-lg border border-gray-200 dark:border-[#3e3e42] overflow-hidden">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-[#9d9d9d]">
                승인 대기 중인 사용자가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#3e3e42]">
                  <thead className="bg-gray-50 dark:bg-[#2d2d30]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        요청 시간
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#252526] divide-y divide-gray-200 dark:divide-[#3e3e42]">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[#cccccc]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[#9d9d9d]">
                          {new Date(user.requested_at).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
                          <button
                            onClick={() => handleApprove(user.user_id)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(user.user_id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            거절
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 승인 완료 탭 */}
        {!loading && activeTab === 'approved' && (
          <div className="bg-white dark:bg-[#252526] rounded-xl shadow-lg border border-gray-200 dark:border-[#3e3e42] overflow-hidden">
            {approvedUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-[#9d9d9d]">
                승인된 사용자가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#3e3e42]">
                  <thead className="bg-gray-50 dark:bg-[#2d2d30]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        승인 시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#9d9d9d] uppercase tracking-wider">
                        요청 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#252526] divide-y divide-gray-200 dark:divide-[#3e3e42]">
                    {approvedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[#cccccc]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[#9d9d9d]">
                          {user.approved_at ? new Date(user.approved_at).toLocaleString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[#9d9d9d]">
                          {new Date(user.requested_at).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPage
