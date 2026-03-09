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
    if (storeId) {
      fetchMenus()
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!tableNo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Table Required</h1>
          <p className="text-gray-600">Please scan the QR code at your table to access the menu.</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Menu</h1>
              <p className="text-sm text-gray-500">Table {tableNo}</p>
            </div>
            <Button
              onClick={() => setCartOpen(true)}
              className="relative bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Grid - Mobile First */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menus.map((menu) => {
            const quantity = getItemQuantity(menu.id)
            return (
              <Card key={menu.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {menu.image_url && (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{menu.name}</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">฿{menu.price}</span>
                    {menu.is_available ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Sold Out</span>
                    )}
                  </div>

                  {menu.is_available ? (
                    quantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(menu.id, quantity - 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(menu.id, quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-sm text-gray-600">฿{(menu.price * quantity).toLocaleString()}</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(menu)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    )
                  ) : (
                    <Button disabled className="w-full" size="sm">
                      Sold Out
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {menus.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items available</h3>
            <p className="text-gray-600">Check back later for updated menu items.</p>
          </div>
        )}
      </div>

      {/* Mobile Cart Summary Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30 md:hidden">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({totalItems} items) - ฿{totalPrice.toLocaleString()}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        open={cartOpen} 
        onOpenChange={setCartOpen}
        storeId={storeId}
        tableNo={tableNo}
      />
    </div>
  )
}
