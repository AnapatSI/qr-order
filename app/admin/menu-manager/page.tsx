'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Upload, UtensilsCrossed, Search } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  is_available: boolean
  category?: string
}

export default function MenuManager() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ name: '', price: '', category: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .limit(1)
        .single()

      if (storeData) {
        setStoreId(storeData.id)
        await fetchMenus(storeData.id)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const fetchMenus = async (sid: string) => {
    const { data } = await supabase.from('menus').select('*').eq('store_id', sid).order('name')
    if (data) setMenus(data)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      if (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) return null
      const fileExt = file.name.split('.').pop()
      const filePath = `${storeId}-${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('menu-images').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (error) return null
      const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath)
      return data.publicUrl
    } catch { return null }
  }

  const toggleAvailability = async (menu: MenuItem) => {
    await supabase.from('menus').update({ is_available: !menu.is_available }).eq('id', menu.id)
    await fetchMenus(storeId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    let imageUrl = editingMenu?.image_url || ''
    if (imageFile) {
      const url = await uploadImage(imageFile)
      if (url) imageUrl = url
    }
    const menuData = { store_id: storeId, name: formData.name, price: parseInt(formData.price), image_url: imageUrl, is_available: true, category: formData.category || null }
    if (editingMenu) {
      await supabase.from('menus').update(menuData).eq('id', editingMenu.id)
    } else {
      await supabase.from('menus').insert(menuData)
    }
    await fetchMenus(storeId)
    resetForm()
    setUploading(false)
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({ name: menu.name, price: menu.price.toString(), category: menu.category || '' })
    setImagePreview(menu.image_url || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this menu item?')) {
      await supabase.from('menus').delete().eq('id', id)
      await fetchMenus(storeId)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '' })
    setImageFile(null)
    setImagePreview('')
    setEditingMenu(null)
    setDialogOpen(false)
  }

  const filteredMenus = menus.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu Manager</h1>
              <p className="text-xs text-gray-400 mt-0.5">{menus.length} items</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={() => resetForm()} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center space-x-2 shadow-md shadow-[#0ea5e9]/20 transition-all">
                  <Plus className="w-4 h-4" />
                  <span>Add Menu</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{editingMenu ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Pad Thai" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Price (฿)</label>
                      <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="120" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" required />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
                      <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Seafood" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Image</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-[#0ea5e9] transition-colors">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                          <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }} className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer py-4">
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="text-xs text-gray-400">Click to upload (max 5MB)</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                  <button type="submit" disabled={uploading} className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl h-11 font-semibold text-sm shadow-md shadow-[#0ea5e9]/20 transition-all disabled:opacity-50">
                    {uploading ? 'Uploading...' : editingMenu ? 'Update' : 'Add Item'}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-[#f5f5f4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30" />
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {filteredMenus.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{menus.length === 0 ? 'No menu items yet. Add your first item!' : 'No items match your search.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMenus.map((menu) => (
              <div key={menu.id} className="bg-white rounded-xl p-4 flex items-center space-x-4 shadow-sm">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f4] flex-shrink-0">
                  {menu.image_url ? (
                    <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{menu.name}</h3>
                  <p className="text-[#0ea5e9] font-bold text-base">฿{menu.price}</p>
                  {menu.category && <span className="text-[10px] text-gray-400 bg-[#f5f5f4] px-2 py-0.5 rounded-full">{menu.category}</span>}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleAvailability(menu)}
                  className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${menu.is_available ? 'bg-[#10b981]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${menu.is_available ? 'left-[22px]' : 'left-0.5'}`} />
                </button>

                {/* Actions */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button onClick={() => handleEdit(menu)} className="w-9 h-9 rounded-lg hover:bg-[#e0f2fe] flex items-center justify-center text-gray-400 hover:text-[#0ea5e9] transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu.id)} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
