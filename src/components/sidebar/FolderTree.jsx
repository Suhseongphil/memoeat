import { useState, useRef, memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { NoteItemSimple } from './NoteList'

const FolderItem = memo(function FolderItem({
  folder,
  selectedFolderId,
  onFolderSelect,
  onRenameFolder,
  onDeleteFolder,
  onCreateSubfolder,
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onRenameNote,
  onToggleFavorite,
  onMoveNote,
  onMoveFolder,
  onReorderFolder,
  onReorderNote,
  level = 0
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`folder-expanded-${folder.id}`)
    return saved ? JSON.parse(saved) : true
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.data.name)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dropPosition, setDropPosition] = useState(null) // 'before' | 'after' | 'inside' | null
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)

  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = folder.id === selectedFolderId

  // 이 폴더에 속한 메모들
  const folderNotes = useMemo(() => {
    return notes.filter(note => note.data.folder_id === folder.id)
  }, [notes, folder.id])

  // 드래그 시작
  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault()
      return
    }

    setIsDragging(true)

    const dragData = {
      type: 'FOLDER',
      id: folder.id,
      parent_id: folder.data.parent_id
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    
    // 드래그 오버 이벤트에서도 사용할 수 있도록 window에 임시 저장
    window.__dragData = dragData
  }

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false)
    setDropPosition(null)
    // 임시 데이터 정리 (어디서 끝나든 정리)
    window.__dragData = null
  }

  // 드래그 오버
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // 드래그 오버에서는 getData를 사용할 수 없으므로 window 객체에서 데이터 가져오기
    const item = window.__dragData
    
    if (!item) {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }

    // 자기 자신으로는 드롭 불가
    if (item.type === 'FOLDER' && item.id === folder.id) {
      e.dataTransfer.dropEffect = 'none'
      setDropPosition(null)
      return
    }

    // 같은 부모를 가진 폴더끼리는 순서 변경 (before/after)
    if (item.type === 'FOLDER' && item.parent_id === folder.data.parent_id) {
      const rect = e.currentTarget.getBoundingClientRect()
      const relativeY = e.clientY - rect.top
      const height = rect.height

      let position
      if (relativeY < height * 0.25) {
        position = 'before'
      } else if (relativeY > height * 0.75) {
        position = 'after'
      } else {
        position = 'inside'
      }

      setDropPosition(position)
      e.dataTransfer.dropEffect = 'move'
      return
    }

    // 메모를 폴더로 이동
    if (item.type === 'NOTE') {
      const note = notes.find(n => n.id === item.id)
      // 이미 이 폴더에 있으면 드롭 불가
      if (note && note.data.folder_id === folder.id) {
        e.dataTransfer.dropEffect = 'none'
        setDropPosition(null)
        return
      }
      setDropPosition('inside')
      e.dataTransfer.dropEffect = 'move'
      return
    }

    // 폴더를 다른 폴더로 이동
    if (item.type === 'FOLDER') {
      // 이미 이 폴더의 자식이면 드롭 불가
      if (item.parent_id === folder.id) {
        e.dataTransfer.dropEffect = 'none'
        setDropPosition(null)
        return
      }
      setDropPosition('inside')
      e.dataTransfer.dropEffect = 'move'
      return
    }

    e.dataTransfer.dropEffect = 'none'
    setDropPosition(null)
  }

  // 드래그 나감
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setDropPosition(null)
  }

  // 드롭
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const position = dropPosition
    setDropPosition(null)

    try {
      // 드롭 이벤트에서는 getData 사용 가능
      const data = e.dataTransfer.getData('application/json')
      let item
      
      if (data) {
        item = JSON.parse(data)
      } else {
        // getData가 실패한 경우 window 객체에서 가져오기
        item = window.__dragData
      }
      
      if (!item) return

      // 같은 부모를 가진 폴더끼리 순서 변경
      if (item.type === 'FOLDER' && item.parent_id === folder.data.parent_id && position && position !== 'inside') {
        if (item.id !== folder.id) {
          onReorderFolder?.(item.id, folder.id, position)
        }
        window.__dragData = null
        return
      }

      // 메모를 폴더로 이동
      if (item.type === 'NOTE' && position === 'inside') {
        const note = notes.find(n => n.id === item.id)
        if (note && note.data.folder_id !== folder.id) {
          onMoveNote(item.id, folder.id)
        }
        window.__dragData = null
        return
      }

      // 폴더를 다른 폴더로 이동
      if (item.type === 'FOLDER' && position === 'inside') {
        if (item.id !== folder.id && item.parent_id !== folder.id) {
          onMoveFolder(item.id, folder.id)
        }
        window.__dragData = null
        return
      }
      
      window.__dragData = null
    } catch (err) {
      console.error('드롭 처리 오류:', err)
      window.__dragData = null
    }
  }

  // 확장/축소 토글
  const toggleExpand = (e) => {
    e.stopPropagation()
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    localStorage.setItem(`folder-expanded-${folder.id}`, JSON.stringify(newExpanded))
  }

  // 폴더 클릭
  const handleClick = (e) => {
    if (isEditing) return
    toggleExpand(e)
  }

  // 메뉴 위치 계산 및 열기
  const openMenu = (clientX, clientY) => {
    const menuWidth = 192
    const menuHeight = 150

    let top = clientY
    let left = clientX

    if (top + menuHeight > window.innerHeight) {
      top = clientY - menuHeight
    }
    if (left + menuWidth > window.innerWidth) {
      left = clientX - menuWidth
    }
    if (left < 0) left = 8
    if (top < 0) top = 8

    setMenuPosition({ top, left })
    setShowMenu(true)
  }

  const handleMenuToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (showMenu) {
      setShowMenu(false)
      return
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      openMenu(rect.right, rect.bottom + 4)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openMenu(e.clientX, e.clientY)
  }

  const startRename = () => {
    setIsEditing(true)
    setShowMenu(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleRename = () => {
    if (editName.trim() && editName !== folder.data.name) {
      onRenameFolder(folder.id, editName.trim())
    } else {
      setEditName(folder.data.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditName(folder.data.name)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    onDeleteFolder(folder.id)
    setShowMenu(false)
  }

  const handleCreateSubfolder = () => {
    onCreateSubfolder(folder.id)
    setIsExpanded(true)
    setShowMenu(false)
  }

  return (
    <div className="select-none relative">
      {/* 상단 드롭 인디케이터 */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="h-1 bg-amber-500 dark:bg-[#569cd6] animate-pulse" />
        </div>
      )}

      {/* 폴더 아이템 */}
      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        data-folder-item
        className={`
          relative flex items-center px-2 py-1 rounded-lg transition-all duration-200 group
          ${isSelected ? 'bg-amber-100 dark:bg-[#1e1e1e]' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}
          ${isDragging ? 'opacity-30 cursor-grabbing scale-95' : 'cursor-grab hover:scale-[1.01]'}
          ${dropPosition === 'inside' ? 'ring-4 ring-amber-500 dark:ring-[#569cd6] bg-amber-50 dark:bg-[#1e1e1e]/20 scale-[1.03] shadow-xl' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px`, userSelect: 'none' }}
        onClick={handleClick}
      >
        {/* 확장/축소 아이콘 */}
        <button
          onClick={toggleExpand}
          className="p-0.5 mr-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <svg
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 폴더 아이콘 */}
        <svg
          className={`w-4 h-4 mr-2 flex-shrink-0 ${
            isExpanded ? 'text-amber-600 dark:text-[#569cd6]' : 'text-gray-500 dark:text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>

        {/* 폴더 이름 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-amber-500 dark:border-[#569cd6] rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm truncate ${
              isSelected
                ? 'text-amber-700 dark:text-[#569cd6] font-medium'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {folder.data.name}
          </span>
        )}

        {/* 메뉴 버튼 */}
        {!isEditing && (
          <button
            ref={buttonRef}
            onClick={handleMenuToggle}
            className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        )}

        {/* 드롭다운 메뉴 */}
        {showMenu && createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
              }}
              style={{ pointerEvents: 'auto' }}
            />
            <div
              ref={menuRef}
              className="fixed z-[10000] w-48 bg-white dark:bg-[#252526] rounded-lg shadow-xl border border-gray-200 dark:border-[#3e3e42] py-1"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCreateSubfolder}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                하위 폴더 생성
              </button>
              <button
                onClick={startRename}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                이름 변경
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                삭제
              </button>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* 하위 폴더들 & 메모들 */}
      {isExpanded && (
        <div>
          {/* 하위 폴더들 (재귀) */}
          {hasChildren && folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={onCreateSubfolder}
              notes={notes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={onNoteSelect}
              onDeleteNote={onDeleteNote}
              onRenameNote={onRenameNote}
              onToggleFavorite={onToggleFavorite}
              onMoveNote={onMoveNote}
              onMoveFolder={onMoveFolder}
              onReorderFolder={onReorderFolder}
              onReorderNote={onReorderNote}
              level={level + 1}
            />
          ))}

          {/* 이 폴더에 속한 메모들 */}
          {folderNotes.map((note) => (
            <NoteItemSimple
              key={note.id}
              note={note}
              selectedNoteId={selectedNoteId}
              onNoteSelect={onNoteSelect}
              onDeleteNote={onDeleteNote}
              onRenameNote={onRenameNote}
              onToggleFavorite={onToggleFavorite}
              onMoveNote={onMoveNote}
              onReorderNote={onReorderNote}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* 하단 드롭 인디케이터 */}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="h-1 bg-amber-500 dark:bg-[#569cd6] animate-pulse" />
        </div>
      )}
    </div>
  )
})

function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onRenameNote,
  onToggleFavorite,
  onMoveNote,
  onMoveFolder,
  onReorderFolder,
  onReorderNote,
  level = 0
}) {
  return (
    <div className="space-y-0">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateSubfolder={onCreateFolder}
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={onNoteSelect}
          onDeleteNote={onDeleteNote}
          onRenameNote={onRenameNote}
          onToggleFavorite={onToggleFavorite}
          onMoveNote={onMoveNote}
          onMoveFolder={onMoveFolder}
          onReorderFolder={onReorderFolder}
          onReorderNote={onReorderNote}
          level={level}
        />
      ))}
    </div>
  )
}

export default FolderTree
