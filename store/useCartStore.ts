import { create } from 'zustand'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  special_instructions?: string
}

interface CartStore {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: number) => void
  updateQuantity: (menuId: number, delta: number) => void
  getItemQuantity: (menuId: number) => number
  clearCart: () => void
  totalPrice: number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: (item) => {
    const { items } = get()
    const existingItem = items.find(i => i.id === item.id)
    
    if (existingItem) {
      set({
        items: items.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      })
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] })
    }
  },
  removeFromCart: (id) => {
    const { items } = get()
    set({ items: items.filter(item => item.id !== id) })
  },
  updateQuantity: (menuId, delta) => {
    const { items } = get()
    const existingItem = items.find(i => i.id === menuId)
    
    if (!existingItem) return
    
    const newQuantity = existingItem.quantity + delta
    
    if (newQuantity <= 0) {
      // Remove item if quantity reaches 0
      set({ items: items.filter(item => item.id !== menuId) })
    } else {
      // Update quantity
      set({
        items: items.map(i => 
          i.id === menuId 
            ? { ...i, quantity: newQuantity }
            : i
        )
      })
    }
  },
  getItemQuantity: (menuId) => {
    const { items } = get()
    const item = items.find(i => i.id === menuId)
    return item ? item.quantity : 0
  },
  clearCart: () => set({ items: [] }),
  get totalPrice() {
    return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
}))
