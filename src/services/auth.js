import { supabase, customStorage } from './supabase'

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
        emailRedirectTo: `${window.location.origin}/dashboard`
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

    // 사용자 친화적인 에러 메시지로 변환
    let errorMessage = '회원가입 중 오류가 발생했습니다.'

    if (error.message.includes('User already registered')) {
      errorMessage = '이미 가입된 이메일입니다.'
    } else if (error.message.includes('Password should be at least')) {
      errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.'
    } else if (error.message.includes('duplicate key')) {
      errorMessage = '이미 가입된 이메일입니다.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      user: null,
      session: null,
      isAdmin: false,
      needsApproval: true,
      error: errorMessage
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
    // 1. 로그인 상태 유지 설정 (로그인 전에 설정)
    // rememberMe가 true면 localStorage (영구), false면 sessionStorage (브라우저 종료 시 삭제)
    customStorage.setStorageType(rememberMe ? 'local' : 'session')

    // 2. Supabase Auth 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // 3. 승인 여부 확인
    const { data: approvalData, error: approvalError } = await supabase
      .from('user_approvals')
      .select('is_approved, approved_at')
      .eq('user_id', authData.user.id)
      .single()

    if (approvalError) throw approvalError

    // 4. 승인되지 않은 경우 로그아웃 처리
    if (!approvalData.is_approved) {
      await supabase.auth.signOut()
      throw new Error('관리자 승인 대기 중입니다. 승인 후 다시 로그인해주세요.')
    }

    return {
      user: authData.user,
      session: authData.session,
      isApproved: true,
      error: null
    }
  } catch (error) {
    console.error('SignIn error:', error)

    // 사용자 친화적인 에러 메시지로 변환
    let errorMessage = '로그인 중 오류가 발생했습니다.'

    if (error.message.includes('Invalid login credentials')) {
      errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
    } else if (error.message.includes('관리자 승인')) {
      errorMessage = error.message // 이미 한글 메시지
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      user: null,
      session: null,
      isApproved: false,
      error: errorMessage
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

/**
 * 승인 대기 중인 사용자 목록 가져오기 (관리자 전용)
 * @returns {Promise<{users, error}>}
 */
export const getPendingApprovals = async () => {
  try {
    const { data, error } = await supabase
      .from('user_approvals')
      .select('*')
      .eq('is_approved', false)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return { users: data, error: null }
  } catch (error) {
    console.error('GetPendingApprovals error:', error)
    return { users: [], error: error.message }
  }
}

/**
 * 승인된 사용자 목록 가져오기 (관리자 전용)
 * @returns {Promise<{users, error}>}
 */
export const getApprovedUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_approvals')
      .select('*')
      .eq('is_approved', true)
      .order('approved_at', { ascending: false })

    if (error) throw error

    return { users: data, error: null }
  } catch (error) {
    console.error('GetApprovedUsers error:', error)
    return { users: [], error: error.message }
  }
}

/**
 * 사용자 승인 (관리자 전용)
 * @param {string} userId - 승인할 사용자 ID
 * @returns {Promise<{success, error}>}
 */
export const approveUser = async (userId) => {
  try {
    // 현재 관리자 정보 가져오기
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) throw new Error('관리자 인증이 필요합니다.')

    // 사용자 승인 처리
    const { error } = await supabase
      .from('user_approvals')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: admin.id
      })
      .eq('user_id', userId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('ApproveUser error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 사용자 승인 거절 및 삭제 (관리자 전용)
 * @param {string} userId - 거절할 사용자 ID
 * @returns {Promise<{success, error}>}
 */
export const rejectUser = async (userId) => {
  try {
    // 1. user_approvals 테이블에서 삭제
    const { error: approvalError } = await supabase
      .from('user_approvals')
      .delete()
      .eq('user_id', userId)

    if (approvalError) throw approvalError

    // 2. Supabase Auth에서 사용자 삭제는 관리자 API 키가 필요하므로
    // 프론트엔드에서는 user_approvals 테이블만 삭제
    // (실제 사용자 삭제는 Supabase Dashboard나 Admin API로 처리)

    return { success: true, error: null }
  } catch (error) {
    console.error('RejectUser error:', error)
    return { success: false, error: error.message }
  }
}
