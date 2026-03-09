'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { validateStoreId, validateTableNumber } from '@/lib/security'
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

    // Validate inputs
    if (!validateStoreId(storeId)) {
      alert('Invalid store ID')
      return
    }

    if (!validateTableNumber(tableNo)) {
      alert('Invalid table number')
      return
    }

    if (items.length === 0) {
      alert('Cart is empty')
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
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      clearCart()
      onOpenChange(false)
      alert('Order placed successfully! The restaurant will prepare your order.')

    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
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
      <SheetContent className="w-full sm:w-96 flex flex-col">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Your Cart</span>
            </div>
            <span className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-5xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">฿{item.price}</div>
                        <div className="text-sm text-gray-600">฿{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-4 space-y-3">
          {items.length > 0 && (
            <>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">฿{totalPrice.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="w-full"
                  size="sm"
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}

          {/* Call Staff Button */}
          <div className="pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              className="w-full text-green-600 border-green-600 hover:bg-green-50"
              size="sm"
              onClick={handleCallStaff}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Staff
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
