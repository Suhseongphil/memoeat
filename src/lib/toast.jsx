import { toast } from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { getThemeById } from '../config/themes'

const getToastPalette = () => {
  const { preferences } = useAuthStore.getState()
  const theme = getThemeById(preferences?.theme)
  const themeId = preferences?.theme === 'dark' ? 'dark' : theme?.id === 'dark' ? 'dark' : 'light'
  const isDark = themeId === 'dark'

  const background = isDark ? (theme?.preview?.background || '#1E1E1E') : '#ffffff'
  const text = isDark ? '#f9fafb' : '#111827'
  const accent = theme?.preview?.accent || (isDark ? '#4A9EFF' : '#3B82F6')

  return {
    background,
    text,
    accent
  }
}

export const showUndoToast = ({ message, onUndo, undoLabel = '실행 취소', duration = 6000 }) => {
  const { background, text } = getToastPalette()

  const id = toast.custom((t) => (
    <div
      className={`pointer-events-auto flex max-w-md items-center justify-between gap-4 rounded-xl shadow-lg transition-all ${
        t.visible ? 'animate-[fadeIn_0.15s_ease-out]' : 'animate-[fadeOut_0.2s_ease-in] opacity-0'
      }`}
      style={{ backgroundColor: background, color: text, padding: '12px 16px' }}
    >
      <span className="text-sm font-medium" style={{ color: text }}>{message}</span>
      {onUndo && (
        <button
          onClick={() => {
            onUndo()
            toast.dismiss(t.id)
          }}
          className="flex-shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition hover:opacity-90"
          style={{ backgroundColor: '#DC2626', color: '#FEE2E2' }}
        >
          {undoLabel}
        </button>
      )}
      <button
        onClick={() => toast.dismiss(t.id)}
        className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition hover:opacity-80"
        style={{ color: text }}
        aria-label="알림 닫기"
      >
        닫기
      </button>
    </div>
  ), {
    id: `undo-${Date.now()}`,
    duration,
    position: 'top-center'
  })

  return id
}

export const showSuccessToast = (message) => {
  const { background, text } = getToastPalette()
  toast.success(message, {
    style: {
      background,
      color: text,
      borderRadius: '12px',
      padding: '12px 16px'
    },
    iconTheme: {
      primary: '#16A34A',
      secondary: background
    }
  })
}

export const showErrorToast = (message) => {
  const { background, text } = getToastPalette()
  toast.error(message, {
    style: {
      background,
      color: text,
      borderRadius: '12px',
      padding: '12px 16px'
    },
    iconTheme: {
      primary: '#DC2626',
      secondary: background
    }
  })
}
