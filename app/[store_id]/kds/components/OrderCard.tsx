'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Flame, CheckCircle, CreditCard, Clock } from 'lucide-react'

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

interface OrderCardProps {
  order: Order
  onUpdate: () => void
  storeId: string
}

export function OrderCard({ order, onUpdate, storeId }: OrderCardProps) {
  const updateOrderStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)

    if (error) {
      console.error('Error updating order:', error)
    } else {
      onUpdate()
    }
  }

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, store_id: storeId })
      })
      if (response.ok) onUpdate()
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  const timeSince = () => {
    const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
  }

  const statusConfig: Record<string, { border: string; badge: string; badgeText: string }> = {
    pending: { border: 'border-l-[#f97316]', badge: 'bg-[#f97316]', badgeText: 'NEW' },
    cooking: { border: 'border-l-[#0ea5e9]', badge: 'bg-[#0ea5e9]', badgeText: 'COOKING' },
    served: { border: 'border-l-[#10b981]', badge: 'bg-[#10b981]', badgeText: 'READY' },
  }

  const config = statusConfig[order.status] || statusConfig.pending

  return (
    <div className={`bg-white rounded-2xl border-l-4 ${config.border} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`${config.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider`}>
              {config.badgeText}
            </span>
            <span className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {timeSince()}
            </span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mt-1">T{order.table_no}</h2>
          <p className="text-xs text-gray-400">#{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">฿{order.total_price}</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 pb-3">
        <div className="space-y-2">
          {order.order_items.map((item, index) => (
            <div key={index}>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  <span className="text-[#0ea5e9] font-bold mr-1">{item.quantity}x</span>
                  {item.menus.name}
                </span>
              </div>
              {item.selected_options && (
                <p className="text-sm bg-[#fef3c7] text-[#92400e] px-2 py-1 rounded-lg mt-1 font-medium">
                  {item.selected_options}
                </p>
              )}
              {item.notes && (
                <p className="text-sm bg-[#fef2f2] text-[#dc2626] px-2 py-1 rounded-lg mt-1 font-medium">
                  Note: {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4">
        {order.status === 'pending' && (
          <button
            onClick={() => updateOrderStatus('cooking')}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl py-4 text-lg font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            <Flame className="w-5 h-5" />
            <span>Start Cooking</span>
          </button>
        )}
        {order.status === 'cooking' && (
          <button
            onClick={() => updateOrderStatus('served')}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white rounded-xl py-4 text-lg font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Serve</span>
          </button>
        )}
        {order.status === 'served' && (
          <button
            onClick={handlePayment}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl py-4 text-lg font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            <CreditCard className="w-5 h-5" />
            <span>Paid / Close</span>
          </button>
        )}
      </div>
    </div>
  )
}
