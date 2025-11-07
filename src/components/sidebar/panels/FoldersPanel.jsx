import FolderTree from '../FolderTree'
import NoteList from '../NoteList'

function FoldersPanel({
  folders,
  selectedFolderId,
  onFolderSelect,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote
}) {
  // 선택된 폴더의 메모만 필터링
  const filteredNotes = selectedFolderId
    ? notes.filter(note => note.data.folder_id === selectedFolderId)
    : []

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#cccccc]">
            폴더
          </h2>
          <button
            onClick={() => onNewFolder(null)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
            aria-label="새 폴더"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-[#9d9d9d]"
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
          </button>
        </div>
      </div>

      {/* 폴더 트리 */}
      <div className="p-4 border-b border-gray-200 dark:border-[#3e3e42] overflow-y-auto" style={{ maxHeight: '40%' }}>
        {folders && folders.length > 0 ? (
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateFolder={onNewFolder}
          />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-[#9d9d9d] text-sm">
            폴더가 없습니다
            <br />
            <span className="text-xs">위 + 버튼을 눌러 폴더를 만드세요</span>
          </div>
        )}
      </div>

      {/* 선택된 폴더의 메모 목록 */}
      <div className="flex-1 overflow-y-auto">
        {selectedFolderId ? (
          filteredNotes.length > 0 ? (
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={onNoteSelect}
              onDeleteNote={onDeleteNote}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#9d9d9d] text-sm">
              이 폴더에 메모가 없습니다
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#9d9d9d] text-sm">
            폴더를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}

export default FoldersPanel
