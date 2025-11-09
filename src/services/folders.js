import { supabase } from './supabase'

/**
 * 폴더 생성
 */
export const createFolder = async (userId, folderData = {}) => {
  try {
    const now = new Date().toISOString()

    const data = {
      name: folderData.name || '새 폴더',
      parent_id: folderData.parent_id || null,
      order: folderData.order || 0,
      created_at: now,
      updated_at: now
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        data: data
      })
      .select()
      .single()

    if (error) {
      console.error('폴더 생성 오류:', error)
      return { folder: null, error: error.message }
    }

    return { folder, error: null }
  } catch (error) {
    console.error('폴더 생성 예외:', error)
    return { folder: null, error: error.message }
  }
}

/**
 * 사용자의 모든 폴더 가져오기
 */
export const getFolders = async (userId, options = {}) => {
  try {
    const { includeDeleted = false, onlyDeleted = false } = options

    let query = supabase
      .from('folders')
      .select('id, data, created_at, deleted_at, user_id')
      .eq('user_id', userId)

    if (onlyDeleted) {
      query = query.not('deleted_at', 'is', null)
    } else if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    query = query.order('data->order', { ascending: true })

    const { data: folders, error } = await query

    if (error) {
      console.error('폴더 조회 오류:', error)
      return { folders: [], error: error.message }
    }

    return { folders: folders || [], error: null }
  } catch (error) {
    console.error('폴더 조회 예외:', error)
    return { folders: [], error: error.message }
  }
}

/**
 * 폴더 업데이트
 */
