import { useState } from 'react'
import axios from 'axios'

/**
 * 링크 요약 모달 컴포넌트
 * 웹페이지 또는 유튜브 링크를 입력받아 AI로 요약합니다.
 */
function LinkModal({ isOpen, onClose, onSummarize }) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [linkType, setLinkType] = useState(null)

  // 링크 타입 감지
  const detectLinkType = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url) ? 'youtube' : 'webpage'
  }

  // 요약 요청
  const handleSummarize = async () => {
    if (!url.trim()) {
      setError('URL을 입력해주세요')
      return
    }

    // URL 유효성 검사
    try {
      new URL(url)
    } catch (e) {
      setError('유효한 URL을 입력해주세요')
      return
    }

    setIsLoading(true)
    setError('')
    const detectedType = detectLinkType(url)
    setLinkType(detectedType)

    try {
      // Vercel Serverless Function 호출
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3000/api/summarize' // 개발 환경
        : '/api/summarize' // 프로덕션 환경

      const response = await axios.post(apiUrl, { url })

      const { summary, linkType: responseLinkType, originalUrl } = response.data

      // 부모 컴포넌트로 요약 결과 전달
      onSummarize({
        summary,
        linkType: responseLinkType,
        url: originalUrl
      })

      // 모달 닫기 및 상태 초기화
      setUrl('')
      setIsLoading(false)
      setError('')
      setLinkType(null)
      onClose()
    } catch (err) {
      console.error('요약 오류:', err)
      setIsLoading(false)

      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.message === 'Network Error') {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.')
      } else {
        setError('요약 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  // 엔터키 입력 시 요약
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSummarize()
    }
  }

  // 모달 닫기
  const handleClose = () => {
    if (isLoading) return // 로딩 중에는 닫기 불가
    setUrl('')
    setError('')
    setLinkType(null)
    onClose()
  }

  // ESC 키로 닫기
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔗 링크 요약
          </h2>
          {!isLoading && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 설명 */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          웹페이지 또는 유튜브 영상 URL을 입력하면 AI가 핵심 내용을 요약해드립니다.
        </p>

        {/* URL 입력 */}
        <div className="mb-4">
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            URL
          </label>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com 또는 https://youtube.com/watch?v=..."
            disabled={isLoading}
            className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-[#569cd6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {linkType === 'youtube' ? '유튜브 영상 분석 중...' : '웹페이지 분석 중...'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  AI가 내용을 요약하고 있습니다. 잠시만 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSummarize}
            disabled={isLoading || !url.trim()}
            className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 dark:bg-[#569cd6] dark:hover:bg-[#4a8cc5] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>요약 중...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>요약하기</span>
              </>
            )}
          </button>
        </div>

        {/* 지원하는 링크 타입 안내 */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            지원하는 링크 타입:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              YouTube
            </span>
            <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              웹페이지
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkModal
