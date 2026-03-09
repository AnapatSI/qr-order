'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { OrderCard } from './components/OrderCard'
import { Flame, ChefHat, CheckCircle, RefreshCw } from 'lucide-react'

interface Order {
  id: number
  table_no: string
  status: string
  total_price: number
  created_at: string
  notes?: string
  order_items: {
    quantity: number
    notes?: string
    selected_options?: string
    menus: {
      name: string
    }
  }[]
}

export default function KDSPage({ params }: { params: Promise<{ store_id: string }> }) {
  const resolvedParams = React.use(params)
  const storeId = resolvedParams.store_id
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          quantity,
          notes,
          selected_options,
          menus(name)
        )
      `)
      .eq('store_id', storeId)
      .neq('status', 'paid')
      .order('created_at', { ascending: false })

    if (!error) setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (storeId) fetchOrders()
  }, [storeId])

  useEffect(() => {
    if (!storeId) return

    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => fetchOrders())
      .subscribe()

    const orderItemsSubscription = supabase
      .channel('order-items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe()

    const pollingInterval = setInterval(fetchOrders, 5000)

    return () => {
      ordersSubscription.unsubscribe()
      orderItemsSubscription.unsubscribe()
      clearInterval(pollingInterval)
    }
  }, [storeId])

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const cookingOrders = orders.filter(o => o.status === 'cooking')
  const servedOrders = orders.filter(o => o.status === 'served')

  const columns = [
    { title: 'New Orders', orders: pendingOrders, icon: Flame, color: '#f97316', bgColor: '#fff7ed', emptyText: 'No new orders' },
    { title: 'Cooking', orders: cookingOrders, icon: ChefHat, color: '#0ea5e9', bgColor: '#e0f2fe', emptyText: 'Nothing cooking' },
    { title: 'Ready', orders: servedOrders, icon: CheckCircle, color: '#10b981', bgColor: '#d1fae5', emptyText: 'No orders ready' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Live Orders</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-sm">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#fff7ed]">
                <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                <span className="font-semibold text-[#f97316]">{pendingOrders.length}</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#e0f2fe]">
                <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
                <span className="font-semibold text-[#0ea5e9]">{cookingOrders.length}</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#d1fae5]">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span className="font-semibold text-[#10b981]">{servedOrders.length}</span>
              </span>
            </div>
            <button onClick={fetchOrders} className="w-9 h-9 rounded-xl bg-[#f5f5f4] flex items-center justify-center hover:bg-gray-200 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 md:p-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ChefHat className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No active orders</h3>
            <p className="text-sm text-gray-400">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {columns.map((col) => (
              <div key={col.title} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: col.bgColor }}>
                    <col.icon className="w-4 h-4" style={{ color: col.color }} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">{col.title}</h2>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: col.color }}>
                    {col.orders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {col.orders.map((order) => (
                    <OrderCard key={order.id} order={order} storeId={storeId} onUpdate={fetchOrders} />
                  ))}
                  {col.orders.length === 0 && (
                    <div className="bg-white/60 rounded-2xl py-10 text-center">
                      <p className="text-sm text-gray-300">{col.emptyText}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
