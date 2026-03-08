'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUser } from '@/lib/supabase-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  price: number
  image_url?: string
  is_available: boolean
}

export default function MenuManager() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      // TEMPORARILY DISABLE AUTH CHECK FOR TESTING
      console.log('AUTHENTICATION DISABLED - Using mock store data')
      
      // Use store ID directly for testing
      const testStoreId = 'BS001'
      setStoreId(testStoreId)
      await fetchMenus(testStoreId)
      setLoading(false)
    }

    fetchData()
  }, [])

  const fetchMenus = async (storeId: string) => {
    const { data } = await supabase
      .from('menus')
      .select('*')
      .eq('store_id', storeId)
      .order('name')

    if (data) {
      setMenus(data)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size)
        return null
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type)
        return null
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${storeId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Uploading image:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      console.log('Upload successful:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('Upload failed:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let imageUrl = editingMenu?.image_url || ''

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }

    const menuData = {
      store_id: storeId,
      name: formData.name,
      price: parseInt(formData.price),
      image_url: imageUrl,
      is_available: true,
    }

    if (editingMenu) {
      const { error } = await supabase
        .from('menus')
        .update(menuData)
        .eq('id', editingMenu.id)

      if (!error) {
        await fetchMenus(storeId)
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('menus')
        .insert(menuData)

      if (!error) {
        await fetchMenus(storeId)
        resetForm()
      }
    }

    setUploading(false)
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
    })
    setImagePreview(menu.image_url || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      await supabase.from('menus').delete().eq('id', id)
      await fetchMenus(storeId)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '' })
    setImageFile(null)
    setImagePreview('')
    setEditingMenu(null)
    setDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  // Show error if user not linked to a store
  if (storeId === 'no-store') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Store Not Found</h2>
            <p className="text-red-600 mb-4">
              Your account is not linked to any store. Please contact the administrator to set up your store.
            </p>
            <Button 
              onClick={() => router.push('/admin/dashboard')}
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Menu Manager</h1>
            <p className="text-sm text-slate-500">Manage your restaurant menu</p>
          </div>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
            className="border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl px-6"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl px-6 py-3 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Menu Item
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Menu Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pad Thai"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Price (฿)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 120"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Menu Image</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-500 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                        }}
                        className="w-full"
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-12 h-12 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600 mb-1">Click to upload image</span>
                      <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={uploading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold"
              >
                {uploading ? 'Uploading...' : editingMenu ? 'Update Menu Item' : 'Add Menu Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="border-0 shadow-lg overflow-hidden">
              {menu.image_url ? (
                <div className="aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={menu.image_url}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                </div>
              )}
              <CardContent className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{menu.name}</h3>
                <div className="text-2xl font-bold text-blue-600 mb-4">฿{menu.price}</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(menu)}
                    variant="outline"
                    className="flex-1 border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(menu.id)}
                    variant="outline"
                    className="flex-1 border-2 border-slate-300 hover:border-red-500 hover:bg-red-50 text-red-600 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
