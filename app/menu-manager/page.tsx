'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Upload, UtensilsCrossed, Search, Settings2, X, GripVertical } from 'lucide-react'

interface MenuOptionChoice {
  name: string
  price: number
}

interface MenuOption {
  id: number
  menu_id: number
  name: string
  choices: MenuOptionChoice[]
  is_required: boolean
  max_selection: number
  sort_order: number
}

interface MenuItem {
  id: number
  name: string
  price: number
  description?: string
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
  const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  // Options state
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false)
  const [optionsMenuId, setOptionsMenuId] = useState<number | null>(null)
  const [optionsMenuName, setOptionsMenuName] = useState('')
  const [options, setOptions] = useState<MenuOption[]>([])
  const [optionForm, setOptionForm] = useState({ name: '', is_required: false, max_selection: 1 })
  const [optionChoices, setOptionChoices] = useState<MenuOptionChoice[]>([{ name: '', price: 0 }])
  const [editingOption, setEditingOption] = useState<MenuOption | null>(null)
  const [optionLoading, setOptionLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Get store_id from URL parameter
      const storeParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('store') : null
      
      if (storeParam) {
        setStoreId(storeParam)
        await fetchMenus(storeParam)
      } else {
        // Fallback: get first store
        const { data: storeData } = await supabase.from('stores').select('id').limit(1).single()
        if (storeData) {
          setStoreId(storeData.id)
          await fetchMenus(storeData.id)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const fetchMenus = async (sid: string) => {
    const { data } = await supabase.from('menus').select('*').eq('store_id', sid).order('name')
    if (data) setMenus(data)
  }

  const fetchOptions = async (menuId: number) => {
    const { data } = await supabase.from('menu_options').select('*').eq('menu_id', menuId).order('sort_order')
    if (data) {
      setOptions(data.map((o: any) => ({
        ...o,
        choices: typeof o.choices === 'string' ? JSON.parse(o.choices) : o.choices
      })))
    }
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

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = editingMenu?.image_url || ''
      if (imageFile) {
        const url = await uploadImage(imageFile)
        if (url) imageUrl = url
      }
      const menuData = {
        store_id: storeId,
        name: formData.name,
        price: parseInt(formData.price),
        image_url: imageUrl,
        is_available: true,
        category: formData.category || null,
        description: formData.description || null
      }
      
      let error
      if (editingMenu) {
        const { error: updateError } = await supabase.from('menus').update(menuData).eq('id', editingMenu.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('menus').insert(menuData)
        error = insertError
      }
      
      if (error) {
        console.error('Error saving menu:', error)
        alert('Failed to save menu item')
      } else {
        await fetchMenus(storeId)
        resetForm()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('Failed to save menu item')
    }
    setUploading(false)
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({ name: menu.name, price: menu.price.toString(), category: menu.category || '', description: menu.description || '' })
    setImagePreview(menu.image_url || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this menu item and all its options?')) {
      try {
        const { error: optionsError } = await supabase.from('menu_options').delete().eq('menu_id', id)
        if (optionsError) {
          console.error('Error deleting menu options:', optionsError)
        }
        
        const { error: menuError } = await supabase.from('menus').delete().eq('id', id)
        if (menuError) {
          console.error('Error deleting menu:', menuError)
          alert('Failed to delete menu item')
        } else {
          await fetchMenus(storeId)
        }
      } catch (error) {
        console.error('Error in handleDelete:', error)
        alert('Failed to delete menu item')
      }
    }
  }

  const toggleAvailable = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('menus').update({ is_available: !currentStatus }).eq('id', id)
    if (error) {
      console.error('Error toggling menu availability:', error)
      alert('Failed to update menu availability')
    } else {
      await fetchMenus(storeId)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '' })
    setImageFile(null)
    setImagePreview('')
    setEditingMenu(null)
    setDialogOpen(false)
  }

  // Options management
  const openOptionsDialog = async (menu: MenuItem) => {
    setOptionsMenuId(menu.id)
    setOptionsMenuName(menu.name)
    setOptionsDialogOpen(true)
    await fetchOptions(menu.id)
  }

  const resetOptionForm = () => {
    setOptionForm({ name: '', is_required: false, max_selection: 1 })
    setOptionChoices([{ name: '', price: 0 }])
    setEditingOption(null)
  }

  const handleEditOption = (opt: MenuOption) => {
    setEditingOption(opt)
    setOptionForm({ name: opt.name, is_required: opt.is_required, max_selection: opt.max_selection })
    setOptionChoices(opt.choices.length > 0 ? opt.choices : [{ name: '', price: 0 }])
  }

  const handleSaveOption = async () => {
    if (!optionsMenuId || !optionForm.name.trim()) return
    setOptionLoading(true)
    const validChoices = optionChoices.filter(c => c.name.trim())
    if (validChoices.length === 0) { setOptionLoading(false); return }

    const payload = {
      menu_id: optionsMenuId,
      name: optionForm.name,
      choices: validChoices,
      is_required: optionForm.is_required,
      max_selection: optionForm.max_selection,
      sort_order: editingOption ? editingOption.sort_order : options.length
    }

    if (editingOption) {
      await supabase.from('menu_options').update(payload).eq('id', editingOption.id)
    } else {
      await supabase.from('menu_options').insert(payload)
    }

    await fetchOptions(optionsMenuId)
    resetOptionForm()
    setOptionLoading(false)
  }

  const handleDeleteOption = async (optId: number) => {
    if (!optionsMenuId) return
    await supabase.from('menu_options').delete().eq('id', optId)
    await fetchOptions(optionsMenuId)
  }

  const addChoiceRow = () => setOptionChoices([...optionChoices, { name: '', price: 0 }])
  const removeChoiceRow = (i: number) => setOptionChoices(optionChoices.filter((_, idx) => idx !== i))
  const updateChoice = (i: number, field: 'name' | 'price', value: string | number) => {
    setOptionChoices(optionChoices.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
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
              <DialogContent className="sm:max-w-[480px] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{editingMenu ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Pad Thai" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Stir-fried rice noodles with shrimp..." className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" />
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
              <div key={menu.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-4">
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
                    {menu.description && <p className="text-[10px] text-gray-400 truncate">{menu.description}</p>}
                    <p className="text-[#0ea5e9] font-bold text-base">฿{menu.price}</p>
                    {menu.category && <span className="text-[10px] text-gray-400 bg-[#f5f5f4] px-2 py-0.5 rounded-full">{menu.category}</span>}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAvailable(menu.id, menu.is_available)}
                    className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${menu.is_available ? 'bg-[#10b981]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${menu.is_available ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={() => openOptionsDialog(menu)} className="w-9 h-9 rounded-lg hover:bg-[#fef3c7] flex items-center justify-center text-gray-400 hover:text-[#d97706] transition-colors" title="Manage Options">
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(menu)} className="w-9 h-9 rounded-lg hover:bg-[#e0f2fe] flex items-center justify-center text-gray-400 hover:text-[#0ea5e9] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(menu.id)} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Options Management Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={(o) => { setOptionsDialogOpen(o); if (!o) resetOptionForm() }}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center space-x-2">
              <Settings2 className="w-5 h-5 text-[#d97706]" />
              <span>Options — {optionsMenuName}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Existing Options */}
          <div className="space-y-3 mt-2">
            {options.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No options yet. Add one below.</p>
            )}
            {options.map((opt) => (
              <div key={opt.id} className="bg-[#f5f5f4] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-gray-900">{opt.name}</h4>
                    {opt.is_required && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>}
                    <span className="text-[9px] text-gray-400">max {opt.max_selection}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => handleEditOption(opt)} className="w-7 h-7 rounded-md hover:bg-white flex items-center justify-center text-gray-400 hover:text-[#0ea5e9]">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteOption(opt.id)} className="w-7 h-7 rounded-md hover:bg-white flex items-center justify-center text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {opt.choices.map((c, i) => (
                    <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-lg text-gray-700">
                      {c.name}{c.price > 0 && <span className="text-[#f97316] ml-1">+฿{c.price}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Option Form */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">{editingOption ? 'Edit Option' : 'Add New Option'}</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Option Group Name</label>
                <Input
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="e.g., Protein, Size, Toppings"
                  className="h-10 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optionForm.is_required}
                    onChange={(e) => setOptionForm({ ...optionForm, is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0ea5e9] focus:ring-[#0ea5e9]"
                  />
                  <span className="text-xs text-gray-700">Required</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Max select:</span>
                  <Input
                    type="number"
                    min={1}
                    value={optionForm.max_selection}
                    onChange={(e) => setOptionForm({ ...optionForm, max_selection: parseInt(e.target.value) || 1 })}
                    className="w-16 h-8 rounded-lg bg-[#f5f5f4] border-0 text-center text-xs focus-visible:ring-[#0ea5e9]"
                  />
                </div>
              </div>

              {/* Choices */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Choices</label>
                <div className="space-y-2">
                  {optionChoices.map((choice, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Input
                        value={choice.name}
                        onChange={(e) => updateChoice(i, 'name', e.target.value)}
                        placeholder="Choice name"
                        className="h-9 rounded-lg bg-[#f5f5f4] border-0 text-sm flex-1 focus-visible:ring-[#0ea5e9]"
                      />
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400">+฿</span>
                        <Input
                          type="number"
                          min={0}
                          value={choice.price}
                          onChange={(e) => updateChoice(i, 'price', parseInt(e.target.value) || 0)}
                          className="w-20 h-9 rounded-lg bg-[#f5f5f4] border-0 text-sm focus-visible:ring-[#0ea5e9]"
                        />
                      </div>
                      {optionChoices.length > 1 && (
                        <button onClick={() => removeChoiceRow(i)} className="w-8 h-8 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addChoiceRow} className="text-xs text-[#0ea5e9] font-medium mt-2 hover:underline flex items-center space-x-1">
                  <Plus className="w-3 h-3" />
                  <span>Add choice</span>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSaveOption}
                  disabled={optionLoading || !optionForm.name.trim()}
                  className="flex-1 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 text-white rounded-xl h-10 font-semibold text-sm transition-all"
                >
                  {optionLoading ? 'Saving...' : editingOption ? 'Update Option' : 'Add Option'}
                </button>
                {editingOption && (
                  <button onClick={resetOptionForm} className="px-4 h-10 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
