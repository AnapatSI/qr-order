'use client'

import { useState } from 'react'

export default function TestFinal() {
  const [logs, setLogs] = useState<string[]>([])
  const [count, setCount] = useState(0)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBasicRedirect = () => {
    addLog('🧪 Testing basic redirect...')
    console.log('🧪 Testing basic redirect...')
    window.location.href = '/admin/dashboard-simple'
  }

  const testReplace = () => {
    addLog('🧪 Testing replace...')
    console.log('🧪 Testing replace...')
    window.location.replace('/admin/dashboard-simple')
  }

  const testAssign = () => {
    addLog('🧪 Testing assign...')
    console.log('🧪 Testing assign...')
    window.location.assign('/admin/dashboard-simple')
  }

  const testConsole = () => {
    addLog('🧪 Console test - incrementing counter...')
    console.log('🧪 Console test - incrementing counter...')
    setCount(prev => prev + 1)
  }

  const testAlert = () => {
    addLog('🧪 Testing alert...')
    alert('Alert test working!')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Final Test - Debug Redirect</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Current counter:</strong> {count} (click "Test Console" to increment)
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={testConsole}
          className="w-full bg-gray-500 text-white p-3 rounded hover:bg-gray-600"
        >
          Test Console (Increment Counter)
        </button>
        
        <button
          onClick={testAlert}
          className="w-full bg-orange-500 text-white p-3 rounded hover:bg-orange-600"
        >
          Test Alert
        </button>
        
        <button
          onClick={testBasicRedirect}
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
        >
          Test window.location.href
        </button>
        
        <button
          onClick={testReplace}
          className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
        >
          Test window.location.replace
        </button>
        
        <button
          onClick={testAssign}
          className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
        >
          Test window.location.assign
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4 max-h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <strong>Instructions:</strong>
        </p>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
          <li>Click "Test Console" - counter should increment</li>
          <li>Click "Test Alert" - alert should appear</li>
          <li>Try redirect buttons - should go to Simple Dashboard</li>
        </ol>
        
        <div className="mt-4 space-y-1">
          <a href="/admin/dashboard-simple" className="block text-blue-500 underline">
            Direct link to Simple Dashboard
          </a>
          <a href="/login" className="block text-blue-500 underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
