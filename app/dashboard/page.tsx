'use client'

import { useEffect, useState } from 'react'
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
  Settings,
  Table2
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Menu', href: '/menu-manager', icon: Utensils },
  { name: 'Tables', href: '/table-manager', icon: Table2 },
  { name: 'QR Codes', href: '/qr-generator', icon: QrCode },
]

export default function Dashboard() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  
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
          .select('id, name, total_orders, total_revenue, average_rating')
          .limit(1)
          .single()

        if (!storeData) { setLoading(false); return }

        setStoreId(storeData.id)
        setTotalOrders(storeData.total_orders || 0)
        setAverageRating(storeData.average_rating || 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('total_price')
          .eq('store_id', storeData.id)
          .eq('status', 'paid')
          .gte('created_at', today.toISOString())

        if (todayOrders) {
          setTodayRevenue(todayOrders.reduce((sum, order) => sum + order.total_price, 0))
        }

        const { data: activeOrdersData } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeData.id)
          .neq('status', 'paid')

        setActiveOrders(activeOrdersData?.length || 0)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: weeklyOrders } = await supabase
          .from('orders')
          .select('total_price, created_at')
          .eq('store_id', storeData.id)
          .eq('status', 'paid')
          .gte('created_at', sevenDaysAgo.toISOString())

        if (weeklyOrders) {
          const revenueByDate = weeklyOrders.reduce((acc: Record<string, number>, order) => {
            const date = new Date(order.created_at).toLocaleDateString()
            acc[date] = (acc[date] || 0) + order.total_price
            return acc
          }, {})
          setRevenueData(
            Object.entries(revenueByDate).map(([date, revenue]) => ({
              date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
              revenue
            }))
          )
        }

        const { data: menuPerformance } = await supabase
          .from('menus')
          .select('id, name, order_items!inner(quantity, price)')
          .eq('store_id', storeData.id)

        if (menuPerformance) {
          setTopMenuItems(
            menuPerformance
              .map((menu: any) => ({
                name: menu.name,
                quantity: menu.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0),
                revenue: menu.order_items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
              }))
              .sort((a: TopMenuItem, b: TopMenuItem) => b.revenue - a.revenue)
              .slice(0, 5)
          )
        }

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (reviewsData) setRecentReviews(reviewsData)
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const kpiCards = [
    { title: "Today's Revenue", value: `฿${todayRevenue.toLocaleString()}`, change: 12.5, icon: DollarSign, gradient: 'from-[#0ea5e9] to-[#0284c7]' },
    { title: 'Active Orders', value: activeOrders, change: 8.2, icon: Users, gradient: 'from-[#10b981] to-[#059669]' },
    { title: 'Avg Rating', value: averageRating.toFixed(1), change: 2.1, icon: Star, gradient: 'from-[#f59e0b] to-[#d97706]' },
    { title: 'Total Orders', value: totalOrders, change: 15.3, icon: TrendingUp, gradient: 'from-[#8b5cf6] to-[#7c3aed]' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f5f5f4]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-[72px]'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col hidden md:flex`}>
        <div className="p-4 border-b border-gray-50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center space-x-3 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center flex-shrink-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="text-left">
                <h1 className="text-sm font-bold text-gray-900">Smart Order</h1>
                <p className="text-[10px] text-gray-400">Bangsaen Seafood</p>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#e0f2fe] text-[#0ea5e9] font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-50">
          <Link href="/admin/qr-generator" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Nav */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${isActive ? 'bg-[#e0f2fe] text-[#0ea5e9]' : 'text-gray-500'}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Welcome back! Here's your overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, i) => (
                <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${kpi.gradient} rounded-xl flex items-center justify-center`}>
                        <kpi.icon className="w-5 h-5 text-white" />
                      </div>
                      {kpi.change > 0 && (
                        <span className="text-[#10b981] text-xs font-medium flex items-center">
                          <ArrowUpRight className="w-3 h-3 mr-0.5" />
                          {kpi.change}%
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{kpi.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={storeId ? `/${storeId}/kds` : '#'}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white">
                  <CardContent className="p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#e0f2fe] rounded-xl flex items-center justify-center group-hover:bg-[#0ea5e9] transition-colors">
                      <ChefHat className="w-6 h-6 text-[#0ea5e9] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#0ea5e9] transition-colors">Live Orders (KDS)</h3>
                      <p className="text-xs text-gray-400 mt-0.5">View and manage incoming orders</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/menu-manager">
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white">
                  <CardContent className="p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#d1fae5] rounded-xl flex items-center justify-center group-hover:bg-[#10b981] transition-colors">
                      <Plus className="w-6 h-6 text-[#10b981] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#10b981] transition-colors">Menu Manager</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Add and edit menu items</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <div key={review.id} className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-9 h-9 bg-[#f5f5f4] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-gray-400">{(review.customer_name || 'A')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{review.customer_name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-[#f59e0b] fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          {review.comment && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{review.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-300">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">No reviews yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
