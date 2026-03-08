'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signOut, getUser } from '@/lib/supabase-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  QrCode,
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Table as TableIcon
} from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'

interface MenuItem {
  id: number
  name: string
  price: number
  category?: string
  description?: string
  image_url?: string
  is_available: boolean
}

interface TableItem {
  id: string
  table_number: string
  created_at: string
}

export default function AdminDashboard() {
  const [creditBalance, setCreditBalance] = useState(0)
  const [todaySales, setTodaySales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<TableItem[]>([])
  const router = useRouter()

  // Menu Manager States
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    price: '',
    description: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  // Table Manager States
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser()
        if (!user) {
          // Don't redirect, just show error - proxy handles auth
          setLoading(false)
          return
        }

        // Get store associated with this user
        const { data: storeData, error } = await supabase
          .from('stores')
          .select('id, credit_balance')
          .eq('owner_id', user.id)
          .single()

        if (storeData) {
          setStoreId(storeData.id)
          setCreditBalance(storeData.credit_balance)

          // Get today's sales
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const { data: ordersData } = await supabase
            .from('orders')
            .select('total_price')
            .eq('store_id', storeData.id)
            .eq('status', 'paid')
            .gte('created_at', today.toISOString())

          if (ordersData) {
            const total = ordersData.reduce((sum, order) => sum + order.total_price, 0)
            setTodaySales(total)
          }

          // Fetch menus and tables
          await fetchMenus(storeData.id)
          await fetchTables(storeData.id)
        } else if (error) {
          console.error('Store fetch error:', error)
          // If store not found, user might not be linked to a store
          setStoreId('no-store')
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      }

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

  const fetchTables = async (storeId: string) => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('store_id', storeId)
      .order('table_number')

    if (data) {
      setTables(data)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  // Menu Manager Functions
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
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size)
        return null
      }

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

  const handleMenuSubmit = async (e: React.FormEvent) => {
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
      name: menuFormData.name,
      price: parseInt(menuFormData.price),
      description: menuFormData.description,
      image_url: imageUrl,
      is_available: true,
    }

    if (editingMenu) {
      const { data, error } = await supabase
        .from('menus')
        .update(menuData)
        .eq('id', editingMenu.id)
        .select()

      if (error) {
        console.error('Error updating menu:', error)
        console.log('Full menu update error:', JSON.stringify(error, null, 2))
        alert(`Error updating menu: ${error.message || 'Unknown error'}`)
      } else {
        console.log('Menu updated successfully:', data)
      }
    } else {
      const { data, error } = await supabase
        .from('menus')
        .insert(menuData)
        .select()

      if (error) {
        console.error('Error creating menu:', error)
        console.log('Full menu create error:', JSON.stringify(error, null, 2))
        alert(`Error creating menu: ${error.message || 'Unknown error'}`)
      } else {
        console.log('Menu created successfully:', data)
      }
    }

    setUploading(false)
    resetMenuForm()
    await fetchMenus(storeId)
  }

  const resetMenuForm = () => {
    setMenuFormData({ name: '', price: '', description: '' })
    setImageFile(null)
    setImagePreview('')
    setEditingMenu(null)
    setMenuDialogOpen(false)
  }

  const deleteMenu = async (menuId: number) => {
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId)

    if (error) {
      console.error('Error deleting menu:', error)
    } else {
      await fetchMenus(storeId)
    }
  }

  // Table Manager Functions
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Adding table:', { storeId, tableNumber })
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          store_id: storeId,
          table_number: tableNumber
        })
        .select()

      if (error) {
        console.error('Error adding table:', error)
        console.log('Full error object:', JSON.stringify(error, null, 2))
        console.log('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Check if tables table doesn't exist
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          alert('Tables table not found. Please run the setup-tables.sql script in Supabase SQL Editor.')
        } else if (error.code === '42501' || error.message.includes('permission denied')) {
          alert('Permission denied. Please check RLS policies in Supabase.')
        } else {
          alert(`Error adding table: ${error.message || 'Unknown error. Check console for details.'}`)
        }
      } else {
        console.log('Table added successfully:', data)
        setTableNumber('')
        setTableDialogOpen(false)
        await fetchTables(storeId)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred. Please check console for details.')
    }
  }

  const deleteTable = async (tableId: string) => {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId)

    if (error) {
      console.error('Error deleting table:', error)
    } else {
      await fetchTables(storeId)
    }
  }

  const getQRCodeUrl = (tableNumber: string) => {
    return `${window.location.origin}/${storeId}/menu?table=${tableNumber}`
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Codes for Tables</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .qr-container { 
                display: inline-block; 
                margin: 20px; 
                text-align: center; 
                page-break-inside: avoid;
              }
              .qr-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .qr-subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            </style>
          </head>
          <body>
            <h1>QR Codes for ${storeId} Tables</h1>
            ${tables.map(table => `
              <div class="qr-container">
                <div class="qr-title">Table ${table.table_number}</div>
                <div id="qr-${table.id}"></div>
                <div class="qr-subtitle">Scan to order</div>
              </div>
            `).join('')}
            <script>
              ${tables.map(table => `
                new QRCode(document.getElementById("qr-${table.id}"), {
                  text: "${getQRCodeUrl(table.table_number)}",
                  width: 128,
                  height: 128
                });
              `).join('')}
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
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
            <Button onClick={handleLogout} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Merchant Dashboard</h1>
            <p className="text-sm text-slate-500">Store ID: {storeId}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-2 border-slate-300 hover:border-red-500 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl px-6"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditBalance}</div>
              <p className="text-xs text-muted-foreground">Remaining credits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{todaySales}</div>
              <p className="text-xs text-muted-foreground">Total sales today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
              <TableIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables.length}</div>
              <p className="text-xs text-muted-foreground">Tables with QR codes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Menu Manager
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Table & QR Manager
            </TabsTrigger>
          </TabsList>

          {/* Menu Manager Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Menu Management</h2>
              <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetMenuForm} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Menu Name</Label>
                      <Input
                        id="name"
                        value={menuFormData.name}
                        onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                        placeholder="e.g., Pad Thai"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (฿)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={menuFormData.price}
                        onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                        placeholder="e.g., 120"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={menuFormData.description}
                        onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                        placeholder="Brief description of the dish"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image">Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        </div>
                      )}
                    </div>
                    
                    <Button type="submit" disabled={uploading} className="w-full">
                      {uploading ? 'Uploading...' : (editingMenu ? 'Update Menu' : 'Add Menu')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <Card key={menu.id} className="overflow-hidden">
                  {menu.image_url && (
                    <div className="aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={menu.image_url}
                        alt={menu.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{menu.name}</h3>
                    {menu.description && (
                      <p className="text-sm text-slate-600 mb-3">{menu.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600">฿{menu.price}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMenu(menu)
                            setMenuFormData({
                              name: menu.name,
                              price: menu.price.toString(),
                              description: menu.description || ''
                            })
                            setMenuDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMenu(menu.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Table & QR Manager Tab */}
          <TabsContent value="tables" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Table & QR Code Management</h2>
              <div className="flex gap-2">
                <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-2 border-slate-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Table</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddTable} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tableNumber">Table Number</Label>
                        <Input
                          id="tableNumber"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="e.g., 1, 2, A1, VIP1"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Table
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                
                {tables.length > 0 && (
                  <Button onClick={printQRCode} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Print All QR Codes
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => (
                <Card key={table.id}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-4">Table {table.table_number}</h3>
                      <div className="bg-white p-4 rounded-lg border-2 border-slate-200 mb-4">
                        <QRCode
                          value={getQRCodeUrl(table.table_number)}
                          size={128}
                          level="M"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mb-4 break-all">
                        {getQRCodeUrl(table.table_number)}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTable(table)
                            setQrDialogOpen(true)
                          }}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTable(table.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code for Table {selectedTable?.table_number}</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            {selectedTable && (
              <>
                <div className="bg-white p-6 rounded-lg border-2 border-slate-200 mb-4">
                  <QRCode
                    value={getQRCodeUrl(selectedTable.table_number)}
                    size={200}
                    level="M"
                  />
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Customers can scan this code to access the menu and place orders for Table {selectedTable.table_number}
                </p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-mono break-all text-slate-600">
                    {getQRCodeUrl(selectedTable.table_number)}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
