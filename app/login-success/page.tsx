'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LoginSuccess() {
  useEffect(() => {
    // Auto redirect after 2 seconds
    const timer = setTimeout(() => {
      window.location.href = '/admin/dashboard-simple'
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Successful! 🎉</h1>
        <p className="text-gray-600 mb-8">
          You are now logged in. Redirecting to dashboard...
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/admin/dashboard-simple"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard Now
          </Link>
          
          <div className="text-sm text-gray-500">
            Or wait for automatic redirect...
          </div>
        </div>
      </div>
    </div>
  )
}
