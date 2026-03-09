'use client'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-4">
            Login redirect is working. This page is outside /admin/ path.
          </p>
        </div>

        <div className="flex space-x-4">
          <a href="/login" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
