import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/common/Header'
import Sidebar from '../components/sidebar/Sidebar'
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
import { useAuthStore } from '../stores/authStore'
import { showUndoToast, showSuccessToast, showErrorToast } from '../lib/toast.jsx'

function MainPage() {
  const queryClient = useQueryClient()
  const { user, preferences } = useAuthStore()

  const [selectedNoteId, setSelectedNoteId] = useState(() => {
    const saved = localStorage.getItem('selectedNoteId')
    return saved || null
  })
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  // selectedNoteId를 localStorage에 저장
  useEffect(() => {
    if (selectedNoteId) {
      localStorage.setItem('selectedNoteId', selectedNoteId)
    } else {
      localStorage.removeItem('selectedNoteId')
    }
  }, [selectedNoteId])

  // 사이드바 위치 결정
  const sidebarPosition = preferences?.sidebarPosition || 'left'

  // 다크모드 여부
  const isDark = preferences?.theme === 'dark'

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
    staleTime: 2 * 60 * 1000,
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


  // notes가 로드된 후 selectedNoteId가 유효한지 확인
  useEffect(() => {
    if (notes.length > 0 && selectedNoteId) {
      const validNoteIds = new Set(notes.map(n => n.id))
      if (!validNoteIds.has(selectedNoteId)) {
        setSelectedNoteId(null)
      }
    }
  }, [notes, selectedNoteId])

  // 화면 크기 변경 시 사이드바 자동 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 현재 선택된 메모
  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null
    return notes.find((n) => n.id === selectedNoteId) || null
  }, [selectedNoteId, notes])

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
      const noteWithDeletedAt = {
        ...newNote,
        deleted_at: null
      }
      
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        const filteredNotes = oldNotes.filter(n => n.id !== newNote.id)
        return [...filteredNotes, noteWithDeletedAt]
      })
      
      setSelectedNoteId(newNote.id)
    },
    onError: (error) => {
      showErrorToast(`메모 생성 실패: ${error.message}`)
    }
  })

  // 메모 업데이트
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

  const removeNoteFromSelection = useCallback((noteId) => {
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null)
    }
  }, [selectedNoteId])

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
        removeNoteFromSelection(targetId)
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


  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('사용자 정보가 없습니다.')

      const noteResult = await emptyNotesTrash(user.id)
      if (!noteResult.success) throw new Error(noteResult.error)

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes'])
      if (user?.id) {
        queryClient.invalidateQueries(['notes', user.id, 'trash'])
      }
      showSuccessToast('휴지통을 비웠습니다.')
    },
    onError: (error) => {
      showErrorToast(`휴지통 비우기 실패: ${error.message}`)
    }
  })

  const handleNewNote = useCallback(() => {
    createNoteMutation.mutate()
  }, [createNoteMutation])

  const handleRestoreNoteFromTrash = useCallback((noteId) => {
    restoreNoteMutation.mutate(noteId)
  }, [restoreNoteMutation])

  const handlePermanentDeleteNote = useCallback((noteId) => {
    permanentlyDeleteNoteMutation.mutate(noteId)
  }, [permanentlyDeleteNoteMutation])

  const handleEmptyTrash = useCallback(() => {
    emptyTrashMutation.mutate()
  }, [emptyTrashMutation])

  const handleNoteSelect = (noteId) => {
    setSelectedNoteId(noteId)
  }

  const handleDeleteNote = useCallback((noteId) => {
    deleteNoteMutation.mutate(noteId)
  }, [deleteNoteMutation])

  // Optimistic Update만 수행 (에디터에서 사용)
  const handleRenameNoteOptimistic = useCallback((noteId, newTitle) => {
    queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
      return oldNotes.map(n => {
        if (n.id === noteId) {
          return {
            ...n,
            data: {
              ...n.data,
              title: newTitle
            }
          }
        }
        return n
      })
    })
  }, [queryClient, user?.id])

  // Optimistic Update + API 호출 (사이드바에서 사용)
  const handleRenameNote = async (noteId, newTitle) => {
    const previousNotes = queryClient.getQueryData(['notes', user?.id])
    queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
      return oldNotes.map(n => {
        if (n.id === noteId) {
          return {
            ...n,
            data: {
              ...n.data,
              title: newTitle
            }
          }
        }
        return n
      })
    })

    const { note, error } = await updateNote(noteId, { title: newTitle })
    if (error) {
      if (previousNotes) {
        queryClient.setQueryData(['notes', user?.id], previousNotes)
      }
      if (error === 'NOTE_NOT_FOUND') {
        showErrorToast('해당 메모를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
        removeNoteFromSelection(noteId)
      } else {
        showErrorToast(`제목 변경 실패: ${error}`)
      }
    } else {
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        return oldNotes.map(n => n.id === noteId ? note : n)
      })
    }
  }

  const handleToggleFavorite = async (noteId) => {
    const previousNotes = queryClient.getQueryData(['notes', user?.id])
    const currentNote = previousNotes?.find(n => n.id === noteId)
    const newFavoriteState = currentNote ? !currentNote.data.is_favorite : false
    
    queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
      return oldNotes.map(n => {
        if (n.id === noteId) {
          return {
            ...n,
            data: {
              ...n.data,
              is_favorite: newFavoriteState
            }
          }
        }
        return n
      })
    })

    const { note, error } = await toggleFavorite(noteId)
    if (error) {
      if (previousNotes) {
        queryClient.setQueryData(['notes', user?.id], previousNotes)
      }
      if (error === 'NOTE_NOT_FOUND') {
        showErrorToast('해당 메모를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
        removeNoteFromSelection(noteId)
      } else {
        showErrorToast(`즐겨찾기 변경 실패: ${error}`)
      }
    } else {
      queryClient.setQueryData(['notes', user?.id], (oldNotes = []) => {
        return oldNotes.map(n => n.id === noteId ? note : n)
      })
    }
  }

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleUpdateNote = useCallback((updates) => {
    // 에디터 내부 로컬 상태만 업데이트
  }, [])

  const handleSaveNote = async (noteId, updates) => {
    await updateNoteMutation.mutateAsync({ noteId, updates })
  }

  // 메모 순서 변경
  const handleReorderNote = async (noteId, targetNoteId, position) => {
    const { success, error } = await reorderNotes(noteId, targetNoteId, position, notes)
    if (error) {
      console.error('메모 순서 변경 실패:', error)
      showErrorToast(`순서 변경 실패: ${error}`)
    } else {
      queryClient.invalidateQueries(['notes'])
    }
  }

  const isTrashLoading = trashedNotesLoading
  const isTrashProcessing =
    restoreNoteMutation.isPending ||
    permanentlyDeleteNoteMutation.isPending ||
    emptyTrashMutation.isPending

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
          selectedNoteId={selectedNoteId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onRenameNote={handleRenameNote}
          onToggleFavorite={handleToggleFavorite}
          onReorderNote={handleReorderNote}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          sidebarPosition={sidebarPosition}
          trashedNotes={trashedNotes}
          onRestoreTrashedNote={handleRestoreNoteFromTrash}
          onDeleteTrashedNote={handlePermanentDeleteNote}
          onEmptyTrash={handleEmptyTrash}
          isTrashLoading={isTrashLoading}
          isTrashProcessing={isTrashProcessing}
        />

        {/* 에디터 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 에디터 */}
          <Editor
            note={selectedNote}
            onUpdateNote={handleUpdateNote}
            onSave={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onRenameNote={handleRenameNoteOptimistic}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>
    </div>
  )
}

export default MainPage
