'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { OrderCard } from './components/OrderCard'

interface Order {
  id: number
  table_no: string
  status: string
  total_price: number
  created_at: string
  order_items: {
    quantity: number
    menus: {
      name: string
    }
  }[]
}

export default function KDSPage({ params }: { params: Promise<{ store_id: string }> }) {
  // 1. Unwrap at the top level
  const resolvedParams = React.use(params);
  const storeId = resolvedParams.store_id;
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    console.log('📋 Fetching orders for store:', storeId)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          quantity,
          menus(name)
        )
      `)
      .eq('store_id', storeId)
      .neq('status', 'paid')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching orders:', error)
    } else {
      console.log('✅ Orders fetched:', data?.length || 0, 'orders')
      console.log('📋 Order data:', data)
      setOrders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (storeId) {
      fetchOrders()
    }
  }, [storeId])

  useEffect(() => {
    if (!storeId) return

    console.log('� Setting up real-time subscriptions for store:', storeId)

    // Subscribe to orders table
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('� Orders table change:', payload)
          fetchOrders()
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status)
      })

    // Subscribe to order_items table
    const orderItemsSubscription = supabase
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('🔔 Order items table change:', payload)
          fetchOrders()
        }
      )
      .subscribe((status) => {
        console.log('📡 Order items subscription status:', status)
      })

    // Fallback polling every 5 seconds
    const pollingInterval = setInterval(() => {
      console.log('⏰ Polling for orders...')
      fetchOrders()
    }, 5000)

    return () => {
      console.log('🧹 Cleaning up subscriptions')
      ordersSubscription.unsubscribe()
      orderItemsSubscription.unsubscribe()
      clearInterval(pollingInterval)
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(order => order.status === 'pending')
  const cookingOrders = orders.filter(order => order.status === 'cooking')
  const servedOrders = orders.filter(order => order.status === 'served')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-sm text-gray-500">Store: {storeId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Active Orders</div>
                <div className="text-xl font-bold text-blue-600">{orders.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Tabs - Mobile First */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="space-y-4">
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <h2 className="text-lg font-bold text-red-800">Pending ({pendingOrders.length})</h2>
              <p className="text-sm text-red-600">New orders to start</p>
            </div>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  storeId={storeId}
                  onUpdate={fetchOrders}
                />
              ))}
              {pendingOrders.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 text-4xl mb-2">⏳</div>
                  <p className="text-gray-600">No pending orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Cooking Orders */}
          <div className="space-y-4">
            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
              <h2 className="text-lg font-bold text-yellow-800">Cooking ({cookingOrders.length})</h2>
              <p className="text-sm text-yellow-600">Orders in progress</p>
            </div>
            <div className="space-y-3">
              {cookingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  storeId={storeId}
                  onUpdate={fetchOrders}
                />
              ))}
              {cookingOrders.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 text-4xl mb-2">👨‍🍳</div>
                  <p className="text-gray-600">No orders cooking</p>
                </div>
              )}
            </div>
          </div>

          {/* Served Orders */}
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <h2 className="text-lg font-bold text-green-800">Served ({servedOrders.length})</h2>
              <p className="text-sm text-green-600">Ready for pickup</p>
            </div>
            <div className="space-y-3">
              {servedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  storeId={storeId}
                  onUpdate={fetchOrders}
                />
              ))}
              {servedOrders.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 text-4xl mb-2">✅</div>
                  <p className="text-gray-600">No served orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active orders</h3>
            <p className="text-gray-600">New orders will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
