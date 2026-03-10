'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { Minus, Plus, Trash2, ShoppingBag, Phone, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  tableNo?: string | null
}

export function CartDrawer({ open, onOpenChange, storeId, tableNo }: CartDrawerProps) {
  const { items, removeFromCart, clearCart, updateQuantity, totalPrice } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const handlePlaceOrder = async () => {
    if (!tableNo || items.length === 0) return

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
        selected_options: item.selectedOptions.length > 0
          ? item.selectedOptions.map(o => `${o.optionName}: ${o.choices.join(', ')}`).join(' | ')
          : null,
        note: item.note || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      clearCart()
      setOrderSuccess(true)
      setTimeout(() => {
        setOrderSuccess(false)
        onOpenChange(false)
      }, 2500)
    } catch (error) {
      console.error('Error placing order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCallStaff = async () => {
    if (!tableNo) return
    try {
      // Create a staff notification record
      await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          table_no: tableNo,
          status: 'staff_call',
          total_price: 0,
          notes: 'Customer requested staff assistance'
        })
      
      alert('Staff has been notified! They will be at your table shortly.')
    } catch (error) {
      console.error('Error calling staff:', error)
      alert('Unable to notify staff. Please call the restaurant directly.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-96 flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#0ea5e9]" />
              <span className="text-lg">Your Order</span>
            </div>
            <span className="text-xs text-gray-400 font-normal">
              {items.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Order Success */}
        <AnimatePresence>
          {orderSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                >
                  <CheckCircle className="w-20 h-20 text-[#10b981] mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Order Placed!</h3>
                <p className="text-gray-500 text-sm">Your food is being prepared</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!orderSuccess && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#f5f5f4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.cartKey}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-[#f5f5f4] rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm flex-1 pr-2">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.cartKey)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Selected Options */}
                        {item.selectedOptions.length > 0 && (
                          <div className="mb-1.5">
                            {item.selectedOptions.map((opt, i) => (
                              <p key={i} className="text-[10px] text-gray-500">
                                {opt.optionName}: <span className="text-gray-700 font-medium">{opt.choices.join(', ')}</span>
                                {opt.extraPrice > 0 && <span className="text-[#f97316]"> +฿{opt.extraPrice}</span>}
                              </p>
                            ))}
                          </div>
                        )}
                        {/* Note */}
                        {item.note && (
                          <p className="text-[10px] text-[#f97316] bg-[#fef3c7] px-2 py-0.5 rounded-md mb-1.5 inline-block">
                            {item.note}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-white rounded-lg">
                            <button onClick={() => updateQuantity(item.cartKey, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#0ea5e9]">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartKey, 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#0ea5e9]">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-bold text-gray-900 text-sm">฿{((item.price + item.addonsPrice) * item.quantity).toLocaleString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {items.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Total</span>
                    <span className="text-xl font-bold text-gray-900">฿{totalPrice.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 text-white rounded-xl h-12 font-semibold text-base shadow-lg shadow-[#0ea5e9]/20 transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Placing order...</span>
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </>
              )}
              <button
                onClick={handleCallStaff}
                className="w-full flex items-center justify-center space-x-2 text-[#10b981] text-sm font-medium py-2 hover:bg-[#10b981]/5 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Staff</span>
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
