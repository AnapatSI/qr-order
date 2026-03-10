'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChefHat,
  Utensils,
  Plus,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  ArrowUpRight,
  QrCode,
  LayoutDashboard,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Review {
  id: string
  rating: number
  comment: string
  customer_name?: string
  created_at: string
}

interface RevenueData {
  date: string
  revenue: number
}

interface TopMenuItem {
  name: string
  quantity: number
  revenue: number
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Live Orders', href: '/kds', icon: ChefHat },
  { name: 'Menu', href: '/menu-manager', icon: Utensils },
  { name: 'Tables', href: '/table-manager', icon: Settings },
  // { name: 'QR Codes', href: '/qr-generator', icon: QrCode },
]

const COLORS = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6', '#ec4899']

export default function StoreDashboard({ params }: { params: Promise<{ store_id: string }> }) {
  const resolvedParams = React.use(params)
  const storeId = resolvedParams.store_id
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('')
  
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [topMenuItems, setTopMenuItems] = useState<TopMenuItem[]>([])
  const [recentReviews, setRecentReviews] = useState<Review[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('name, total_orders, total_revenue, average_rating')
          .eq('id', storeId)
          .single()

        if (!storeData) { setLoading(false); return }

        setStoreName(storeData.name)
        setTotalOrders(storeData.total_orders || 0)
        setAverageRating(storeData.average_rating || 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('total_price')
          .eq('store_id', storeId)
          .gte('created_at', today.toISOString())

        const todayRev = todayOrders?.reduce((sum, order) => sum + order.total_price, 0) || 0
        setTodayRevenue(todayRev)

        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeId)
          .in('status', ['pending', 'cooking'])

        setActiveOrders(pendingOrders?.length || 0)

        // Weekly revenue data
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const { data: weeklyData } = await supabase
          .from('orders')
          .select('total_price, created_at')
          .eq('store_id', storeId)
          .gte('created_at', weekAgo.toISOString())

        const revenueByDate: { [key: string]: number } = {}
        weeklyData?.forEach(order => {
          const date = new Date(order.created_at).toLocaleDateString()
          revenueByDate[date] = (revenueByDate[date] || 0) + order.total_price
        })

        const formattedRevenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
          date: date.split('/').slice(0, 2).join('/'),
          revenue
        }))
        setRevenueData(formattedRevenueData)

        // Top menu items
        const { data: menuStats } = await supabase
          .from('order_items')
          .select('quantity, menus!inner(name), orders!inner(total_price)')
          .eq('orders.store_id', storeId)
          .in('orders.status', ['served', 'paid'])

        const itemStats: { [key: string]: { quantity: number; revenue: number } } = {}
        menuStats?.forEach((item: any) => {
          const name = item.menus?.name || 'Unknown'
          if (!itemStats[name]) {
            itemStats[name] = { quantity: 0, revenue: 0 }
          }
          itemStats[name].quantity += item.quantity
          itemStats[name].revenue += item.orders.total_price
        })

        const topItems = Object.entries(itemStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
        setTopMenuItems(topItems)

        // Recent reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentReviews(reviews || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) fetchDashboardData()
  }, [storeId])

  const kpis = [
    { title: 'Today Revenue', value: `฿${todayRevenue.toLocaleString()}`, icon: DollarSign, color: '#10b981', bgColor: '#d1fae5' },
    { title: 'Active Orders', value: activeOrders.toString(), icon: Users, color: '#f97316', bgColor: '#fff7ed' },
    { title: 'Avg Rating', value: averageRating.toFixed(1), icon: Star, color: '#8b5cf6', bgColor: '#f3e8ff' },
    { title: 'Total Orders', value: totalOrders.toString(), icon: TrendingUp, color: '#0ea5e9', bgColor: '#e0f2fe' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col print:hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-gray-900 text-sm">{storeName}</h2>
                <p className="text-xs text-gray-400">Store Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const href = item.href ? `/${storeId}${item.href}` : `/${storeId}`
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={item.name}
                href={href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#0ea5e9] text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-50">
          <Link href="/stores" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">All Stores</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Store: {storeId}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: kpi.bgColor }}>
                      <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Weekly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip formatter={(value) => [`฿${value}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <p className="text-sm">No data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Top Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  {topMenuItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topMenuItems} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="revenue" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                          {topMenuItems.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`฿${value}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <p className="text-sm">No data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-[#0ea5e9]" />
                Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {review.customer_name || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-300">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
