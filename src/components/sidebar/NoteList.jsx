import { useState, useRef, useEffect } from 'react'

// 드래그 중인 아이템을 저장하는 모듈 변수 (export하여 다른 모듈과 공유)
export let currentDraggedItem = null

// 모듈 변수를 업데이트하는 함수 (export)
export const setCurrentDraggedItem = (item) => {
  currentDraggedItem = item
}

// 간단한 메모 아이템 컴포넌트 (VSCode 탐색기 스타일)
export function NoteItemSimple({ note, selectedNoteId, onNoteSelect, onDeleteNote, onRenameNote, onMoveNote, onReorderNote, level }) {
  const noteData = note.data
  const isSelected = note.id === selectedNoteId
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(noteData.title || '제목 없음')
  const [showMenu, setShowMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dropPosition, setDropPosition] = useState(null) // 'before' | 'after' | null
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  // HTML5 Drag & Drop - 드래그 시작
  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault()
      return
    }

    setIsDragging(true)
    console.log('🔵 메모 드래그 시작:', note.id, noteData.title)

    // 드래그 데이터 설정
    const dragData = {
      type: 'NOTE',
      id: note.id,
      data: noteData
    }

    // 모듈 변수에 저장 (dragOver에서 사용)
    setCurrentDraggedItem(dragData)

    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'

    // 드래그 이미지 커스터마이징 (선택사항)
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
  }

  // HTML5 Drag & Drop - 드래그 종료
  const handleDragEnd = (e) => {
    setIsDragging(false)
    setCurrentDraggedItem(null) // 모듈 변수 초기화
    console.log('🔵 메모 드래그 종료:', note.id)
  }

  // HTML5 Drag & Drop - 순서 변경을 위한 드래그 오버
  const handleDragOverForReorder = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 전역 변수에서 드래그 중인 아이템 가져오기
    const item = currentDraggedItem

    if (!item) {
      e.dataTransfer.dropEffect = 'move'
      return
    }

    // 메모만 순서 변경 가능
    if (item.type !== 'NOTE') {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }

    // 자기 자신에게는 드롭 불가
    if (item.id === note.id) {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }

    // 같은 폴더 내에서만 순서 변경 가능
    if (item.data.folder_id !== noteData.folder_id) {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }

    // 드롭 위치 계산 (상단/하단)
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const position = e.clientY < midpoint ? 'before' : 'after'

    setDropPosition(position)
    e.dataTransfer.dropEffect = 'move'
  }

  // HTML5 Drag & Drop - 드래그 나감
  const handleDragLeaveForReorder = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 자식 요소로 이동하는 경우 무시 (dropPosition 유지)
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }

    setDropPosition(null)
  }

  // HTML5 Drag & Drop - 순서 변경 드롭
  const handleDropForReorder = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const position = dropPosition
    setDropPosition(null)

    console.log('🎯 [NoteItem] 드롭 이벤트:', { position, targetNoteId: note.id })

    if (!position) {
      console.log('⚠️ [NoteItem] position 없음, 드롭 취소')
      return
    }

    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) {
        console.log('⚠️ [NoteItem] 드래그 데이터 없음')
        return
      }

      const item = JSON.parse(data)
      console.log('🎯 [NoteItem] 파싱된 아이템:', { type: item.type, id: item.id, title: item.data?.title })

      // 메모 순서 변경
      if (item.type === 'NOTE' && item.id !== note.id && item.data.folder_id === noteData.folder_id) {
        console.log('✅ [NoteItem] onReorderNote 호출:', {
          draggedNoteId: item.id,
          draggedTitle: item.data?.title,
          targetNoteId: note.id,
          targetTitle: noteData.title,
          position
        })
        onReorderNote?.(item.id, note.id, position)
      } else {
        console.log('⚠️ [NoteItem] 조건 불만족:', {
          isNote: item.type === 'NOTE',
          isDifferent: item.id !== note.id,
          sameFolder: item.data.folder_id === noteData.folder_id
        })
      }
    } catch (err) {
      console.error('❌ [NoteItem] 순서 변경 드롭 오류:', err)
    }
  }

  // 우클릭 메뉴
  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)
  }

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // 이름 변경 시작
  const startRename = () => {
    setIsEditing(true)
    setShowMenu(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // 이름 변경 완료
  const handleRename = () => {
    if (editTitle.trim() && editTitle !== noteData.title) {
      onRenameNote(note.id, editTitle.trim())
    } else {
      setEditTitle(noteData.title || '제목 없음')
    }
    setIsEditing(false)
  }

  // 이름 변경 취소
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditTitle(noteData.title || '제목 없음')
      setIsEditing(false)
    }
  }

  // 메모 삭제
  const handleDelete = () => {
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      onDeleteNote(note.id)
    }
    setShowMenu(false)
  }

  // 클릭 핸들러 - 드래그와 구분
  const handleClick = (e) => {
    // 드래그 중이 아닐 때만 클릭 처리
    if (!isEditing && !isDragging) {
      onNoteSelect(note.id)
    }
  }

  // 마우스 다운 핸들러
  const handleMouseDown = (e) => {
    // 우클릭이면 무시
    if (e.button === 2) return
    // 왼쪽 클릭이면 드래그 준비
    e.stopPropagation()
  }

  return (
    <div className="relative">
      {/* 상단 드롭 인디케이터 - 개선된 시각적 효과 */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="h-1 bg-orange-500 dark:bg-indigo-500 animate-pulse shadow-lg" />
          <div className="absolute top-0 left-0 right-0 h-8 bg-orange-100 dark:bg-indigo-900/40 opacity-60 -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1 bg-orange-500 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
              ↑ 위에 놓기
            </div>
          </div>
        </div>
      )}

      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOverForReorder}
        onDragLeave={handleDragLeaveForReorder}
        onDrop={handleDropForReorder}
        data-note-item
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          relative flex items-center px-2 py-1 transition-all duration-200
          ${isSelected ? 'bg-orange-100 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}
          ${isDragging ? 'opacity-30 cursor-grabbing scale-95' : 'cursor-grab hover:scale-[1.01]'}
          ${dropPosition ? 'ring-2 ring-orange-300 dark:ring-indigo-600' : ''}
        `}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          userSelect: 'none'
        }}
      >
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
          className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-orange-500 dark:border-indigo-500 rounded outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span
            className={`flex-1 text-sm truncate ${
              isSelected
                ? 'text-orange-700 dark:text-indigo-300 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {noteData.title || '제목 없음'}
          </span>

          {/* 즐겨찾기 아이콘 (제목 오른쪽) */}
          {noteData.is_favorite && (
            <svg
              className="w-3 h-3 ml-1 text-yellow-500 fill-current flex-shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </>
      )}

      {/* 우클릭 메뉴 */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
          style={{
            top: '100%',
            right: '0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={startRename}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
      )}
      </div>

      {/* 하단 드롭 인디케이터 - 개선된 시각적 효과 */}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="h-1 bg-orange-500 dark:bg-indigo-500 animate-pulse shadow-lg" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-orange-100 dark:bg-indigo-900/40 opacity-60 translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="px-3 py-1 bg-orange-500 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
              ↓ 아래에 놓기
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteItem({ note, selectedNoteId, onNoteSelect, onDeleteNote }) {
  const noteData = note.data
  const isSelected = note.id === selectedNoteId
  const [isDragging, setIsDragging] = useState(false)

  // HTML5 Drag & Drop - 드래그 시작
  const handleDragStart = (e) => {
    setIsDragging(true)

    const dragData = {
      type: 'NOTE',
      id: note.id,
      data: noteData
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }

  // HTML5 Drag & Drop - 드래그 종료
  const handleDragEnd = (e) => {
    setIsDragging(false)
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
    e.stopPropagation() // 메모 선택 이벤트 방지
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      onDeleteNote(note.id)
    }
  }

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onNoteSelect(note.id)}
      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        isSelected
          ? 'bg-orange-50 dark:bg-indigo-900/20 border-l-4 border-orange-500 dark:border-indigo-500'
          : ''
      } ${isDragging ? 'opacity-30 scale-95' : 'hover:scale-[1.01]'}`}
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 제목 + 즐겨찾기 아이콘 */}
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
                  ? 'text-orange-700 dark:text-indigo-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {noteData.title || '제목 없음'}
            </h3>
          </div>

          {/* 내용 미리보기 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {getPreviewText(noteData.content)}
          </p>

          {/* 수정 시간 */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formatDate(noteData.updated_at)}
          </p>

          {/* 링크 타입 표시 */}
          {noteData.link_type && (
            <div className="mt-2 flex items-center">
              {noteData.link_type === 'youtube' ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  YouTube
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Web
                </span>
              )}
            </div>
          )}
        </div>

        {/* 삭제 버튼 */}
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
