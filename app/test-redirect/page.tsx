'use client'

import { useState } from 'react'

export default function TestRedirect() {
  const [redirecting, setRedirecting] = useState(false)

  const handleRedirect = () => {
    setRedirecting(true)
    console.log('🚀 Testing direct redirect...')
    window.location.replace('/admin/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirect Test</h1>
        <p className="mb-6">Click the button to test direct redirect to dashboard</p>
        
        <button
          onClick={handleRedirect}
          disabled={redirecting}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {redirecting ? 'Redirecting...' : 'Test Redirect to Dashboard'}
        </button>
        
        <div className="mt-8">
          <p>Or try direct links:</p>
          <a href="/admin/dashboard" className="block text-blue-500 underline mt-2">
            Direct link to Dashboard
          </a>
          <a href="/login" className="block text-blue-500 underline mt-2">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
