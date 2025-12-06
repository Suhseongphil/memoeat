/**
 * 스켈레톤 로더 컴포넌트
 * 콘텐츠 로딩 중 플레이스홀더 UI를 표시합니다
 */

// 기본 스켈레톤 박스
export function SkeletonBox({ className = '', width = 'w-full', height = 'h-4' }) {
  return (
    <div
      className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    />
  )
}

// 사이드바 메모 목록 스켈레톤
export function NoteListSkeleton({ count = 5 }) {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse"
        >
          {/* 제목 */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          {/* 내용 미리보기 */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

// 에디터 스켈레톤
export function EditorSkeleton() {
  return (
    <div className="flex-1 p-8 space-y-4">
      {/* 제목 */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />

      {/* 툴바 */}
      <div className="flex space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
        ))}
      </div>

      {/* 에디터 내용 */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// 사이드바 전체 스켈레톤
export function SidebarSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 animate-pulse"
          />
        ))}
      </div>

      {/* 메모 목록 */}
      <div className="flex-1 overflow-hidden">
        <NoteListSkeleton count={8} />
      </div>
    </div>
  )
}

// 카드 스켈레톤 (관리자 페이지용)
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 테이블 스켈레톤 (관리자 페이지용)
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-4 py-3 text-left">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
