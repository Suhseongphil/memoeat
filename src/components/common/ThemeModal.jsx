import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { THEME_LIST } from '../../config/themes'
import { showErrorToast, showSuccessToast } from '../../lib/toast.jsx'

function ThemeModal({ isOpen, onClose }) {
  const { preferences, updatePreferences } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleThemeSelect = async (themeId) => {
    setIsLoading(true)
    try {
      await updatePreferences({ theme: themeId })
      const selectedTheme = THEME_LIST.find(theme => theme.id === themeId)
      showSuccessToast(`${selectedTheme?.name || '테마'}로 변경되었어요.`)
      // 테마 변경 후 약간의 지연을 주고 모달 닫기
      setTimeout(() => {
        onClose()
      }, 300)
    } catch (error) {
      showErrorToast(`테마 변경 실패: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            테마 선택
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 gap-4">
          {THEME_LIST.map((theme) => {
            const isSelected = preferences.theme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={isLoading}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Theme Info */}
                <div className="flex items-center gap-4">
                  {/* Color Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600">
                      <div
                        className="w-full h-1/2"
                        style={{ backgroundColor: theme.preview.background }}
                      />
                      <div
                        className="w-full h-1/2 flex items-center justify-center gap-1"
                        style={{ backgroundColor: theme.preview.background }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.preview.text }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {theme.name}
                      </h3>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            테마는 자동으로 저장되며 모든 기기에서 동기화됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ThemeModal
