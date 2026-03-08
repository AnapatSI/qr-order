'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { Minus, Plus, X, ShoppingBag, Phone } from 'lucide-react'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  tableNo?: string | null
}

export function CartDrawer({ open, onOpenChange, storeId, tableNo }: CartDrawerProps) {
  const { items, removeFromCart, clearCart, updateQuantity } = useCartStore()
  const [loading, setLoading] = useState(false)

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleUpdateQuantity = (menuId: number, delta: number) => {
    updateQuantity(menuId, delta)
  }

  const handlePlaceOrder = async () => {
    if (!tableNo) {
      alert('Table number is required')
      return
    }

    setLoading(true)
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          table_no: tableNo,
          status: 'pending',
          total_price: totalPrice
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        menu_id: item.id,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      clearCart()
      onOpenChange(false)
      alert('Order placed successfully!')
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleCallStaff = async () => {
    if (!tableNo) {
      alert('Table number is required')
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('store_id', storeId)
        .eq('table_no', tableNo)
        .eq('status', 'pending')

      if (error) throw error
      alert('Staff notified!')
    } catch (error) {
      console.error('Error calling staff:', error)
      alert('Failed to notify staff')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[480px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-cyan-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <SheetTitle className="text-2xl font-bold text-white">Your Cart</SheetTitle>
          </div>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-slate-100 rounded-full p-6 mb-4">
                <ShoppingBag className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">Your cart is empty</p>
              <p className="text-slate-400 text-sm mt-1">Add some delicious items!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-blue-600 font-semibold text-lg">฿{item.price}</span>
                        <span className="text-slate-400">×</span>
                        <span className="text-slate-600 font-medium">{item.quantity}</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-2">
                        ฿{item.price * item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 rounded-lg hover:bg-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-8 text-center font-bold text-sm">
                          {item.quantity}
                        </div>
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 rounded-lg hover:bg-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Actions */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 space-y-4">
            {/* Total */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-lg">Total</span>
                <span className="text-3xl font-bold text-blue-600">฿{totalPrice}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl py-7 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Placing Order...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6" />
                    <span>Place Order</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={handleCallStaff}
                variant="outline"
                className="w-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-2xl py-6 text-lg font-semibold transition-all duration-200"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Staff / Bill
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
