import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../services/auth'
import DarkModeToggle from '../components/common/DarkModeToggle'
import logoLight from '../assets/images/memoeat_logo_light_border.svg'
import logoDark from '../assets/images/memoeat_logo_dark.svg'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDark, setIsDark] = useState(false)

  // 다크모드 초기 상태 설정 및 변경 감지
  useEffect(() => {
    const dark = localStorage.getItem('darkMode') === 'true'
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    }

    // 다크모드 변경 이벤트 리스너
    const handleDarkModeChange = () => {
      const newDark = localStorage.getItem('darkMode') === 'true'
      setIsDark(newDark)
    }

    window.addEventListener('darkModeChange', handleDarkModeChange)
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user, session, isApproved, error: signInError } = await signIn(
        formData.email,
        formData.password,
        formData.rememberMe
      )

      if (signInError) {
        setError(signInError)
        return
      }

      if (isApproved) {
        // 승인된 사용자는 대시보드로 이동
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark
        ? 'bg-[#1e1e1e]'
        : 'bg-white'
    }`}>
      <DarkModeToggle />

      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-4">
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

        {/* 로그인 폼 */}
        <div className={`rounded-2xl shadow-xl p-8 ${
          isDark ? 'bg-[#252526] border border-[#3e3e42]' : 'bg-white border border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 ${
            isDark ? 'text-[#cccccc]' : 'text-gray-900'
          }`}>
            로그인
          </h2>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              isDark
                ? 'bg-red-900/30 border border-red-700 text-red-400'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="mb-4">
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-[#cccccc]' : 'text-gray-700'
              }`}>
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${
                  isDark
                    ? 'border-[#3e3e42] bg-[#1e1e1e] text-[#cccccc] focus:ring-white'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-gray-900'
                }`}
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-[#cccccc]' : 'text-gray-700'
              }`}>
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${
                  isDark
                    ? 'border-[#3e3e42] bg-[#1e1e1e] text-[#cccccc] focus:ring-white'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-gray-900'
                }`}
                placeholder="••••••••"
              />
            </div>

            {/* 로그인 상태 유지 */}
            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className={`w-4 h-4 rounded focus:ring-2 ${
                  isDark
                    ? 'text-white bg-[#1e1e1e] border-[#3e3e42] focus:ring-white'
                    : 'text-gray-900 bg-gray-100 border-gray-300 focus:ring-gray-900'
                }`}
              />
              <label htmlFor="rememberMe" className={`ml-2 text-sm ${
                isDark ? 'text-[#cccccc]' : 'text-gray-700'
              }`}>
                로그인 상태 유지
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white hover:bg-gray-100 text-gray-900'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className={`mt-6 text-center text-sm ${
            isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
          }`}>
            계정이 없으신가요?{' '}
            <Link
              to="/signup"
              className={`font-medium ${
                isDark
                  ? 'text-white hover:text-gray-300'
                  : 'text-gray-900 hover:text-gray-700'
              }`}
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
