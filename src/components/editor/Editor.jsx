import { useState, useEffect, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { debounce } from 'lodash'
import { toggleFavorite } from '../../services/notes'
import LinkModal from './LinkModal'

function Editor({ note, onUpdateNote, onSave, onDeleteNote }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)

  // note가 변경될 때 에디터 업데이트
  useEffect(() => {
    if (note) {
      setTitle(note.data.title || '')
      setContent(note.data.content || '')
      setIsFavorite(note.data.is_favorite || false)
    } else {
      setTitle('')
      setContent('')
      setIsFavorite(false)
    }
  }, [note?.id]) // note.id가 변경될 때만 실행

  // 자동 저장 함수 (debounce 2초)
  const debouncedSave = useCallback(
    debounce(async (noteId, updates) => {
      await onSave(noteId, updates)
    }, 2000),
    [onSave]
  )

  // 제목 변경 핸들러
  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (note) {
      onUpdateNote({ title: newTitle })
      debouncedSave(note.id, { title: newTitle })
    }
  }

  // 내용 변경 핸들러
  const handleContentChange = (value) => {
    setContent(value)
    if (note) {
      onUpdateNote({ content: value })
      debouncedSave(note.id, { content: value })
    }
  }

  // 즐겨찾기 토글
  const handleToggleFavorite = async () => {
    if (!note) return

    // 낙관적 업데이트: UI를 즉시 변경
    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)

    // 서버에 저장
    const { note: updatedNote, error } = await toggleFavorite(note.id)
    if (error) {
      // 에러 발생 시 원래 상태로 되돌림
      setIsFavorite(!newFavoriteState)
      console.error('즐겨찾기 토글 실패:', error)
    } else if (updatedNote) {
      // 즐겨찾기는 즉시 저장되므로 onSave 호출하여 사이드바 업데이트
      await onSave(note.id, { is_favorite: updatedNote.data.is_favorite })
    }
  }

  // 메모 삭제
  const handleDelete = () => {
    if (!note) return

    if (confirm('이 메모를 삭제하시겠습니까?')) {
      onDeleteNote(note.id)
    }
  }

  // 링크 요약 완료 핸들러
  const handleSummarize = async ({ summary, linkType, url }) => {
    if (!note) return

    // 요약 결과를 에디터에 추가
    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    const summaryHeader = `\n\n---\n\n## 🔗 링크 요약 (${timestamp})\n\n**원본 링크**: ${url}\n\n${summary}\n\n---\n\n`

    const newContent = content + summaryHeader
    setContent(newContent)

    // 메모에 링크 정보 저장
    const updates = {
      content: newContent,
      link_url: url,
      link_type: linkType
    }

    // 즉시 저장 (debounce 없이)
    onUpdateNote(updates)
    await onSave(note.id, updates)
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="w-24 h-24 text-gray-300 dark:text-gray-700 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <p className="text-lg text-gray-500 dark:text-gray-400">메모를 선택하거나</p>
          <p className="text-lg text-gray-500 dark:text-gray-400">새 메모를 작성하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* 링크 요약 영역 */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-3">
          {/* 링크 요약 버튼 */}
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>링크 요약</span>
          </button>

          {/* 링크 정보 표시 */}
          {note.data.link_type && (
            <div className="flex items-center space-x-2 ml-auto">
              {note.data.link_type === 'youtube' ? (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  YouTube
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Web
                </span>
              )}
              {note.data.link_url && (
                <a
                  href={note.data.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  aria-label="원본 링크"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 제목 입력 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* 즐겨찾기 버튼 (제목 왼쪽) */}
          <button
            onClick={handleToggleFavorite}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="즐겨찾기 토글"
          >
            <svg
              className={`w-6 h-6 transition-colors ${
                isFavorite
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          {/* 제목 입력 필드 */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목을 입력하세요"
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
          />
          {/* 삭제 버튼 (제목 오른쪽) */}
          <button
            onClick={handleDelete}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            aria-label="메모 삭제"
          >
            <svg
              className="w-6 h-6 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* CodeMirror 에디터 */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={content}
          height="100%"
          extensions={[markdown()]}
          onChange={handleContentChange}
          theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            foldGutter: false
          }}
          className="h-full text-base"
          style={{
            fontSize: '16px',
            height: '100%'
          }}
        />
      </div>

      {/* 링크 요약 모달 */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSummarize={handleSummarize}
      />
    </div>
  )
}

export default Editor
