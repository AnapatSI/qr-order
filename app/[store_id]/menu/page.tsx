'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import { CartDrawer } from './components/CartDrawer'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  is_available: boolean
}

export default function MenuPage({ params }: { params: Promise<{ store_id: string }> }) {
  // 1. Unwrap at the top level
  const resolvedParams = React.use(params);
  const storeId = resolvedParams.store_id;
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const searchParams = useSearchParams()
  const tableNo = searchParams.get('table')
  const addToCart = useCartStore((state) => state.addToCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getItemQuantity = useCartStore((state) => state.getItemQuantity)
  const totalItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = useCartStore((state) => state.totalPrice)

    const fetchMenus = async () => {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_available', true)
      .order('name')

    if (error) {
      console.error('Error fetching menus:', error)
    } else {
      setMenus(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenus()
  }, [storeId])

  const handleAddToCart = (menu: MenuItem) => {
    addToCart({
      id: menu.id,
      name: menu.name,
      price: menu.price
    })
  }

  const handleUpdateQuantity = (menuId: number, delta: number) => {
    updateQuantity(menuId, delta)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg text-slate-600">Loading menu...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bangsaen Cafe</h1>
              <p className="text-sm text-slate-500">Order your favorites</p>
            </div>
            {tableNo && (
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-2xl shadow-md">
                <div className="text-xs font-medium opacity-90">Table</div>
                <div className="text-xl font-bold">{tableNo}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menus.map((menu) => {
            const quantity = getItemQuantity(menu.id)
            return (
              <div
                key={menu.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {menu.image_url && (
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{menu.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-3xl font-bold text-blue-600">
                      ฿{menu.price}
                    </div>
                    
                    {quantity === 0 ? (
                      <Button
                        onClick={() => handleAddToCart(menu)}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                        <Button
                          onClick={() => handleUpdateQuantity(menu.id, -1)}
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-xl hover:bg-white transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <div className="w-12 text-center font-bold text-lg">
                          {quantity}
                        </div>
                        <Button
                          onClick={() => handleUpdateQuantity(menu.id, 1)}
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-xl hover:bg-white transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl px-6 py-5 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium opacity-90">{totalItems} {totalItems === 1 ? 'item' : 'items'}</div>
                  <div className="text-xs opacity-75">View cart</div>
                </div>
              </div>
              <div className="text-2xl font-bold">
                ฿{totalPrice}
              </div>
            </button>
          </div>
        </div>
      )}

      <CartDrawer 
        open={cartOpen} 
        onOpenChange={setCartOpen}
        storeId={storeId}
        tableNo={tableNo}
      />
    </div>
  )
}
