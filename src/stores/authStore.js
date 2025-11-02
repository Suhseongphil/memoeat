import { create } from 'zustand'
import { getCurrentUser } from '../services/auth'

/**
 * 인증 상태 관리를 위한 Zustand 스토어
 */
export const useAuthStore = create((set) => ({
  // 상태
  user: null,
  session: null,
  isApproved: false,
  loading: true,
  error: null,

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

      set({ user, session, isApproved, loading: false, error: null })
      return { success: true, user, session, isApproved }
    } catch (err) {
      const errorMessage = err.message || '사용자 정보를 가져오는 중 오류가 발생했습니다.'
      set({ user: null, session: null, isApproved: false, loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  // 액션: 관리자 여부 확인
  isAdmin: () => {
    const state = useAuthStore.getState()
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    return state.user?.email === adminEmail
  }
}))
