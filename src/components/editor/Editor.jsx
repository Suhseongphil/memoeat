import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const editorRef = useRef(null)

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

  // 마크다운 포맷 삽입 함수
  const insertMarkdown = (prefix, suffix = '') => {
    if (!note) return

    const newContent = content + prefix + suffix
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })
  }

  // 색상 적용 함수
  const applyColor = (color, isBackground = false) => {
    if (!note) return

    const tag = isBackground
      ? `<span style="background-color:${color}">텍스트</span>`
      : `<span style="color:${color}">텍스트</span>`

    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    // 색상 선택기 닫기
    setShowTextColorPicker(false)
    setShowBgColorPicker(false)
  }

  // 실행 취소/다시 실행 (CodeMirror의 undo/redo 명령 사용)
  const handleUndo = () => {
    // CodeMirror의 undo는 내부적으로 처리되므로 Ctrl+Z로 동작
    document.execCommand('undo')
  }

  const handleRedo = () => {
    // CodeMirror의 redo는 내부적으로 처리되므로 Ctrl+Y로 동작
    document.execCommand('redo')
  }

  // 전체 선택
  const handleSelectAll = () => {
    if (editorRef.current) {
      document.execCommand('selectAll')
    }
  }

  // 색상 팔레트 (자주 사용하는 색상들)
  const textColors = [
    { name: '검정', value: '#000000' },
    { name: '빨강', value: '#EF4444' },
    { name: '주황', value: '#F97316' },
    { name: '노랑', value: '#EAB308' },
    { name: '초록', value: '#22C55E' },
    { name: '파랑', value: '#3B82F6' },
    { name: '남색', value: '#6366F1' },
    { name: '보라', value: '#A855F7' },
    { name: '분홍', value: '#EC4899' },
    { name: '회색', value: '#6B7280' },
  ]

  const bgColors = [
    { name: '노랑', value: '#FEF08A' },
    { name: '초록', value: '#BBF7D0' },
    { name: '파랑', value: '#BFDBFE' },
    { name: '보라', value: '#DDD6FE' },
    { name: '분홍', value: '#FBCFE8' },
    { name: '회색', value: '#E5E7EB' },
  ]

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
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* 에디터 도구 모음 */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between gap-3">
          {/* 왼쪽: 텍스트 서식 도구 */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* 제목 */}
            <button
              onClick={() => insertMarkdown('\n## ', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="제목 (Heading)"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* 굵게 */}
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold"
              title="굵게 (Bold)"
            >
              <span className="text-gray-700 dark:text-gray-300">B</span>
            </button>

            {/* 이탤릭 */}
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors italic"
              title="이탤릭 (Italic)"
            >
              <span className="text-gray-700 dark:text-gray-300">I</span>
            </button>

            {/* 취소선 */}
            <button
              onClick={() => insertMarkdown('~~', '~~')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="취소선 (Strikethrough)"
            >
              <span className="text-gray-700 dark:text-gray-300 line-through">S</span>
            </button>

            {/* 인라인 코드 */}
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-mono"
              title="인라인 코드"
            >
              <span className="text-gray-700 dark:text-gray-300">&lt;/&gt;</span>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* 글자 색상 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTextColorPicker(!showTextColorPicker)
                  setShowBgColorPicker(false)
                }}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="글자 색상"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              {/* 색상 팔레트 */}
              {showTextColorPicker && (
                <div className="absolute top-full mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="grid grid-cols-5 gap-1">
                    {textColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => applyColor(color.value, false)}
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 배경 색상 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBgColorPicker(!showBgColorPicker)
                  setShowTextColorPicker(false)
                }}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="배경 색상 (형광펜)"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              {/* 색상 팔레트 */}
              {showBgColorPicker && (
                <div className="absolute top-full mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="grid grid-cols-3 gap-1">
                    {bgColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => applyColor(color.value, true)}
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* 리스트 */}
            <button
              onClick={() => insertMarkdown('\n- ', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="순서 없는 리스트"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* 순서 있는 리스트 */}
            <button
              onClick={() => insertMarkdown('\n1. ', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="순서 있는 리스트"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* 체크리스트 */}
            <button
              onClick={() => insertMarkdown('\n- [ ] ', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="체크리스트"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* 인용구 */}
            <button
              onClick={() => insertMarkdown('\n> ', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="인용구"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>

            {/* 코드 블록 */}
            <button
              onClick={() => insertMarkdown('\n```\n', '\n```\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="코드 블록"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>

            {/* 구분선 */}
            <button
              onClick={() => insertMarkdown('\n---\n', '\n')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="구분선"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            {/* 링크 */}
            <button
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="링크 삽입"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* 실행 취소 */}
            <button
              onClick={handleUndo}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="실행 취소 (Ctrl+Z)"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            {/* 다시 실행 */}
            <button
              onClick={handleRedo}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="다시 실행 (Ctrl+Y)"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>

            {/* 전체 선택 */}
            <button
              onClick={handleSelectAll}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="전체 선택 (Ctrl+A)"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* 오른쪽: 링크 요약 버튼 */}
          <button
            onClick={() => setIsLinkModalOpen(true)}
            disabled
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed opacity-60 flex-shrink-0"
            title="링크 요약 기능은 현재 개선 중입니다"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">링크 요약</span>
          </button>
        </div>

        {/* 링크 정보 표시 (두 번째 줄) */}
        {note.data.link_type && (
          <div className="flex items-center space-x-2 mt-2">
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

      {/* CodeMirror 에디터 - 스크롤 가능하도록 수정 */}
      <div className="flex-1 overflow-auto" ref={editorRef}>
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
            minHeight: '100%'
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
