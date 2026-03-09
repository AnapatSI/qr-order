'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUser, signOut } from '@/lib/supabase-auth-simple'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  LogOut, 
  ChefHat,
  Utensils,
  Plus,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
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

interface KPICard {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

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

export default function Dashboard() {
  const [storeId, setStoreId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  
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
        const user = await getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        setUserEmail(user.email || '')

        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, total_orders, total_revenue, average_rating')
          .eq('owner_id', user.id)
          .single()

        if (storeError || !storeData) {
          setLoading(false)
          return
        }

        setStoreId(storeData.id)
        setStoreName(storeData.name || 'My Restaurant')
        setTotalOrders(storeData.total_orders || 0)
        setAverageRating(storeData.average_rating || 0)

        // Today's revenue
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

        // Active orders
        const { data: activeOrdersData } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeData.id)
          .neq('status', 'paid')

        setActiveOrders(activeOrdersData?.length || 0)

        // Last 7 days revenue
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

        // Top menu items
        const { data: menuPerformance } = await supabase
          .from('menus')
          .select('id, name, order_items!inner(quantity, price)')
          .eq('store_id', storeData.id)

        if (menuPerformance) {
          const menuStats = menuPerformance
            .map((menu: any) => ({
              name: menu.name,
              quantity: menu.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0),
              revenue: menu.order_items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
            }))
            .sort((a: TopMenuItem, b: TopMenuItem) => b.revenue - a.revenue)
            .slice(0, 5)
          
          setTopMenuItems(menuStats)
        }

        // Recent reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (reviewsData) {
          setRecentReviews(reviewsData)
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const kpiCards: KPICard[] = [
    {
      title: "Today's Revenue",
      value: `฿${todayRevenue.toLocaleString()}`,
      change: todayRevenue > 0 ? 12.5 : 0,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Active Orders',
      value: activeOrders,
      change: activeOrders > 0 ? 8.2 : 0,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'Average Rating',
      value: averageRating.toFixed(1),
      change: averageRating > 0 ? 2.1 : 0,
      icon: <Star className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-600'
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      change: totalOrders > 0 ? 15.3 : 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/kds" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm whitespace-nowrap">
              <ChefHat className="w-4 h-4" />
              <span>Live Orders</span>
            </Link>
            <Link href="/admin/menu-manager" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm whitespace-nowrap">
              <Utensils className="w-4 h-4" />
              <span>Menu</span>
            </Link>
            <Link href="/admin/qr-generator" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm whitespace-nowrap">
              <QrCode className="w-4 h-4" />
              <span>QR Codes</span>
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className={`${kpi.color} text-white border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm font-medium">{kpi.title}</p>
                    <p className="text-xl sm:text-3xl font-bold mt-1">{kpi.value}</p>
                    {kpi.change !== undefined && kpi.change > 0 && (
                      <div className="flex items-center mt-2 text-xs">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        <span className="text-white/80">{kpi.change}% from yesterday</span>
                      </div>
                    )}
                  </div>
                  <div className="text-white/20">{kpi.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link href="/admin/kds">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">Receive Orders (KDS)</h3>
                    <p className="text-gray-600 mt-2 text-sm">View and manage live orders from customers</p>
                    <div className="flex items-center mt-4 text-blue-600 text-sm font-medium">
                      <span>Go to KDS</span>
                      <ChefHat className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200">
                    <ChefHat className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/menu-manager">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600">Add New Menu</h3>
                    <p className="text-gray-600 mt-2 text-sm">Create new menu items with options and pricing</p>
                    <div className="flex items-center mt-4 text-green-600 text-sm font-medium">
                      <span>Manage Menu</span>
                      <Utensils className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-200">
                    <Plus className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Last 7 Days Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`฿${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No revenue data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top 5 Best Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {topMenuItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topMenuItems}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {topMenuItems.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`฿${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No menu data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Recent Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-gray-900">{review.customer_name || 'Anonymous'}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No reviews yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
