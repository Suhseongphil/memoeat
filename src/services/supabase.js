import { createClient } from '@supabase/supabase-js';

// 커스텀 Storage Adapter: localStorage 또는 sessionStorage 동적 선택
class CustomStorageAdapter {
  constructor() {
    this.storageType = 'local' // 기본값
  }

  setStorageType(type) {
    this.storageType = type
  }

  getStorage() {
    return this.storageType === 'session' ? sessionStorage : localStorage
  }

  getItem(key) {
    return this.getStorage().getItem(key)
  }

  setItem(key, value) {
    this.getStorage().setItem(key, value)
  }

  removeItem(key) {
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
