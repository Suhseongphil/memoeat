import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applyTheme, initializeTheme } from './config/theme'
import logoLight from './assets/images/memoeat_logo_light_border.svg'
import logoDark from './assets/images/memoeat_logo_dark.svg'

function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 초기 테마 설정 (CSS Variables 적용)
    const dark = initializeTheme()
    setIsDark(dark)

    // 다크모드 변경 이벤트 리스너
    const handleDarkModeChange = () => {
      const newDark = localStorage.getItem('darkMode') === 'true'
      setIsDark(newDark)
      applyTheme(newDark)
    }

    window.addEventListener('darkModeChange', handleDarkModeChange)
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange)
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)

    // CSS Variables 테마 적용
    applyTheme(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // 다른 컴포넌트에 변경사항 알림
    window.dispatchEvent(new Event('darkModeChange'))
  }

  const handleLoginClick = () => {
    window.location.href = '/login'
  }

  const handleSignUpClick = () => {
    window.location.href = '/signup'
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark
        ? 'bg-[#1e1e1e]'
        : 'bg-white'
    }`}>
      <div className="text-center max-w-2xl">
        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleDarkMode}
          className={`fixed top-4 right-4 p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-50 ${
            isDark
              ? 'bg-[#252526] text-[#cccccc]'
              : 'bg-gray-100 text-gray-800'
          }`}
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
          <Link to="/" className="block">
            <img
              src={logoLight}
              alt="MemoEat Logo"
              className={`w-full h-auto cursor-pointer ${isDark ? 'hidden' : 'block'}`}
            />
            <img
              src={logoDark}
              alt="MemoEat Logo"
              className={`w-full h-auto cursor-pointer ${isDark ? 'block' : 'hidden'}`}
            />
          </Link>
        </div>

        {/* 설명 */}
        <p className={`text-xl md:text-2xl mb-4 ${
          isDark ? 'text-[#cccccc]' : 'text-gray-900'
        }`}>
          정보를 먹다, 지식을 소화하다
        </p>
        <p className={`text-base md:text-lg mb-12 px-4 ${
          isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
        }`}>
          빠르고 간편한 메모 작성, 그리고 AI 링크 요약까지
        </p>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleLoginClick}
            className="w-full sm:w-auto px-8 py-3 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
          >
            로그인
          </button>
          <button
            onClick={handleSignUpClick}
            className={`w-full sm:w-auto px-8 py-3 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all border-2 ${
              isDark
                ? 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                : 'bg-white hover:bg-gray-50'
            } text-[var(--color-primary)] border-[var(--color-primary)]`}
          >
            회원가입
          </button>
        </div>

        {/* 기능 소개 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className={`p-6 rounded-xl shadow-md ${
            isDark ? 'bg-[#252526] border border-[#3e3e42]' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-3xl mb-3">🔗</div>
            <h3 className={`font-bold mb-2 ${
              isDark ? 'text-[#cccccc]' : 'text-gray-900'
            }`}>AI 링크 요약</h3>
            <p className={`text-sm ${
              isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
            }`}>
              웹페이지와 유튜브 영상을 AI가 자동으로 요약
            </p>
          </div>
          <div className={`p-6 rounded-xl shadow-md ${
            isDark ? 'bg-[#252526] border border-[#3e3e42]' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-3xl mb-3">📁</div>
            <h3 className={`font-bold mb-2 ${
              isDark ? 'text-[#cccccc]' : 'text-gray-900'
            }`}>폴더 관리</h3>
            <p className={`text-sm ${
              isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
            }`}>
              Windows 탐색기 스타일의 직관적인 폴더 구조
            </p>
          </div>
          <div className={`p-6 rounded-xl shadow-md ${
            isDark ? 'bg-[#252526] border border-[#3e3e42]' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-3xl mb-3">⚡</div>
            <h3 className={`font-bold mb-2 ${
              isDark ? 'text-[#cccccc]' : 'text-gray-900'
            }`}>자동 저장</h3>
            <p className={`text-sm ${
              isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
            }`}>
              별도의 저장 버튼 없이 실시간 자동 저장
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
