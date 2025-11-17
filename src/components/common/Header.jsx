import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'
import { useAuthStore } from '../../stores/authStore'
import logoLight from '../../assets/images/memoeat_logo_amber_bg_white_text.svg'
import logoDark from '../../assets/images/memoeat_logo_dark.svg'
import { showErrorToast, showSuccessToast } from '../../lib/toast.jsx'

function Header({ onMenuToggle, showMenuButton = true, isSidebarOpen = true }) {
  const navigate = useNavigate()
  const { user, preferences, updatePreferences } = useAuthStore()
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const isAdmin = user?.email === adminEmail

  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  // 외부 클릭 시 설정 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false)
      }
    }

    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [settingsOpen])

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        showErrorToast('로그아웃 중 오류가 발생했습니다.')
        return
      }

      // Zustand store 초기화
      const { clearUser } = useAuthStore.getState()
      clearUser()

      // 메인 화면으로 리다이렉트
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
      showErrorToast('로그아웃 중 오류가 발생했습니다.')
    }
  }

  const handleThemeToggle = async () => {
    try {
      const newTheme = preferences?.theme === 'dark' ? 'light' : 'dark'
      await updatePreferences({ theme: newTheme })
      showSuccessToast(`테마가 ${newTheme === 'dark' ? '다크 모드' : '라이트 모드'}로 변경되었습니다.`)
    } catch (error) {
      showErrorToast(`테마 변경 실패: ${error.message}`)
    }
  }

  const handleSidebarPositionToggle = async () => {
    try {
      const newPosition = preferences?.sidebarPosition === 'right' ? 'left' : 'right'
      await updatePreferences({ sidebarPosition: newPosition })
      showSuccessToast(`사이드바가 ${newPosition === 'right' ? '오른쪽' : '왼쪽'}으로 이동했어요.`)
    } catch (error) {
      showErrorToast(`사이드바 위치 변경 실패: ${error.message}`)
    }
  }

  return (
    <header className="bg-white dark:bg-[#252526] shadow-md border-b border-gray-200 dark:border-[#3e3e42]">
      <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
        {/* 왼쪽: 모바일 메뉴 버튼 + 로고 */}
        <div className="flex items-center space-x-4">
          {/* 모바일 사이드바 토글 버튼 */}
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="사이드바 토글"
            >
              <svg
                className="w-6 h-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* 로고 */}
          <Link to="/dashboard" className="flex items-center">
            <img src={logoLight} alt="MemoEat" className="h-8 dark:hidden" />
            <img src={logoDark} alt="MemoEat" className="h-8 hidden dark:block" />
          </Link>
        </div>

        {/* 오른쪽: 관리자 버튼 + 설정 버튼 + 로그아웃 */}
        <div className="flex items-center space-x-2">
          {/* 관리자 페이지 버튼 (관리자만 표시) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center px-3 py-2 text-sm font-medium text-amber-600 dark:text-[#569cd6] hover:bg-amber-50 dark:hover:bg-[#2d2d30] rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              관리자
            </Link>
          )}

          {/* 사용자 정보 */}
          <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-400">
            {user?.email}
          </div>

          {/* 설정 버튼 */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="설정"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline ml-1">설정</span>
            </button>

            {/* 설정 드롭다운 */}
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2d2d30] rounded-lg shadow-lg border border-gray-200 dark:border-[#3e3e42] py-2 z-[100]">
                {/* 다크모드 토글 */}
                <button
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3e3e42] transition-colors"
                >
                  <span className="flex items-center">
                    {preferences?.theme === 'dark' ? (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {preferences?.theme === 'dark' ? '다크모드' : '라이트모드'}
                  </span>
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences?.theme === 'dark' ? 'bg-[#569cd6]' : 'bg-amber-500'
                  }`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      preferences?.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                {/* 사이드바 위치 토글 */}
                <button
                  onClick={handleSidebarPositionToggle}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#3e3e42] transition-colors"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    사이드바 {preferences?.sidebarPosition === 'right' ? '오른쪽' : '왼쪽'}
                  </span>
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences?.sidebarPosition === 'right' ? 'bg-amber-500 dark:bg-[#569cd6]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      preferences?.sidebarPosition === 'right' ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                <div className="border-t border-gray-200 dark:border-[#3e3e42] my-2"></div>

                {/* 설정 안내 */}
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-[#9d9d9d]">
                  설정은 자동으로 저장되며 모든 기기에서 동기화됩니다.
                </div>
              </div>
            )}
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
