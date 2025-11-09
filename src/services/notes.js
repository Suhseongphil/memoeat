import { supabase } from './supabase'

/**
 * 새 메모 생성
 * @param {string} userId - 사용자 ID
 * @param {Object} noteData - 메모 데이터
 * @returns {Promise<{note, error}>}
 */
export const createNote = async (userId, noteData = {}) => {
  try {
    const now = new Date().toISOString()

    // 같은 폴더 내 메모들의 최대 order 값 찾기 (직접 쿼리)
    const folderId = noteData.folder_id || null
    let query = supabase
      .from('notes')
      .select('data')
      .eq('user_id', userId)

    if (folderId === null) {
      query = query.is('data->folder_id', null)
    } else {
      query = query.eq('data->folder_id', folderId)
    }

    const { data: existingNotes, error: queryError } = await query

    const maxOrder = existingNotes && existingNotes.length > 0
      ? Math.max(...existingNotes.map(n => n.data?.order || 0))
      : -1

    const data = {
      title: noteData.title || '제목 없음',
      content: noteData.content || '',
      folder_id: noteData.folder_id || null,
      link_url: noteData.link_url || null,
      link_type: noteData.link_type || null,
      is_favorite: noteData.is_favorite || false,
      order: noteData.order !== undefined ? noteData.order : maxOrder + 1,
      created_at: now,
      updated_at: now
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert([{ user_id: userId, data }])
      .select('id, data, created_at, updated_at')
      .single()

    if (error) throw error

    return { note, error: null }
  } catch (error) {
    console.error('CreateNote error:', error)
    return { note: null, error: error.message }
  }
}

/**
 * 사용자의 모든 메모 가져오기
 * @param {string} userId - 사용자 ID
 * @param {Object} filters - 필터 옵션
 * @returns {Promise<{notes, error}>}
 */
export const getNotes = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('notes')
      .select('id, data, created_at, updated_at')
      .eq('user_id', userId)

    // 폴더 필터
    if (filters.folderId !== undefined) {
      if (filters.folderId === null) {
        query = query.is('data->folder_id', null)
      } else {
        query = query.eq('data->folder_id', filters.folderId)
      }
    }

    // 즐겨찾기 필터
    if (filters.isFavorite) {
      query = query.eq('data->is_favorite', true)
    }

    // 검색어 필터
    if (filters.searchQuery) {
      query = query.or(
        `data->title.ilike.%${filters.searchQuery}%,data->content.ilike.%${filters.searchQuery}%`
      )
    }

    // 정렬 (order 순서대로, order가 같으면 최근 수정 순)
    query = query.order('data->order', { ascending: true })
    query = query.order('updated_at', { ascending: false })

    const { data: notes, error } = await query

    if (error) throw error

    return { notes, error: null }
  } catch (error) {
    console.error('GetNotes error:', error)
    return { notes: [], error: error.message }
  }
}

/**
 * 특정 메모 가져오기
 * @param {string} noteId - 메모 ID
 * @returns {Promise<{note, error}>}
 */
export const getNote = async (noteId) => {
  try {
    const { data: note, error } = await supabase
      .from('notes')
      .select('id, data, created_at, updated_at')
      .eq('id', noteId)
      .maybeSingle()

    if (error) throw error
    if (!note) {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }

    return { note, error: null }
  } catch (error) {
    console.error('GetNote error:', error)
    return { note: null, error: error.message }
  }
}

/**
 * 메모 업데이트
 * @param {string} noteId - 메모 ID
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Promise<{note, error}>}
 */
export const updateNote = async (noteId, updates) => {
  try {
    // 기존 메모 가져오기
    const { note: existingNote, error: fetchError } = await getNote(noteId)
    if (fetchError === 'NOTE_NOT_FOUND') {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }
    if (fetchError) throw new Error(fetchError)

    // 데이터 병합
    const updatedData = {
      ...existingNote.data,
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update({
        data: updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select('id, data, created_at, updated_at')
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return { note: null, error: 'NOTE_NOT_FOUND' }
      }
      throw error
    }
    if (!note) {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }

    return { note, error: null }
  } catch (error) {
    if (error?.code === 'PGRST116') {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }
    console.error('UpdateNote error:', error)
    return { note: null, error: error.message }
  }
}

/**
 * 메모 삭제
 * @param {string} noteId - 메모 ID
 * @returns {Promise<{success, error}>}
 */
export const deleteNote = async (noteId) => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('DeleteNote error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 즐겨찾기 토글
 * @param {string} noteId - 메모 ID
 * @returns {Promise<{note, error}>}
 */
export const toggleFavorite = async (noteId) => {
  try {
    const { note: existingNote, error: fetchError } = await getNote(noteId)
    if (fetchError === 'NOTE_NOT_FOUND') {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }
    if (fetchError) throw new Error(fetchError)

    const updatedData = {
      ...existingNote.data,
      is_favorite: !existingNote.data.is_favorite,
      updated_at: new Date().toISOString()
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update({ data: updatedData })
      .eq('id', noteId)
      .select('id, data, created_at, updated_at')
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return { note: null, error: 'NOTE_NOT_FOUND' }
      }
      throw error
    }
    if (!note) {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }

    return { note, error: null }
  } catch (error) {
    if (error?.code === 'PGRST116') {
      return { note: null, error: 'NOTE_NOT_FOUND' }
    }
    console.error('ToggleFavorite error:', error)
    return { note: null, error: error.message }
  }
}

/**
 * 메모 순서 변경
 * @param {string} noteId - 이동할 메모 ID
 * @param {string} targetNoteId - 타겟 메모 ID
 * @param {string} position - 'before' | 'after'
 * @param {Array} allNotes - 모든 메모 배열
 */
export const reorderNotes = async (noteId, targetNoteId, position, allNotes) => {
  try {
    const draggedNote = allNotes.find(n => n.id === noteId)
    const targetNote = allNotes.find(n => n.id === targetNoteId)

    if (!draggedNote || !targetNote) {
      console.error('메모를 찾을 수 없습니다')
      return { success: false, error: '메모를 찾을 수 없습니다' }
    }

    // 같은 폴더에 속한 메모들만 필터링
    const folderId = targetNote.data.folder_id
    const siblings = allNotes
      .filter(n => n.data.folder_id === folderId && n.id !== noteId)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))

    // 타겟의 인덱스 찾기
    const targetIndex = siblings.findIndex(n => n.id === targetNoteId)

    // 새로운 순서 계산
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

    siblings.splice(insertIndex, 0, draggedNote)

    // order 값 재할당
    const updates = []
    for (let i = 0; i < siblings.length; i++) {
      const note = siblings[i]
      const newOrder = i

      if (note.data.order !== newOrder || note.id === noteId) {
        const updatedData = {
          ...note.data,
          order: newOrder,
          folder_id: folderId, // 드래그한 메모의 folder_id도 업데이트
          updated_at: new Date().toISOString()
        }

        updates.push(
          supabase
            .from('notes')
            .update({
              data: updatedData,
              updated_at: new Date().toISOString()
            })
            .eq('id', note.id)
        )
      }
    }

    // 모든 업데이트 실행
    await Promise.all(updates)

    return { success: true, error: null }
  } catch (error) {
    console.error('메모 순서 변경 오류:', error)
    return { success: false, error: error.message }
  }
}
