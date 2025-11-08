import { createClient } from '@supabase/supabase-js';

// 커스텀 Storage Adapter: localStorage 또는 sessionStorage 동적 선택
class CustomStorageAdapter {
  constructor() {
    // 초기화 시 localStorage에 저장된 세션이 있는지 확인
    const hasLocalSession = this.findAuthKey(localStorage) !== null
    const hasSessionSession = this.findAuthKey(sessionStorage) !== null

    if (hasLocalSession) {
      this.storageType = 'local'
      console.log('🔄 CustomStorage: Found session in localStorage, using local storage')
    } else if (hasSessionSession) {
      this.storageType = 'session'
      console.log('🔄 CustomStorage: Found session in sessionStorage, using session storage')
    } else {
      this.storageType = 'local' // 기본값
      console.log('🔄 CustomStorage: No session found, defaulting to local storage')
    }
  }

  findAuthKey(storage) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.includes('sb-') && key.includes('auth')) {
        return key
      }
    }
    return null
  }

  setStorageType(type) {
    console.log(`🔧 CustomStorage: Switching to ${type} storage`)
    this.storageType = type
  }

  getStorage() {
    return this.storageType === 'session' ? sessionStorage : localStorage
  }

  getItem(key) {
    const value = this.getStorage().getItem(key)
    console.log(`📖 CustomStorage: getItem(${key}) from ${this.storageType}Storage:`, value ? 'found' : 'not found')
    return value
  }

  setItem(key, value) {
    console.log(`💾 CustomStorage: setItem(${key}) to ${this.storageType}Storage`)
    this.getStorage().setItem(key, value)
  }

  removeItem(key) {
    console.log(`🗑️ CustomStorage: removeItem(${key}) from both storages`)
    // 양쪽 storage에서 모두 제거
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

// CustomStorageAdapter 인스턴스 생성
export const customStorage = new CustomStorageAdapter()

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage
    }
  }
);
