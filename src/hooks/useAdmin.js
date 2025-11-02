import { useState, useEffect } from 'react'
import { getCurrentUser } from '../services/auth'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { user, isApproved } = await getCurrentUser()

        if (!user || !isApproved) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
        const isUserAdmin = user.email === adminEmail

        setIsAdmin(isUserAdmin)
      } catch (error) {
        console.error('관리자 확인 오류:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { isAdmin, loading }
}
