import { useState, useRef, memo } from 'react'
import { createPortal } from 'react-dom'

// 간단한 메모 아이템 컴포넌트 (VSCode 탐색기 스타일)
export const NoteItemSimple = memo(function NoteItemSimple({ 
  note, 
  selectedNoteId, 
  onNoteSelect, 
  onDeleteNote, 
  onRenameNote, 
  onToggleFavorite, 
  onMoveNote, 
  onReorderNote, 
  level 
}) {
  const noteData = note.data
  const isSelected = note.id === selectedNoteId
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(noteData.title || '제목 없음')
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dropPosition, setDropPosition] = useState(null) // 'before' | 'after' | null
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)
  const itemRef = useRef(null)

  // 메뉴 위치 계산 및 열기
  const openMenu = (clientX, clientY) => {
    const menuWidth = 192
    const menuHeight = 120

    let top = clientY
    let left = clientX

    if (top + menuHeight > window.innerHeight) {
      top = clientY - menuHeight
    }
    if (left + menuWidth > window.innerWidth) {
      left = clientX - menuWidth
    }
    if (left < 0) left = 8
    if (top < 0) top = 8

    setMenuPosition({ top, left })
    setShowMenu(true)
  }

  const handleMenuToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (showMenu) {
      setShowMenu(false)
      return
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      openMenu(rect.right, rect.bottom + 4)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openMenu(e.clientX, e.clientY)
  }

  const startRename = () => {
    setIsEditing(true)
    setShowMenu(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== noteData.title) {
      onRenameNote(note.id, editTitle.trim())
    } else {
      setEditTitle(noteData.title || '제목 없음')
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditTitle(noteData.title || '제목 없음')
      setIsEditing(false)
    }
  }

  const handleToggleFavorite = () => {
    onToggleFavorite?.(note.id)
    setShowMenu(false)
  }

  const handleDelete = () => {
    onDeleteNote(note.id)
    setShowMenu(false)
  }

  // 드래그 시작
  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault()
      return
    }

    setIsDragging(true)

    const dragData = {
      type: 'NOTE',
      id: note.id,
      folder_id: noteData.folder_id
    }

    // 드롭 이벤트에서 사용할 데이터 저장
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    
    // 드래그 오버 이벤트에서도 사용할 수 있도록 window에 임시 저장
    // (HTML5 Drag & Drop API 제한: 드래그 오버에서는 getData 사용 불가)
    window.__dragData = dragData
  }

  // 드래그 종료
  const handleDragEnd = (e) => {
    setIsDragging(false)
    setDropPosition(null)
    // 임시 데이터 정리 (어디서 끝나든 정리)
    window.__dragData = null
  }

  // 드래그 오버 (순서 변경용)
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 드래그 오버에서는 getData를 사용할 수 없으므로 window 객체에서 데이터 가져오기
    const item = window.__dragData
    
    if (!item || item.type !== 'NOTE') {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }
    
    // 같은 타입이고 같은 폴더에 있는 메모끼리만 순서 변경 가능
    if (item.id !== note.id && item.folder_id === noteData.folder_id) {
      const rect = e.currentTarget.getBoundingClientRect()
      const relativeY = e.clientY - rect.top
      const height = rect.height
      const position = relativeY < height / 2 ? 'before' : 'after'
      
      setDropPosition(position)
      e.dataTransfer.dropEffect = 'move'
    } else {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
    }
  }

  // 드래그 나감
  const handleDragLeave = (e) => {
    // 자식 요소로 이동한 경우는 무시
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setDropPosition(null)
  }

  // 드롭 (순서 변경)
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const position = dropPosition
    setDropPosition(null)

    try {
      // 드롭 이벤트에서는 getData 사용 가능
      const data = e.dataTransfer.getData('application/json')
      let item
      
      if (data) {
        item = JSON.parse(data)
      } else {
        // getData가 실패한 경우 window 객체에서 가져오기
        item = window.__dragData
      }
      
      if (!item) return

      if (item.type === 'NOTE' && item.id !== note.id && item.folder_id === noteData.folder_id && position) {
        onReorderNote?.(item.id, note.id, position)
      }
      
      window.__dragData = null
    } catch (err) {
      console.error('드롭 처리 오류:', err)
      window.__dragData = null
    }
  }

  // 클릭 핸들러
  const handleClick = (e) => {
    if (!isEditing && !isDragging) {
      onNoteSelect(note.id)
    }
  }

  return (
    <div className="relative">
      {/* 상단 드롭 인디케이터 */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="h-0.5 bg-amber-500 dark:bg-[#569cd6]" />
        </div>
      )}

      <div
        ref={itemRef}
        data-note-id={note.id}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        className={`
          relative flex items-center px-2 py-1 transition-all duration-200 group
          ${isSelected ? 'bg-amber-100 dark:bg-[#1e1e1e]' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}
          ${isDragging ? 'opacity-30 cursor-grabbing' : 'cursor-pointer'}
        `}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          userSelect: 'none'
        }}
      >
        {/* 하단 드롭 인디케이터 */}
        {dropPosition === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="h-0.5 bg-amber-500 dark:bg-[#569cd6]" />
          </div>
        )}

        {/* 파일 아이콘 */}
        <svg
          className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        {/* 메모 제목 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-amber-500 dark:border-[#569cd6] rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span
              className={`flex-1 text-sm truncate ${
                isSelected
                  ? 'text-amber-700 dark:text-[#569cd6] font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {noteData.title || '제목 없음'}
            </span>

            {/* 즐겨찾기 아이콘 */}
            {noteData.is_favorite && (
              <div className="relative group/star">
                <svg
                  className="w-3 h-3 ml-1 text-yellow-500 fill-current flex-shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/star:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  즐겨찾기
                </div>
              </div>
            )}

            {/* 메뉴 버튼 */}
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </>
        )}

        {/* 드롭다운 메뉴 */}
        {showMenu && createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
              }}
              style={{ pointerEvents: 'auto' }}
            />
            <div
              ref={menuRef}
              className="fixed z-[10000] w-48 bg-white dark:bg-[#252526] rounded-lg shadow-xl border border-gray-200 dark:border-[#3e3e42] py-1"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={startRename}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                제목 변경
              </button>
              {noteData.is_favorite && (
                <button
                  onClick={handleToggleFavorite}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  즐겨찾기 해제
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                삭제
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  )
})

