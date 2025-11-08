import { createClient } from '@supabase/supabase-js';

// 커스텀 Storage Adapter: localStorage 또는 sessionStorage 동적 선택
class CustomStorageAdapter {
  constructor() {
    this.storageType = 'local' // 기본값
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
    let value = localStorage.getItem(key)
    if (value) {
      console.log(`📖 CustomStorage: getItem(${key}) found in localStorage`)
      this.storageType = 'local' // localStorage에서 찾았으면 타입 업데이트
      return value
    }

    value = sessionStorage.getItem(key)
    if (value) {
      console.log(`📖 CustomStorage: getItem(${key}) found in sessionStorage`)
      this.storageType = 'session' // sessionStorage에서 찾았으면 타입 업데이트
      return value
    }

    console.log(`📖 CustomStorage: getItem(${key}) not found in any storage`)
    return null
  }

  setItem(key, value) {
    const targetStorage = this.storageType === 'session' ? sessionStorage : localStorage
    console.log(`💾 CustomStorage: setItem(${key}) to ${this.storageType}Storage`)

    targetStorage.setItem(key, value)

    // 반대쪽 storage에서 제거
    if (this.storageType === 'session') {
      localStorage.removeItem(key)
    } else {
      sessionStorage.removeItem(key)
    }
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
