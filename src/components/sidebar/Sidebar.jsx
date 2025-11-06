import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import FolderTree from './FolderTree'
import { NoteItemSimple, currentDraggedItem } from './NoteList'

// 루트 드롭존 컴포넌트
function RootDropZone({ userName, onDrop, notes, onNewFolder }) {
  const [isOver, setIsOver] = useState(false)
  const [canDrop, setCanDrop] = useState(false)

  // HTML5 Drag & Drop - 드래그 오버
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 전역 변수에서 드래그 중인 아이템 가져오기
    const item = currentDraggedItem

    if (!item) {
      e.dataTransfer.dropEffect = 'move'
      setCanDrop(true)
      return
    }

    // 이미 메인 폴더에 있는 항목은 드롭 불가
    let canDropItem = true
    if (item.type === 'NOTE') {
      const note = notes.find(n => n.id === item.id)
      canDropItem = note && note.data.folder_id !== null
    }
    if (item.type === 'FOLDER') {
      canDropItem = item.data.parent_id !== null
    }

    setCanDrop(canDropItem)
    e.dataTransfer.dropEffect = canDropItem ? 'move' : 'none'
  }

  // HTML5 Drag & Drop - 드래그 진입
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(true)
  }

  // HTML5 Drag & Drop - 드래그 나감
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setIsOver(false)
    setCanDrop(false)
  }

  // HTML5 Drag & Drop - 드롭
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)
    setCanDrop(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) return

      const item = JSON.parse(data)
      console.log('✅ 루트로 드롭:', item)
      onDrop(item)
    } catch (err) {
      console.error('루트 드롭 처리 오류:', err)
    }
  }

  const isActive = isOver && canDrop

  return (
    <div className="p-4 pb-3 group">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center px-5 py-4 text-base font-bold rounded-xl transition-all duration-200 ${
          isActive
            ? 'ring-4 ring-orange-500 dark:ring-indigo-500 bg-orange-100 dark:bg-indigo-900/40 scale-[1.05] shadow-2xl'
            : canDrop
            ? 'ring-2 ring-orange-300 dark:ring-indigo-600 bg-orange-50 dark:bg-indigo-900/20'
            : 'bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-700'
        } text-gray-800 dark:text-gray-200 cursor-pointer`}
        style={{
          minHeight: '56px'
        }}
      >
        <svg
          className={`w-6 h-6 mr-3 transition-all duration-200 ${
            isActive ? 'text-orange-600 dark:text-indigo-400 scale-110' : 'text-gray-600 dark:text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="flex-1 text-base">{userName}</span>

        {/* 새 폴더 추가 버튼 */}
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNewFolder(null)
            }}
            className="ml-2 p-1.5 rounded-lg hover:bg-orange-200 dark:hover:bg-indigo-700 transition-all"
            title="새 폴더"
          >
            <svg
              className="w-4 h-4 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {isActive && (
          <svg
            className="w-5 h-5 text-orange-600 dark:text-indigo-400 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>

      {/* 드롭존 설명 텍스트 */}
      {isActive && (
        <div className="mt-3 mx-2 px-3 py-2 bg-orange-50 dark:bg-indigo-900/20 border border-orange-300 dark:border-indigo-600 rounded-lg text-sm text-orange-700 dark:text-indigo-300 font-semibold text-center animate-pulse">
          ↓ 메인 폴더로 이동 ↓
        </div>
      )}

      {/* 드래그 가능할 때 힌트 표시 */}
      {canDrop && !isActive && (
        <div className="mt-2 px-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 {userName} 폴더로 드래그하면 메인 폴더로 이동
        </div>
      )}
    </div>
  )
}

