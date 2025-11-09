import { useMemo } from 'react'
import { NoteItemSimple } from './NoteList'

function FavoritesPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onRenameNote,
  onToggleFavorite,
  onMoveNote,
  onReorderNote,
  onClose
}) {
  // 즐겨찾기 메모만 필터링
  const favoriteNotes = useMemo(() => {
    return notes.filter(note => note.data.is_favorite === true)
  }, [notes])

  const handleNoteSelect = (noteId) => {
    onNoteSelect(noteId)
    // 모바일에서는 메모 선택 후 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  return (
    <>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">
            즐겨찾기
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
      </div>

      {/* 즐겨찾기 메모 리스트 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {favoriteNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-[#9d9d9d] text-sm">
            즐겨찾기한 메모가 없습니다
          </div>
        ) : (
          <div className="p-2">
            {favoriteNotes.map((note) => (
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
                level={0}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default FavoritesPanel
