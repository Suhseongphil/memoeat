import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/auth'
import { applyTheme, initializeTheme } from '../config/theme'
import DarkModeToggle from '../components/common/DarkModeToggle'
import logoLight from '../assets/images/memoeat_logo_amber_bg_white_text.svg'
import logoDark from '../assets/images/memoeat_logo_dark.svg'

function SignUpPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDark, setIsDark] = useState(false)

  // 초기 테마 설정 (CSS Variables 적용)
  useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const { user, isAdmin, needsApproval, error: signUpError } = await signUp(
        formData.email,
        formData.password
      )

      if (signUpError) {
        setError(signUpError)
        return
      }

      if (isAdmin) {
        // 관리자는 자동 승인되어 바로 로그인 페이지로 이동
        alert('회원가입이 완료되었습니다. 로그인해주세요.')
        navigate('/login')
      } else if (needsApproval) {
        // 일반 사용자는 승인 대기 메시지 표시
        alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.')
        navigate('/login')
      }
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark
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

        {/* 회원가입 폼 */}
        <div className={`rounded-2xl shadow-xl p-8 ${isDark ? 'bg-[#252526] border border-[#3e3e42]' : 'bg-white border border-gray-200'
          }`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-[#cccccc]' : 'text-gray-900'
            }`}>
            회원가입
          </h2>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isDark
                ? 'bg-red-900/30 border border-red-700 text-red-400'
                : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="mb-4">
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#cccccc]' : 'text-gray-700'
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
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${isDark
                    ? 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                    : 'border-gray-300 bg-white text-gray-900'
                  } focus:ring-[var(--color-primary)]`}
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#cccccc]' : 'text-gray-700'
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
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${isDark
                    ? 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                    : 'border-gray-300 bg-white text-gray-900'
                  } focus:ring-[var(--color-primary)]`}
                placeholder="최소 6자 이상"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#cccccc]' : 'text-gray-700'
                }`}>
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${isDark
                    ? 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                    : 'border-gray-300 bg-white text-gray-900'
                  } focus:ring-[var(--color-primary)]`}
                placeholder="비밀번호 재입력"
              />
            </div>

            {/* 안내 메시지 */}
            <div className={`mb-6 p-3 rounded-lg ${isDark
                ? 'bg-yellow-900/20 border border-yellow-800'
                : 'bg-yellow-50 border border-yellow-200'
              }`}>
              <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                <strong>안내:</strong> 회원가입 후 관리자 승인이 필요합니다. 승인 후 로그인이 가능합니다.
              </p>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className={`mt-6 text-center text-sm ${isDark ? 'text-[#9d9d9d]' : 'text-gray-600'
            }`}>
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
