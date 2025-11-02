import { useState, useEffect } from 'react'
import logoLight from './assets/images/memoeat_logo_notepad.svg'
import logoDark from './assets/images/memoeat_logo_notepad_dark_v2.svg'

function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 다크모드 초기 상태 설정
    const dark = localStorage.getItem('darkMode') === 'true'
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLoginClick = () => {
    window.location.href = '/login'
  }

  const handleSignUpClick = () => {
    window.location.href = '/signup'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* 로고 */}
        <div className="mb-8 max-w-md mx-auto">
          <img
            src={logoLight}
            alt="MemoEat Logo"
            className="w-full h-auto dark:hidden"
          />
          <img
            src={logoDark}
            alt="MemoEat Logo"
            className="w-full h-auto hidden dark:block"
          />
        </div>

        {/* 설명 */}
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
          정보를 먹다, 지식을 소화하다
        </p>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-12 px-4">
          빠르고 간편한 메모 작성, 그리고 AI 링크 요약까지
        </p>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleLoginClick}
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            로그인
          </button>
          <button
            onClick={handleSignUpClick}
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-orange-600 dark:text-indigo-400 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-orange-500 dark:border-indigo-500"
          >
            회원가입
          </button>
        </div>

        {/* 기능 소개 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">AI 링크 요약</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              웹페이지와 유튜브 영상을 AI가 자동으로 요약
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">폴더 관리</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Windows 탐색기 스타일의 직관적인 폴더 구조
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">자동 저장</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              별도의 저장 버튼 없이 실시간 자동 저장
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
