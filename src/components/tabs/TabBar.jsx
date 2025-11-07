function TabBar({ openedNotes, activeTabId, onTabChange, onTabClose }) {
  const handleTabClick = (noteId) => {
    if (noteId !== activeTabId) {
      onTabChange(noteId)
    }
  }

  const handleCloseClick = (e, noteId) => {
    e.stopPropagation() // 탭 선택 이벤트 방지
    onTabClose(noteId)
  }

  if (openedNotes.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e42]">
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#3e3e42]">
        {openedNotes.map((note) => {
          const isActive = note.id === activeTabId
          const title = note.data.title || '제목 없음'

          return (
            <div
              key={note.id}
              onClick={() => handleTabClick(note.id)}
              className={`
                flex items-center space-x-6 pl-4 pr-2 py-2.5 border-r border-gray-200 dark:border-[#3e3e42]
                cursor-pointer transition-colors min-w-0 max-w-xs group
                ${
                  isActive
                    ? 'bg-gray-50 dark:bg-[#1e1e1e] border-b-2 border-b-blue-500 dark:border-b-[#569cd6]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#2d2d30]'
                }
              `}
            >
              {/* 탭 제목 */}
              <span
                className={`text-sm truncate flex-1 ${
                  isActive
                    ? 'text-gray-900 dark:text-[#cccccc] font-medium'
                    : 'text-gray-600 dark:text-[#9d9d9d]'
                }`}
                title={title}
              >
                {title}
              </span>

              {/* 닫기 버튼 */}
              <button
                onClick={(e) => handleCloseClick(e, note.id)}
                className={`
                  p-0.5 rounded hover:bg-gray-200 dark:hover:bg-[#3e3e42]
                  transition-colors flex-shrink-0
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                aria-label="탭 닫기"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-[#9d9d9d] hover:text-gray-700 dark:hover:text-[#cccccc]"
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
          )
        })}
      </div>
    </div>
  )
}

export default TabBar
