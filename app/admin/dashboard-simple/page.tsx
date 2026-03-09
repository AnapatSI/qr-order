'use client'

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🎉 Simple Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ Success!</h2>
          <p className="text-gray-600 mb-4">
            If you can see this page, the login redirect is working perfectly!
          </p>
          <div className="space-y-2">
            <p>✅ Authentication: Working</p>
            <p>✅ Session: Active</p>
            <p>✅ Redirect: Successful</p>
            <p>✅ Dashboard: Loading</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">🔧 Next Steps</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Set up store data in Supabase</li>
            <li>• Configure menu items</li>
            <li>• Test order flow</li>
            <li>• Customize dashboard</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <a href="/admin/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Main Dashboard
          </a>
          <a href="/login" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Logout
          </a>
        </div>
      </div>
    </div>
  )
}