export const updateFolder = async (folderId, updates) => {
  try {
    // 기존 폴더 데이터 가져오기
    const { data: existingFolder, error: fetchError } = await supabase
      .from('folders')
      .select('id, data, created_at, deleted_at')
      .eq('id', folderId)
      .maybeSingle()

    if (fetchError) {
      console.error('폴더 조회 오류:', fetchError)
      return { folder: null, error: fetchError.message }
    }
    if (!existingFolder || existingFolder.deleted_at) {
      return { folder: null, error: 'FOLDER_NOT_FOUND' }
    }

    // 데이터 병합
    const updatedData = {
      ...existingFolder.data,
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .update({ data: updatedData })
      .eq('id', folderId)
      .select('id, data, created_at, deleted_at')
      .maybeSingle()

    if (error) {
      console.error('폴더 업데이트 오류:', error)
      return { folder: null, error: error.message }
    }

    return { folder, error: null }
  } catch (error) {
    console.error('폴더 업데이트 예외:', error)
    return { folder: null, error: error.message }
  }
}

/**
 * 폴더 삭제 (소프트 삭제, 하위 메모와 폴더 포함)
 */
export const deleteFolder = async (folderId) => {
  try {
    const now = new Date().toISOString()
    const affectedFolders = new Set()
    const affectedNotes = new Set()

    const softDeleteRecursive = async (targetFolderId) => {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, data, deleted_at')
        .eq('id', targetFolderId)
        .maybeSingle()

      if (folderError) throw folderError
      if (!folder) throw new Error('FOLDER_NOT_FOUND')

      if (!folder.deleted_at) {
        const updatedFolderData = {
          ...folder.data,
          deleted_at: now,
          updated_at: now
        }
        const { error: updateFolderError } = await supabase
          .from('folders')
          .update({
            data: updatedFolderData,
            deleted_at: now
          })
          .eq('id', targetFolderId)

        if (updateFolderError) throw updateFolderError
      }
      affectedFolders.add(targetFolderId)

      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, data, deleted_at')
        .eq('data->>folder_id', targetFolderId)

      if (notesError) throw notesError

      for (const note of notes || []) {
        if (!note.deleted_at) {
          const updatedNoteData = {
            ...note.data,
            deleted_at: now,
            updated_at: now
          }
          const { error: updateNoteError } = await supabase
            .from('notes')
            .update({
              data: updatedNoteData,
              deleted_at: now,
              updated_at: now
            })
            .eq('id', note.id)

          if (updateNoteError) throw updateNoteError
        }
        affectedNotes.add(note.id)
      }

      const { data: childFolders, error: childError } = await supabase
        .from('folders')
        .select('id')
        .eq('data->>parent_id', targetFolderId)

      if (childError) throw childError

      for (const child of childFolders || []) {
        await softDeleteRecursive(child.id)
      }
    }

    await softDeleteRecursive(folderId)

    return {
      success: true,
      error: null,
      affectedFolders: Array.from(affectedFolders),
      affectedNotes: Array.from(affectedNotes)
    }
  } catch (error) {
    if (error.message === 'FOLDER_NOT_FOUND') {
      return { success: false, error: 'FOLDER_NOT_FOUND' }
    }
    console.error('폴더 삭제 예외:', error)
    return { success: false, error: error.message }
  }
}

export const restoreFolder = async (folderId) => {
  try {
    const now = new Date().toISOString()
    const restoredFolders = new Set()
    const restoredNotes = new Set()

    const restoreRecursive = async (targetFolderId) => {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, data, deleted_at')
        .eq('id', targetFolderId)
        .maybeSingle()

      if (folderError) throw folderError
      if (!folder) throw new Error('FOLDER_NOT_FOUND')

      if (folder.deleted_at) {
        const updatedFolderData = {
          ...folder.data,
          deleted_at: null,
          updated_at: now
        }
        const { error: updateFolderError } = await supabase
          .from('folders')
          .update({
            data: updatedFolderData,
            deleted_at: null
          })
          .eq('id', targetFolderId)

        if (updateFolderError) throw updateFolderError
      }
      restoredFolders.add(targetFolderId)

      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, data, deleted_at')
        .eq('data->>folder_id', targetFolderId)

      if (notesError) throw notesError

      for (const note of notes || []) {
        if (note.deleted_at) {
          const updatedNoteData = {
            ...note.data,
            deleted_at: null,
            updated_at: now
          }
          const { error: updateNoteError } = await supabase
            .from('notes')
            .update({
              data: updatedNoteData,
              deleted_at: null,
              updated_at: now
            })
            .eq('id', note.id)

          if (updateNoteError) throw updateNoteError
        }
        restoredNotes.add(note.id)
      }

      const { data: childFolders, error: childError } = await supabase
        .from('folders')
        .select('id, deleted_at')
        .eq('data->>parent_id', targetFolderId)

      if (childError) throw childError

      for (const child of childFolders || []) {
        if (child.deleted_at) {
          await restoreRecursive(child.id)
        }
      }
    }

    await restoreRecursive(folderId)

    return {
      success: true,
      error: null,
      restoredFolders: Array.from(restoredFolders),
      restoredNotes: Array.from(restoredNotes)
    }
  } catch (error) {
    if (error.message === 'FOLDER_NOT_FOUND') {
      return { success: false, error: 'FOLDER_NOT_FOUND' }
    }
    console.error('폴더 복구 예외:', error)
    return { success: false, error: error.message }
  }
}

export const permanentlyDeleteFolder = async (folderId) => {
  try {
    const { data: childFolders, error: childError } = await supabase
      .from('folders')
      .select('id')
      .eq('data->>parent_id', folderId)

    if (childError) throw childError

    for (const child of childFolders || []) {
      const { error } = await permanentlyDeleteFolder(child.id)
      if (error) throw new Error(error)
    }

    const { error: deleteNotesError } = await supabase
      .from('notes')
      .delete()
      .eq('data->>folder_id', folderId)

    if (deleteNotesError) throw deleteNotesError

    const { error: deleteFolderError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (deleteFolderError) throw deleteFolderError

    return { success: true, error: null }
  } catch (error) {
    console.error('폴더 영구 삭제 예외:', error)
    return { success: false, error: error.message }
  }
}

export const emptyFoldersTrash = async (userId) => {
  try {
    const { data: trashedFolders, error } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)

    if (error) throw error

    for (const folder of trashedFolders || []) {
      const { error: deleteError } = await permanentlyDeleteFolder(folder.id)
      if (deleteError) throw new Error(deleteError)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('폴더 휴지통 비우기 오류:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Flat 배열을 트리 구조로 변환
 */
export const buildFolderTree = (folders) => {
  if (!folders || folders.length === 0) return []

  // ID로 폴더를 빠르게 찾기 위한 맵
  const folderMap = new Map()
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  const tree = []

  // 부모-자식 관계 설정
  folderMap.forEach(folder => {
    const parentId = folder.data.parent_id
    if (parentId && folderMap.has(parentId)) {
      // 부모가 있으면 부모의 children에 추가
      folderMap.get(parentId).children.push(folder)
    } else {
      // 부모가 없으면 루트 레벨에 추가
      tree.push(folder)
    }
  })

  // order로 정렬
  const sortByOrder = (items) => {
    items.sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
    items.forEach(item => {
      if (item.children.length > 0) {
        sortByOrder(item.children)
      }
    })
  }

  sortByOrder(tree)

  return tree
}

/**
 * 순환 참조 확인 (폴더를 자기 자식으로 이동 방지)
 */
export const isCircularReference = (folderId, targetParentId, folders) => {
  if (folderId === targetParentId) return true

  let currentId = targetParentId
  const visited = new Set()

  while (currentId) {
    if (visited.has(currentId)) return true // 이미 방문한 노드면 순환
    visited.add(currentId)

    if (currentId === folderId) return true // 대상 폴더를 만나면 순환

    const folder = folders.find(f => f.id === currentId)
    if (!folder) break

    currentId = folder.data.parent_id
  }

  return false
}

/**
 * 폴더 순서 변경
 * @param {string} folderId - 이동할 폴더 ID
 * @param {string} targetFolderId - 타겟 폴더 ID
 * @param {string} position - 'before' | 'after'
 * @param {Array} allFolders - 모든 폴더 배열
 */
export const reorderFolders = async (folderId, targetFolderId, position, allFolders) => {
  try {
    const draggedFolder = allFolders.find(f => f.id === folderId)
    const targetFolder = allFolders.find(f => f.id === targetFolderId)

    if (!draggedFolder || !targetFolder) {
      console.error('폴더를 찾을 수 없습니다')
      return { success: false, error: '폴더를 찾을 수 없습니다' }
    }

    // 같은 부모를 가진 폴더들만 필터링
    const parentId = targetFolder.data.parent_id
    const siblings = allFolders
      .filter(f => f.data.parent_id === parentId && f.id !== folderId)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))

    // 타겟의 인덱스 찾기
    const targetIndex = siblings.findIndex(f => f.id === targetFolderId)

    // 새로운 순서 계산
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

    siblings.splice(insertIndex, 0, draggedFolder)

    // order 값 재할당
    const updates = []
    for (let i = 0; i < siblings.length; i++) {
      const folder = siblings[i]
      const newOrder = i

      if (folder.data.order !== newOrder || folder.id === folderId) {
        const updatedData = {
          ...folder.data,
          order: newOrder,
          parent_id: parentId, // 드래그한 폴더의 parent_id도 업데이트
          updated_at: new Date().toISOString()
        }

        updates.push(
          supabase
            .from('folders')
            .update({ data: updatedData })
            .eq('id', folder.id)
        )
      }
    }

    // 모든 업데이트 실행
    await Promise.all(updates)

    return { success: true, error: null }
  } catch (error) {
    console.error('폴더 순서 변경 오류:', error)
    return { success: false, error: error.message }
  }
}
