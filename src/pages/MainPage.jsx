import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/common/Header'
import Sidebar from '../components/sidebar/Sidebar'
import TabBar from '../components/tabs/TabBar'
import Editor from '../components/editor/Editor'
import { getCurrentUser } from '../services/auth'
import { getNotes, createNote, updateNote, deleteNote } from '../services/notes'
import { useAuthStore } from '../stores/authStore'

function MainPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, fetchUser } = useAuthStore()

  const [openedNotes, setOpenedNotes] = useState([]) // 열린 탭들의 ID 배열
  const [activeTabId, setActiveTabId] = useState(null) // 현재 활성 탭 ID
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

  const handleNewNote = () => {
    createNoteMutation.mutate()
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
          selectedNoteId={activeTabId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onSearch={handleSearch}
          onToggleFavoriteFilter={handleToggleFavoriteFilter}
          showFavoritesOnly={showFavoritesOnly}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
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
          />
        </div>
      </div>
    </div>
  )
}

export default MainPage
