import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/auth'
import DarkModeToggle from '../components/common/DarkModeToggle'
import logoLight from '../assets/images/memoeat_logo_notepad.svg'
import logoDark from '../assets/images/memoeat_logo_notepad_dark_v2.svg'

function SignUpPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <DarkModeToggle />

      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-4">
          <Link to="/" className="block">
            <img
              src={logoLight}
              alt="MemoEat Logo"
              className="w-full h-auto dark:hidden cursor-pointer"
            />
            <img
              src={logoDark}
              alt="MemoEat Logo"
              className="w-full h-auto hidden dark:block cursor-pointer"
            />
          </Link>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            회원가입
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
                placeholder="최소 6자 이상"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                placeholder="비밀번호 재입력"
              />
            </div>

            {/* 안내 메시지 */}
            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>안내:</strong> 회원가입 후 관리자 승인이 필요합니다. 승인 후 로그인이 가능합니다.
              </p>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="text-orange-600 dark:text-indigo-400 hover:text-orange-700 dark:hover:text-indigo-300 font-medium"
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
