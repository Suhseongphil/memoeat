import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import ThemeModal from './ThemeModal'
import { getThemeById } from '../../config/themes'

function SettingsModal({ isOpen, onClose }) {
  const { preferences, updatePreferences } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)

  if (!isOpen) return null

  const currentTheme = getThemeById(preferences?.theme || 'default')

  const handleSidebarPositionToggle = async () => {
    setIsLoading(true)
    try {
      const newPosition = preferences.sidebarPosition === 'left' ? 'right' : 'left'
      await updatePreferences({ sidebarPosition: newPosition })
    } catch (error) {
      alert(`사이드바 위치 변경 실패: ${error.message}`)
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            설정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Options */}
        <div className="space-y-4">
          {/* Theme Selection */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                테마
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                현재 테마: {currentTheme.name}
              </p>
            </div>
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              테마 변경
            </button>
          </div>

          {/* Sidebar Position Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                사이드바 위치
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {preferences.sidebarPosition === 'left' ? '왼쪽에 표시 중' : '오른쪽에 표시 중'}
              </p>
            </div>
            <button
              onClick={handleSidebarPositionToggle}
              disabled={isLoading}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${preferences.sidebarPosition === 'right' ? 'bg-blue-600' : 'bg-gray-200'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.sidebarPosition === 'right' ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            설정은 자동으로 저장되며 모든 기기에서 동기화됩니다.
          </p>
        </div>
      </div>

      {/* Theme Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  )
}

export default SettingsModal
