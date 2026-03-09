'use client'

import { useEffect, useState } from 'react'
import { getUser } from '@/lib/supabase-auth'

export default function TestAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUser()
        console.log('Test auth - User data:', userData)
        setUser(userData)
      } catch (error) {
        console.error('Test auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      {user ? (
        <div className="space-y-2">
          <p>✅ Authenticated</p>
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p>❌ Not authenticated</p>
          <p>Please <a href="/login" className="text-blue-500 underline">login</a> first</p>
        </div>
      )}
    </div>
  )
}
