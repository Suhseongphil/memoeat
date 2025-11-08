import { createClient } from '@supabase/supabase-js';

// 커스텀 Storage Adapter: localStorage 또는 sessionStorage 동적 선택
class CustomStorageAdapter {
  constructor() {
    // 초기화 시 storage에서 세션을 찾아서 storageType 설정
    this.storageType = this.detectStorageType()
  }

  /**
   * localStorage와 sessionStorage에서 Supabase 세션을 찾아서 storage 타입 감지
   */
  detectStorageType() {
    try {
      // Supabase auth token 키 패턴 찾기
      const supabaseUrl = import.meta.env.SUPABASE_URL
      if (!supabaseUrl) return 'local' // 기본값

      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (!projectRef) return 'local'

      // 가능한 키 패턴들
      const possibleKeys = [
        `sb-${projectRef}-auth-token`,
        `supabase.auth.token`
      ]

      // localStorage에서 먼저 확인
      for (const key of possibleKeys) {
        if (localStorage.getItem(key)) {
          console.log(`🔍 CustomStorage: Detected localStorage for key: ${key}`)
          return 'local'
        }
      }

      // sessionStorage에서 확인
      for (const key of possibleKeys) {
        if (sessionStorage.getItem(key)) {
          console.log(`🔍 CustomStorage: Detected sessionStorage for key: ${key}`)
          return 'session'
        }
      }

      // 모든 storage에서 sb-로 시작하는 키 찾기
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('sb-') && key.includes('auth')) {
          console.log(`🔍 CustomStorage: Detected localStorage for key: ${key}`)
          return 'local'
        }
      }

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.includes('sb-') && key.includes('auth')) {
          console.log(`🔍 CustomStorage: Detected sessionStorage for key: ${key}`)
          return 'session'
        }
      }

      console.log(`🔍 CustomStorage: No session found, defaulting to localStorage`)
      return 'local' // 기본값
    } catch (error) {
      console.error('🔍 CustomStorage: Error detecting storage type:', error)
      return 'local' // 에러 시 기본값
    }
  }

  setStorageType(type) {
    console.log(`🔧 CustomStorage: Switching to ${type} storage`)
    this.storageType = type
  }

  getStorage() {
    return this.storageType === 'session' ? sessionStorage : localStorage
  }

  getItem(key) {
    // 양쪽 storage를 모두 확인 (이전에 저장된 세션 찾기)
    // localStorage를 먼저 확인 (rememberMe가 true인 경우)
    let value = localStorage.getItem(key)
    if (value) {
      console.log(`📖 CustomStorage: getItem(${key}) found in localStorage`)
      // localStorage에서 찾았으면 타입을 local로 설정하여 일관성 유지
      if (this.storageType !== 'local') {
        this.storageType = 'local'
        console.log(`🔄 CustomStorage: Updated storageType to 'local'`)
      }
      return value
    }

    // sessionStorage 확인
    value = sessionStorage.getItem(key)
    if (value) {
      console.log(`📖 CustomStorage: getItem(${key}) found in sessionStorage`)
      // sessionStorage에서 찾았으면 타입을 session으로 설정하여 일관성 유지
      if (this.storageType !== 'session') {
        this.storageType = 'session'
        console.log(`🔄 CustomStorage: Updated storageType to 'session'`)
      }
      return value
    }

    console.log(`📖 CustomStorage: getItem(${key}) not found in any storage`)
    return null
  }

  setItem(key, value) {
    // storageType에 따라 저장하되, 저장 시점에 양쪽 storage를 확인하여 올바른 위치에 저장
    const targetStorage = this.storageType === 'session' ? sessionStorage : localStorage
    console.log(`💾 CustomStorage: setItem(${key}) to ${this.storageType}Storage`)

    targetStorage.setItem(key, value)

    // 반대쪽 storage에서 제거하여 중복 방지
    const oppositeStorage = this.storageType === 'session' ? localStorage : sessionStorage
    oppositeStorage.removeItem(key)
  }

  removeItem(key) {
    console.log(`🗑️ CustomStorage: removeItem(${key}) from both storages`)
    // 양쪽 storage에서 모두 제거
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }

  /**
   * 모든 Supabase 관련 키 가져오기 (디버깅용)
   */
  getAllKeys() {
    const keys = {
      localStorage: [],
      sessionStorage: []
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('sb-') || key.includes('supabase'))) {
        keys.localStorage.push(key)
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('sb-') || key.includes('supabase'))) {
        keys.sessionStorage.push(key)
      }
    }

    return keys
  }
}

// CustomStorageAdapter 인스턴스 생성
export const customStorage = new CustomStorageAdapter()

export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage
    }
  }
);
