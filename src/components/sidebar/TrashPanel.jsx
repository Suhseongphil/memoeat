import { useState } from 'react'
import { createPortal } from 'react-dom'

const formatDeletedAt = (timestamp) => {
  if (!timestamp) return '방금 전'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '방금 전'
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function TrashPanel({
  trashedNotes = [],
  onRestoreNote,
  onDeleteNote,
  onEmptyTrash,
  isLoading,
  isProcessing,
  onClose
}) {
  const hasItems = trashedNotes.length > 0
  const [menuState, setMenuState] = useState({
    open: false,
    type: null,
    id: null,
    position: { top: 0, left: 0 }
  })

  const closeMenu = () => {
    setMenuState({ open: false, type: null, id: null, position: { top: 0, left: 0 } })
  }

  const openMenu = (type, id, position) => {
    setMenuState({ open: true, type, id, position })
  }

  const handleMenuAction = (action) => {
    if (!menuState.open) return

    if (action === 'restore') {
      if (menuState.type === 'note') {
        onRestoreNote?.(menuState.id)
      }
    } else if (action === 'delete') {
      if (menuState.type === 'note') {
        onDeleteNote?.(menuState.id)
      }
    }

    closeMenu()
  }

  const getMenuPositionByRect = (rect) => {
    const menuWidth = 192
    const menuHeight = 120
    let top = rect.bottom + 8
    let left = rect.left

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 8
    }
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 16
    }
    if (left < 8) left = 8
    if (top < 8) top = 8

    return { top, left }
  }

  const getMenuPositionByPoint = (x, y) => {
    const menuWidth = 192
    const menuHeight = 120
    let left = x
    let top = y

    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 16
    }
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 16
    }
    if (left < 8) left = 8
    if (top < 8) top = 8

    return { top, left }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-[#3e3e42]">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">휴지통</h2>
            <p className="text-xs text-gray-500 dark:text-[#9d9d9d]">30일 보관 후 자동으로 삭제됩니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEmptyTrash}
              disabled={!hasItems || isProcessing}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                hasItems && !isProcessing
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-gray-200 text-gray-500 dark:bg-[#2d2d30] dark:text-[#7a7a7a]'
              }`}
            >
              비우기
            </button>
            <button
              onClick={onClose}
              className="lg:hidden rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#2d2d30]"
              aria-label="패널 닫기"
            >
              <svg
                className="h-5 w-5 text-gray-600 dark:text-[#9d9d9d]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2d2d30]" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2d2d30]" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2d2d30]" />
          </div>
        ) : hasItems ? (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-[#9d9d9d]">삭제된 메모</h3>
            <div className="space-y-3">
              {trashedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#2d2d30] dark:bg-[#1e1e1e]"
                      onContextMenu={(e) => {
                        e.preventDefault()
                        openMenu('note', note.id, getMenuPositionByPoint(e.clientX, e.clientY))
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-[#cccccc]">
                            {note.data?.title || '제목 없음'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#7a7a7a]">
                            삭제됨: {formatDeletedAt(note.deleted_at || note.data?.deleted_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            openMenu('note', note.id, getMenuPositionByRect(rect))
                          }}
                          disabled={isProcessing}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-[#9d9d9d] dark:hover:bg-[#2d2d30] transition-colors"
                          aria-label="메모 옵션"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-[#2d2d30] dark:bg-[#1a1a1a]">
            <svg
              className="mb-3 h-10 w-10 text-gray-400 dark:text-[#3d3d40]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 3h6" />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-[#9d9d9d]">휴지통이 비어 있습니다.</p>
            <p className="text-xs text-gray-500 dark:text-[#7a7a7a]">삭제된 메모는 여기에서 복구하거나 영구 삭제할 수 있어요.</p>
          </div>
        )}
      </div>

      {menuState.open && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={closeMenu}
            style={{ pointerEvents: 'auto' }}
          />
          <div
            className="fixed z-[10000] w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-[#3e3e42] dark:bg-[#252526]"
            style={{
              top: `${menuState.position.top}px`,
              left: `${menuState.position.left}px`,
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={() => handleMenuAction('restore')}
              disabled={isProcessing}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#cccccc] dark:hover:bg-[#2d2d30]"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.5 12a7.5 7.5 0 101.356-4.267"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 7.5V12h4.5" />
              </svg>
              복구
            </button>
            <button
              onClick={() => handleMenuAction('delete')}
              disabled={isProcessing}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              영구 삭제
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default TrashPanel
