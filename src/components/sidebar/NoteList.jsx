function NoteList({ notes, selectedNoteId, onNoteSelect, onDeleteNote }) {
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

  const handleDelete = (e, noteId) => {
    e.stopPropagation() // 메모 선택 이벤트 방지
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      onDeleteNote(noteId)
    }
  }

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
      {notes.map((note) => {
        const noteData = note.data
        const isSelected = note.id === selectedNoteId

        return (
          <div
            key={note.id}
            onClick={() => onNoteSelect(note.id)}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
              isSelected
                ? 'bg-orange-50 dark:bg-indigo-900/20 border-l-4 border-orange-500 dark:border-indigo-500'
                : ''
            }`}
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
                onClick={(e) => handleDelete(e, note.id)}
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
      })}
    </div>
  )
}

export default NoteList
