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
export const getFolders = async (userId) => {
  try {
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('data->order', { ascending: true })

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
      .select('*')
      .eq('id', folderId)
      .single()

    if (fetchError) {
      console.error('폴더 조회 오류:', fetchError)
      return { folder: null, error: fetchError.message }
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
      .select()
      .single()

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
 * 폴더 삭제 (하위 메모와 하위 폴더도 함께 삭제)
 */
export const deleteFolder = async (folderId) => {
  try {
    console.log('🗑️ [deleteFolder] 폴더 삭제 시작:', folderId)

    // 1. 먼저 해당 폴더에 속한 모든 메모 조회 후 삭제
    const { data: notesToDelete, error: fetchNotesError } = await supabase
      .from('notes')
      .select('id, data')
      .eq('data->>folder_id', folderId)

    if (fetchNotesError) {
      console.error('❌ [deleteFolder] 메모 조회 오류:', fetchNotesError)
      return { success: false, error: fetchNotesError.message }
    }

    console.log(`📝 [deleteFolder] 삭제할 메모 ${notesToDelete?.length || 0}개 발견`)

    // 메모 삭제
    if (notesToDelete && notesToDelete.length > 0) {
      const noteIds = notesToDelete.map(note => note.id)
      const { error: deleteNotesError } = await supabase
        .from('notes')
        .delete()
        .in('id', noteIds)

      if (deleteNotesError) {
        console.error('❌ [deleteFolder] 메모 삭제 오류:', deleteNotesError)
        return { success: false, error: deleteNotesError.message }
      }
      console.log(`✅ [deleteFolder] ${noteIds.length}개 메모 삭제 완료`)
    }

    // 2. 하위 폴더들도 재귀적으로 삭제
    const { data: childFolders, error: fetchFoldersError } = await supabase
      .from('folders')
      .select('id, data')
      .eq('data->>parent_id', folderId)

    if (fetchFoldersError) {
      console.error('❌ [deleteFolder] 하위 폴더 조회 오류:', fetchFoldersError)
      return { success: false, error: fetchFoldersError.message }
    }

    console.log(`📁 [deleteFolder] 삭제할 하위 폴더 ${childFolders?.length || 0}개 발견`)

    // 하위 폴더들 재귀적으로 삭제
    if (childFolders && childFolders.length > 0) {
      for (const childFolder of childFolders) {
        const { success, error } = await deleteFolder(childFolder.id)
        if (!success) {
          console.error('❌ [deleteFolder] 하위 폴더 삭제 실패:', error)
          return { success: false, error }
        }
      }
      console.log(`✅ [deleteFolder] ${childFolders.length}개 하위 폴더 삭제 완료`)
    }

    // 3. 마지막으로 폴더 자체 삭제
    const { error: folderError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (folderError) {
      console.error('❌ [deleteFolder] 폴더 삭제 오류:', folderError)
      return { success: false, error: folderError.message }
    }

    console.log('✅ [deleteFolder] 폴더 삭제 완료:', folderId)
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [deleteFolder] 폴더 삭제 예외:', error)
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
    console.log('📁 [reorderFolders] 시작:', { folderId, targetFolderId, position })

    const draggedFolder = allFolders.find(f => f.id === folderId)
    const targetFolder = allFolders.find(f => f.id === targetFolderId)

    console.log('📁 [reorderFolders] 찾은 폴더:', {
      draggedFolder: draggedFolder?.data?.name,
      targetFolder: targetFolder?.data?.name
    })

    if (!draggedFolder || !targetFolder) {
      console.error('❌ [reorderFolders] 폴더를 찾을 수 없음')
      return { success: false, error: '폴더를 찾을 수 없습니다' }
    }

    // 같은 부모를 가진 폴더들만 필터링
    const parentId = targetFolder.data.parent_id
    const siblings = allFolders
      .filter(f => f.data.parent_id === parentId && f.id !== folderId)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))

    console.log('📁 [reorderFolders] 같은 부모의 형제 폴더들:',
      siblings.map(f => ({ id: f.id, name: f.data?.name, order: f.data?.order }))
    )

    // 타겟의 인덱스 찾기
    const targetIndex = siblings.findIndex(f => f.id === targetFolderId)
    console.log('📁 [reorderFolders] 타겟 인덱스:', targetIndex)

    // 새로운 순서 계산
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
    console.log('📁 [reorderFolders] 삽입 인덱스:', insertIndex, '(position:', position, ')')

    siblings.splice(insertIndex, 0, draggedFolder)
    console.log('📁 [reorderFolders] 재정렬 후:',
      siblings.map((f, i) => ({ index: i, id: f.id, name: f.data?.name }))
    )

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

        console.log('📁 [reorderFolders] 업데이트:', {
          id: folder.id,
          name: folder.data?.name,
          oldOrder: folder.data.order,
          newOrder
        })

        updates.push(
          supabase
            .from('folders')
            .update({ data: updatedData })
            .eq('id', folder.id)
        )
      }
    }

    console.log('📁 [reorderFolders] 총 업데이트 개수:', updates.length)

    // 모든 업데이트 실행
    await Promise.all(updates)

    console.log('✅ [reorderFolders] 완료!')
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ [reorderFolders] 오류:', error)
    return { success: false, error: error.message }
  }
}
