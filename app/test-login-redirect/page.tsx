'use client'

import { useState } from 'react'

export default function TestLoginRedirect() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testRedirect = () => {
    addLog('🧪 Testing window.location.replace...')
    console.log('🧪 Testing redirect...')
    window.location.replace('/admin/dashboard')
  }

  const testHref = () => {
    addLog('🧪 Testing window.location.href...')
    console.log('🧪 Testing href...')
    window.location.href = '/admin/dashboard'
  }

  const testRouter = () => {
    addLog('🧪 Testing Next.js router...')
    console.log('🧪 Testing router...')
    window.location.pathname = '/admin/dashboard'
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Login Redirect</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testRedirect}
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
        >
          Test window.location.replace()
        </button>
        
        <button
          onClick={testHref}
          className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
        >
          Test window.location.href
        </button>
        
        <button
          onClick={testRouter}
          className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
        >
          Test pathname change
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>

      <div className="space-y-2">
        <a href="/admin/dashboard" className="block text-blue-500 underline">
          Direct link to Dashboard
        </a>
        <a href="/login" className="block text-blue-500 underline">
          Back to Login
        </a>
      </div>
    </div>
  )
}
