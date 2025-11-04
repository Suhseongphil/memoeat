import { supabase } from './supabase'

/**
 * 사용자 설정 가져오기
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{preferences, error}>}
 */
export const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_approvals')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // 기본 설정
    const defaultPreferences = {
      theme: 'light',
      sidebarPosition: 'left'
    }

    return {
      preferences: data?.preferences || defaultPreferences,
      error: null
    }
  } catch (error) {
    console.error('GetUserPreferences error:', error)
    return {
      preferences: {
        theme: 'light',
        sidebarPosition: 'left'
      },
      error: error.message
    }
  }
}

/**
 * 사용자 설정 업데이트
 * @param {string} userId - 사용자 ID
 * @param {Object} preferences - 설정 객체 { theme, sidebarPosition }
 * @returns {Promise<{success, error}>}
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const { error } = await supabase
      .from('user_approvals')
      .update({ preferences })
      .eq('user_id', userId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('UpdateUserPreferences error:', error)
    return { success: false, error: error.message }
  }
}
