'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import { CartDrawer } from './components/CartDrawer'
import { ShoppingCart, Plus, Minus, Search, UtensilsCrossed } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  is_available: boolean
  category?: string
  description?: string
}

const CATEGORIES = ['All', 'Recommended', 'Seafood', 'Drinks', 'Desserts']

export default function MenuPage({ params }: { params: Promise<{ store_id: string }> }) {
  const resolvedParams = React.use(params)
  const storeId = resolvedParams.store_id
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredMenus = menus.filter(menu => {
    const matchCategory = activeCategory === 'All' || menu.category === activeCategory
    const matchSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-[#0ea5e9] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!tableNo) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-[#e0f2fe] rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-[#0ea5e9]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h1>
          <p className="text-gray-500 text-sm">Please scan the QR code at your table to access the menu.</p>
        </motion.div>
      </div>
    )
  }

  const handleAddToCart = (menu: MenuItem) => {
    addToCart({ id: menu.id, name: menu.name, price: menu.price })
  }

  const handleUpdateQuantity = (menuId: number, delta: number) => {
    updateQuantity(menuId, delta)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bangsaen Seafood</h1>
              <p className="text-xs text-[#0ea5e9] font-medium">Table {tableNo}</p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-10 h-10 bg-[#0ea5e9] rounded-full flex items-center justify-center shadow-md"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#f97316] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#f5f5f4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 transition-all"
            />
          </div>

          {/* Category Pills */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#0ea5e9] text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredMenus.map((menu) => {
              const quantity = getItemQuantity(menu.id)
              return (
                <motion.div
                  key={menu.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!menu.is_available ? 'opacity-60' : ''}`}>
                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-gray-100 relative">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e0f2fe] to-[#f5f5f4]">
                          <UtensilsCrossed className="w-10 h-10 text-[#0ea5e9]/30" />
                        </div>
                      )}

                      {/* Sold Out Overlay */}
                      {!menu.is_available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Sold Out
                          </span>
                        </div>
                      )}

                      {/* Quick Add Button */}
                      {menu.is_available && quantity === 0 && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddToCart(menu)}
                          className="absolute bottom-2 right-2 w-8 h-8 bg-[#0ea5e9] rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </motion.button>
                      )}

                      {/* Quantity Badge */}
                      {quantity > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute bottom-2 right-2 flex items-center bg-[#0ea5e9] rounded-full shadow-lg"
                        >
                          <button
                            onClick={() => handleUpdateQuantity(menu.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white text-xs font-bold min-w-[20px] text-center">{quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(menu.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{menu.name}</h3>
                      <p className="text-[#0ea5e9] font-bold text-base">฿{menu.price}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredMenus.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No menu items found</p>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-30"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-[#0ea5e9] text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-[#0ea5e9]/25"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">{totalItems} items</span>
              </div>
              <span className="font-bold text-lg">฿{totalPrice.toLocaleString()}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
