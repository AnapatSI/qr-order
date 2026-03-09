import { create } from 'zustand'

export interface SelectedOption {
  optionName: string
  choices: string[]
  extraPrice: number
}

export interface CartItem {
  id: number
  cartKey: string // unique key: menuId + options combo
  name: string
  price: number // base price
  quantity: number
  selectedOptions: SelectedOption[]
  note: string
  addonsPrice: number // total extra price from options
}

interface CartStore {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartKey'>) => void
  addToCartSimple: (item: { id: number; name: string; price: number }) => void
  removeFromCart: (cartKey: string) => void
  updateQuantity: (cartKey: string, delta: number) => void
  getItemQuantity: (menuId: number) => number
  clearCart: () => void
  totalPrice: number
}

function generateCartKey(item: { id: number; selectedOptions: SelectedOption[]; note: string }): string {
  const optionsStr = item.selectedOptions
    .map(o => `${o.optionName}:${o.choices.sort().join(',')}`)
    .sort()
    .join('|')
  return `${item.id}-${optionsStr}-${item.note}`
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: (item) => {
    const { items } = get()
    const cartKey = generateCartKey(item)
    const existingItem = items.find(i => i.cartKey === cartKey)

    if (existingItem) {
      set({
        items: items.map(i =>
          i.cartKey === cartKey
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      })
    } else {
      set({ items: [...items, { ...item, cartKey, quantity: 1 }] })
    }
  },
  addToCartSimple: (item) => {
    get().addToCart({ ...item, selectedOptions: [], note: '', addonsPrice: 0 })
  },
  removeFromCart: (cartKey) => {
    set({ items: get().items.filter(item => item.cartKey !== cartKey) })
  },
  updateQuantity: (cartKey, delta) => {
    const { items } = get()
    const existingItem = items.find(i => i.cartKey === cartKey)
    if (!existingItem) return

    const newQuantity = existingItem.quantity + delta
    if (newQuantity <= 0) {
      set({ items: items.filter(item => item.cartKey !== cartKey) })
    } else {
      set({
        items: items.map(i =>
          i.cartKey === cartKey ? { ...i, quantity: newQuantity } : i
        )
      })
    }
  },
  getItemQuantity: (menuId) => {
    return get().items
      .filter(i => i.id === menuId)
      .reduce((sum, i) => sum + i.quantity, 0)
  },
  clearCart: () => set({ items: [] }),
  get totalPrice() {
    return get().items.reduce((sum, item) => sum + ((item.price + item.addonsPrice) * item.quantity), 0)
  }
}))
