'use client'

import { useEffect, useState } from 'react'

export default function SimpleDebug() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const runTests = async () => {
      addLog('🔍 Starting diagnostic tests...')
      
      // Test 1: Environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      addLog(`📡 Env vars: URL=${!!url}, Key=${!!key}`)
      
      if (!url || !key) {
        addLog('❌ Missing environment variables!')
        return
      }
      
      // Test 2: Import Supabase
      try {
        const { supabase } = await import('@/lib/supabase')
        addLog('✅ Supabase client imported')
        
        // Test 3: Check session
        const { data: { session } } = await supabase.auth.getSession()
        addLog(`👤 Session: ${session ? 'exists' : 'none'}`)
        if (session) {
          addLog(`   User ID: ${session.user.id}`)
          addLog(`   Email: ${session.user.email}`)
        }
        
        // Test 4: Test login
        addLog('🔐 Testing login...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test@bangsaen.com',
          password: 'test123456'
        })
        
        if (error) {
          addLog(`❌ Login failed: ${error.message}`)
        } else if (data.user) {
          addLog(`✅ Login successful!`)
          addLog(`   User ID: ${data.user.id}`)
          addLog(`   Email: ${data.user.email}`)
          
          // Test 5: Check session after login
          setTimeout(async () => {
            const { data: { session: afterSession } } = await supabase.auth.getSession()
            addLog(`🔄 Session after login: ${afterSession ? 'exists' : 'none'}`)
            if (afterSession) {
              addLog(`   User ID: ${afterSession.user.id}`)
            }
          }, 1000)
        } else {
          addLog('❌ No user returned from login')
        }
        
      } catch (error) {
        addLog(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    runTests()
  }, [])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Simple Login Debug</h1>
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>
    </div>
  )
}
