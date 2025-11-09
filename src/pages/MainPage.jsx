import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/common/Header'
import Sidebar from '../components/sidebar/Sidebar'
import TabBar from '../components/tabs/TabBar'
import Editor from '../components/editor/Editor'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  reorderNotes,
  toggleFavorite,
  restoreNote,
  permanentlyDeleteNote,
  emptyNotesTrash
} from '../services/notes'
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  buildFolderTree,
  reorderFolders,
  restoreFolder,
  permanentlyDeleteFolder,
  emptyFoldersTrash
} from '../services/folders'
import { useAuthStore } from '../stores/authStore'
import { showUndoToast, showSuccessToast, showErrorToast } from '../lib/toast.jsx'

function MainPage() {
  const queryClient = useQueryClient()
  // ProtectedRoute에서 이미 인증 체크 및 사용자 정보 로드 완료
  const { user, preferences } = useAuthStore()

  const [openedNotes, setOpenedNotes] = useState(() => {
    // localStorage에서 복원
    const saved = localStorage.getItem('openedNotes')
    return saved ? JSON.parse(saved) : []
  })
  const [activeTabId, setActiveTabId] = useState(() => {
    // localStorage에서 복원
    const saved = localStorage.getItem('activeTabId')
    return saved || null
  })
  const [selectedFolderId, setSelectedFolderId] = useState(null) // 선택된 폴더 ID
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024 // 데스크톱에서는 기본적으로 열기, 모바일은 닫기
  })
  // openedNotes와 activeTabId를 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('openedNotes', JSON.stringify(openedNotes))
  }, [openedNotes])

  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem('activeTabId', activeTabId)
    } else {
      localStorage.removeItem('activeTabId')
    }
  }, [activeTabId])

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
    staleTime: 5 * 60 * 1000, // 폴더는 5분간 캐시 유지 (변경 빈도가 낮음)
  })

  // 폴더 트리 구조 생성
  const folderTree = useMemo(() => {
    return buildFolderTree(foldersData)
  }, [foldersData])

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
    staleTime: 2 * 60 * 1000, // 메모는 2분간 캐시 유지 (변경 빈도가 높음)
  })

  const { data: trashedNotes = [], isLoading: trashedNotesLoading } = useQuery({
    queryKey: ['notes', user?.id, 'trash'],
    queryFn: async () => {
      if (!user?.id) return []

      const { notes: deletedNotes, error } = await getNotes(user.id, { onlyDeleted: true })
      if (error) {
        console.error('휴지통 메모 로딩 오류:', error)
        return []
      }

      return deletedNotes
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000
  })

  const { data: trashedFolders = [], isLoading: trashedFoldersLoading } = useQuery({
    queryKey: ['folders', user?.id, 'trash'],
    queryFn: async () => {
      if (!user?.id) return []

      const { folders: deletedFolders, error } = await getFolders(user.id, { onlyDeleted: true })
      if (error) {
        console.error('휴지통 폴더 로딩 오류:', error)
        return []
      }

      return deletedFolders
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000
  })

  // notes가 로드된 후 openedNotes에 존재하지 않는 메모 ID 제거
  useEffect(() => {
    if (notes.length > 0 && openedNotes.length > 0) {
      const validNoteIds = new Set(notes.map(n => n.id))
      const validOpenedNotes = openedNotes.filter(id => validNoteIds.has(id))
      
      if (validOpenedNotes.length !== openedNotes.length) {
        setOpenedNotes(validOpenedNotes)
        // 활성 탭이 유효하지 않으면 첫 번째 탭으로 변경
        if (activeTabId && !validNoteIds.has(activeTabId)) {
          setActiveTabId(validOpenedNotes.length > 0 ? validOpenedNotes[0] : null)
        }
      }
    }
  }, [notes, openedNotes, activeTabId])

  // 화면 크기 변경 시 사이드바 자동 닫기 (모바일/태블릿)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        // 데스크톱에서는 기본적으로 열기
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    // 초기 체크
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 열린 탭들의 실제 메모 객체 가져오기
  // openedNotes의 순서를 유지하면서 notes에서 메모 객체를 찾음
  // 중요: openedNotes 배열의 순서를 절대 변경하지 않음
  const openedNotesData = useMemo(() => {
    // notes를 Map으로 변환하여 O(1) 조회 성능 확보
    const notesMap = new Map(notes.map(note => [note.id, note]))
    
    // openedNotes의 순서를 유지하면서 메모 객체 찾기
    const result = openedNotes
      .map((noteId) => notesMap.get(noteId))
      .filter(Boolean) // null/undefined 제거
    
    // 디버깅: 순서 확인
    // openedNotes 순서 유지
    
    return result
  }, [openedNotes, notes])

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
      showErrorToast(`메모 생성 실패: ${error.message}`)
    }
  })

  // 메모 업데이트 (사이드바 업데이트 없음)
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, updates }) => {
      const { note, error } = await updateNote(noteId, updates)
      if (error && error !== 'NOTE_NOT_FOUND') throw new Error(error)
      return note || null
    },
    onError: (error) => {
      console.error('메모 업데이트 오류:', error)
    }
  })

  // 메모 업데이트 (사이드바 업데이트 포함 - 즐겨찾기용)
  const updateNoteWithRefreshMutation = useMutation({
    mutationFn: async ({ noteId, updates }) => {
      const { note, error } = await updateNote(noteId, updates)
      if (error && error !== 'NOTE_NOT_FOUND') throw new Error(error)
      return note || null
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes'])
    },
    onError: (error) => {
      console.error('메모 업데이트 오류:', error)
    }
  })

  const removeNoteFromTabs = useCallback((noteId) => {
    setOpenedNotes((prev) => {
      const newOpenedNotes = prev.filter((id) => id !== noteId)
      const closedIndex = prev.indexOf(noteId)
      setActiveTabId((currentActive) => {
        if (currentActive !== noteId) return currentActive
        if (newOpenedNotes.length === 0) return null
        const newActiveIndex = Math.max(0, closedIndex - 1)
        return newOpenedNotes[newActiveIndex]
      })
      return newOpenedNotes
    })
  }, [])

  const restoreNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const { note, error } = await restoreNote(noteId)
      if (error) throw new Error(error)
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('메모를 복구했습니다.')
    },
    onError: (error) => {
      showErrorToast(`메모 복구 실패: ${error.message}`)
    }
  })

  const permanentlyDeleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const { success, error } = await permanentlyDeleteNote(noteId)
      if (!success) throw new Error(error)
      return noteId
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('메모를 영구 삭제했습니다.')
    },
    onError: (error) => {
      showErrorToast(`메모 영구 삭제 실패: ${error.message}`)
    }
  })

  // 메모 삭제 (소프트 삭제)
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const result = await deleteNote(noteId)
      if (!result.success) throw new Error(result.error)
      return result.note
    },
    onSuccess: (deletedNote, noteId) => {
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }

      const targetId = deletedNote?.id ?? noteId
      if (targetId) {
        removeNoteFromTabs(targetId)
        showUndoToast({
          message: '메모가 휴지통으로 이동했어요.',
          onUndo: () => restoreNoteMutation.mutate(targetId)
        })
      }
    },
    onError: (error) => {
      showErrorToast(`메모 삭제 실패: ${error.message}`)
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
      showErrorToast(`폴더 생성 실패: ${error.message}`)
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
      showErrorToast(`폴더 이름 변경 실패: ${error.message}`)
    }
  })

  const restoreFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      const { success, error } = await restoreFolder(folderId)
      if (!success) throw new Error(error)
      return folderId
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['folders'])
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['folders', user.id, 'trash'])
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('폴더를 복구했습니다.')
    },
    onError: (error) => {
      showErrorToast(`폴더 복구 실패: ${error.message}`)
    }
  })

  const permanentlyDeleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      const { success, error } = await permanentlyDeleteFolder(folderId)
      if (!success) throw new Error(error)
      return folderId
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['folders'])
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['folders', user.id, 'trash'])
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('폴더를 영구 삭제했습니다.')
    },
    onError: (error) => {
      showErrorToast(`폴더 영구 삭제 실패: ${error.message}`)
    }
  })

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('사용자 정보가 없습니다.')

      const folderResult = await emptyFoldersTrash(user.id)
      if (!folderResult.success) throw new Error(folderResult.error)

      const noteResult = await emptyNotesTrash(user.id)
      if (!noteResult.success) throw new Error(noteResult.error)

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['folders'])
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['folders', user.id, 'trash'])
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('휴지통을 비웠습니다.')
    },
    onError: (error) => {
      showErrorToast(`휴지통 비우기 실패: ${error.message}`)
    }
  })

  // 폴더 삭제
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      const result = await deleteFolder(folderId)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result, deletedFolderId) => {
      queryClient.invalidateQueries(['folders'])
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['folders', user.id, 'trash'])
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }

      if (Array.isArray(result?.affectedNotes)) {
        result.affectedNotes.forEach((noteId) => {
          removeNoteFromTabs(noteId)
        })
      }

      // 삭제된 폴더가 선택되어 있었다면 선택 해제
      if (selectedFolderId === deletedFolderId) {
        setSelectedFolderId(null)
      }

      const folderCount = (result?.affectedFolders?.length || 1) - 1
      const noteCount = result?.affectedNotes?.length || 0
      const hasDescendants = folderCount > 0 || noteCount > 0

      showUndoToast({
        message: hasDescendants
          ? `폴더와 하위 항목이 휴지통으로 이동했어요. (폴더 ${Math.max(folderCount, 0)}개, 메모 ${noteCount}개)`
          : '폴더가 휴지통으로 이동했어요.',
        onUndo: () => restoreFolderMutation.mutate(deletedFolderId)
      })
    },
    onError: (error) => {
      showErrorToast(`폴더 삭제 실패: ${error.message}`)
    }
  })

  const handleNewNote = useCallback(() => {
    createNoteMutation.mutate()
  }, [createNoteMutation])

  const handleNewFolder = useCallback((parentId = null) => {
    createFolderMutation.mutate(parentId)
  }, [createFolderMutation])

  const handleFolderSelect = (folderId) => {
    // 같은 폴더 클릭 시 필터 해제
    setSelectedFolderId(folderId === selectedFolderId ? null : folderId)
  }

  const handleRenameFolder = useCallback((folderId, name) => {
    renameFolderMutation.mutate({ folderId, name })
  }, [renameFolderMutation])

  const handleDeleteFolder = useCallback((folderId) => {
    deleteFolderMutation.mutate(folderId)
  }, [deleteFolderMutation])

  const handleRestoreNoteFromTrash = useCallback((noteId) => {
    restoreNoteMutation.mutate(noteId)
  }, [restoreNoteMutation])

  const handleRestoreFolderFromTrash = useCallback((folderId) => {
    restoreFolderMutation.mutate(folderId)
  }, [restoreFolderMutation])

  const handlePermanentDeleteNote = useCallback((noteId) => {
    permanentlyDeleteNoteMutation.mutate(noteId)
  }, [permanentlyDeleteNoteMutation])

  const handlePermanentDeleteFolder = useCallback((folderId) => {
    permanentlyDeleteFolderMutation.mutate(folderId)
  }, [permanentlyDeleteFolderMutation])

  const handleEmptyTrash = useCallback(() => {
    emptyTrashMutation.mutate()
  }, [emptyTrashMutation])

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

  const handleDeleteNote = useCallback((noteId) => {
    deleteNoteMutation.mutate(noteId)
  }, [deleteNoteMutation])

  const handleRenameNote = async (noteId, newTitle) => {
    const { note, error } = await updateNote(noteId, { title: newTitle })
    if (error) {
      if (error === 'NOTE_NOT_FOUND') {
        showErrorToast('해당 메모를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
        removeNoteFromTabs(noteId)
      } else {
        showErrorToast(`제목 변경 실패: ${error}`)
      }
    } else {
      // 캐시를 직접 업데이트하여 즉시 반영
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        return oldNotes.map(n => n.id === noteId ? note : n)
      })
      // 사이드바는 나중에 업데이트
      setTimeout(() => {
        queryClient.invalidateQueries(['notes'])
      }, 100)
    }
  }

  const handleToggleFavorite = async (noteId) => {
    const { note, error } = await toggleFavorite(noteId)
    if (error) {
      if (error === 'NOTE_NOT_FOUND') {
        showErrorToast('해당 메모를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
        removeNoteFromTabs(noteId)
      } else {
        showErrorToast(`즐겨찾기 변경 실패: ${error}`)
      }
    } else {
      // 캐시를 직접 업데이트하여 즉시 반영
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        return oldNotes.map(n => n.id === noteId ? note : n)
      })
      // 사이드바는 나중에 업데이트
      setTimeout(() => {
        queryClient.invalidateQueries(['notes'])
      }, 100)
    }
  }

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleUpdateNote = useCallback((updates) => {
    // 에디터 내부 로컬 상태만 업데이트 (사이드바는 변경 안됨)
    // 실제 저장은 handleSaveNote에서만 수행
  }, [])

  const handleSaveNote = async (noteId, updates) => {
    // 자동 저장 완료 후에만 사이드바 업데이트
    await updateNoteMutation.mutateAsync({ noteId, updates })
  }

  // 메모를 다른 폴더로 이동
  const handleMoveNote = async (noteId, targetFolderId) => {
    const { note, error } = await updateNote(noteId, { folder_id: targetFolderId })
    if (error) {
      if (error === 'NOTE_NOT_FOUND') {
        showErrorToast('해당 메모를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
        removeNoteFromTabs(noteId)
      } else {
        showErrorToast(`메모 이동 실패: ${error}`)
      }
    } else {
      // 캐시를 직접 업데이트하여 탭 순서를 유지
      // invalidateQueries는 notes 배열을 완전히 다시 로드하면서 순서가 바뀔 수 있음
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        return oldNotes.map(n => n.id === noteId ? note : n)
      })
      
      // 사이드바는 나중에 업데이트 (순서에 영향 없음)
      setTimeout(() => {
        queryClient.invalidateQueries(['notes'])
      }, 100)
    }
  }

  // 폴더를 다른 폴더로 이동
  const handleMoveFolder = async (folderId, targetParentId) => {
    // 순환 참조 방지
    const { isCircularReference } = await import('../services/folders')
    if (isCircularReference(folderId, targetParentId, foldersData)) {
      showErrorToast('폴더를 자기 자신이나 하위 폴더로 이동할 수 없습니다.')
      return
    }

    const { folder, error } = await updateFolder(folderId, { parent_id: targetParentId })
    if (error) {
      showErrorToast(`폴더 이동 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['folders'])
    }
  }

  // 메모 순서 변경 (위로/아래로)
  const handleReorderNote = async (noteId, targetNoteId, position) => {
    const { success, error } = await reorderNotes(noteId, targetNoteId, position, notes)
    if (error) {
      console.error('메모 순서 변경 실패:', error)
    } else {
      queryClient.invalidateQueries(['notes'])
    }
  }

  // 폴더 순서 변경
  const handleReorderFolder = async (folderId, targetFolderId, position) => {
    const { success, error } = await reorderFolders(folderId, targetFolderId, position, foldersData)
    if (error) {
      console.error('폴더 순서 변경 실패:', error)
    } else {
      queryClient.invalidateQueries(['folders'])
    }
  }

  const isTrashLoading = trashedNotesLoading || trashedFoldersLoading
  const isTrashProcessing =
    restoreNoteMutation.isPending ||
    restoreFolderMutation.isPending ||
    permanentlyDeleteNoteMutation.isPending ||
    permanentlyDeleteFolderMutation.isPending ||
    emptyTrashMutation.isPending

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
          trashedNotes={trashedNotes}
          trashedFolders={trashedFolders}
          onRestoreTrashedNote={handleRestoreNoteFromTrash}
          onRestoreTrashedFolder={handleRestoreFolderFromTrash}
          onDeleteTrashedNote={handlePermanentDeleteNote}
          onDeleteTrashedFolder={handlePermanentDeleteFolder}
          onEmptyTrash={handleEmptyTrash}
          isTrashLoading={isTrashLoading}
          isTrashProcessing={isTrashProcessing}
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
