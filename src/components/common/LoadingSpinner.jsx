function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1e1e1e]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 dark:border-[#569cd6] border-t-transparent mb-4"></div>
        <p className="text-gray-600 dark:text-[#9d9d9d]">로딩 중...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

