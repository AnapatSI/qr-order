'use client'

import { useEffect, useState } from 'react'
import { getUser } from '@/lib/supabase-auth-simple'
import { supabaseAuth } from '@/lib/supabase-auth-simple'

export default function SessionDebug() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Debug: Checking session...')
        
        // Check session
        const { data: { session: sessionData } } = await supabaseAuth.auth.getSession()
        console.log('📊 Debug: Session data:', sessionData)
        setSession(sessionData)
        
        // Check user
        const userData = await getUser()
        console.log('👤 Debug: User data:', userData)
        setUser(userData)
        
      } catch (error) {
        console.error('💥 Debug error:', error)
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
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Session Status:</h2>
          <p className={session ? "text-green-600" : "text-red-600"}>
            {session ? "✅ Session exists" : "❌ No session"}
          </p>
          {session && (
            <div className="mt-2 text-sm">
              <p>User ID: {session.user?.id}</p>
              <p>Email: {session.user?.email}</p>
              <p>Expires: {new Date(session.expires_at * 1000).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">User Status:</h2>
          <p className={user ? "text-green-600" : "text-red-600"}>
            {user ? "✅ User found" : "❌ No user"}
          </p>
          {user && (
            <div className="mt-2 text-sm">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
            </div>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Next Steps:</h2>
          {session && user ? (
            <div>
              <p className="text-green-600">✅ Auth is working!</p>
              <a href="/admin/dashboard" className="text-blue-500 underline block mt-2">
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Auth not working</p>
              <a href="/login" className="text-blue-500 underline block mt-2">
                Go to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
