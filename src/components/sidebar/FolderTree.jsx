import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NoteItemSimple, currentDraggedItem, setCurrentDraggedItem } from './NoteList'

function FolderItem({
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
    // localStorage에서 확장 상태 복원
    const saved = localStorage.getItem(`folder-expanded-${folder.id}`)
    return saved ? JSON.parse(saved) : true
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.data.name)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const [dropPosition, setDropPosition] = useState(null) // 'before' | 'after' | 'inside' | null
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)

  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = folder.id === selectedFolderId

  // 이 폴더에 속한 메모들
  const folderNotes = notes.filter(note => note.data.folder_id === folder.id)

  // HTML5 Drag & Drop - 드래그 시작
  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault()
      return
    }

    setIsDragging(true)
    console.log('🔵 폴더 드래그 시작:', folder.id, folder.data.name)

    const dragData = {
      type: 'FOLDER',
      id: folder.id,
      data: folder.data
    }

    setCurrentDraggedItem(dragData)
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
  }

  // HTML5 Drag & Drop - 드래그 종료
  const handleDragEnd = (e) => {
    setIsDragging(false)
    setCurrentDraggedItem(null)
    console.log('🔵 폴더 드래그 종료:', folder.id)
  }

  // HTML5 Drag & Drop - 드래그 오버
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const item = currentDraggedItem

    if (!item) {
      e.dataTransfer.dropEffect = 'move'
      setIsOver(true)
      setDropPosition('inside')
      return
    }

    if (item.type === 'FOLDER' && item.id === folder.id) {
      e.dataTransfer.dropEffect = 'none'
      setIsOver(false)
      setDropPosition(null)
      return
    }

    if (item.type === 'FOLDER' && item.data.parent_id === folder.data.parent_id) {
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
      setIsOver(position === 'inside')
      e.dataTransfer.dropEffect = 'move'
      return
    }

    if (item.type === 'NOTE') {
      const note = notes.find(n => n.id === item.id)
      if (note && note.data.folder_id === folder.id) {
        e.dataTransfer.dropEffect = 'none'
        setIsOver(false)
        setDropPosition(null)
        return
      }
    }
    if (item.type === 'FOLDER') {
      if (item.data.parent_id === folder.id) {
        e.dataTransfer.dropEffect = 'none'
        setIsOver(false)
        setDropPosition(null)
        return
      }
    }

    setIsOver(true)
    setDropPosition('inside')
    e.dataTransfer.dropEffect = 'move'
  }

  // HTML5 Drag & Drop - 드래그 진입
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(true)
  }

  // HTML5 Drag & Drop - 드래그 나감
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setIsOver(false)
    setDropPosition(null)
  }

  // HTML5 Drag & Drop - 드롭
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const position = dropPosition
    setIsOver(false)
    setDropPosition(null)

    console.log('🎯 [FolderItem] 드롭 이벤트:', { position, targetFolderId: folder.id, targetFolderName: folder.data.name })

    if (!position) {
      console.log('⚠️ [FolderItem] position 없음, 드롭 취소')
      return
    }

    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) {
        console.log('⚠️ [FolderItem] 드래그 데이터 없음')
        return
      }

      const item = JSON.parse(data)
      console.log('🎯 [FolderItem] 파싱된 아이템:', {
        type: item.type,
        id: item.id,
        name: item.data?.name || item.data?.title,
        parentId: item.data?.parent_id
      })

      if (item.type === 'FOLDER' && item.data.parent_id === folder.data.parent_id && position && position !== 'inside') {
        if (item.id !== folder.id) {
          console.log('✅ [FolderItem] onReorderFolder 호출:', {
            draggedFolderId: item.id,
            draggedFolderName: item.data?.name,
            targetFolderId: folder.id,
            targetFolderName: folder.data.name,
            position,
            sameParent: item.data.parent_id === folder.data.parent_id
          })
          onReorderFolder?.(item.id, folder.id, position)
        } else {
          console.log('⚠️ [FolderItem] 자기 자신에게 드롭, 무시')
        }
        return
      } else if (item.type === 'FOLDER') {
        console.log('⚠️ [FolderItem] 폴더 순서 변경 조건 불만족:', {
          isFolder: item.type === 'FOLDER',
          sameParent: item.data.parent_id === folder.data.parent_id,
          hasPosition: !!position,
          positionNotInside: position !== 'inside',
          draggedParent: item.data.parent_id,
          targetParent: folder.data.parent_id
        })
      }

      console.log('✅ [FolderItem] 폴더/메모를 폴더 안으로 이동:', item.type, '-> 폴더:', folder.id)

      if (item.type === 'NOTE') {
        if (item.data.folder_id !== folder.id) {
          console.log('✅ [FolderItem] onMoveNote 호출:', item.id, '->', folder.id)
          onMoveNote(item.id, folder.id)
        }
      } else if (item.type === 'FOLDER') {
        if (item.id !== folder.id && item.data.parent_id !== folder.id) {
          console.log('✅ [FolderItem] onMoveFolder 호출:', item.id, '->', folder.id)
          onMoveFolder(item.id, folder.id)
        }
      }
    } catch (err) {
      console.error('❌ [FolderItem] 드롭 처리 오류:', err)
    }
  }

  // 확장/축소 토글
  const toggleExpand = (e) => {
    e.stopPropagation()
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    localStorage.setItem(`folder-expanded-${folder.id}`, JSON.stringify(newExpanded))
  }

  // 폴더 클릭 (확장/축소만)
  const handleClick = (e) => {
    if (isEditing) return
    toggleExpand(e)
  }

  // 메뉴 위치 계산 및 열기 공통 로직
  const openMenu = (clientX, clientY) => {
    const menuWidth = 192 // w-48 = 192px
    const menuHeight = 150 // 대략적인 메뉴 높이

    // 화면 경계 체크
    let top = clientY
    let left = clientX

    // 화면 아래로 넘어가면 위로 표시
    if (top + menuHeight > window.innerHeight) {
      top = clientY - menuHeight
    }

    // 화면 오른쪽으로 넘어가면 왼쪽 정렬
    if (left + menuWidth > window.innerWidth) {
      left = clientX - menuWidth
    }

    // 화면 왼쪽으로 넘어가면 오른쪽 정렬
    if (left < 0) {
      left = 8
    }

    // 화면 위로 넘어가면 아래로 조정
    if (top < 0) {
      top = 8
    }

    setMenuPosition({ top, left })
    setShowMenu(true)
  }

  // ... 버튼 클릭으로 메뉴 토글
  const handleMenuToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (showMenu) {
      setShowMenu(false)
      return
    }

    if (!buttonRef.current) {
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    openMenu(rect.right, rect.bottom + 4)
  }

  // 우클릭으로 메뉴 열기
  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()

    openMenu(e.clientX, e.clientY)
  }

  // 외부 클릭은 오버레이로 처리하므로 별도 useEffect 불필요

  // 이름 변경 시작
  const startRename = () => {
    setIsEditing(true)
    setShowMenu(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // 이름 변경 완료
  const handleRename = () => {
    if (editName.trim() && editName !== folder.data.name) {
      onRenameFolder(folder.id, editName.trim())
    } else {
      setEditName(folder.data.name)
    }
    setIsEditing(false)
  }

  // 이름 변경 취소
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditName(folder.data.name)
      setIsEditing(false)
    }
  }

  // 폴더 삭제
  const handleDelete = () => {
    if (confirm(`"${folder.data.name}" 폴더를 삭제하시겠습니까?\n\n⚠️ 폴더 내의 모든 메모도 함께 삭제됩니다.`)) {
      onDeleteFolder(folder.id)
    }
    setShowMenu(false)
  }

  // 하위 폴더 생성
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
          <div className="h-1 bg-orange-500 dark:bg-indigo-500 animate-pulse shadow-lg" />
          <div className="absolute top-0 left-0 right-0 h-8 bg-orange-100 dark:bg-indigo-900/40 opacity-60 -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1 bg-orange-500 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
              ↑ 위에 놓기
            </div>
          </div>
        </div>
      )}

      {/* 폴더 아이템 */}
      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        data-folder-item
        className={`
          relative flex items-center px-2 py-1 rounded-lg transition-all duration-200 group
          ${isSelected ? 'bg-orange-100 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}
          ${isDragging ? 'opacity-30 cursor-grabbing scale-95' : 'cursor-grab hover:scale-[1.01]'}
          ${dropPosition === 'inside' ? 'ring-4 ring-orange-500 dark:ring-indigo-500 bg-orange-50 dark:bg-indigo-900/20 scale-[1.03] shadow-xl' : ''}
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
            isExpanded ? 'text-orange-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
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
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-orange-500 dark:border-indigo-500 rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm truncate ${
              isSelected
                ? 'text-orange-700 dark:text-indigo-300 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {folder.data.name}
          </span>
        )}

        {/* ... 메뉴 버튼 (hover 시 표시) */}
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

        {/* 드롭다운 메뉴 - Portal로 body에 직접 렌더링 */}
        {showMenu && createPortal(
          <>
            {/* 투명 오버레이 - 뒤의 요소들과 메뉴 분리 */}
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
              className="fixed z-[10000] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
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
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                하위 폴더 생성
              </button>
              <button
                onClick={startRename}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          <div className="h-1 bg-orange-500 dark:bg-indigo-500 animate-pulse shadow-lg" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-orange-100 dark:bg-indigo-900/40 opacity-60 translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="px-3 py-1 bg-orange-500 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
              ↓ 아래에 놓기
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
