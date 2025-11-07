import NoteList from '../NoteList'

function FavoritesPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote
}) {
  // 즐겨찾기 메모만 필터링
  const favoriteNotes = notes.filter(note => note.data.is_favorite)

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">
            즐겨찾기
          </h2>
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-yellow-500 fill-current"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span className="text-sm text-gray-600 dark:text-[#9d9d9d]">
              {favoriteNotes.length}개
            </span>
          </div>
        </div>
      </div>

      {/* 즐겨찾기 메모 목록 */}
      <div className="flex-1 overflow-y-auto">
        {favoriteNotes.length > 0 ? (
          <NoteList
            notes={favoriteNotes}
            selectedNoteId={selectedNoteId}
            onNoteSelect={onNoteSelect}
            onDeleteNote={onDeleteNote}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-[#9d9d9d]">
            <svg
              className="w-16 h-16 mb-4 text-gray-300 dark:text-[#2d2d30]"
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
            <p className="text-sm">즐겨찾기한 메모가 없습니다</p>
            <p className="text-xs mt-2">메모 에디터에서 별 아이콘을 눌러</p>
            <p className="text-xs">즐겨찾기에 추가하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPanel
