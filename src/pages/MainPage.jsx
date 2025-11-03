import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/common/Header'
import Sidebar from '../components/sidebar/Sidebar'
import Editor from '../components/editor/Editor'
import { getCurrentUser } from '../services/auth'
import { getNotes, createNote, updateNote, deleteNote } from '../services/notes'
import { useAuthStore } from '../stores/authStore'

function MainPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, fetchUser } = useAuthStore()

  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { user: currentUser, isApproved, error } = await getCurrentUser()
      if (error || !currentUser || !isApproved) {
        navigate('/login')
        return
      }
      fetchUser()
    }
    checkAuth()
  }, [])

  // 메모 목록 가져오기
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', user?.id, searchQuery, showFavoritesOnly],
    queryFn: async () => {
      if (!user?.id) return []

      const filters = {
        searchQuery: searchQuery || undefined,
        isFavorite: showFavoritesOnly || undefined
      }

      const { notes, error } = await getNotes(user.id, filters)
      if (error) {
        console.error('메모 로딩 오류:', error)
        return []
      }
      return notes
    },
    enabled: !!user?.id,
    staleTime: 0
  })

  // 선택된 메모 업데이트
  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId)
      setSelectedNote(note || null)
    }
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
      queryClient.invalidateQueries(['notes'])
      setSelectedNoteId(newNote.id)
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
      if (selectedNoteId === deletedNoteId) {
        setSelectedNoteId(null)
        setSelectedNote(null)
      }
    },
    onError: (error) => {
      alert(`메모 삭제 실패: ${error.message}`)
    }
  })

  const handleNewNote = () => {
    createNoteMutation.mutate()
  }

  const handleNoteSelect = (noteId) => {
    // 다른 메모 선택 시 이전 메모의 변경사항을 사이드바에 반영
    if (selectedNoteId && selectedNoteId !== noteId) {
      queryClient.invalidateQueries(['notes'])
    }
    setSelectedNoteId(noteId)
  }

  const handleDeleteNote = (noteId) => {
    deleteNoteMutation.mutate(noteId)
  }

  const handleUpdateNote = (updates) => {
    // 에디터 내부 로컬 상태만 업데이트 (사이드바는 변경 안됨)
    // 실제 저장은 handleSaveNote에서만 수행
  }

  const handleSaveNote = async (noteId, updates) => {
    // 자동 저장 완료 후에만 사이드바 업데이트
    await updateNoteMutation.mutateAsync({ noteId, updates })
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleToggleFavoriteFilter = () => {
    setShowFavoritesOnly(!showFavoritesOnly)
  }

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 dark:border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <Header onMenuToggle={handleMenuToggle} />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 */}
        <Sidebar
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onSearch={handleSearch}
          onToggleFavoriteFilter={handleToggleFavoriteFilter}
          showFavoritesOnly={showFavoritesOnly}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />

        {/* 에디터 */}
        <Editor
          note={selectedNote}
          onUpdateNote={handleUpdateNote}
          onSave={handleSaveNote}
        />
      </div>
    </div>
  )
}

export default MainPage
