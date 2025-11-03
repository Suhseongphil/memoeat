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

    const data = {
      title: noteData.title || '제목 없음',
      content: noteData.content || '',
      folder_id: noteData.folder_id || null,
      link_url: noteData.link_url || null,
      link_type: noteData.link_type || null,
      is_favorite: noteData.is_favorite || false,
      created_at: now,
      updated_at: now
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert([{ user_id: userId, data }])
      .select()
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
      .select('*')
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

    // 정렬 (최근 수정 순)
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
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) throw error

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
      .select()
      .single()

    if (error) throw error

    return { note, error: null }
  } catch (error) {
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
    if (fetchError) throw new Error(fetchError)

    const updatedData = {
      ...existingNote.data,
      is_favorite: !existingNote.data.is_favorite,
      updated_at: new Date().toISOString()
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update({
        data: updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return { note, error: null }
  } catch (error) {
    console.error('ToggleFavorite error:', error)
    return { note: null, error: error.message }
  }
}