// 레거시 NoteItem 컴포넌트 (사용되지 않을 수 있음)
function NoteItem({ note, selectedNoteId, onNoteSelect, onDeleteNote }) {
  const noteData = note.data
  const isSelected = note.id === selectedNoteId
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    const dragData = {
      type: 'NOTE',
      id: note.id,
      folder_id: noteData.folder_id
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    window.__dragData = dragData
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    // 임시 데이터 정리 (어디서 끝나든 정리)
    window.__dragData = null
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPreviewText = (content) => {
    if (!content) return '내용 없음'
    return content.length > 60 ? content.substring(0, 60) + '...' : content
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDeleteNote(note.id)
  }

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onNoteSelect(note.id)}
      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        isSelected
          ? 'bg-amber-50 dark:bg-[#1e1e1e]/20 border-l-4 border-amber-500 dark:border-[#569cd6]'
          : ''
      } ${isDragging ? 'opacity-30 scale-95' : 'hover:scale-[1.01]'}`}
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {noteData.is_favorite && (
              <svg
                className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
            <h3
              className={`font-medium truncate ${
                isSelected
                  ? 'text-amber-700 dark:text-[#569cd6]'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {noteData.title || '제목 없음'}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {getPreviewText(noteData.content)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formatDate(noteData.updated_at)}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="메모 삭제"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function NoteList({ notes, selectedNoteId, onNoteSelect, onDeleteNote }) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">메모가 없습니다</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          "새 메모" 버튼을 눌러 시작하세요
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          selectedNoteId={selectedNoteId}
          onNoteSelect={onNoteSelect}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </div>
  )
}

export default NoteList
