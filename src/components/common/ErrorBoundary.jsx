import { Component } from 'react'

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치하고
 * 에러 UI를 표시하며 애플리케이션이 크래시되는 것을 방지합니다.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 서비스에 에러를 기록할 수 있습니다
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // 페이지 새로고침 옵션
    if (this.props.resetOnError) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI
      return (
        <div className="min-h-screen bg-white dark:bg-[#1e1e1e] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-[#252526] rounded-2xl shadow-xl border border-gray-200 dark:border-[#3e3e42] p-8">
            {/* 에러 아이콘 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg
                  className="w-10 h-10 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                오류가 발생했습니다
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </p>
            </div>

            {/* 에러 상세 정보 (개발 모드에서만) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                  <strong>에러:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-700 dark:text-red-400 cursor-pointer">
                      스택 트레이스 보기
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 dark:bg-[#569cd6] dark:hover:bg-[#4a8cc5] text-white font-medium rounded-lg transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                홈으로 이동
              </button>
            </div>

            {/* 도움말 */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>문제가 계속되나요?</strong>
              </p>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 페이지를 새로고침 해보세요 (Ctrl+R)</li>
                <li>• 브라우저 캐시를 삭제해보세요</li>
                <li>• 다른 브라우저를 사용해보세요</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
