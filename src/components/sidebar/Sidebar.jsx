import { useState, useRef, useEffect } from 'react'
import { NoteItemSimple } from './NoteList'
import SearchPanel from './SearchPanel'
import FavoritesPanel from './FavoritesPanel'
import TrashPanel from './TrashPanel'

function SidebarContent({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote,
  onToggleFavorite,
  onReorderNote,
  isOpen,
  onClose,
  sidebarPosition = 'left',
  trashedNotes = [],
  onRestoreTrashedNote,
  onDeleteTrashedNote,
  onEmptyTrash,
  isTrashLoading,
  isTrashProcessing
}) {
  const [activePanel, setActivePanel] = useState('explorer')
  const trashCount = trashedNotes?.length || 0
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
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
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

  let panelContent = null

  if (activePanel === 'explorer') {
    panelContent = (
      <>
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">
              메모
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

        {/* 메모 리스트 - 스크롤 영역 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative custom-scrollbar"
        >
          {notes.length > 0 ? (
            <div className="px-2 pt-4 pb-4">
              {notes.map((note) => (
                <NoteItemSimple
                  key={note.id}
                  note={note}
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={handleNoteSelect}
                  onDeleteNote={onDeleteNote}
                  onRenameNote={onRenameNote}
                  onToggleFavorite={onToggleFavorite}
                  onReorderNote={onReorderNote}
                  level={0}
                />
              ))}
            </div>
          ) : (
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
        trashedNotes={trashedNotes}
        onRestoreNote={onRestoreTrashedNote}
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
          {/* 메모 아이콘 */}
          <button
            onClick={() => setActivePanel('explorer')}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2
              ${activePanel === 'explorer'
                ? 'bg-amber-200 dark:bg-[#569cd6] text-amber-700 dark:text-[#cccccc]'
                : 'hover:bg-gray-200 dark:hover:bg-[#252526] text-gray-600 dark:text-[#9d9d9d]'
              }
            `}
            title="메모"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
    </>
  )
}

export default SidebarContent
