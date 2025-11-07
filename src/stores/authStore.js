import { create } from 'zustand'
import { getCurrentUser } from '../services/auth'
import { getUserPreferences, updateUserPreferences } from '../services/preferences'

/**
 * 인증 상태 관리를 위한 Zustand 스토어
 */
export const useAuthStore = create((set, get) => ({
  // 상태
  user: null,
  session: null,
  isApproved: false,
  loading: true,
  error: null,
  preferences: {
    theme: 'default', // 기본 테마: 하얀색 베이스
    sidebarPosition: 'left'
  },

  // 액션: 사용자 정보 설정
  setUser: (user, session, isApproved) => set({
    user,
    session,
    isApproved,
    loading: false,
    error: null
  }),

  // 액션: 사용자 정보 초기화
  clearUser: () => set({
    user: null,
    session: null,
    isApproved: false,
    loading: false,
    error: null
  }),

  // 액션: 로딩 상태 설정
  setLoading: (loading) => set({ loading }),

  // 액션: 에러 설정
  setError: (error) => set({ error, loading: false }),

  // 액션: 현재 사용자 정보 가져오기
  fetchUser: async () => {
    set({ loading: true, error: null })

    try {
      const { user, session, isApproved, error } = await getCurrentUser()

      if (error) {
        set({ user: null, session: null, isApproved: false, loading: false, error })
        return { success: false, error }
      }

      // 사용자 설정 불러오기 (loading 상태를 false로 변경하기 전에)
      let userPreferences = { theme: 'default', sidebarPosition: 'left' }
      if (user) {
        const { preferences } = await getUserPreferences(user.id)
        userPreferences = preferences

        // 테마 적용
        if (preferences.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      // 모든 데이터 로드 완료 후 loading: false
      set({
        user,
        session,
        isApproved,
        preferences: userPreferences,
        loading: false,
        error: null
      })

      return { success: true, user, session, isApproved }
    } catch (err) {
      const errorMessage = err.message || '사용자 정보를 가져오는 중 오류가 발생했습니다.'
      set({ user: null, session: null, isApproved: false, loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  // 액션: 사용자 설정 업데이트
  updatePreferences: async (newPreferences) => {
    const state = get()
    if (!state.user) return { success: false, error: '로그인이 필요합니다.' }

    try {
      const updatedPreferences = { ...state.preferences, ...newPreferences }
      const { success, error } = await updateUserPreferences(state.user.id, updatedPreferences)

      if (error) throw new Error(error)

      set({ preferences: updatedPreferences })

      // 테마 적용
      if (updatedPreferences.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  // 액션: 관리자 여부 확인
  isAdmin: () => {
    const state = useAuthStore.getState()
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    return state.user?.email === adminEmail
  }
}))