function SidebarContent({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote,
  folders,
  selectedFolderId,
  onFolderSelect,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveNote,
  onMoveFolder,
  onReorderNote,
  onReorderFolder,
  isOpen,
  onClose,
  userName,
  sidebarPosition = 'left'
}) {
  const handleNoteSelect = (noteId) => {
    onNoteSelect(noteId)
    // 모바일에서는 메모 선택 후 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const handleNewNote = () => {
    onNewNote()
    // 모바일에서는 새 메모 생성 후 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const handleRootDrop = (item) => {
    console.log('메인 폴더로 이동:', item)
    if (item.type === 'NOTE') {
      onMoveNote(item.id, null)
    } else if (item.type === 'FOLDER') {
      onMoveFolder(item.id, null)
    }
  }

  // 사이드바 우클릭 메뉴 상태
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 })
  const contextMenuRef = useRef(null)

  // 사이드바 빈 공간 우클릭
  const handleSidebarContextMenu = (e) => {
    // 폴더나 메모 항목이 아닌 경우에만 처리
    if (e.target.closest('[data-folder-item]') || e.target.closest('[data-note-item]')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const menuWidth = 192
    const menuHeight = 60

    let top = e.clientY
    let left = e.clientX

    // 화면 경계 체크
    if (top + menuHeight > window.innerHeight) {
      top = e.clientY - menuHeight
    }
    if (left + menuWidth > window.innerWidth) {
      left = e.clientX - menuWidth
    }
    if (left < 0) {
      left = 8
    }
    if (top < 0) {
      top = 8
    }

    setContextMenuPosition({ top, left })
    setShowContextMenu(true)
  }

  // 새 폴더 생성
  const handleCreateFolder = () => {
    onNewFolder(null)
    setShowContextMenu(false)
  }

  // 폴더에 속하지 않은 메모들 (루트 메모)
  const rootNotes = notes.filter(note => !note.data.folder_id)

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-white dark:bg-gray-800
          ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-gray-200 dark:border-gray-700
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              탐색기
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

          {/* 새 메모 버튼 */}
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            새 메모
          </button>
        </div>

        {/* 루트 폴더 (사용자 이름) - 상단 고정 */}
        <div className="flex-shrink-0">
          <RootDropZone
            userName={userName}
            onDrop={handleRootDrop}
            notes={notes}
            onNewFolder={onNewFolder}
          />
        </div>

        {/* 폴더 트리 + 메모 리스트 - 스크롤 영역 */}
        <div
          className="flex-1 overflow-y-auto relative custom-scrollbar"
          onContextMenu={handleSidebarContextMenu}
        >
          {/* 폴더 트리 */}
          {folders && folders.length > 0 && (
            <div className="px-2">
              <FolderTree
                folders={folders}
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onCreateFolder={onNewFolder}
                notes={notes}
                selectedNoteId={selectedNoteId}
                onNoteSelect={handleNoteSelect}
                onDeleteNote={onDeleteNote}
                onRenameNote={onRenameNote}
                onMoveNote={onMoveNote}
                onMoveFolder={onMoveFolder}
                onReorderNote={onReorderNote}
                onReorderFolder={onReorderFolder}
                level={1}
              />
            </div>
          )}

          {/* 루트 레벨 메모들 */}
          {rootNotes.length > 0 && (
            <div className="px-2 pb-4">
              {rootNotes.map((note) => (
                <NoteItemSimple
                  key={note.id}
                  note={note}
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={handleNoteSelect}
                  onDeleteNote={onDeleteNote}
                  onRenameNote={onRenameNote}
                  onMoveNote={onMoveNote}
                  onReorderNote={onReorderNote}
                  level={1}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 사이드바 우클릭 메뉴 - Portal로 body에 직접 렌더링 */}
      {showContextMenu && createPortal(
        <>
          {/* 투명 오버레이 */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation()
              setShowContextMenu(false)
            }}
            style={{ pointerEvents: 'auto' }}
          />
          <div
            ref={contextMenuRef}
            className="fixed z-[10000] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
            style={{
              top: `${contextMenuPosition.top}px`,
              left: `${contextMenuPosition.left}px`,
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={handleCreateFolder}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-indigo-900/30 flex items-center transition-colors"
            >
              <svg
                className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              새 폴더
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export default SidebarContent
