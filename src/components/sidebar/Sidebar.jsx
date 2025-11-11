import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import FolderTree from './FolderTree'
import { NoteItemSimple } from './NoteList'
import SearchPanel from './SearchPanel'
import FavoritesPanel from './FavoritesPanel'
import TrashPanel from './TrashPanel'

// 루트 드롭존 컴포넌트
function RootDropZone({ userName, onDrop, notes, onNewFolder }) {
  const [isOver, setIsOver] = useState(false)

  // 드래그 오버
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 드래그 오버에서는 getData를 사용할 수 없으므로 window 객체에서 데이터 가져오기
    const item = window.__dragData
    
    if (!item) {
      e.dataTransfer.dropEffect = 'none'
      return
    }

    // 이미 메인 폴더에 있는 항목은 드롭 불가
    if (item.type === 'NOTE') {
      const note = notes.find(n => n.id === item.id)
      if (note && note.data.folder_id === null) {
        e.dataTransfer.dropEffect = 'none'
        return
      }
    }
    if (item.type === 'FOLDER') {
      if (item.parent_id === null) {
        e.dataTransfer.dropEffect = 'none'
        return
      }
    }

    e.dataTransfer.dropEffect = 'move'
  }

  // 드래그 진입
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(true)
  }

  // 드래그 나감
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setIsOver(false)
  }

  // 드롭
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)

    try {
      // 드롭 이벤트에서는 getData 사용 가능
      const data = e.dataTransfer.getData('application/json')
      if (!data) {
        // getData가 실패한 경우 window 객체에서 가져오기
        const item = window.__dragData
        if (item) {
          onDrop(item)
          window.__dragData = null
        }
        return
      }

      const item = JSON.parse(data)
      onDrop(item)
      // 임시 데이터 정리
      window.__dragData = null
    } catch (err) {
      console.error('루트 드롭 처리 오류:', err)
      window.__dragData = null
    }
  }

  return (
    <div className="p-4 pb-3 group">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center px-5 py-4 text-base font-bold rounded-xl transition-all duration-200 ${
          isOver
            ? 'ring-4 ring-amber-500 dark:ring-[#569cd6] bg-amber-100 dark:bg-[#1e1e1e] scale-[1.05] shadow-2xl'
            : 'bg-gray-100 dark:bg-[#2d2d30] hover:bg-gray-200 dark:hover:bg-[#2d2d30]'
        } text-gray-800 dark:text-[#cccccc] cursor-pointer`}
        style={{
          minHeight: '56px'
        }}
      >
        <svg
          className={`w-6 h-6 mr-3 transition-all duration-200 ${
            isOver ? 'text-amber-600 dark:text-[#569cd6] scale-110' : 'text-gray-600 dark:text-[#9d9d9d]'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="flex-1 text-base">{userName}</span>

        {/* 새 폴더 추가 버튼 */}
        {!isOver && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNewFolder(null)
            }}
            className="ml-2 p-1.5 rounded-lg hover:bg-amber-200 dark:hover:bg-[#569cd6] transition-all"
            title="새 폴더"
          >
            <svg
              className="w-4 h-4 text-gray-700 dark:text-[#cccccc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {isOver && (
          <svg
            className="w-5 h-5 text-amber-600 dark:text-[#569cd6] animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>

      {/* 드롭존 설명 텍스트 */}
      {isOver && (
        <div className="mt-3 mx-2 px-3 py-2 bg-amber-50 dark:bg-[#1e1e1e] border border-amber-300 dark:border-[#569cd6] rounded-lg text-sm text-amber-700 dark:text-[#569cd6] font-semibold text-center animate-pulse">
          ↓ 메인 폴더로 이동 ↓
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
  onToggleFavorite,
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
  sidebarPosition = 'left',
  trashedNotes = [],
  trashedFolders = [],
  onRestoreTrashedNote,
  onRestoreTrashedFolder,
  onDeleteTrashedNote,
  onDeleteTrashedFolder,
  onEmptyTrash,
  isTrashLoading,
  isTrashProcessing
}) {
  const [activePanel, setActivePanel] = useState('explorer')
  const trashCount = (trashedNotes?.length || 0) + (trashedFolders?.length || 0)
  const scrollContainerRef = useRef(null)
  
  // 선택된 메모가 변경되면 해당 메모로 스크롤
  useEffect(() => {
    if (activePanel === 'explorer' && selectedNoteId && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const noteElement = scrollContainerRef.current?.querySelector(
          `[data-note-id="${selectedNoteId}"]`
        )
        if (noteElement) {
          noteElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        } else {
          const note = notes.find(n => n.id === selectedNoteId)
          if (note && !note.data.folder_id) {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [selectedNoteId, activePanel, notes])

  const handleNoteSelect = (noteId) => {
    onNoteSelect(noteId)
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const handleNewNote = () => {
    onNewNote()
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const handleRootDrop = (item) => {
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
    if (e.target.closest('[data-folder-item]') || e.target.closest('[data-note-id]')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const menuWidth = 192
    const menuHeight = 60

    let top = e.clientY
    let left = e.clientX

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

  const handleCreateFolder = () => {
    onNewFolder(null)
    setShowContextMenu(false)
  }

  // 폴더에 속하지 않은 메모들 (루트 메모)
  const rootNotes = useMemo(() => {
    return notes.filter(note => !note.data.folder_id)
  }, [notes])

  let panelContent = null

  if (activePanel === 'explorer') {
    panelContent = (
      <>
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">
              탐색기
            </h2>
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
              aria-label="사이드바 닫기"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-[#9d9d9d]"
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
            className="w-full flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-[#569cd6] dark:hover:bg-[#4a8cc5] text-white font-medium rounded-lg transition-colors"
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
          ref={scrollContainerRef}
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
                onToggleFavorite={onToggleFavorite}
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
                  onToggleFavorite={onToggleFavorite}
                  onMoveNote={onMoveNote}
                  onReorderNote={onReorderNote}
                  level={1}
                />
              ))}
            </div>
          )}
        </div>
      </>
    )
  } else if (activePanel === 'favorites') {
    panelContent = (
      <FavoritesPanel
        notes={notes}
        selectedNoteId={selectedNoteId}
        onNoteSelect={handleNoteSelect}
        onDeleteNote={onDeleteNote}
        onRenameNote={onRenameNote}
        onToggleFavorite={onToggleFavorite}
        onMoveNote={onMoveNote}
        onReorderNote={onReorderNote}
        onClose={onClose}
      />
    )
  } else if (activePanel === 'search') {
    panelContent = (
      <SearchPanel
        notes={notes}
        onNoteSelect={handleNoteSelect}
        onDeleteNote={onDeleteNote}
        onRenameNote={onRenameNote}
        onToggleFavorite={onToggleFavorite}
        selectedNoteId={selectedNoteId}
        onClose={onClose}
      />
    )
  } else if (activePanel === 'trash') {
    panelContent = (
      <TrashPanel
        trashedFolders={trashedFolders}
        trashedNotes={trashedNotes}
        onRestoreFolder={onRestoreTrashedFolder}
        onRestoreNote={onRestoreTrashedNote}
        onDeleteFolder={onDeleteTrashedFolder}
        onDeleteNote={onDeleteTrashedNote}
        onEmptyTrash={onEmptyTrash}
        isLoading={isTrashLoading}
        isProcessing={isTrashProcessing}
        onClose={onClose}
      />
    )
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 컨테이너 */}
      <aside
        className={[
          'fixed lg:static inset-y-0 z-50 transition-transform duration-300 ease-in-out',
          sidebarPosition === 'left' ? 'left-0' : 'right-0',
          sidebarPosition === 'left' ? 'flex flex-row' : 'flex flex-row-reverse',
          sidebarPosition === 'left'
            ? isOpen
              ? 'translate-x-0 lg:translate-x-0'
              : '-translate-x-full lg:-translate-x-full'
            : isOpen
              ? 'translate-x-0 lg:translate-x-0'
              : 'translate-x-full lg:translate-x-full',
          isOpen ? 'lg:w-[23rem]' : 'lg:w-0',
          isOpen ? 'lg:pointer-events-auto' : 'lg:pointer-events-none',
          isOpen ? '' : 'lg:overflow-hidden'
        ].join(' ')}
      >
        {/* 아이콘 네비게이션 바 */}
        <div className={`w-12 bg-gray-100 dark:bg-[#1e1e1e] flex flex-col items-center py-4 ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-gray-200 dark:border-[#3e3e42]`}>
          {/* 탐색기 아이콘 */}
          <button
            onClick={() => setActivePanel('explorer')}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2
              ${activePanel === 'explorer'
                ? 'bg-amber-200 dark:bg-[#569cd6] text-amber-700 dark:text-[#cccccc]'
                : 'hover:bg-gray-200 dark:hover:bg-[#252526] text-gray-600 dark:text-[#9d9d9d]'
              }
            `}
            title="탐색기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </button>

          {/* 즐겨찾기 아이콘 */}
          <button
            onClick={() => setActivePanel('favorites')}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2
              ${activePanel === 'favorites'
                ? 'bg-amber-200 dark:bg-[#569cd6] text-amber-700 dark:text-[#cccccc]'
                : 'hover:bg-gray-200 dark:hover:bg-[#252526] text-gray-600 dark:text-[#9d9d9d]'
              }
            `}
            title="즐겨찾기"
          >
            <svg
              className="w-6 h-6"
              fill={activePanel === 'favorites' ? 'currentColor' : 'none'}
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
          </button>

          {/* 검색 아이콘 */}
          <button
            onClick={() => setActivePanel('search')}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2
              ${activePanel === 'search'
                ? 'bg-amber-200 dark:bg-[#569cd6] text-amber-700 dark:text-[#cccccc]'
                : 'hover:bg-gray-200 dark:hover:bg-[#252526] text-gray-600 dark:text-[#9d9d9d]'
              }
            `}
            title="검색"
          >
            <svg
              className="w-6 h-6"
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
          </button>

          {/* 휴지통 아이콘 */}
          <button
            onClick={() => setActivePanel('trash')}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${activePanel === 'trash'
                ? 'bg-amber-200 dark:bg-[#569cd6] text-amber-700 dark:text-[#cccccc]'
                : 'hover:bg-gray-200 dark:hover:bg-[#252526] text-gray-600 dark:text-[#9d9d9d]'
              }
            `}
            title="휴지통"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-3-4h4a1 1 0 011 1v1H8V4a1 1 0 011-1h4z"
              />
            </svg>
          </button>
        </div>

        {/* 패널 영역 */}
        <div className={`w-80 bg-white dark:bg-[#252526] ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-gray-200 dark:border-[#3e3e42] flex flex-col`}>
          {panelContent}
        </div>
      </aside>

      {/* 사이드바 우클릭 메뉴 */}
      {showContextMenu && createPortal(
        <>
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
            className="fixed z-[10000] w-48 bg-white dark:bg-[#252526] rounded-lg shadow-xl border border-gray-200 dark:border-[#3e3e42] py-1"
            style={{
              top: `${contextMenuPosition.top}px`,
              left: `${contextMenuPosition.left}px`,
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={handleCreateFolder}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-amber-100 dark:hover:bg-[#1e1e1e] flex items-center transition-colors"
            >
              <svg
                className="w-4 h-4 mr-3 text-gray-600 dark:text-[#9d9d9d]"
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
