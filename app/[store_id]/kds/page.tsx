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
    console.log('🔍 Setting up KDS real-time for store:', storeId)
    fetchOrders()

    // Subscribe to orders table changes
    const ordersChannel = supabase
      .channel(`orders_${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('📢 Orders real-time update received:', payload)
          console.log('📢 Event type:', payload.eventType)
          console.log('📢 New record:', payload.new)
          console.log('📢 Old record:', payload.old)
          
          // Fetch fresh data
          fetchOrders()
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Orders real-time connected successfully')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Orders real-time connection failed')
        }
      })

    // Also subscribe to order_items changes
    const orderItemsChannel = supabase
      .channel(`order_items_${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('� Order items real-time update received:', payload)
          // Fetch fresh data when order items change
          fetchOrders()
        }
      )
      .subscribe((status) => {
        console.log('📡 Order items subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Order items real-time connected successfully')
        }
      })

    // Fallback: Poll every 5 seconds if real-time fails
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for orders (fallback)')
      fetchOrders()
    }, 5000)

    return () => {
      console.log('�🔌 Unsubscribing from KDS real-time')
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(orderItemsChannel)
      clearInterval(pollInterval)
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center text-2xl">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Kitchen Display System</h1>
        
        {orders.length === 0 ? (
          <div className="text-center text-2xl text-gray-400 py-12">
            No active orders
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdate={fetchOrders}
                storeId={storeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
