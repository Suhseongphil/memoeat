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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          {isDark ? '🌞 라이트 모드' : '🌙 다크 모드'}
        </button>

        {/* 로고 - CSS로 다크모드 전환 */}
        <div className="mb-8">
          <img
            src={logoLight}
            alt="MemoEat Logo"
            className="h-32 mx-auto dark:hidden"
          />
          <img
            src={logoDark}
            alt="MemoEat Logo"
            className="h-32 mx-auto hidden dark:block"
          />
        </div>

        <h1 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
          MemoEat
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          정보를 먹다, 지식을 소화하다
        </p>
        <div className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors cursor-pointer">
          Welcome to MemoEat
        </div>
      </div>
    </div>
  )
}

export default App
