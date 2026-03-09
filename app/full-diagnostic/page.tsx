'use client'

import { useEffect, useState } from 'react'
import { signIn, getUser } from '@/lib/supabase-auth-simple'
import { supabaseAuth } from '@/lib/supabase-auth-simple'

export default function FullDiagnostic() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const addResult = (test: string, status: 'success' | 'error' | 'warning', details: any) => {
    setResults(prev => [...prev, { test, status, details, timestamp: new Date().toLocaleTimeString() }])
  }

  useEffect(() => {
    const runDiagnostic = async () => {
      addResult('Environment Check', 'loading', 'Checking environment variables...')
      
      // Check 1: Environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        addResult('Environment Variables', 'success', { 
          url: supabaseUrl.substring(0, 20) + '...', 
          keyExists: !!supabaseKey 
        })
      } else {
        addResult('Environment Variables', 'error', { 
          url: !!supabaseUrl, 
          key: !!supabaseKey 
        })
        return
      }

      // Check 2: Supabase client initialization
      try {
        const { data: { session } } = await supabaseAuth.auth.getSession()
        addResult('Supabase Client', 'success', { clientInitialized: true, hasSession: !!session })
      } catch (error) {
        addResult('Supabase Client', 'error', { error: error.message })
        return
      }

      // Check 3: Current session
      try {
        const { data: { session } } = await supabaseAuth.auth.getSession()
        if (session) {
          addResult('Current Session', 'success', { 
            userId: session.user.id,
            email: session.user.email,
            expires: new Date(session.expires_at * 1000).toLocaleString()
          })
        } else {
          addResult('Current Session', 'warning', 'No active session found')
        }
      } catch (error) {
        addResult('Current Session', 'error', { error: error.message })
      }

      // Check 4: Test login
      try {
        addResult('Test Login', 'loading', 'Attempting login with test credentials...')
        const { user, error: signInError } = await signIn('test@bangsaen.com', 'test123456')
        
        if (signInError) {
          addResult('Test Login', 'error', { error: signInError.message })
        } else if (user) {
          addResult('Test Login', 'success', { 
            userId: user.id,
            email: user.email,
            confirmed: user.email_confirmed
          })
          
          // Check 5: Session after login
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabaseAuth.auth.getSession()
              if (session) {
                addResult('Session After Login', 'success', { 
                  userId: session.user.id,
                  email: session.user.email,
                  expires: new Date(session.expires_at * 1000).toLocaleString()
                })
              } else {
                addResult('Session After Login', 'error', 'No session after login')
              }
            } catch (error) {
              addResult('Session After Login', 'error', { error: error.message })
            }
            
            // Check 6: getUser function
            try {
              const user = await getUser()
              if (user) {
                addResult('Get User Function', 'success', { 
                  userId: user.id,
                  email: user.email
                })
              } else {
                addResult('Get User Function', 'error', 'getUser returned null')
              }
            } catch (error) {
              addResult('Get User Function', 'error', { error: error.message })
            }
            
            setLoading(false)
          }, 2000)
          
        } else {
          addResult('Test Login', 'error', 'No user returned from login')
          setLoading(false)
        }
      } catch (error) {
        addResult('Test Login', 'error', { error: error.message })
        setLoading(false)
      }
    }

    runDiagnostic()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'loading': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Complete Login Diagnostic</h1>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{result.test}</h3>
              <span className="text-xs opacity-75">{result.timestamp}</span>
            </div>
            <div className="text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Running diagnostic tests...</p>
        </div>
      )}

      {!loading && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">📋 Summary</h3>
          <p className="text-sm text-gray-600">
            Review the results above. Any red items indicate problems that need to be fixed.
            Green items are working correctly.
          </p>
        </div>
      )}
    </div>
  )
}
