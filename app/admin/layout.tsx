'use client'

import { useState } from 'react'
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  ChefHat, 
  Utensils, 
  QrCode, 
  Menu,
  X,
  TrendingUp,
  Star,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    current: true
  },
  {
    name: 'Live Orders (KDS)',
    href: '/admin/kds',
    icon: ChefHat,
    current: false
  },
  {
    name: 'Menu Manager',
    href: '/admin/menu-manager',
    icon: Utensils,
    current: false
  },
  {
    name: 'QR Generator',
    href: '/admin/qr-generator',
    icon: QrCode,
    current: false
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
            <SidebarContent className="p-4">
              {/* Logo */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  {sidebarOpen && (
                    <div>
                      <h1 className="text-lg font-bold text-gray-900">Smart Order</h1>
                      <p className="text-xs text-gray-500">Restaurant POS</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2"
                >
                  {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Quick Stats (when expanded) */}
              {sidebarOpen && (
                <div className="mt-8 space-y-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Today's Revenue</p>
                          <p className="text-2xl font-bold">฿2,450</p>
                        </div>
                        <TrendingUp className="w-8 h-8 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Active Orders</p>
                          <p className="text-2xl font-bold">12</p>
                        </div>
                        <Users className="w-8 h-8 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Avg Rating</p>
                          <p className="text-2xl font-bold">4.8</p>
                        </div>
                        <Star className="w-8 h-8 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">
                    <Star className="w-4 h-4 mr-2" />
                    View Reviews
                  </Button>
                  <Button variant="outline" size="sm">
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Codes
                  </Button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
