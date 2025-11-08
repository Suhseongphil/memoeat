import { useEffect } from 'react'

/**
 * 키보드 단축키 훅
 * @param {Object} shortcuts - 단축키 핸들러 객체
 * @param {Function} shortcuts.onNextTab - Tab: 다음 탭으로 이동
 * @param {Function} shortcuts.onPrevTab - Shift+Tab: 이전 탭으로 이동
 * @param {Function} shortcuts.onEscape - Esc: 모달 닫기
 * @param {boolean} enabled - 단축키 활성화 여부 (기본: true)
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      const shift = e.shiftKey
      const key = e.key.toLowerCase()

      // input/textarea에서는 Esc만 허용
      const isInputElement =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable

      // Esc: 모달 닫기 (input에서도 동작)
      if (key === 'escape' && shortcuts.onEscape) {
        shortcuts.onEscape()
        return
      }

      // 이하 단축키는 input/textarea에서 비활성화
      if (isInputElement) return

      // Tab: 탭 이동 (메모 탭이 있을 때만)
      if (key === 'tab' && (shortcuts.onNextTab || shortcuts.onPrevTab)) {
        // Shift+Tab: 이전 탭
        if (shift && shortcuts.onPrevTab) {
          e.preventDefault()
          shortcuts.onPrevTab()
          return
        }

        // Tab: 다음 탭
        if (!shift && shortcuts.onNextTab) {
          e.preventDefault()
          shortcuts.onNextTab()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
