'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

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
      alert('Failed to update order')
    } else {
      onUpdate()
    }
  }

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/orders/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          store_id: storeId
        })
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('Payment processing failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment processing failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'cooking': return 'bg-blue-500'
      case 'served': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'PENDING'
      case 'cooking': return 'COOKING'
      case 'served': return 'READY TO SERVE'
      default: return status.toUpperCase()
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
            <div className="text-6xl font-bold text-center py-4">
              TABLE {order.table_no}
            </div>
            <div className="text-center text-gray-400">
              Order #{order.id}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.order_items.map((item, index) => (
            <div key={index} className="flex justify-between text-lg">
              <span>{item.quantity}x {item.menus.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="text-2xl font-bold text-center mb-4">
            Total: ฿{order.total_price}
          </div>

          <div className="space-y-3">
            {order.status === 'pending' && (
              <Button
                onClick={() => updateOrderStatus('cooking')}
                className="w-full text-xl py-6 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Start Cooking
              </Button>
            )}

            {order.status === 'cooking' && (
              <Button
                onClick={() => updateOrderStatus('served')}
                className="w-full text-xl py-6 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Ready to Serve
              </Button>
            )}

            {order.status === 'served' && (
              <Button
                onClick={handlePayment}
                className="w-full text-xl py-6 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                Paid / Close
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
