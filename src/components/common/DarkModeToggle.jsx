import { useState, useEffect } from 'react'
import { applyTheme, initializeTheme } from '../../config/theme'

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 초기 테마 설정 (CSS Variables 적용)
    const dark = initializeTheme()
    setIsDark(dark)
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

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-4 right-4 p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDark ? (
        // 라이트 모드 아이콘 (해)
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // 다크 모드 아이콘 (달)
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}

export default DarkModeToggle
