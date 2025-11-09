import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/common/Header'
import Sidebar from '../components/sidebar/Sidebar'
import TabBar from '../components/tabs/TabBar'
import Editor from '../components/editor/Editor'
import { getNotes, createNote, updateNote, deleteNote, reorderNotes, toggleFavorite } from '../services/notes'
import { getFolders, createFolder, updateFolder, deleteFolder, buildFolderTree, reorderFolders } from '../services/folders'
import { useAuthStore } from '../stores/authStore'

function MainPage() {
  const queryClient = useQueryClient()
  // ProtectedRoute에서 이미 인증 체크 및 사용자 정보 로드 완료
  const { user, preferences } = useAuthStore()

  const [openedNotes, setOpenedNotes] = useState([]) // 열린 탭들의 ID 배열
  const [activeTabId, setActiveTabId] = useState(null) // 현재 활성 탭 ID
  const [selectedFolderId, setSelectedFolderId] = useState(null) // 선택된 폴더 ID
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024 // 데스크톱에서는 기본적으로 열기, 모바일은 닫기
  })

  // 사용자 이름 추출 (이메일의 @ 앞부분)
  const userName = user?.email ? user.email.split('@')[0] : 'User'

  // 사이드바 위치 결정
  const sidebarPosition = preferences?.sidebarPosition || 'left'

  // 다크모드 여부
  const isDark = preferences?.theme === 'dark'

  // 폴더 목록 가져오기
  const { data: foldersData = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { folders, error } = await getFolders(user.id)
      if (error) {
        console.error('폴더 로딩 오류:', error)
        return []
      }
      return folders
    },
    enabled: !!user?.id,
    staleTime: 0
  })

  // 폴더 트리 구조 생성
  const folderTree = buildFolderTree(foldersData)

  // 메모 목록 가져오기
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { notes, error } = await getNotes(user.id, {})
      if (error) {
        console.error('메모 로딩 오류:', error)
        return []
      }

      return notes
    },
    enabled: !!user?.id,
    staleTime: 0
  })

  // 열린 탭들의 실제 메모 객체 가져오기
  const openedNotesData = openedNotes
    .map((noteId) => notes.find((n) => n.id === noteId))
    .filter(Boolean) // null/undefined 제거

  // 현재 활성 탭의 메모
  const selectedNote = notes.find((n) => n.id === activeTabId) || null

  // 새 메모 생성
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const { note, error } = await createNote(user.id, {
        title: '새 메모',
        content: ''
      })
      if (error) throw new Error(error)
      return note
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries(['notes'])
      // 새 메모를 탭으로 열기
      setOpenedNotes((prev) => [...prev, newNote.id])
      setActiveTabId(newNote.id)
    },
    onError: (error) => {
      alert(`메모 생성 실패: ${error.message}`)
    }
  })

  // 메모 업데이트 (사이드바 업데이트 없음)
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, updates }) => {
      const { note, error } = await updateNote(noteId, updates)
      if (error) throw new Error(error)
      return note
    },
    onError: (error) => {
      console.error('메모 업데이트 오류:', error)
    }
  })

  // 메모 업데이트 (사이드바 업데이트 포함 - 즐겨찾기용)
  const updateNoteWithRefreshMutation = useMutation({
    mutationFn: async ({ noteId, updates }) => {
      const { note, error } = await updateNote(noteId, updates)
      if (error) throw new Error(error)
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes'])
    },
    onError: (error) => {
      console.error('메모 업데이트 오류:', error)
    }
  })

  // 메모 삭제
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const { success, error } = await deleteNote(noteId)
      if (error) throw new Error(error)
      return success
    },
    onSuccess: (_, deletedNoteId) => {
      queryClient.invalidateQueries(['notes'])
      // 삭제된 메모가 열린 탭에 있으면 해당 탭 닫기
      setOpenedNotes((prev) => {
        const newOpenedNotes = prev.filter((id) => id !== deletedNoteId)
        // 삭제된 탭이 활성 탭이었다면 다른 탭으로 전환
        if (activeTabId === deletedNoteId) {
          const deletedIndex = prev.indexOf(deletedNoteId)
          if (newOpenedNotes.length > 0) {
            // 이전 탭 or 다음 탭으로 전환
            const newActiveIndex = Math.max(0, deletedIndex - 1)
            setActiveTabId(newOpenedNotes[newActiveIndex])
          } else {
            setActiveTabId(null)
          }
        }
        return newOpenedNotes
      })
    },
    onError: (error) => {
      alert(`메모 삭제 실패: ${error.message}`)
    }
  })

  // 폴더 생성
  const createFolderMutation = useMutation({
    mutationFn: async (parentId = null) => {
      const { folder, error } = await createFolder(user.id, {
        name: '새 폴더',
        parent_id: parentId
      })
      if (error) throw new Error(error)
      return folder
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['folders'])
    },
    onError: (error) => {
      alert(`폴더 생성 실패: ${error.message}`)
    }
  })

  // 폴더 이름 변경
  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, name }) => {
      const { folder, error } = await updateFolder(folderId, { name })
      if (error) throw new Error(error)
      return folder
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['folders'])
    },
    onError: (error) => {
      alert(`폴더 이름 변경 실패: ${error.message}`)
    }
  })

  // 폴더 삭제
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      const { success, error} = await deleteFolder(folderId)
      if (error) throw new Error(error)
      return success
    },
    onSuccess: (_, deletedFolderId) => {
      queryClient.invalidateQueries(['folders'])
      // 삭제된 폴더가 선택되어 있었다면 선택 해제
      if (selectedFolderId === deletedFolderId) {
        setSelectedFolderId(null)
      }
    },
    onError: (error) => {
      alert(`폴더 삭제 실패: ${error.message}`)
    }
  })

  const handleNewNote = () => {
    createNoteMutation.mutate()
  }

  const handleNewFolder = (parentId = null) => {
    createFolderMutation.mutate(parentId)
  }

  const handleFolderSelect = (folderId) => {
    // 같은 폴더 클릭 시 필터 해제
    setSelectedFolderId(folderId === selectedFolderId ? null : folderId)
  }

  const handleRenameFolder = (folderId, name) => {
    renameFolderMutation.mutate({ folderId, name })
  }

  const handleDeleteFolder = (folderId) => {
    deleteFolderMutation.mutate(folderId)
  }

  const handleNoteSelect = (noteId) => {
    // 이미 열려있는 탭이면 해당 탭으로 전환
    if (openedNotes.includes(noteId)) {
      // 다른 탭으로 전환 시 현재 탭의 변경사항을 사이드바에 반영
      if (activeTabId && activeTabId !== noteId) {
        queryClient.invalidateQueries(['notes'])
      }
      setActiveTabId(noteId)
    } else {
      // 새 탭으로 열기
      // 현재 활성 탭의 변경사항을 사이드바에 반영
      if (activeTabId) {
        queryClient.invalidateQueries(['notes'])
      }
      setOpenedNotes((prev) => [...prev, noteId])
      setActiveTabId(noteId)
    }
  }

  const handleTabChange = (noteId) => {
    // 탭 전환 시 현재 탭의 변경사항을 사이드바에 반영
    if (activeTabId && activeTabId !== noteId) {
      queryClient.invalidateQueries(['notes'])
    }
    setActiveTabId(noteId)
  }

  const handleTabClose = (noteId) => {
    setOpenedNotes((prev) => {
      const newOpenedNotes = prev.filter((id) => id !== noteId)
      // 닫힌 탭이 활성 탭이었다면 다른 탭으로 전환
      if (activeTabId === noteId) {
        const closedIndex = prev.indexOf(noteId)
        if (newOpenedNotes.length > 0) {
          // 이전 탭 or 다음 탭으로 전환
          const newActiveIndex = Math.max(0, closedIndex - 1)
          setActiveTabId(newOpenedNotes[newActiveIndex])
        } else {
          setActiveTabId(null)
        }
      }
      return newOpenedNotes
    })
    // 탭을 닫을 때 변경사항을 사이드바에 반영
    queryClient.invalidateQueries(['notes'])
  }

  const handleDeleteNote = (noteId) => {
    deleteNoteMutation.mutate(noteId)
  }

  const handleRenameNote = async (noteId, newTitle) => {
    const { note, error } = await updateNote(noteId, { title: newTitle })
    if (error) {
      alert(`제목 변경 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['notes'])
    }
  }

  const handleToggleFavorite = async (noteId) => {
    const { note, error } = await toggleFavorite(noteId)
    if (error) {
      alert(`즐겨찾기 변경 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['notes'])
    }
  }

  const handleUpdateNote = (updates) => {
    // 에디터 내부 로컬 상태만 업데이트 (사이드바는 변경 안됨)
    // 실제 저장은 handleSaveNote에서만 수행
  }

  const handleSaveNote = async (noteId, updates) => {
    // 자동 저장 완료 후에만 사이드바 업데이트
    await updateNoteMutation.mutateAsync({ noteId, updates })
  }

  const handleMenuToggle = () => {
    setSidebarOpen((prev) => !prev)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  // 메모를 다른 폴더로 이동
  const handleMoveNote = async (noteId, targetFolderId) => {
    const { note, error } = await updateNote(noteId, { folder_id: targetFolderId })
    if (error) {
      alert(`메모 이동 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['notes'])
    }
  }

  // 폴더를 다른 폴더로 이동
  const handleMoveFolder = async (folderId, targetParentId) => {
    // 순환 참조 방지
    const { isCircularReference } = await import('../services/folders')
    if (isCircularReference(folderId, targetParentId, foldersData)) {
      alert('폴더를 자기 자신이나 하위 폴더로 이동할 수 없습니다.')
      return
    }

    const { folder, error } = await updateFolder(folderId, { parent_id: targetParentId })
    if (error) {
      alert(`폴더 이동 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['folders'])
    }
  }

  // 메모 순서 변경 (위로/아래로)
  const handleReorderNote = async (noteId, targetNoteId, position) => {
    console.log('🔷 [MainPage] handleReorderNote 호출:', { noteId, targetNoteId, position })
    const { success, error } = await reorderNotes(noteId, targetNoteId, position, notes)
    if (error) {
      console.error('❌ [MainPage] 메모 순서 변경 실패:', error)
    } else {
      console.log('✅ [MainPage] 메모 순서 변경 성공, 쿼리 무효화')
      queryClient.invalidateQueries(['notes'])
    }
  }

  // 폴더 순서 변경
  const handleReorderFolder = async (folderId, targetFolderId, position) => {
    console.log('🔷 [MainPage] handleReorderFolder 호출:', { folderId, targetFolderId, position })
    const { success, error } = await reorderFolders(folderId, targetFolderId, position, foldersData)
    if (error) {
      console.error('❌ [MainPage] 폴더 순서 변경 실패:', error)
    } else {
      console.log('✅ [MainPage] 폴더 순서 변경 성공, 쿼리 무효화')
      queryClient.invalidateQueries(['folders'])
    }
  }

  // ProtectedRoute에서 이미 인증 및 로딩 완료 상태이므로 여기서는 바로 렌더링
  return (
    <div className={`h-screen flex flex-col ${
      isDark ? 'bg-[#1e1e1e]' : 'bg-white'
    }`}>
      {/* 헤더 */}
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={sidebarOpen} />

      {/* 메인 컨텐츠 영역 */}
      <div className={`flex-1 flex overflow-hidden ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* 사이드바 */}
        <Sidebar
          notes={notes}
          selectedNoteId={activeTabId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onRenameNote={handleRenameNote}
          onToggleFavorite={handleToggleFavorite}
          folders={folderTree}
          selectedFolderId={selectedFolderId}
          onFolderSelect={handleFolderSelect}
          onNewFolder={handleNewFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNote={handleMoveNote}
          onMoveFolder={handleMoveFolder}
          onReorderNote={handleReorderNote}
          onReorderFolder={handleReorderFolder}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          userName={userName}
          sidebarPosition={sidebarPosition}
        />

        {/* 탭바 + 에디터 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 탭바 */}
          <TabBar
            openedNotes={openedNotesData}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
          />

          {/* 에디터 */}
          <Editor
            note={selectedNote}
            onUpdateNote={handleUpdateNote}
            onSave={handleSaveNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </div>
    </div>
  )
}

export default MainPage
