import { useState, useEffect, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { debounce } from 'lodash'
import { toggleFavorite } from '../../services/notes'
import LinkModal from './LinkModal'

function Editor({ note, onUpdateNote, onSave, onDeleteNote }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false)
  const [showSpecialCharPicker, setShowSpecialCharPicker] = useState(false)
  const [showAlignmentPicker, setShowAlignmentPicker] = useState(false)
  const [showLineSpacingPicker, setShowLineSpacingPicker] = useState(false)

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
  }, [note?.id])

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

    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)

    const { note: updatedNote, error } = await toggleFavorite(note.id)
    if (error) {
      setIsFavorite(!newFavoriteState)
      console.error('즐겨찾기 토글 실패:', error)
    } else if (updatedNote) {
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

    const updates = {
      content: newContent,
      link_url: url,
      link_type: linkType
    }

    onUpdateNote(updates)
    await onSave(note.id, updates)
  }

  // 서식 삽입 함수
  const insertMarkdown = (prefix, suffix = '') => {
    if (!note) return

    const newContent = content + prefix + suffix
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })
  }

  // 색상 적용 함수
  const applyColor = (color) => {
    if (!note) return

    const tag = `<span style="color:${color}">텍스트</span>`
    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowTextColorPicker(false)
  }

  // 글자 크기 적용 함수
  const applyFontSize = (size) => {
    if (!note) return

    const tag = `<span style="font-size:${size}">텍스트</span>`
    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowFontSizePicker(false)
  }

  // 글꼴 적용 함수
  const applyFontFamily = (font) => {
    if (!note) return

    const tag = `<span style="font-family:${font}">텍스트</span>`
    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowFontFamilyPicker(false)
  }

  // 특수문자 삽입
  const insertSpecialChar = (char) => {
    if (!note) return

    const newContent = content + char
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowSpecialCharPicker(false)
  }

  // 정렬 적용 함수
  const applyAlignment = (alignment) => {
    if (!note) return

    const tag = `<div style="text-align:${alignment}">텍스트</div>`
    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowAlignmentPicker(false)
  }

  // 줄간격 적용 함수
  const applyLineSpacing = (spacing) => {
    if (!note) return

    const tag = `<div style="line-height:${spacing}">텍스트</div>`
    const newContent = content + tag
    setContent(newContent)
    onUpdateNote({ content: newContent })
    debouncedSave(note.id, { content: newContent })

    setShowLineSpacingPicker(false)
  }

  // 색상 팔레트
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

  // 글자 크기 옵션
  const fontSizes = [
    { name: '9pt', value: '12px' },
    { name: '10pt', value: '13px' },
    { name: '11pt', value: '15px' },
    { name: '12pt', value: '16px' },
    { name: '14pt', value: '19px' },
    { name: '16pt', value: '21px' },
    { name: '18pt', value: '24px' },
    { name: '20pt', value: '27px' },
    { name: '22pt', value: '29px' },
    { name: '24pt', value: '32px' },
  ]

  // 글꼴 옵션
  const fontFamilies = [
    { name: '돋움', value: 'Dotum, sans-serif' },
    { name: '굴림', value: 'Gulim, sans-serif' },
    { name: '바탕', value: 'Batang, serif' },
    { name: '궁서', value: 'Gungsuh, serif' },
    { name: '맑은 고딕', value: '"Malgun Gothic", sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
  ]

  // 특수문자 목록
  const specialChars = [
    '★', '☆', '♥', '♡', '●', '○', '■', '□',
    '▲', '△', '▼', '▽', '◆', '◇', '►', '◀',
    '※', '◎', '⊙', '◈', '▣', '◐', '◑', '▒',
    '℃', '℉', '㉿', '№', '㈜', 'Ⓡ', 'ⓒ', '™',
    '→', '←', '↑', '↓', '↔', '⇒', '⇐', '⇔'
  ]

  // 정렬 옵션
  const alignments = [
    { name: '왼쪽', value: 'left', icon: '⬅' },
    { name: '가운데', value: 'center', icon: '↔' },
    { name: '오른쪽', value: 'right', icon: '➡' },
    { name: '양쪽', value: 'justify', icon: '⬌' }
  ]

  // 줄간격 옵션
  const lineSpacings = [
    { name: '좁게', value: '1.2' },
    { name: '보통', value: '1.5' },
    { name: '넓게', value: '1.8' },
    { name: '매우 넓게', value: '2.0' },
    { name: '아주 넓게', value: '2.5' }
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
      {/* 에디터 도구 모음 - 네이버 카페 스타일 */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 글꼴 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontFamilyPicker(!showFontFamilyPicker)
                setShowFontSizePicker(false)
                setShowTextColorPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineSpacingPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="글꼴"
            >
              글꼴
            </button>
            {showFontFamilyPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                <div className="flex flex-col gap-1">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => applyFontFamily(font.value)}
                      className="px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 글자 크기 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontSizePicker(!showFontSizePicker)
                setShowFontFamilyPicker(false)
                setShowTextColorPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineSpacingPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="글자 크기"
            >
              글자크기
            </button>
            {showFontSizePicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[100px]">
                <div className="flex flex-col gap-1">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => applyFontSize(size.value)}
                      className="px-3 py-1.5 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                      style={{ fontSize: size.value }}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* 굵게 */}
          <button
            onClick={() => insertMarkdown('**', '**')}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 font-bold"
            title="굵게 (Bold)"
          >
            B
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* 글자 색상 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTextColorPicker(!showTextColorPicker)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineSpacingPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="글자 색상"
            >
              색상
            </button>
            {showTextColorPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-5 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => applyColor(color.value)}
                      className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* 정렬 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlignmentPicker(!showAlignmentPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowLineSpacingPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="정렬"
            >
              정렬
            </button>
            {showAlignmentPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <div className="flex flex-col gap-1">
                  {alignments.map((align) => (
                    <button
                      key={align.value}
                      onClick={() => applyAlignment(align.value)}
                      className="px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <span>{align.icon}</span>
                      <span>{align.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 줄간격 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLineSpacingPicker(!showLineSpacingPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="줄간격"
            >
              줄간격
            </button>
            {showLineSpacingPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <div className="flex flex-col gap-1">
                  {lineSpacings.map((spacing) => (
                    <button
                      key={spacing.value}
                      onClick={() => applyLineSpacing(spacing.value)}
                      className="px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      {spacing.name} ({spacing.value})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* 특수문자 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpecialCharPicker(!showSpecialCharPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowAlignmentPicker(false)
                setShowLineSpacingPicker(false)
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
              title="특수문자"
            >
              특수문자
            </button>
            {showSpecialCharPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="grid grid-cols-8 gap-1">
                  {specialChars.map((char) => (
                    <button
                      key={char}
                      onClick={() => insertSpecialChar(char)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                      title={char}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 링크 */}
          <button
            onClick={() => insertMarkdown('[', '](url)')}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
            title="링크 삽입"
          >
            링크
          </button>
        </div>

        {/* 링크 정보 표시 */}
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
          {/* 즐겨찾기 버튼 */}
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

          {/* 제목 입력 */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목을 입력하세요"
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
          />

          {/* 삭제 버튼 */}
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

      {/* CodeMirror 에디터 - 자동 줄바꿈 적용 */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          height="100%"
          extensions={[
            markdown(),
            EditorView.lineWrapping // 자동 줄바꿈 활성화
          ]}
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
