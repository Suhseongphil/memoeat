function ActivityBar({ activeView, onViewChange, isCollapsed, onToggleCollapse }) {
  const views = [
    {
      id: 'notes',
      name: '메모',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )
    },
    {
      id: 'favorites',
      name: '즐겨찾기',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )
    }
  ]

  const handleViewClick = (viewId) => {
    // 같은 뷰를 클릭하면 사이드바 토글
    if (activeView === viewId) {
      onToggleCollapse()
    } else {
      onViewChange(viewId)
      // 사이드바가 접혀있었다면 펼치기
      if (isCollapsed) {
        onToggleCollapse()
      }
    }
  }

  return (
    <div className="w-12 bg-gray-900 dark:bg-gray-950 flex flex-col items-center py-2 border-r border-gray-800 dark:border-gray-900">
      {/* 뷰 버튼들 */}
      <div className="flex flex-col space-y-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => handleViewClick(view.id)}
            className={`
              p-2 rounded-lg transition-colors relative
              ${
                activeView === view.id && !isCollapsed
                  ? 'text-white bg-gray-700 dark:bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-900'
              }
            `}
            title={view.name}
            aria-label={view.name}
          >
            {view.icon}
            {/* 활성 표시 바 */}
            {activeView === view.id && !isCollapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-500 dark:bg-[#569cd6] rounded-r" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ActivityBar
