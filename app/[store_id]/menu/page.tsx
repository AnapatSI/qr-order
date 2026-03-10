'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/useCartStore'
import { CartDrawer } from './components/CartDrawer'
import { MenuOptionDrawer } from './components/MenuOptionDrawer'
import { ShoppingCart, Plus, Minus, Search, UtensilsCrossed, ClipboardList } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  is_available: boolean
  category?: string
  description?: string
}

export default function MenuPage({ params }: { params: Promise<{ store_id: string }> }) {
  const resolvedParams = React.use(params)
  const storeId = resolvedParams.store_id
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [optionDrawerOpen, setOptionDrawerOpen] = useState(false)
  const [storeName, setStoreName] = useState('Smart Order')
  const searchParams = useSearchParams()
  const tableNo = searchParams.get('table')
  const [tableError, setTableError] = useState(false)
  const addToCartSimple = useCartStore((state) => state.addToCartSimple)
  const getItemQuantity = useCartStore((state) => state.getItemQuantity)
  const totalItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = useCartStore((state) => state.totalPrice)

  useEffect(() => {
    if (storeId) {
      fetchMenus()
      fetchStoreName()
    }
  }, [storeId])

  useEffect(() => {
    if (!tableNo) {
      setTableError(true)
    }
  }, [tableNo])

  const fetchStoreName = async () => {
    const { data } = await supabase.from('stores').select('name').eq('id', storeId).single()
    if (data) setStoreName(data.name)
  }

  const fetchMenus = async () => {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('store_id', storeId)
      .order('name')

    if (!error && data) {
      setMenus(data)
      // Build dynamic categories from data
      const cats = [...new Set(data.map(m => m.category).filter(Boolean))] as string[]
      setCategories(['All', ...cats])
    }
    setLoading(false)
  }

  const filteredMenus = menus.filter(menu => {
    const matchCategory = activeCategory === 'All' || menu.category === activeCategory
    const matchSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const handleMenuClick = (menu: MenuItem) => {
    if (!menu.is_available) return
    setSelectedMenu(menu)
    setOptionDrawerOpen(true)
  }

  const handleQuickAdd = (e: React.MouseEvent, menu: MenuItem) => {
    e.stopPropagation()
    addToCartSimple({ id: menu.id, name: menu.name, price: menu.price })
  }

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

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Table Selection Modal */}
      {tableError && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Your Table</h2>
            <p className="text-sm text-gray-400 mb-4">Please scan QR code or select your table number to continue</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    const newUrl = `${window.location.pathname}?table=${num}`
                    window.location.href = newUrl
                  }}
                  className="bg-[#f5f5f4] hover:bg-[#0ea5e9] hover:text-white rounded-lg py-3 text-sm font-medium transition-colors"
                >
                  Table {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const newUrl = `${window.location.pathname}?table=1`
                window.location.href = newUrl
              }}
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg py-3 text-sm font-medium transition-colors"
            >
              Continue with Table 1
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
              <p className="text-xs text-gray-400">Table {tableNo || 'Not Selected'}</p>
            </div>
            {tableNo && (
              <Link href={`/${storeId}/orders?table=${tableNo}`} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <ClipboardList className="w-4 h-4" />
              </Link>
            )}
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
            {categories.map((cat) => (
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
                  <div
                    onClick={() => handleMenuClick(menu)}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${!menu.is_available ? 'opacity-60' : ''}`}
                  >
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
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Sold Out</span>
                        </div>
                      )}

                      {/* Quick Add Button */}
                      {menu.is_available && quantity === 0 && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleQuickAdd(e, menu)}
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
                          className="absolute bottom-2 right-2 bg-[#0ea5e9] text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg"
                        >
                          {quantity}
                        </motion.div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{menu.name}</h3>
                      {menu.description && (
                        <p className="text-[10px] text-gray-400 line-clamp-1 mb-1">{menu.description}</p>
                      )}
                      <p className="text-[#0ea5e9] font-bold text-base">฿{menu.price}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })})}
          </AnimatePresence>
        </div>

        {filteredMenus.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
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

      {/* Add-on Drawer */}
      <MenuOptionDrawer
        open={optionDrawerOpen}
        onOpenChange={setOptionDrawerOpen}
        menu={selectedMenu}
      />

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
