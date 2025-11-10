import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Link } from '@tiptap/extension-link'
import { Underline } from '@tiptap/extension-underline'
import { debounce } from 'lodash'
import { FontSize } from './extensions/FontSize'
import { LineHeight } from './extensions/LineHeight'
import './tiptap.css'
import { showErrorToast } from '../../lib/toast.jsx'

function Editor({ note, onUpdateNote, onSave, onDeleteNote, onRenameNote, onToggleFavorite }) {
  const [title, setTitle] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false)
  const [showSpecialCharPicker, setShowSpecialCharPicker] = useState(false)
  const [showAlignmentPicker, setShowAlignmentPicker] = useState(false)
  const [showLineHeightPicker, setShowLineHeightPicker] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const [isCopied, setIsCopied] = useState(false) // 클립보드 복사 상태

  // debouncedSave 함수 참조를 저장
  const debouncedSaveRef = useRef(null)

  // 각 메모별 편집 상태를 저장 (noteId -> {title, content, isFavorite})
  const editStateRef = useRef(new Map())

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 드롭다운 버튼이나 드롭다운 내부를 클릭한 경우는 무시
      if (event.target.closest('.dropdown-container')) {
        return
      }
      // 모든 드롭다운 닫기
      setShowTextColorPicker(false)
      setShowFontSizePicker(false)
      setShowFontFamilyPicker(false)
      setShowSpecialCharPicker(false)
      setShowAlignmentPicker(false)
      setShowLineHeightPicker(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 브라우저 종료/새로고침 시 저장 처리
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // 대기 중인 저장이 있으면 즉시 실행
      if (debouncedSaveRef.current?.flush) {
        debouncedSaveRef.current.flush()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Tiptap 에디터 초기화
  const editor = useEditor({
    extensions: [
      // 필수 기본 확장 기능
      Document,
      Paragraph,
      Text,

      // 서식 기능
      Bold,
      Italic,
      Underline,

      // 제목
      Heading.configure({
        levels: [1, 2, 3]
      }),

      // 실행 취소/다시 실행 (메모별 독립적인 히스토리)
      History.configure({
        depth: 100,  // 최대 100개의 히스토리 유지
        newGroupDelay: 500  // 500ms 내 변경사항은 하나의 그룹으로
      }),

      // 정렬
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify']
      }),

      // 텍스트 스타일
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle']
      }),
      FontSize,
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        lineHeights: ['1.0', '1.15', '1.5', '1.75', '2.0', '2.5', '3.0'],
        defaultLineHeight: '1.5'
      }),

      // 링크
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer'
        }
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none p-6'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      handleContentChange(html)
    }
  }, [note?.id])  // note.id가 변경될 때마다 새로운 에디터 인스턴스 생성

  // 자동 저장 함수 (debounce 3초)
  const debouncedSave = useCallback(
    debounce(async (noteId, updates, editStateMap) => {
      const MAX_RETRIES = 3
      const RETRY_DELAY = 1000 // 1초

      // 재시도 로직
      const saveWithRetry = async (retryCount = 0) => {
        try {
          await onSave(noteId, updates)
          return true
        } catch (error) {
          console.error(`저장 실패 (시도 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error)

          if (retryCount < MAX_RETRIES) {
            // 재시도 전 대기
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
            return saveWithRetry(retryCount + 1)
          }

          // 모든 재시도 실패
          throw error
        }
      }

      try {
        setSaveStatus('saving')
        await saveWithRetry()
        setSaveStatus('saved')

        // 저장 성공 시 해당 메모의 편집 상태를 DB와 동기화
        // (저장된 내용이 DB의 최신 상태가 됨)
        const currentState = editStateMap.get(noteId)
        if (currentState) {
          editStateMap.set(noteId, {
            ...currentState,
            ...updates  // 저장된 내용으로 업데이트
          })
        }

        // 3초 후 저장 완료 메시지 숨김
        setTimeout(() => {
          setSaveStatus('saved')
        }, 3000)
      } catch (error) {
        console.error('저장 중 오류 (재시도 실패):', error)
        setSaveStatus('error')

        // 오류 알림
        showErrorToast('메모 저장에 실패했습니다. 네트워크 연결을 확인해주세요.')
      }
    }, 3000),
    [onSave]
  )

  // debouncedSave를 ref에 저장
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave
  }, [debouncedSave])

  // 내용 변경 핸들러
  const handleContentChange = (html) => {
    if (note) {
      // 편집 상태 업데이트
      const currentState = editStateRef.current.get(note.id) || {}
      editStateRef.current.set(note.id, {
        ...currentState,
        content: html
      })

      onUpdateNote({ content: html })
      debouncedSave(note.id, { content: html }, editStateRef.current)
    }
  }

  // note가 변경될 때 에디터 업데이트
  useEffect(() => {
    // note가 변경되기 전에 대기 중인 저장을 즉시 실행
    if (debouncedSaveRef.current?.flush) {
      debouncedSaveRef.current.flush()
    }

    if (note && editor) {
      // 이전에 편집한 상태가 있는지 확인
      const savedState = editStateRef.current.get(note.id)

      if (savedState) {
        // 이전 편집 상태 복원 (사용자가 편집했던 내용 유지)
        setTitle(savedState.title)
        setIsFavorite(savedState.isFavorite)

        const currentContent = editor.getHTML()
        if (currentContent !== savedState.content) {
          editor.commands.setContent(savedState.content, false)
        }
      } else {
        // 처음 여는 메모는 DB 데이터 사용
        const dbTitle = note.data.title || ''
        const dbIsFavorite = note.data.is_favorite || false
        const dbContent = note.data.content || '<p></p>'

        setTitle(dbTitle)
        setIsFavorite(dbIsFavorite)

        const currentContent = editor.getHTML()
        if (currentContent !== dbContent) {
          editor.commands.setContent(dbContent, false)
        }

        // 초기 상태 저장
        editStateRef.current.set(note.id, {
          title: dbTitle,
          content: dbContent,
          isFavorite: dbIsFavorite
        })
      }
    } else if (!note && editor) {
      setTitle('')
      setIsFavorite(false)
      editor.commands.setContent('<p></p>', false)
    }
  }, [note?.id, editor])

  // 제목 변경 핸들러
  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (note) {
      // 편집 상태 업데이트
      const currentState = editStateRef.current.get(note.id) || {}
      editStateRef.current.set(note.id, {
        ...currentState,
        title: newTitle
      })

      onUpdateNote({ title: newTitle })
      
      // Optimistic Update: 사이드바와 탭에 즉시 반영
      if (onRenameNote) {
        onRenameNote(note.id, newTitle)
      }
      
      // 디바운스된 저장 (3초 후 API 호출)
      debouncedSave(note.id, { title: newTitle }, editStateRef.current)
    }
  }

  // 즐겨찾기 토글
  const handleToggleFavorite = async () => {
    if (!note) return

    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)

    // 편집 상태 업데이트
    const currentState = editStateRef.current.get(note.id) || {}
    editStateRef.current.set(note.id, {
      ...currentState,
      isFavorite: newFavoriteState
    })

    // Optimistic Update: 사이드바와 탭에 즉시 반영 + API 호출
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(note.id)
      } catch (error) {
        // 실패 시 롤백
        setIsFavorite(!newFavoriteState)
        editStateRef.current.set(note.id, {
          ...currentState,
          isFavorite: !newFavoriteState
        })
      }
    }
  }

  // 메모 삭제
  const handleDelete = () => {
    if (!note) return
    // 삭제 전에 대기 중인 저장 완료
    if (debouncedSaveRef.current?.flush) {
      debouncedSaveRef.current.flush()
    }
    onDeleteNote(note.id)
  }

  // HTML을 일반 텍스트로 변환
  const convertHtmlToPlainText = (html) => {
    if (!html) return ''

    // DOM을 사용하여 HTML 파싱
    const temp = document.createElement('div')
    temp.innerHTML = html

    // 줄바꿈 처리
    const processNode = (node) => {
      let text = ''

      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase()

          // 블록 요소는 앞뒤로 줄바꿈 추가
          if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            text += '\n' + processNode(child) + '\n'
          }
          // 줄바꿈 태그
          else if (tagName === 'br') {
            text += '\n'
          }
          // 리스트 아이템
          else if (tagName === 'li') {
            text += '\n• ' + processNode(child)
          }
          // 인라인 요소는 그냥 내용만
          else {
            text += processNode(child)
          }
        }
      })

      return text
    }

    let plainText = processNode(temp)

    // 연속된 줄바꿈을 최대 2개로 제한
    plainText = plainText.replace(/\n{3,}/g, '\n\n')

    // 앞뒤 공백 제거
    return plainText.trim()
  }

  // 클립보드로 복사
  const handleCopyToClipboard = async () => {
    if (!note || !editor) return

    try {
      // 현재 에디터 내용 가져오기
      const currentHtmlContent = editor.getHTML()
      const plainContent = convertHtmlToPlainText(currentHtmlContent)
      const textToCopy = `${title}\n\n${plainContent}`

      // 클립보드에 복사
      await navigator.clipboard.writeText(textToCopy)

      // 복사 성공 상태로 변경
      setIsCopied(true)

      // 2초 후 원래 아이콘으로 복구
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('복사 중 오류 발생:', error)
      showErrorToast('복사에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // TXT 파일로 다운로드
  const handleDownloadTxt = async () => {
    if (!note || !editor) return

    try {
      // 1. 대기 중인 저장이 있으면 즉시 실행
      if (debouncedSaveRef.current?.flush) {
        debouncedSaveRef.current.flush()
        // 저장 완료를 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 2. 현재 에디터 내용 가져오기
      const currentHtmlContent = editor.getHTML()

      // 3. 최신 변경사항 확실하게 저장
      await onSave(note.id, {
        content: currentHtmlContent,
        title: title
      })

      // 4. 다운로드 진행
      const plainContent = convertHtmlToPlainText(currentHtmlContent)
      const txtContent = `${title}\n\n${plainContent}`

      // Blob 생성 (BOM 추가하여 한글 깨짐 방지)
      const blob = new Blob(['\ufeff' + txtContent], { type: 'text/plain;charset=utf-8' })

      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || '제목 없음'}.txt`

      // 다운로드 실행
      document.body.appendChild(link)
      link.click()

      // 정리
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error)
      showErrorToast('다운로드에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 특수문자 삽입
  const insertSpecialChar = (char) => {
    if (!editor) return
    editor.commands.insertContent(char)
    setShowSpecialCharPicker(false)
  }

  // 색상 팔레트 (확장)
  const textColors = [
    { name: '검정', value: '#000000' },
    { name: '진회색', value: '#374151' },
    { name: '회색', value: '#6B7280' },
    { name: '밝은회색', value: '#9CA3AF' },
    { name: '흰색', value: '#FFFFFF' },

    { name: '진빨강', value: '#991B1B' },
    { name: '빨강', value: '#DC2626' },
    { name: '밝은빨강', value: '#EF4444' },
    { name: '연빨강', value: '#FCA5A5' },
    { name: '핑크', value: '#EC4899' },

    { name: '진주황', value: '#9A3412' },
    { name: '주황', value: '#EA580C' },
    { name: '밝은주황', value: '#F97316' },
    { name: '연주황', value: '#FDBA74' },
    { name: '복숭아', value: '#FBBF24' },

    { name: '진노랑', value: '#854D0E' },
    { name: '노랑', value: '#CA8A04' },
    { name: '밝은노랑', value: '#EAB308' },
    { name: '연노랑', value: '#FDE047' },
    { name: '레몬', value: '#FEF08A' },

    { name: '진초록', value: '#166534' },
    { name: '초록', value: '#16A34A' },
    { name: '밝은초록', value: '#22C55E' },
    { name: '연초록', value: '#86EFAC' },
    { name: '민트', value: '#6EE7B7' },

    { name: '진파랑', value: '#1E3A8A' },
    { name: '파랑', value: '#2563EB' },
    { name: '밝은파랑', value: '#3B82F6' },
    { name: '연파랑', value: '#93C5FD' },
    { name: '하늘', value: '#BAE6FD' },

    { name: '진남색', value: '#3730A3' },
    { name: '남색', value: '#4F46E5' },
    { name: '밝은남색', value: '#6366F1' },
    { name: '연남색', value: '#A5B4FC' },
    { name: '라벤더', value: '#C4B5FD' },

    { name: '진보라', value: '#6B21A8' },
    { name: '보라', value: '#9333EA' },
    { name: '밝은보라', value: '#A855F7' },
    { name: '연보라', value: '#D8B4FE' },
    { name: '분홍보라', value: '#F0ABFC' },
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

  // 특수문자 목록 (대폭 확장)
  const specialChars = [
    // 별/하트
    '★', '☆', '✦', '✧', '✪', '✫', '✬', '✭', '✮', '✯',
    '♥', '♡', '❤', '💙', '💚', '💛', '💜', '🧡', '🖤', '🤍',

    // 도형
    '●', '○', '◉', '◎', '⊙', '⦿', '◐', '◑', '◒', '◓',
    '■', '□', '▪', '▫', '◾', '◽', '▮', '▯', '▰', '▱',
    '▲', '△', '▴', '▵', '▶', '▷', '▸', '▹', '►', '▻',
    '▼', '▽', '▾', '▿', '◀', '◁', '◂', '◃', '◄', '◅',
    '◆', '◇', '◈', '◊', '♦', '⬥', '⬦', '⬧', '⬨', '⬩',

    // 화살표
    '→', '←', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙',
    '⇒', '⇐', '⇑', '⇓', '⇔', '⇕', '⇖', '⇗', '⇘', '⇙',
    '➔', '➘', '➙', '➚', '➛', '➜', '➝', '➞', '➟', '➠',

    // 체크/기호
    '✓', '✔', '✕', '✖', '✗', '✘', '☑', '☒', '✅', '❌',
    '※', '‼', '⁉', '❓', '❔', '❕', '❗', '⚠', '⛔', '🚫',

    // 손가락/이모지
    '☝', '👆', '👇', '👈', '👉', '👍', '👎', '✊', '✋', '👌',
    '😀', '😊', '😂', '😍', '😢', '😭', '😡', '😱', '🤔', '🤗',

    // 기타 기호
    '℃', '℉', '°', '№', '㈜', '™', '®', '©', '§', '¶',
    '†', '‡', '※', '‰', '‱', '′', '″', '‴', '¹', '²',
    '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰', '₁', '₂',

    // 통화/수학
    '₩', '$', '€', '£', '¥', '¢', '฿', '₹', '₽', '₴',
    '+', '−', '×', '÷', '=', '≠', '≈', '≤', '≥', '∞',

    // 선/구분
    '─', '━', '│', '┃', '┌', '┐', '└', '┘', '├', '┤',
    '┬', '┴', '┼', '═', '║', '╔', '╗', '╚', '╝', '╠'
  ]

  // 정렬 옵션
  const alignments = [
    { name: '왼쪽', value: 'left', icon: '⬅' },
    { name: '가운데', value: 'center', icon: '↔' },
    { name: '오른쪽', value: 'right', icon: '➡' },
    { name: '양쪽', value: 'justify', icon: '⬌' }
  ]

  // 줄간격 옵션
  const lineHeights = [
    { name: '1.0', value: '1.0' },
    { name: '1.15', value: '1.15' },
    { name: '1.5', value: '1.5' },
    { name: '1.75', value: '1.75' },
    { name: '2.0', value: '2.0' },
    { name: '2.5', value: '2.5' },
    { name: '3.0', value: '3.0' },
  ]

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center">
          <svg
            className="w-24 h-24 text-gray-300 dark:text-[#9d9d9d] mx-auto mb-4"
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
          <p className="text-lg text-gray-500 dark:text-[#cccccc]">메모를 선택하거나</p>
          <p className="text-lg text-gray-500 dark:text-[#cccccc]">새 메모를 작성하세요</p>
        </div>
      </div>
    )
  }

  if (!editor) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden">
      {/* 에디터 도구 모음 - 네이버 카페 스타일 */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-[#3e3e42] bg-gray-50 dark:bg-[#252526]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 글꼴 */}
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowFontFamilyPicker(!showFontFamilyPicker)
                setShowFontSizePicker(false)
                setShowTextColorPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineHeightPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="글꼴"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M5.5 7h13" />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              글꼴
            </div>
            {showFontFamilyPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 min-w-[140px]">
                <div className="flex flex-col gap-1">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        editor.chain().focus().setFontFamily(font.value).run()
                        setShowFontFamilyPicker(false)
                      }}
                      className="px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors text-sm text-gray-900 dark:text-[#cccccc]"
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
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowFontSizePicker(!showFontSizePicker)
                setShowFontFamilyPicker(false)
                setShowTextColorPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineHeightPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="글자 크기"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <text x="2" y="18" fontSize="18" fontWeight="bold" fill="currentColor">A</text>
                <text x="12" y="20" fontSize="12" fill="currentColor">A</text>
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              글자 크기
            </div>
            {showFontSizePicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 min-w-[100px]">
                <div className="flex flex-col gap-1">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => {
                        editor.chain().focus().setFontSize(size.value).run()
                        setShowFontSizePicker(false)
                      }}
                      className="px-3 py-1.5 text-left rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors text-sm text-gray-900 dark:text-[#cccccc]"
                      style={{ fontSize: size.value }}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#3e3e42]"></div>

          {/* 굵게 */}
          <div className="relative group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200 dark:bg-[#2d2d30]' : 'bg-white dark:bg-[#252526]'
              }`}
              title="굵게"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              굵게 (Ctrl+B)
            </div>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#3e3e42]"></div>

          {/* 글자 색상 */}
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowTextColorPicker(!showTextColorPicker)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
                setShowLineHeightPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="글자 색상"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              글자 색상
            </div>
            {showTextColorPicker && (
              <div className="absolute top-full mt-1 p-4 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 w-[420px] max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-10 gap-3">
                  {textColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        editor.chain().focus().setColor(color.value).run()
                        setShowTextColorPicker(false)
                      }}
                      className="w-9 h-9 rounded border-2 border-gray-300 dark:border-[#3e3e42] hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#3e3e42]"></div>

          {/* 정렬 */}
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowAlignmentPicker(!showAlignmentPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowLineHeightPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="정렬"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              텍스트 정렬
            </div>
            {showAlignmentPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 min-w-[120px]">
                <div className="flex flex-col gap-1">
                  {alignments.map((align) => (
                    <button
                      key={align.value}
                      onClick={() => {
                        editor.chain().focus().setTextAlign(align.value).run()
                        setShowAlignmentPicker(false)
                      }}
                      className={`px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors text-sm flex items-center gap-2 text-gray-900 dark:text-[#cccccc] ${
                        editor.isActive({ textAlign: align.value }) ? 'bg-gray-100 dark:bg-[#2d2d30]' : ''
                      }`}
                    >
                      <span>{align.icon}</span>
                      <span>{align.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#3e3e42]"></div>

          {/* 줄간격 */}
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowLineHeightPicker(!showLineHeightPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowSpecialCharPicker(false)
                setShowAlignmentPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="줄간격"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              줄간격
            </div>
            {showLineHeightPicker && (
              <div className="absolute top-full mt-1 p-2 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 min-w-[100px]">
                <div className="flex flex-col gap-1">
                  {lineHeights.map((height) => (
                    <button
                      key={height.value}
                      onClick={() => {
                        editor.chain().focus().setLineHeight(height.value).run()
                        setShowLineHeightPicker(false)
                      }}
                      className="px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors text-sm text-gray-900 dark:text-[#cccccc]"
                    >
                      {height.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#3e3e42]"></div>

          {/* 특수문자 */}
          <div className="relative group dropdown-container">
            <button
              onClick={() => {
                setShowSpecialCharPicker(!showSpecialCharPicker)
                setShowTextColorPicker(false)
                setShowFontSizePicker(false)
                setShowFontFamilyPicker(false)
                setShowAlignmentPicker(false)
                setShowLineHeightPicker(false)
              }}
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors bg-white dark:bg-[#252526]"
              title="특수문자"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              특수문자 삽입
            </div>
            {showSpecialCharPicker && (
              <div className="absolute top-full mt-1 p-3 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e42] rounded-lg shadow-lg z-10 w-[360px] max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-10 gap-1">
                  {specialChars.map((char, index) => (
                    <button
                      key={`${char}-${index}`}
                      onClick={() => insertSpecialChar(char)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-[#3e3e42] hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors text-base text-gray-900 dark:text-[#cccccc]"
                      title={char}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 링크 - 비활성화 */}
          <div className="relative group">
            <button
              disabled
              className="p-2 border border-gray-300 dark:border-[#3e3e42] rounded bg-gray-100 dark:bg-[#252526] opacity-50 cursor-not-allowed"
              title="링크 (비활성화)"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-[#cccccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              링크 (비활성화)
            </div>
          </div>
        </div>

      </div>

      {/* 제목 입력 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3e3e42]">
        <div className="flex items-center space-x-3">
          {/* 즐겨찾기 버튼 */}
          <div className="relative group">
            <button
              onClick={handleToggleFavorite}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors flex-shrink-0"
              aria-label="즐겨찾기"
            >
              <svg
                className={`w-6 h-6 transition-colors ${
                  isFavorite
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-400 dark:text-[#9d9d9d]'
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
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            </div>
          </div>

          {/* 제목 입력 */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목을 입력하세요"
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-[#cccccc] placeholder-gray-400 dark:placeholder-[#9d9d9d]"
          />

          {/* 클립보드 복사 버튼 */}
          <div className="relative group">
            <button
              onClick={handleCopyToClipboard}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors flex-shrink-0"
              aria-label="클립보드에 복사"
            >
              {isCopied ? (
                // 복사 완료 아이콘 (체크 표시)
                <svg
                  className="w-6 h-6 text-green-500 dark:text-green-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              ) : (
                // 기본 복사 아이콘
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-[#9d9d9d] hover:text-green-500 dark:hover:text-green-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {isCopied ? '복사 완료!' : '클립보드에 복사'}
            </div>
          </div>

          {/* TXT 다운로드 버튼 */}
          <div className="relative group">
            <button
              onClick={handleDownloadTxt}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d30] transition-colors flex-shrink-0"
              aria-label="TXT 다운로드"
            >
              <svg
                className="w-6 h-6 text-gray-400 dark:text-[#9d9d9d] hover:text-blue-500 dark:hover:text-[#569cd6] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              TXT 다운로드
            </div>
          </div>

          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            aria-label="메모 삭제"
          >
            <svg
              className="w-6 h-6 text-gray-400 dark:text-[#9d9d9d] hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

      {/* Tiptap 에디터 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <EditorContent editor={editor} className="h-full" />
      </div>

    </div>
  )
}

export default Editor
