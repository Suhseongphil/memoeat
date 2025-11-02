import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../services/auth'
import DarkModeToggle from '../components/common/DarkModeToggle'
import logoLight from '../assets/images/memoeat_logo_notepad.svg'
import logoDark from '../assets/images/memoeat_logo_notepad_dark_v2.svg'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        // 승인된 사용자는 메인 페이지로 이동 (추후 대시보드로 변경)
        alert('로그인 성공!')
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <DarkModeToggle />

      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
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
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            정보를 먹다, 지식을 소화하다
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            로그인
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 이메일 */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
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
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                로그인 상태 유지
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{' '}
            <Link
              to="/signup"
              className="text-orange-600 dark:text-indigo-400 hover:text-orange-700 dark:hover:text-indigo-300 font-medium"
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
