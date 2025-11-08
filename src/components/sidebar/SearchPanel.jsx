import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { createPortal } from 'react-dom'

const SearchPanel = forwardRef(({
  notes,
  onNoteSelect,
  onDeleteNote,
  onRenameNote,
  onToggleFavorite,
  selectedNoteId,
  onClose
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, noteId: null })
  const [showMenu, setShowMenu] = useState(null) // 메뉴 표시 상태
  const contextMenuRef = useRef(null)
  const menuRef = useRef(null)
  const searchInputRef = useRef(null)

  // 외부에서 검색창에 포커스할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    focus: () => {
      searchInputRef.current?.focus()
    }
  }))

  // Esc 키로 검색 패널 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // 메뉴가 열려있으면 메뉴만 닫기
        if (showMenu || contextMenu.show) {
          setShowMenu(null)
          setContextMenu({ show: false, x: 0, y: 0, noteId: null })
        } else if (onClose) {
          // 메뉴가 없으면 검색 패널 닫기
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showMenu, contextMenu.show, onClose])

  // HTML 태그 제거 함수
  const stripHtmlTags = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // 검색 결과 필터링
  const searchResults = notes.filter(note => {
    if (!searchQuery.trim()) return false

    const query = searchQuery.toLowerCase()
    const title = note.data.title?.toLowerCase() || ''
    const content = stripHtmlTags(note.data.content || '').toLowerCase()

    return title.includes(query) || content.includes(query)
  })

  // 메모 선택
  const handleNoteClick = (noteId) => {
    onNoteSelect(noteId)
    // 모바일에서는 메모 선택 후 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  // 우클릭 메뉴
  const handleContextMenu = (e, noteId) => {
    e.preventDefault()
    e.stopPropagation()

    const menuWidth = 160
    const menuHeight = 96

    let x = e.clientX
    let y = e.clientY

    // 화면 경계 체크
    if (x + menuWidth > window.innerWidth) {
      x = e.clientX - menuWidth
    }
    if (y + menuHeight > window.innerHeight) {
      y = e.clientY - menuHeight
    }
    if (x < 0) x = 8
    if (y < 0) y = 8

    setShowMenu(null) // 점 3개 메뉴 닫기
    setContextMenu({ show: true, x, y, noteId })
  }

  // 점 3개 메뉴 토글
  const handleMenuClick = (e, noteId) => {
    e.stopPropagation()
    setShowMenu(showMenu === noteId ? null : noteId)
  }

  // 제목 변경
  const handleRename = (noteId) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const newTitle = window.prompt('메모 제목을 입력하세요', note.data.title)
    if (newTitle && newTitle.trim() && newTitle !== note.data.title) {
      onRenameNote(noteId, newTitle.trim())
    }
    setShowMenu(null)
    setContextMenu({ show: false, x: 0, y: 0, noteId: null })
  }

  // 즐겨찾기 해제
  const handleToggleFavorite = (noteId) => {
    onToggleFavorite?.(noteId)
    setShowMenu(null)
    setContextMenu({ show: false, x: 0, y: 0, noteId: null })
  }

  // 삭제
  const handleDelete = (noteId) => {
    if (window.confirm('정말 이 메모를 삭제하시겠습니까?')) {
      onDeleteNote(noteId)
    }
    setShowMenu(null)
    setContextMenu({ show: false, x: 0, y: 0, noteId: null })
  }

  // 검색 결과에서 매칭된 텍스트 하이라이트
  const highlightText = (text, query) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-gray-100">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full">
        {/* 검색 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              검색
            </h2>
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="사이드바 닫기"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
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
          </div>

          {/* 검색 입력 */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="메모 검색..."
              className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-[#569cd6]"
              aria-label="메모 검색"
              role="searchbox"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              검색어를 입력하세요
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="p-2">
              <div className="mb-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                {searchResults.length}개의 결과
              </div>
              {searchResults.map((note) => {
                const isSelected = selectedNoteId === note.id
                const noteData = note.data
                const plainContent = stripHtmlTags(noteData.content || '')

                return (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note.id)}
                    onContextMenu={(e) => handleContextMenu(e, note.id)}
                    className={`
                      group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1
                      ${isSelected
                        ? 'bg-amber-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      {/* 제목 */}
                      <div className="font-medium text-sm truncate">
                        {highlightText(noteData.title || '제목 없음', searchQuery)}
                      </div>
                      {/* 내용 미리보기 */}
                      {plainContent && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {highlightText(
                            plainContent.slice(0, 100),
                            searchQuery
                          )}
                        </div>
                      )}
                    </div>

                    {/* 점 3개 메뉴 버튼 */}
                    <button
                      onClick={(e) => handleMenuClick(e, note.id)}
                      className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                      title="메뉴"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {showMenu === note.id && (
                      <>
                        {/* 투명 오버레이 */}
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={() => setShowMenu(null)}
                        />
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[9999]"
                        >
                          <button
                            onClick={() => handleRename(note.id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                              onClick={() => handleToggleFavorite(note.id)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
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
                            onClick={() => handleDelete(note.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu.show && createPortal(
        <>
          {/* 투명 오버레이 */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setContextMenu({ show: false, x: 0, y: 0, noteId: null })}
          />
          <div
            ref={contextMenuRef}
            className="fixed z-[10000] w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
            }}
          >
            <button
              onClick={() => handleRename(contextMenu.noteId)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
            >
              <svg
                className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              제목 변경
            </button>
            {notes.find(n => n.id === contextMenu.noteId)?.data.is_favorite && (
              <button
                onClick={() => handleToggleFavorite(contextMenu.noteId)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
              onClick={() => handleDelete(contextMenu.noteId)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
    </>
  )
})

SearchPanel.displayName = 'SearchPanel'

export default SearchPanel
