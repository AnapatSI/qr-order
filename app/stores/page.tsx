'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Store, Utensils, Table2, QrCode } from 'lucide-react'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  credit_balance: number
  total_orders: number
  total_revenue: number
  average_rating: number
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  // Fix for Next.js client-side URLSearchParams
  const getStoreParam = () => {
    if (typeof window === 'undefined') return null
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('store')
  }

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*').order('name')
    if (data) setStores(data)
    setLoading(false)
  }

  const handleAddStore = async () => {
    if (!formData.name.trim()) return
    setAdding(true)
    
    // Generate store ID from name
    const storeId = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]/g, '')
      .substring(0, 10) + Date.now().toString().slice(-4)
    
    await supabase.from('stores').insert({
      id: storeId,
      name: formData.name.trim(),
      credit_balance: 100,
      total_orders: 0,
      total_revenue: 0,
      average_rating: 0
    })
    
    setFormData({ name: '' })
    setDialogOpen(false)
    await fetchStores()
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Store Management</h1>
                <p className="text-[10px] text-gray-400">{stores.length} stores</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={() => setFormData({ name: '' })} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center space-x-2 shadow-md shadow-[#0ea5e9]/20 transition-all">
                  <Plus className="w-4 h-4" />
                  <span>Add Store</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Add New Store</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Store Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      placeholder="e.g., Bangsaen Seafood"
                      className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]"
                    />
                  </div>
                  <button
                    onClick={handleAddStore}
                    disabled={adding || !formData.name.trim()}
                    className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 text-white rounded-xl h-11 font-semibold text-sm transition-all"
                  >
                    {adding ? 'Adding...' : 'Add Store'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {stores.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No stores yet. Add your first store!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card key={store.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">ID: {store.id}</p>
                      <p className="text-xs text-gray-400">Credit: ฿{store.credit_balance}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{store.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#f5f5f4] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-900">{store.total_orders}</p>
                      <p className="text-xs text-gray-400">Orders</p>
                    </div>
                    <div className="bg-[#f5f5f4] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-900">⭐{store.average_rating || '0'}</p>
                      <p className="text-xs text-gray-400">Rating</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href={`/${store.id}/dashboard`} className="block w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg px-3 py-2 text-sm font-medium text-center transition-all">
                      Dashboard
                    </Link>
                    <div className="grid grid-cols-3 gap-2">
                      <Link href={`/menu-manager?store=${store.id}`} className="bg-[#f5f5f4] hover:bg-[#e5e7eb] text-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium text-center transition-all">
                        Menu
                      </Link>
                      <Link href={`/table-manager?store=${store.id}`} className="bg-[#f5f5f4] hover:bg-[#e5e7eb] text-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium text-center transition-all">
                        Tables
                      </Link>
                      <Link href={`/qr-generator?store=${store.id}`} className="bg-[#f5f5f4] hover:bg-[#e5e7eb] text-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium text-center transition-all">
                        QR
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
