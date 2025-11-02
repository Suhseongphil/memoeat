import { supabase } from './supabase'

/**
 * 회원가입 함수
 * @param {string} email - 사용자 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<{user, error}>}
 */
export const signUp = async (email, password) => {
  try {
    // 1. Supabase Auth에 사용자 등록
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email_confirmed: false // 이메일 확인 필요
        }
      }
    })

    if (authError) throw authError

    // 2. 관리자 이메일인지 확인
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    const isAdmin = email === adminEmail

    // 3. user_approvals 테이블에 승인 요청 추가
    const { error: approvalError } = await supabase
      .from('user_approvals')
      .insert([
        {
          user_id: authData.user.id,
          email: email,
          is_approved: isAdmin, // 관리자는 자동 승인
          approved_at: isAdmin ? new Date().toISOString() : null,
          approved_by: isAdmin ? authData.user.id : null
        }
      ])

    if (approvalError) throw approvalError

    return {
      user: authData.user,
      session: authData.session,
      isAdmin,
      needsApproval: !isAdmin,
      error: null
    }
  } catch (error) {
    console.error('SignUp error:', error)
    return {
      user: null,
      session: null,
      isAdmin: false,
      needsApproval: true,
      error: error.message
    }
  }
}

/**
 * 로그인 함수
 * @param {string} email - 사용자 이메일
 * @param {string} password - 비밀번호
 * @param {boolean} rememberMe - 로그인 상태 유지 여부
 * @returns {Promise<{user, session, isApproved, error}>}
 */
export const signIn = async (email, password, rememberMe = false) => {
  try {
    // 1. Supabase Auth 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // 2. 승인 여부 확인
    const { data: approvalData, error: approvalError } = await supabase
      .from('user_approvals')
      .select('is_approved, approved_at')
      .eq('user_id', authData.user.id)
      .single()

    if (approvalError) throw approvalError

    // 3. 승인되지 않은 경우 로그아웃 처리
    if (!approvalData.is_approved) {
      await supabase.auth.signOut()
      throw new Error('관리자 승인 대기 중입니다. 승인 후 다시 로그인해주세요.')
    }

    // 4. 로그인 상태 유지 설정
    if (!rememberMe) {
      // rememberMe가 false인 경우, 세션을 localStorage가 아닌 sessionStorage에 저장
      // Supabase는 기본적으로 localStorage를 사용하므로, 필요시 추가 로직 구현
    }

    return {
      user: authData.user,
      session: authData.session,
      isApproved: true,
      error: null
    }
  } catch (error) {
    console.error('SignIn error:', error)
    return {
      user: null,
      session: null,
      isApproved: false,
      error: error.message
    }
  }
}

/**
 * 로그아웃 함수
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('SignOut error:', error)
    return { error: error.message }
  }
}

/**
 * 현재 로그인된 사용자 정보 가져오기
 * @returns {Promise<{user, session, error}>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) return { user: null, session: null, error: null }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    // 승인 여부 확인
    const { data: approvalData, error: approvalError } = await supabase
      .from('user_approvals')
      .select('is_approved')
      .eq('user_id', user.id)
      .single()

    if (approvalError) throw approvalError

    return {
      user,
      session,
      isApproved: approvalData.is_approved,
      error: null
    }
  } catch (error) {
    console.error('GetCurrentUser error:', error)
    return {
      user: null,
      session: null,
      isApproved: false,
      error: error.message
    }
  }
}

/**
 * 비밀번호 재설정 이메일 전송
 * @param {string} email - 사용자 이메일
 * @returns {Promise<{error}>}
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('ResetPassword error:', error)
    return { error: error.message }
  }
}

/**
 * 비밀번호 업데이트
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<{error}>}
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('UpdatePassword error:', error)
    return { error: error.message }
  }
}

/**
 * 인증 상태 변경 리스너 등록
 * @param {Function} callback - 상태 변경 시 호출될 콜백 함수
 * @returns {Object} - 구독 해제 함수를 포함한 객체
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    callback(event, session)
  })

  return subscription
}
